import express from "express";
import cors from "cors";
import { createClient } from "redis";
import { encodeBase62 } from "./services/base_62_encoding_service.js";

const app = express();

// Use CORS middleware to handle Cross-Origin requests
app.use(cors());
app.use(express.json());

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
      const id = await redisClient.incr("global_counter");
      console.log(id);
      // Encode the counter value to a Base62 string
      const shortUrlId = encodeBase62(id);
      console.log(shortUrlId);

      // Store the short URL ID and the original URL in the Redis hash
      await redisClient.hSet("urls", shortUrlId, originalURL);

      // Return the shortened URL in the response
      res.json({
        status: true,
        data: "http://localhost:3001/" + shortUrlId,
      });
    } catch (error) {
      console.log(error);
      // Return an error response in case of any issues
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
    const originalUrl = await redisClient.hGet("urls", shortUrlId);
    // res.redirect(originalUrl);
    // console.log(originalUrl);

    if (!originalUrl) {
      // If the URL is not found, return a 404 response
      res.status(404).json({
        status: false,
        error: "Short URL not found",
      });
    } else {
      // Redirect the user to the original URL (302 Temporary Redirect by default)
      res.redirect(originalUrl);
    }
  } catch (error) {
    console.error(error);
    // Return a 500 response for server errors
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
