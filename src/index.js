require("dotenv").config();
const http = require('http');
const app = require('./app');
const { initWebSocket } = require('./services/websocket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));