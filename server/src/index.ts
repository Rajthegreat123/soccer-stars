import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { SoccerRoom } from "./rooms/SoccerRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

// Enable CORS for all origins (adjust for production)
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

const server = createServer(app);
const gameServer = new Server({
  server,
});

// Register room handlers
gameServer.define('soccer', SoccerRoom);

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Soccer Stars Colyseus Server',
    status: 'running',
    uptime: process.uptime()
  });
});

gameServer.listen(port);
console.log(`🎮 Soccer Stars server listening on ws://localhost:${port}`);