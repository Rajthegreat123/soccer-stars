# Quick Deployment Guide

## 🚀 Deploy in 5 Minutes

### 1. Backend (Render - Free)

1. **Push to GitHub**: `git add . && git commit -m "Initial commit" && git push`
2. **Go to [render.com](https://render.com)** → Sign up with GitHub
3. **New Web Service** → Connect repository
4. **Settings**:
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm start`
   - Environment: Node.js
5. **Deploy** → Copy the URL (e.g., `https://your-app.onrender.com`)

### 2. Frontend (Netlify - Free)

1. **Update server URL** in `client/game.js` line 123:
   ```javascript
   : 'wss://your-app.onrender.com'; // Replace with your Render URL
   ```

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag & drop the `client` folder
   - Or connect GitHub repo with build settings:
     - Build command: `cd client && npm run build`
     - Publish directory: `client`

### 3. Test

- Open your Netlify URL in one browser → Create Room → Note the code
- Open the same URL in another browser → Join Room → Enter the code  
- Both players should connect and start playing!

### 🔧 Local Development

```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client  
cd client && npm run dev
# Open http://localhost:3000 in multiple tabs
```

### 🐛 Issues?

- **Can't connect**: Check server URL in `client/game.js`
- **Server not starting**: Check `render.com` logs
- **Game not working**: Open browser dev tools → Console for errors

That's it! 🎮