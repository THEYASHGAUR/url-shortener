export function encodeBase62(number) {
  // Characters used for Base62 encoding
  let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";

  // Loop to convert the number to a Base62 encoded string
  while (number > 0) {
    console.log("new number - " + number);
    // Get the character corresponding to the remainder of number divided by 62
    result = chars[number % 62] + result;
    // Update number to be the quotient of number divided by 62
    number = Math.floor(number / 62);
  }

  // Return the encoded result or "0" if the initial number was 0
  return result || "0";
}
