# Soccer Stars - Multiplayer Game

A full-stack, browser-based multiplayer turn-based game inspired by Soccer Stars, built with Phaser 3 and Colyseus.

## 🎮 Game Features

- **Multiplayer**: 2 players per room
- **Turn-based gameplay**: Each player takes turns moving their discs
- **Physics**: Realistic ball and disc physics with collision detection
- **Goal scoring**: First to 5 goals wins
- **Mobile & Desktop**: Works on both platforms with touch/mouse controls
- **Real-time sync**: All game state synchronized via Colyseus

## 🚀 Tech Stack

- **Frontend**: Phaser 3 (vanilla JS)
- **Backend**: Colyseus (Node.js + TypeScript)
- **Hosting**: Netlify (frontend) + Render/Railway (backend)

## 📁 Project Structure

```
project-root/
├── client/           # Phaser frontend
│   ├── index.html
│   ├── game.js
│   └── package.json
├── server/           # Colyseus backend
│   ├── src/
│   │   ├── index.ts
│   │   ├── rooms/SoccerRoom.ts
│   │   └── schema/GameState.ts
│   ├── package.json
│   └── tsconfig.json
├── package.json      # Root workspace config
├── netlify.toml      # Netlify deployment config
├── render.yaml       # Render deployment config
└── README.md
```

## 🛠️ Local Development

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd soccer-stars-multiplayer
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```
   Server will run on `ws://localhost:2567`

3. **Start the client:**
   ```bash
   cd client  
   npm run dev
   ```
   Client will run on `http://localhost:3000`

4. **Open multiple browser tabs/windows to test multiplayer**

## 🎯 How to Play

1. **Join a room**: Open the game URL
2. **Wait for opponent**: Game starts when 2 players join
3. **Take turns**: 
   - Drag any of your discs to aim
   - Release to shoot (longer drag = more power)
   - Turn ends when all motion stops
4. **Score goals**: Hit the ball into opponent's goal
5. **Win**: First to 5 goals wins!

### Controls

- **Desktop**: Mouse drag and release
- **Mobile**: Touch drag and release
- **Visual feedback**: Aim line and power bar show shot direction/strength

## 🚀 Deployment

### Backend (Render/Railway)

#### Option 1: Render

1. **Push to GitHub**
2. **Connect Render to your repository**
3. **Create new Web Service with:**
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm start`
   - Environment: Node.js
   - Plan: Free tier

#### Option 2: Railway

1. **Install Railway CLI**: `npm install -g @railway/cli`
2. **Login**: `railway login`
3. **Deploy**:
   ```bash
   cd server
   railway deploy
   ```

### Frontend (Netlify)

#### Option 1: Netlify UI

1. **Drag & drop** the `client` folder to Netlify
2. **Update server URL** in `client/game.js`:
   ```javascript
   const serverUrl = 'wss://your-backend-url.onrender.com';
   ```

#### Option 2: Netlify CLI

1. **Install CLI**: `npm install -g netlify-cli`
2. **Deploy**:
   ```bash
   cd client
   netlify deploy --prod
   ```

### Environment Variables

Update the server URL in your client code after backend deployment:

```javascript
// In client/game.js, replace:
const serverUrl = process.env.SERVER_URL || 'ws://localhost:2567';

// With your deployed server URL:
const serverUrl = 'wss://your-app.onrender.com';
```

## 🎮 Game Rules

- **Teams**: Green (Team 0) vs Red (Team 1)
- **Discs**: Each team has 5 discs
- **Turns**: Only the active player can move their discs
- **Shooting**: Drag any disc to aim, release to shoot
- **Physics**: Discs can hit the ball and each other
- **Goals**: Ball must enter opponent's goal area
- **Winning**: First team to 5 goals wins
- **Timeout**: 8-second turn limit (automatic switch)

## 🔧 Technical Details

### Client-Server Communication

- **move**: Update disc position during aiming
- **shoot**: Apply force to disc (forceX, forceY)
- **restart**: Reset game after completion

### Physics Engine

- **60 FPS** server simulation
- **Friction** applied to all moving objects
- **Collision detection** between discs and ball
- **Boundary collision** with field edges
- **Goal detection** zones

### State Synchronization

- Real-time state sync via Colyseus
- Turn management and validation
- Anti-cheat: Server-side physics and rule enforcement

## 🐛 Troubleshooting

### Connection Issues

- Check server URL in client code
- Verify server is running and accessible
- Check browser console for WebSocket errors

### Game Not Starting

- Ensure 2 players have joined the room
- Check that server is running properly
- Refresh browser if stuck on "Waiting..."

### Performance Issues

- Close other browser tabs
- Check network connection
- Try refreshing the page

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📝 License

MIT License - feel free to use this project for learning or building upon!

## 🎯 Future Enhancements

- [ ] Spectator mode
- [ ] Different field sizes
- [ ] Power-ups and special abilities
- [ ] Tournament brackets
- [ ] Player statistics
- [ ] Custom team colors
- [ ] Sound effects and music
- [ ] Replay system