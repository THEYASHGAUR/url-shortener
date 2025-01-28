import express from "express";
import cors from "cors";
import { createClient } from "redis";
import { encodeBase62 } from "./services/base_62_encoding_service.js";
import { nanoid } from "nanoid";

const app = express();

// Use CORS middleware to handle Cross-Origin requests
app.use(cors());
app.use(express.json());

// Enable CORS
app.use(cors({ origin: "*" }));

// Handle preflight requests for OPTIONS method
app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.status(204).end();
});

// Allow requests from your Next.js frontend
app.use(cors({
  origin: 'http://localhost:3000', // Your Next.js frontend URL
  credentials: true // If you're sending cookies or authentication headers
}));

// Initialise Redis client with the given URL
const redisClient = createClient({
  url: "redis://localhost:6379",
});

// Event listener for successful Redis connection
redisClient.on("connect", () => {
  console.log("Redis is connected");
});

// Event listener for Redis connection errors
redisClient.on("error", () => {
  console.log("Redis Connection Failed");
});

// Endpoint to shorten a long URL
app.post("/shorten", async (req, res) => {
  const originalURL = req.body["originalURL"];
  console.log(req.body);

  if (!originalURL) {
    // If the original URL is not provided, return an error response
    res.json({
      status: false,
      error: "Please pass the Long URL",
    });
  } else {
    try {
      // Increment the global counter in Redis
      // const id = await redisClient.incr("global_counter");
      // console.log(id);
      // Encode the counter value to a Base62 string
      // const shortUrlId = encodeBase62(id);
      // console.log(shortUrlId);

      const shortUrlId = nanoid(5); // Generates an 8-character ID by default
      console.log(shortUrlId);

      // Store the short URL ID and the original URL in the Redis hash
      await redisClient.hSet("urls", shortUrlId, originalURL);
      console.log(`Stored in Redis: ${shortUrlId} -> ${originalURL}`);

      // Return the shortened URL in the response
      res.json({
        status: true,
        data: "http://localhost:3001/" + shortUrlId,
      });
    } catch (error) {
      console.log(error);

      res.json({
        status: false,
        error: error,
      });
    }
  }
});

// Endpoint to get the original URL from a short URL ID
app.get("/:shortUrlId", async (req, res) => {
  const shortUrlId = req.params.shortUrlId;

  try {
    // Retrieve the original URL from the Redis hash
    console.log(`Fetching from Redis: Key -> urls, Field -> ${shortUrlId}`);
    const originalUrl = await redisClient.hGet("urls", shortUrlId);
    console.log(`Fetched: ${originalUrl}`);

    console.log(originalUrl);

    if (!originalUrl) {
      // If the URL is not found, return a 404 response
      console.log("not found");
      res.status(404).json({
        status: false,
        error: "Short URL not found",
      });
    } else {
      
      // Redirect to the original URL
      res.redirect(302, originalUrl);
    }
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: false,
      error: "An error occurred while processing your request",
    });
  }
});

// Start the Express server and connect to Redis
app.listen(3001, async () => {
  try {
    await redisClient.connect();
    console.log("Backend is running");
  } catch (error) {
    console.log(error);
  }
});
