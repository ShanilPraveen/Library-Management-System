const { jwtDecode } = require("jwt-decode");

// Extracts the userId from a JWT token
const extractUserId = (token) => {
  try {
    if (!token) return null;
    const actualToken = token.startsWith("Bearer ")
      ? token.substring(7)
      : token;
    const payload = jwtDecode(actualToken);
    return payload["custom:userId"] || null;
  } catch (error) {
    return null;
  }
};

// Cleans and formats database data for LLM consumption
const cleanDataForLLM = (data) => {
  if (!data) return "No data found.";
  let cleanString = JSON.stringify(data);
  cleanString = cleanString.replace(/\b\d{12,13}\b/g, (match) => {
    return new Date(parseInt(match)).toDateString();
  });

  return cleanString;
};

// Creates a descriptive string of available tools for the LLM
const createToolDescription = (tools) => {
  let description = "You have access to the following tools:\n";

  for (const [name, config] of Object.entries(tools)) {
    description += `- ${name}: ${config.description}\n`;
    if (config.requiresArgs) {
      description += `  Requires Args: ${JSON.stringify(
        config.requiresArgs
      )}\n`;
    }
    if (config.query) {
      description += `  Query: ${config.query.trim()}\n`;
    }
    description += "\n";
  }
  return description.trim();
};

module.exports = {
  extractUserId,
  cleanDataForLLM,
  createToolDescription,
};
