require("dotenv").config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const historyLimit = 10;

const LLM_Config = {
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  max_tokens: 1000,
};

const roles = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
};

module.exports = {
  GROQ_API_KEY,
  historyLimit,
  LLM_Config,
  roles,
};
