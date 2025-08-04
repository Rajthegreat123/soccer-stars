"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colyseus_1 = require("colyseus");
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const SoccerRoom_1 = require("./rooms/SoccerRoom");
const port = Number(process.env.PORT || 2567);
const app = (0, express_1.default)();
// Enable CORS for all origins (adjust for production)
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
const server = (0, http_1.createServer)(app);
const gameServer = new colyseus_1.Server({
    server,
});
// Register room handlers with metadata support
gameServer.define('soccer', SoccerRoom_1.SoccerRoom, {
    metadata: {
        roomCode: ''
    }
});
// Room creation endpoint
app.post('/create-room', (req, res) => {
    const roomCode = generateRoomCode();
    res.json({ roomCode });
});
// Basic health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Soccer Stars Colyseus Server',
        status: 'running',
        uptime: process.uptime()
    });
});
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
gameServer.listen(port);
console.log(`🎮 Soccer Stars server listening on ws://localhost:${port}`);
