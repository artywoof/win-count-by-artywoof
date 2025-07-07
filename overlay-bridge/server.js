const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let currentState = {
    win: 0,
    goal: 10,
    show_crown: true,
    show_goal: true
};

console.log('🚀 Starting Win-Count Overlay Bridge Server...');

// Store all connected clients
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('📱 New client connected');
    clients.add(ws);
    
    // Send current state to new client
    ws.send(JSON.stringify(currentState));
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('📥 Received:', data);
            
            if (data.type === 'request-sync') {
                // Send current state to requesting client
                ws.send(JSON.stringify(currentState));
                console.log('📤 Sent current state to client');
            } else if (data.type === 'update') {
                // Update current state and broadcast to all clients
                if (data.win !== undefined) currentState.win = data.win;
                if (data.goal !== undefined) currentState.goal = data.goal;
                if (data.show_crown !== undefined) currentState.show_crown = data.show_crown;
                if (data.show_goal !== undefined) currentState.show_goal = data.show_goal;
                
                console.log('🔄 State updated:', currentState);
                
                // Broadcast to all connected clients
                const updateMessage = JSON.stringify(currentState);
                clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(updateMessage);
                    }
                });
                console.log(`📡 Broadcasted to ${clients.size - 1} clients`);
            }
        } catch (e) {
            console.error('❌ Error parsing message:', e);
        }
    });
    
    ws.on('close', () => {
        console.log('📱 Client disconnected');
        clients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        clients.delete(ws);
    });
});

// HTTP endpoint for REST API (alternative to WebSocket)
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.get('/api/state', (req, res) => {
    console.log('📥 HTTP GET /api/state');
    res.json(currentState);
});

app.post('/api/update', (req, res) => {
    console.log('📥 HTTP POST /api/update:', req.body);
    
    const { win, goal, show_crown, show_goal } = req.body;
    
    if (win !== undefined) currentState.win = win;
    if (goal !== undefined) currentState.goal = goal;
    if (show_crown !== undefined) currentState.show_crown = show_crown;
    if (show_goal !== undefined) currentState.show_goal = show_goal;
    
    console.log('🔄 State updated via HTTP:', currentState);
    
    // Broadcast to all WebSocket clients
    const updateMessage = JSON.stringify(currentState);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(updateMessage);
        }
    });
    console.log(`📡 Broadcasted to ${clients.size} WebSocket clients`);
    
    res.json({ success: true, state: currentState });
});

// Serve static files (for hosting the overlay)
app.use(express.static('../static'));

const PORT = 8081;
server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server running on ws://localhost:${PORT}`);
    console.log(`🌐 Overlay available at http://localhost:${PORT}/overlay-websocket.html`);
    console.log('\n📋 API Endpoints:');
    console.log(`  GET  http://localhost:${PORT}/api/state - Get current state`);
    console.log(`  POST http://localhost:${PORT}/api/update - Update state`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
