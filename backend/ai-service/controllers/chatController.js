const Groq = require("groq-sdk");
const { TOOLS } = require("../config/tools");
const {
  GROQ_API_KEY,
  LLM_Config,
  roles,
  historyLimit,
} = require("../config/constants");
const { system_prompts } = require("../config/prompts");
const {
  extractUserId,
  cleanDataForLLM,
  createToolDescription,
} = require("../utils/helpers");
const groq = new Groq({ apiKey: GROQ_API_KEY });

// The memory store to give the LLM some context of prior messages
const sessions = {};

/**
 * Executes the tool decided by the LLM and fetches data from the database.
 */
const fetchDataWithTool = async (toolName, toolArgs, authHeader,userId) => {
  if (Object.keys(TOOLS).includes(toolName)) {
    const toolConfig = TOOLS[toolName];
    //if the tool requires userId, add it to args
    if (toolConfig.requiresUserId) {
      toolArgs.userId = userId;
    }
    // Execute the tool's query against the database and get data
    try {
      const response = await fetch(toolConfig.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          query: toolConfig.query,
          variables: toolArgs,
        }),
      });

      const json = await response.json();

      if (json.errors) {
        context += `Database Error Occuered: ${JSON.stringify(json.errors)}`;
      } else {
        return json.data;
      }
    } catch (error) {
      return res.status(500).json({ error: "Error executing tool" });
    }
  }
  return null;
};

/**
 * Handles chat requests from users, processes them using LLM and tools, and returns responses.
 */
const handleChatRequest = async (req, res) => {
  const userMessage = req.body.msg;
  const authHeader = req.headers.authorization || "";
  const userToken = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader;

  if (!userToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = extractUserId(userToken);
  if (!userId) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Create tool descriptions for LLM
  const toolDescriptions = createToolDescription(TOOLS);

  try {
    // Build intent detection messages
    const intentMessages = [
      {
        role: roles.SYSTEM,
        content: system_prompts.intentDetection(toolDescriptions),
      },
      { role: roles.USER, content: `User Message: ${userMessage}` },
    ];

    if (!sessions[userToken]) {
      sessions[userToken] = [];
    }
    // limit history
    if (sessions[userToken].length > historyLimit) {
      sessions[userToken] = sessions[userToken].slice(-historyLimit);
    }
    // Get the session history for the user
    const userHistory = sessions[userToken];

    // Call LLM for intent detection
    const intentResponse = await groq.chat.completions.create({
      model: LLM_Config.model,
      messages: [...userHistory, ...intentMessages],
      temperature: LLM_Config.temperature,
      response_format: { type: "json_object" },
    });

    const decision = JSON.parse(
      intentResponse.choices[0]?.message?.content || `{"tool":"null"}`
    );
    const toolName = decision.tool;
    const toolArgs = decision.args || {};

    let context = system_prompts.systemInstruction;

    // If a tool is decided, execute it and fetch data
    data = await fetchDataWithTool(toolName, toolArgs, authHeader, userId);
    let dbdata = cleanDataForLLM(data);
    context += system_prompts.responseCreation;

    const responseMessages = [
      { role: roles.SYSTEM, content: context },
      ...userHistory,
      {
        role: roles.USER,
        content: `user Input: \"${userMessage}\" \nSystem data: \"${dbdata}\"`,
      },
    ];

    // Final LLM call to generate user response
    const finalResponse = await groq.chat.completions.create({
      model: LLM_Config.model,
      messages: responseMessages,
      temperature: LLM_Config.temperature,
      max_tokens: LLM_Config.maxTokens,
    });

    const finalMessage =
      finalResponse.choices[0]?.message?.content ||
      "I'm sorry, I couldn't process your request.";

    // Update session history
    sessions[userToken].push({ role: roles.USER, content: userMessage });
    sessions[userToken].push({ role: roles.ASSISTANT, content: finalMessage });

    res.json({ reply: finalMessage });
  } catch (error) {
    console.error("Error handling chat request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  handleChatRequest,
};
