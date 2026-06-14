const ws = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;
const userConnections = new Map(); // userId (number) -> Set of WebSocket clients

function initWebSocket(server) {
    wss = new ws.WebSocketServer({ server, path: '/ws' });

    console.log('WebSocket Server initialized on path /ws');

    wss.on('connection', (wsClient, request) => {
        // Parse query params from connection URL
        const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        const token = url.searchParams.get('token');
        let userId = url.searchParams.get('userId');

        // Verify JWT if token is provided
        if (token) {
            try {
                const secret = process.env.JWT_SECRET;
                const decoded = jwt.verify(token, secret);
                userId = decoded && (decoded.userId || decoded.id);
            } catch (err) {
                console.error('WebSocket JWT Verification Failed:', err.message);
                wsClient.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
                wsClient.close();
                return;
            }
        }

        if (!userId) {
            console.error('WebSocket connection attempt rejected: No valid userId or token');
            wsClient.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
            wsClient.close();
            return;
        }

        const userIdNum = Number(userId);
        if (!userConnections.has(userIdNum)) {
            userConnections.set(userIdNum, new Set());
        }
        userConnections.get(userIdNum).add(wsClient);

        console.log(`User ${userIdNum} connected to WebSocket (Total connections for user: ${userConnections.get(userIdNum).size})`);

        // Send a connection success message
        wsClient.send(JSON.stringify({ type: 'connection_established', userId: userIdNum }));

        wsClient.on('close', () => {
            console.log(`User ${userIdNum} disconnected from WebSocket`);
            const connections = userConnections.get(userIdNum);
            if (connections) {
                connections.delete(wsClient);
                if (connections.size === 0) {
                    userConnections.delete(userIdNum);
                }
            }
        });

        wsClient.on('error', (err) => {
            console.error(`WebSocket error for user ${userIdNum}:`, err);
        });
    });
}

function sendNotificationToUser(userId, notification) {
    const userIdNum = Number(userId);
    const connections = userConnections.get(userIdNum);
    if (connections && connections.size > 0) {
        const payload = JSON.stringify({
            type: 'notification',
            data: notification
        });
        console.log(`Sending real-time notification to user ${userIdNum}: "${notification.message}"`);
        for (const wsClient of connections) {
            if (wsClient.readyState === ws.OPEN) {
                wsClient.send(payload);
            }
        }
        return true;
    }
    console.log(`User ${userIdNum} is offline. Notification saved to DB only.`);
    return false;
}

module.exports = {
    initWebSocket,
    sendNotificationToUser
};
