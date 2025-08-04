"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoccerRoom = void 0;
const colyseus_1 = require("colyseus");
const GameState_1 = require("../schema/GameState");
class SoccerRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 2;
        this.roomCode = "";
        this.creatorId = "";
    }
    onCreate(options) {
        this.setState(new GameState_1.GameState());
        // Set room code and creator
        this.roomCode = options.roomCode || this.generateRoomCode();
        this.creatorId = options.creatorId || "";
        console.log(`Room created with code: ${this.roomCode}`);
        // Update metadata with room code
        this.setMetadata({ roomCode: this.roomCode });
        this.onMessage("move", (client, message) => {
            this.handleMove(client, message);
        });
        this.onMessage("shoot", (client, message) => {
            this.handleShoot(client, message);
        });
        this.onMessage("restart", (client) => {
            if (this.state.gamePhase === 2) { // game ended
                this.resetGame();
            }
        });
        // Setup update loop for physics
        this.setSimulationInterval((deltaTime) => this.update(deltaTime), 1000 / 60);
        console.log("SoccerRoom created!", this.roomId);
    }
    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
        const playerCount = Object.keys(this.state.players).length;
        if (playerCount >= 2) {
            throw new Error("Room is full");
        }
        // Create player
        const player = new GameState_1.Player();
        player.id = client.sessionId;
        player.team = playerCount;
        player.x = playerCount === 0 ? 100 : 700;
        player.y = 300;
        this.state.players.set(client.sessionId, player);
        // Create player discs (5 per team)
        this.createPlayerDiscs(client.sessionId, playerCount);
        // Start game when 2 players joined
        if (Object.keys(this.state.players).length === 2) {
            this.state.gamePhase = 1; // playing
            this.resetBall();
        }
    }
    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
        // Remove player and their discs
        this.state.players.delete(client.sessionId);
        // Remove all discs belonging to this player
        this.state.discs.forEach((disc, key) => {
            if (key.startsWith(client.sessionId)) {
                this.state.discs.delete(key);
            }
        });
        // Reset game if player left
        if (Object.keys(this.state.players).length < 2) {
            this.state.gamePhase = 0; // waiting
            this.state.scoreTeam0 = 0;
            this.state.scoreTeam1 = 0;
        }
    }
    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
    createPlayerDiscs(playerId, team) {
        const formations = [
            // Team 0 (left side) disc positions
            [
                { x: 150, y: 200 },
                { x: 150, y: 400 },
                { x: 250, y: 150 },
                { x: 250, y: 300 },
                { x: 250, y: 450 }
            ],
            // Team 1 (right side) disc positions  
            [
                { x: 650, y: 200 },
                { x: 650, y: 400 },
                { x: 550, y: 150 },
                { x: 550, y: 300 },
                { x: 550, y: 450 }
            ]
        ];
        formations[team].forEach((pos, index) => {
            const disc = new GameState_1.Disc();
            disc.id = `${playerId}_${index}`;
            disc.x = pos.x;
            disc.y = pos.y;
            disc.team = team;
            disc.canMove = team === this.state.currentTurn;
            this.state.discs.set(disc.id, disc);
        });
    }
    handleMove(client, message) {
        const player = this.state.players.get(client.sessionId);
        if (!player || this.state.gamePhase !== 1)
            return;
        // Check if it's player's turn
        if (player.team !== this.state.currentTurn)
            return;
        // Check if still moving
        if (this.state.isMoving)
            return;
        const disc = this.state.discs.get(message.discId);
        if (!disc || disc.team !== player.team)
            return;
        // Update disc position (for aiming line)
        disc.x = Math.max(20, Math.min(this.state.fieldWidth - 20, message.x));
        disc.y = Math.max(20, Math.min(this.state.fieldHeight - 20, message.y));
    }
    handleShoot(client, message) {
        const player = this.state.players.get(client.sessionId);
        if (!player || this.state.gamePhase !== 1)
            return;
        // Check if it's player's turn
        if (player.team !== this.state.currentTurn)
            return;
        // Check if still moving
        if (this.state.isMoving)
            return;
        const disc = this.state.discs.get(message.discId);
        if (!disc || disc.team !== player.team)
            return;
        // Apply force to disc
        const force = 0.3; // adjust for game feel
        disc.vx = message.forceX * force;
        disc.vy = message.forceY * force;
        this.state.isMoving = true;
        // Set timeout to end turn if motion doesn't stop naturally
        this.clock.setTimeout(() => {
            if (this.state.isMoving) {
                this.endTurn();
            }
        }, 8000); // 8 second timeout
    }
    update(deltaTime) {
        if (this.state.gamePhase !== 1)
            return;
        let anyMoving = false;
        const friction = 0.98;
        const minVelocity = 0.1;
        // Update ball physics
        this.updateBallPhysics(friction, minVelocity);
        if (Math.abs(this.state.ball.vx) > minVelocity || Math.abs(this.state.ball.vy) > minVelocity) {
            anyMoving = true;
        }
        // Update disc physics
        this.state.discs.forEach((disc) => {
            // Apply friction
            disc.vx *= friction;
            disc.vy *= friction;
            // Stop if velocity too low
            if (Math.abs(disc.vx) < minVelocity)
                disc.vx = 0;
            if (Math.abs(disc.vy) < minVelocity)
                disc.vy = 0;
            // Update position
            disc.x += disc.vx;
            disc.y += disc.vy;
            // Boundary collision
            if (disc.x < 20) {
                disc.x = 20;
                disc.vx = -disc.vx * 0.7;
            }
            if (disc.x > this.state.fieldWidth - 20) {
                disc.x = this.state.fieldWidth - 20;
                disc.vx = -disc.vx * 0.7;
            }
            if (disc.y < 20) {
                disc.y = 20;
                disc.vy = -disc.vy * 0.7;
            }
            if (disc.y > this.state.fieldHeight - 20) {
                disc.y = this.state.fieldHeight - 20;
                disc.vy = -disc.vy * 0.7;
            }
            if (Math.abs(disc.vx) > minVelocity || Math.abs(disc.vy) > minVelocity) {
                anyMoving = true;
            }
        });
        // Check collisions
        this.checkCollisions();
        // End turn when everything stops moving
        if (this.state.isMoving && !anyMoving) {
            this.endTurn();
        }
    }
    updateBallPhysics(friction, minVelocity) {
        // Apply friction
        this.state.ball.vx *= friction;
        this.state.ball.vy *= friction;
        // Stop if velocity too low
        if (Math.abs(this.state.ball.vx) < minVelocity)
            this.state.ball.vx = 0;
        if (Math.abs(this.state.ball.vy) < minVelocity)
            this.state.ball.vy = 0;
        // Update position
        this.state.ball.x += this.state.ball.vx;
        this.state.ball.y += this.state.ball.vy;
        // Goal detection
        const goalY1 = (this.state.fieldHeight - this.state.goalWidth) / 2;
        const goalY2 = goalY1 + this.state.goalWidth;
        // Left goal (team 1 scores)
        if (this.state.ball.x < this.state.goalDepth &&
            this.state.ball.y > goalY1 && this.state.ball.y < goalY2) {
            this.scoreGoal(1);
            return;
        }
        // Right goal (team 0 scores)
        if (this.state.ball.x > this.state.fieldWidth - this.state.goalDepth &&
            this.state.ball.y > goalY1 && this.state.ball.y < goalY2) {
            this.scoreGoal(0);
            return;
        }
        // Boundary collision
        if (this.state.ball.x < 15) {
            this.state.ball.x = 15;
            this.state.ball.vx = -this.state.ball.vx * 0.8;
        }
        if (this.state.ball.x > this.state.fieldWidth - 15) {
            this.state.ball.x = this.state.fieldWidth - 15;
            this.state.ball.vx = -this.state.ball.vx * 0.8;
        }
        if (this.state.ball.y < 15) {
            this.state.ball.y = 15;
            this.state.ball.vy = -this.state.ball.vy * 0.8;
        }
        if (this.state.ball.y > this.state.fieldHeight - 15) {
            this.state.ball.y = this.state.fieldHeight - 15;
            this.state.ball.vy = -this.state.ball.vy * 0.8;
        }
    }
    checkCollisions() {
        // Ball-disc collisions
        this.state.discs.forEach((disc) => {
            const dx = this.state.ball.x - disc.x;
            const dy = this.state.ball.y - disc.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 30) { // collision threshold
                // Collision response
                const angle = Math.atan2(dy, dx);
                const overlap = 30 - distance;
                // Separate objects
                this.state.ball.x += Math.cos(angle) * overlap * 0.5;
                this.state.ball.y += Math.sin(angle) * overlap * 0.5;
                disc.x -= Math.cos(angle) * overlap * 0.5;
                disc.y -= Math.sin(angle) * overlap * 0.5;
                // Transfer momentum
                const ballSpeed = Math.sqrt(this.state.ball.vx * this.state.ball.vx + this.state.ball.vy * this.state.ball.vy);
                const discSpeed = Math.sqrt(disc.vx * disc.vx + disc.vy * disc.vy);
                if (discSpeed > ballSpeed) {
                    // Disc hits ball
                    this.state.ball.vx = Math.cos(angle) * discSpeed * 0.8;
                    this.state.ball.vy = Math.sin(angle) * discSpeed * 0.8;
                    disc.vx *= 0.3;
                    disc.vy *= 0.3;
                }
            }
        });
    }
    scoreGoal(team) {
        if (team === 0) {
            this.state.scoreTeam0++;
        }
        else {
            this.state.scoreTeam1++;
        }
        // Check for winner
        if (this.state.scoreTeam0 >= this.state.maxScore) {
            this.state.winner = "Team 0";
            this.state.gamePhase = 2; // ended
        }
        else if (this.state.scoreTeam1 >= this.state.maxScore) {
            this.state.winner = "Team 1";
            this.state.gamePhase = 2; // ended
        }
        // Reset for next round
        this.resetBall();
        this.state.isMoving = false;
        this.state.currentTurn = team === 0 ? 1 : 0; // opponent starts next
    }
    resetBall() {
        this.state.ball.x = this.state.fieldWidth / 2;
        this.state.ball.y = this.state.fieldHeight / 2;
        this.state.ball.vx = 0;
        this.state.ball.vy = 0;
    }
    endTurn() {
        this.state.isMoving = false;
        this.state.currentTurn = this.state.currentTurn === 0 ? 1 : 0;
        // Update disc permissions
        this.state.discs.forEach((disc) => {
            disc.canMove = disc.team === this.state.currentTurn;
        });
    }
    resetGame() {
        this.state.scoreTeam0 = 0;
        this.state.scoreTeam1 = 0;
        this.state.gamePhase = 1;
        this.state.winner = "";
        this.state.currentTurn = 0;
        this.state.isMoving = false;
        // Reset all disc positions
        let team0Index = 0;
        let team1Index = 0;
        const formations = [
            [
                { x: 150, y: 200 }, { x: 150, y: 400 }, { x: 250, y: 150 },
                { x: 250, y: 300 }, { x: 250, y: 450 }
            ],
            [
                { x: 650, y: 200 }, { x: 650, y: 400 }, { x: 550, y: 150 },
                { x: 550, y: 300 }, { x: 550, y: 450 }
            ]
        ];
        this.state.discs.forEach((disc) => {
            if (disc.team === 0) {
                const pos = formations[0][team0Index];
                disc.x = pos.x;
                disc.y = pos.y;
                disc.vx = 0;
                disc.vy = 0;
                team0Index++;
            }
            else {
                const pos = formations[1][team1Index];
                disc.x = pos.x;
                disc.y = pos.y;
                disc.vx = 0;
                disc.vy = 0;
                team1Index++;
            }
            disc.canMove = disc.team === this.state.currentTurn;
        });
        this.resetBall();
    }
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}
exports.SoccerRoom = SoccerRoom;
