const express = require('express');
const cors = require('cors');
const {handleChatRequest} = require('./controllers/chatController');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/chat', handleChatRequest);

const PORT = process.env.PORT || 4004;

app.listen(PORT, () => {
  console.log(`AI Assistant Service is running on http://localhost:${PORT}`);
});