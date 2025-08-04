class SoccerStarsGame extends Phaser.Scene {
    constructor() {
        super({ key: 'SoccerStarsGame' });
        
        // Game objects
        this.ball = null;
        this.discs = new Map();
        this.selectedDisc = null;
        this.aimLine = null;
        this.powerBar = null;
        
        // Network
        this.client = null;
        this.room = null;
        this.playerTeam = null;
        this.playerId = null;
        this.roomCode = null;
        this.isCreator = false;
        
        // Input
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.currentPointer = null;
        
        // Game state
        this.gameWidth = 800;
        this.gameHeight = 600;
        this.goalWidth = 120;
        this.goalDepth = 40;
    }
    
    preload() {
        // Create simple colored circles for game objects
        this.createCircleTexture('ball', 15, 0xFFFFFF);
        this.createCircleTexture('disc0', 18, 0x4CAF50); // Green team
        this.createCircleTexture('disc1', 18, 0xFF5722); // Red team
        this.createCircleTexture('discSelected', 18, 0xFFEB3B); // Yellow when selected
        
        // Field texture
        this.createFieldTexture();
    }
    
    create() {
        // Create field background
        this.createField();
        
        // Setup input
        this.setupInput();
        
        // Create UI elements
        this.createUI();
        
        // Show lobby instead of auto-connecting
        this.showLobby();
    }
    
    createCircleTexture(key, radius, color) {
        const graphics = this.add.graphics();
        graphics.fillStyle(color);
        graphics.fillCircle(radius, radius, radius);
        graphics.generateTexture(key, radius * 2, radius * 2);
        graphics.destroy();
    }
    
    createFieldTexture() {
        const graphics = this.add.graphics();
        
        // Field background
        graphics.fillStyle(0x4CAF50);
        graphics.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Center circle
        graphics.lineStyle(3, 0xFFFFFF);
        graphics.strokeCircle(this.gameWidth / 2, this.gameHeight / 2, 80);
        
        // Center line
        graphics.moveTo(this.gameWidth / 2, 0);
        graphics.lineTo(this.gameWidth / 2, this.gameHeight);
        graphics.strokePath();
        
        // Goals
        const goalY = (this.gameHeight - this.goalWidth) / 2;
        
        // Left goal
        graphics.strokeRect(0, goalY, this.goalDepth, this.goalWidth);
        
        // Right goal  
        graphics.strokeRect(this.gameWidth - this.goalDepth, goalY, this.goalDepth, this.goalWidth);
        
        // Field border
        graphics.strokeRect(0, 0, this.gameWidth, this.gameHeight);
        
        graphics.generateTexture('field', this.gameWidth, this.gameHeight);
        graphics.destroy();
    }
    
    createField() {
        this.field = this.add.image(0, 0, 'field').setOrigin(0, 0);
    }
    
    createUI() {
        // Aim line (hidden initially)
        this.aimLine = this.add.graphics();
        this.aimLine.setDepth(10);
        
        // Power indicator
        this.powerBar = this.add.graphics();
        this.powerBar.setDepth(11);
    }
    
    setupInput() {
        // Mouse/touch input
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);
        
        // Keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    
    async connectToServer() {
        try {
            // Check if Colyseus is available
            if (typeof Colyseus === 'undefined') {
                throw new Error('Colyseus library not loaded. Please refresh the page.');
            }
            
            console.log('Colyseus version:', Colyseus.version || 'unknown');
            console.log('Colyseus.Client available:', typeof Colyseus.Client);
            
            // Use production server URL or fallback to localhost for development
            const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'ws://localhost:2567'
                : 'wss://your-render-app.onrender.com'; // Replace with your deployed server URL
            
            console.log('Connecting to:', serverUrl);
            this.client = new Colyseus.Client(serverUrl);
            
            console.log('Colyseus client created successfully');
            
        } catch (error) {
            console.error('Failed to connect to server:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            this.showConnectionError();
        }
    }
    
    setupRoomListeners() {
        // Listen for state changes
        this.room.onStateChange((state) => {
            this.updateGameState(state);
        });
        
        // Listen for player joins
        this.room.state.players.onAdd((player, key) => {
            console.log('Player joined:', key, player.team);
            if (key === this.playerId) {
                this.playerTeam = player.team;
            }
        });
        
        // Listen for disc updates
        this.room.state.discs.onAdd((disc, key) => {
            this.createDisc(disc, key);
        });
        
        this.room.state.discs.onChange((disc, key) => {
            this.updateDisc(disc, key);
        });
        
        this.room.state.discs.onRemove((disc, key) => {
            this.removeDisc(key);
        });
        
        // Listen for ball updates
        this.room.state.ball.onChange((ball) => {
            this.updateBall(ball);
        });
        
        // Room events
        this.room.onError((code, message) => {
            console.error('Room error:', code, message);
        });
        
        this.room.onLeave((code) => {
            console.log('Left room with code:', code);
        });
        
        // Listen for room code confirmation
        this.room.onMessage('roomCodeSet', (message) => {
            console.log('Room code confirmed:', message.roomCode);
        });
        

    }
    
    updateGameState(state) {
        // Update UI
        this.updateUI(state);
        
        // Create ball if not exists
        if (!this.ball && state.ball) {
            this.createBall(state.ball);
        }
    }
    
    updateUI(state) {
        // Update scores
        document.getElementById('score0').textContent = state.scoreTeam0;
        document.getElementById('score1').textContent = state.scoreTeam1;
        
        // Update turn indicator
        const turnIndicator = document.getElementById('turnIndicator');
        
        if (state.gamePhase === 0) {
            turnIndicator.textContent = 'Waiting for players...';
            turnIndicator.style.background = 'rgba(255,165,0,0.9)';
        } else if (state.gamePhase === 1) {
            if (state.isMoving) {
                turnIndicator.textContent = 'Motion in progress...';
                turnIndicator.style.background = 'rgba(255,0,0,0.9)';
            } else {
                const isMyTurn = this.playerTeam === state.currentTurn;
                turnIndicator.textContent = isMyTurn ? 'Your Turn!' : 'Opponent Turn';
                turnIndicator.style.background = isMyTurn ? 
                    'rgba(76,175,80,0.9)' : 'rgba(255,193,7,0.9)';
            }
        } else if (state.gamePhase === 2) {
            const winner = state.winner === `Team ${this.playerTeam}` ? 'You Win!' : 'You Lose!';
            this.showGameOver(winner);
        }
    }
    
    createBall(ballData) {
        this.ball = this.add.image(ballData.x, ballData.y, 'ball');
        this.ball.setDepth(5);
    }
    
    updateBall(ballData) {
        if (this.ball) {
            this.ball.setPosition(ballData.x, ballData.y);
        }
    }
    
    createDisc(discData, discId) {
        const texture = discData.team === 0 ? 'disc0' : 'disc1';
        const disc = this.add.image(discData.x, discData.y, texture);
        disc.setDepth(3);
        disc.setInteractive();
        
        // Store reference
        this.discs.set(discId, disc);
        
        // Add data
        disc.discId = discId;
        disc.team = discData.team;
        disc.canMove = discData.canMove;
        
        // Make draggable if it's player's disc and their turn
        this.updateDiscInteractivity(disc, discData);
    }
    
    updateDisc(discData, discId) {
        const disc = this.discs.get(discId);
        if (!disc) return;
        
        // Update position
        disc.setPosition(discData.x, discData.y);
        
        // Update properties
        disc.canMove = discData.canMove;
        disc.team = discData.team;
        
        // Update interactivity
        this.updateDiscInteractivity(disc, discData);
    }
    
    updateDiscInteractivity(disc, discData) {
        const isMyDisc = disc.discId.startsWith(this.playerId);
        const canInteract = isMyDisc && discData.canMove && this.room?.state?.gamePhase === 1;
        
        if (canInteract) {
            disc.setTint(0xFFFFFF); // Normal color
            disc.setAlpha(1);
        } else {
            disc.setTint(0x888888); // Dimmed
            disc.setAlpha(0.7);
        }
    }
    
    removeDisc(discId) {
        const disc = this.discs.get(discId);
        if (disc) {
            disc.destroy();
            this.discs.delete(discId);
        }
    }
    
    onPointerDown(pointer) {
        // Check if clicking on a disc
        const hitDisc = this.getDiscAtPosition(pointer.x, pointer.y);
        
        if (hitDisc && this.canMoveDisc(hitDisc)) {
            this.selectedDisc = hitDisc;
            this.isDragging = true;
            this.dragStart.x = pointer.x;
            this.dragStart.y = pointer.y;
            this.currentPointer = pointer;
            
            // Visual feedback
            hitDisc.setTexture('discSelected');
            
            // Start showing aim line
            this.showAimLine(hitDisc.x, hitDisc.y, pointer.x, pointer.y);
        }
    }
    
    onPointerMove(pointer) {
        if (this.isDragging && this.selectedDisc) {
            this.currentPointer = pointer;
            
            // Update aim line
            this.showAimLine(this.selectedDisc.x, this.selectedDisc.y, pointer.x, pointer.y);
            
            // Update power bar
            this.showPowerBar();
        }
    }
    
    onPointerUp(pointer) {
        if (this.isDragging && this.selectedDisc) {
            // Calculate force
            const dx = pointer.x - this.dragStart.x;
            const dy = pointer.y - this.dragStart.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) { // Minimum drag distance
                // Send shoot command
                this.room.send('shoot', {
                    discId: this.selectedDisc.discId,
                    forceX: dx / 100, // Scale down force
                    forceY: dy / 100
                });
            }
            
            // Reset visual state
            this.resetDiscSelection();
        }
    }
    
    showAimLine(fromX, fromY, toX, toY) {
        this.aimLine.clear();
        this.aimLine.lineStyle(3, 0xFFFFFF, 0.8);
        this.aimLine.moveTo(fromX, fromY);
        this.aimLine.lineTo(toX, toY);
        this.aimLine.strokePath();
        
        // Add arrow head
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const arrowLength = 15;
        const arrowAngle = 0.3;
        
        this.aimLine.moveTo(toX, toY);
        this.aimLine.lineTo(
            toX - arrowLength * Math.cos(angle - arrowAngle),
            toY - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.aimLine.moveTo(toX, toY);
        this.aimLine.lineTo(
            toX - arrowLength * Math.cos(angle + arrowAngle),
            toY - arrowLength * Math.sin(angle + arrowAngle)
        );
        this.aimLine.strokePath();
    }
    
    showPowerBar() {
        if (!this.currentPointer || !this.selectedDisc) return;
        
        const dx = this.currentPointer.x - this.dragStart.x;
        const dy = this.currentPointer.y - this.dragStart.y;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 2, 100);
        
        this.powerBar.clear();
        
        // Background
        this.powerBar.fillStyle(0x333333);
        this.powerBar.fillRect(10, this.gameHeight - 30, 200, 20);
        
        // Power fill
        const color = power < 30 ? 0x4CAF50 : power < 70 ? 0xFFEB3B : 0xFF5722;
        this.powerBar.fillStyle(color);
        this.powerBar.fillRect(10, this.gameHeight - 30, power * 2, 20);
        
        // Border
        this.powerBar.lineStyle(2, 0xFFFFFF);
        this.powerBar.strokeRect(10, this.gameHeight - 30, 200, 20);
    }
    
    resetDiscSelection() {
        if (this.selectedDisc) {
            // Reset texture
            const texture = this.selectedDisc.team === 0 ? 'disc0' : 'disc1';
            this.selectedDisc.setTexture(texture);
            this.selectedDisc = null;
        }
        
        this.isDragging = false;
        this.currentPointer = null;
        
        // Clear visuals
        this.aimLine.clear();
        this.powerBar.clear();
    }
    
    getDiscAtPosition(x, y) {
        for (const [discId, disc] of this.discs) {
            const dx = disc.x - x;
            const dy = disc.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 25) { // Click tolerance
                return disc;
            }
        }
        return null;
    }
    
    canMoveDisc(disc) {
        const isMyDisc = disc.discId.startsWith(this.playerId);
        const gameRunning = this.room?.state?.gamePhase === 1;
        const isMyTurn = this.playerTeam === this.room?.state?.currentTurn;
        const notMoving = !this.room?.state?.isMoving;
        
        return isMyDisc && gameRunning && isMyTurn && notMoving && disc.canMove;
    }
    
    showGameOver(message) {
        const gameStatus = document.getElementById('gameStatus');
        const statusText = document.getElementById('statusText');
        
        statusText.textContent = message;
        gameStatus.style.display = 'block';
    }
    
    showConnectionError() {
        const loading = document.getElementById('loading');
        loading.innerHTML = `
            <div style="color: #ff5722; text-align: center;">
                <h3>Connection Failed</h3>
                <p>Could not connect to game server</p>
                <button class="btn" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
    
    showLobby() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('lobby').style.display = 'flex';
    }
    
    hideLobby() {
        document.getElementById('lobby').style.display = 'none';
    }
    
    async createRoomWithCode(roomCode) {
        try {
            this.roomCode = roomCode;
            this.isCreator = true;
            
            // Connect to server first
            await this.connectToServer();
            
            // Check if client was successfully created
            if (!this.client) {
                throw new Error('Failed to establish connection to server');
            }
            
            // Create a new room with a unique identifier to ensure we get a fresh room
            console.log('Attempting to create room...');
            const uniqueId = Date.now().toString();
            this.room = await this.client.joinOrCreate('soccer', { uniqueId: uniqueId });
            console.log('Room created successfully:', this.room.roomId);
            this.playerId = this.room.sessionId;
            
            console.log('Created room successfully');
            this.setupRoomListeners();
            
            // Send room code to server after room is created
            console.log('Sending room code to server:', roomCode);
            this.room.send('setRoomCode', { roomCode: roomCode });
            
            console.log('Created room with code:', roomCode);
            this.hideLobby();
            
            // Show waiting room
            this.showWaitingRoom(roomCode);
            
        } catch (error) {
            console.error('Failed to create room:', error);
            
            // Handle specific error cases
            if (error.message && error.message.includes('Room is full')) {
                this.showLobbyError('Room is full. Please try a different room code.');
            } else if (error.message && error.message.includes('Room not found')) {
                this.showLobbyError('Room not found. Please check the room code.');
            } else {
                this.showLobbyError('Failed to create room. Please try again.');
            }
        }
    }
    
    async joinRoomWithCode(roomCode) {
        try {
            this.roomCode = roomCode;
            this.isCreator = false;
            
            // Connect to server first
            await this.connectToServer();
            
            // Check if client was successfully created
            if (!this.client) {
                throw new Error('Failed to establish connection to server');
            }
            
            // Try to join existing room
            console.log('Attempting to join room with code:', roomCode);
            
            // Get all available rooms and find the one with matching room code
            const rooms = await this.client.getAvailableRooms('soccer');
            const targetRoom = rooms.find(room => room.metadata?.roomCode === roomCode);
            
            if (!targetRoom) {
                throw new Error('Room not found');
            }
            
            this.room = await this.client.joinById('soccer', targetRoom.roomId);
            console.log('Room joined successfully:', this.room.roomId);
            this.playerId = this.room.sessionId;
            
            console.log('Joined room with code:', roomCode);
            this.setupRoomListeners();
            this.hideLobby();
            
        } catch (error) {
            console.error('Failed to join room:', error);
            
            // Handle specific error cases
            if (error.message && error.message.includes('Room is full')) {
                this.showLobbyError('Room is full. Please try a different room code.');
            } else if (error.message && error.message.includes('Room not found')) {
                this.showLobbyError('Room not found. Please check the room code.');
            } else {
                this.showLobbyError('Failed to join room. Please check the code.');
            }
        }
    }
    
    showWaitingRoom(roomCode) {
        document.getElementById('currentRoomCode').textContent = roomCode;
        document.getElementById('lobbyOptions').style.display = 'none';
        document.getElementById('createRoom').style.display = 'none';
        document.getElementById('joinRoom').style.display = 'none';
        document.getElementById('waitingRoom').style.display = 'block';
    }
    
    showLobbyError(message) {
        alert(message); // Simple error display for now
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'gameContainer',
    backgroundColor: 0x4CAF50,
    scene: SoccerStarsGame,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        max: {
            width: 800,
            height: 600
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

// Global functions for UI buttons
function restartGame() {
    if (game && game.scene && game.scene.scenes[0] && game.scene.scenes[0].room) {
        game.scene.scenes[0].room.send('restart');
    }
}

function exitGame() {
    if (game && game.scene && game.scene.scenes[0] && game.scene.scenes[0].room) {
        game.scene.scenes[0].room.leave();
    }
    location.reload();
}

function hideStatus() {
    document.getElementById('gameStatus').style.display = 'none';
}

// Lobby functions
function showCreateRoom() {
    document.getElementById('lobbyOptions').style.display = 'none';
    document.getElementById('createRoom').style.display = 'block';
    
    // Generate room code
    generateRoomCode();
}

function showJoinRoom() {
    document.getElementById('lobbyOptions').style.display = 'none';
    document.getElementById('joinRoom').style.display = 'block';
    
    // Focus on input
    setTimeout(() => {
        document.getElementById('roomCodeInput').focus();
    }, 100);
}

function showLobbyOptions() {
    document.getElementById('lobbyOptions').style.display = 'block';
    document.getElementById('createRoom').style.display = 'none';
    document.getElementById('joinRoom').style.display = 'none';
    document.getElementById('waitingRoom').style.display = 'none';
}

async function generateRoomCode() {
    try {
        const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:2567'
            : 'https://your-render-app.onrender.com'; // Replace with your deployed server URL
            
        const response = await fetch(`${serverUrl}/create-room`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        document.getElementById('roomCodeDisplay').textContent = data.roomCode;
        
    } catch (error) {
        console.error('Failed to generate room code:', error);
        document.getElementById('roomCodeDisplay').textContent = 'ERROR';
    }
}

function createRoom() {
    const roomCode = document.getElementById('roomCodeDisplay').textContent;
    if (roomCode && roomCode !== 'XXXXX' && roomCode !== 'ERROR') {
        if (game && game.scene && game.scene.scenes[0]) {
            game.scene.scenes[0].createRoomWithCode(roomCode);
        } else {
            console.error('Game not initialized yet');
        }
    }
}

function joinRoom() {
    const roomCode = document.getElementById('roomCodeInput').value.toUpperCase().trim();
    if (roomCode.length === 5) {
        if (game && game.scene && game.scene.scenes[0]) {
            game.scene.scenes[0].joinRoomWithCode(roomCode);
        } else {
            console.error('Game not initialized yet');
        }
    } else {
        alert('Please enter a valid 5-letter room code');
    }
}

function leaveLobby() {
    if (game && game.scene && game.scene.scenes[0] && game.scene.scenes[0].room) {
        game.scene.scenes[0].room.leave();
    }
    location.reload();
}

// Verify required libraries are loaded
function verifyLibraries() {
    if (typeof Phaser === 'undefined') {
        console.error('Phaser library not loaded');
        alert('Failed to load Phaser library. Please refresh the page.');
        return false;
    }
    
    if (typeof Colyseus === 'undefined') {
        console.error('Colyseus library not loaded');
        alert('Failed to load Colyseus library. Please refresh the page.');
        return false;
    }
    
    console.log('All required libraries loaded successfully');
    return true;
}

// Declare game variable in global scope
let game;

// Start the game only if libraries are loaded
if (verifyLibraries()) {
    game = new Phaser.Game(config);
} else {
    console.error('Game initialization failed due to missing libraries');
}