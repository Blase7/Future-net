# Bankroll Book

## Run locally
1. Copy `.env.example` to `.env` and paste your MongoDB connection string.
2. `npm install` then `npm start`, open http://localhost:3000

## Deploy on Render
1. Push this folder to GitHub (`.env` is git-ignored).
2. New > Web Service > pick the repo. Build: `npm install`. Start: `npm start`.
3. Add your variables: Environment tab (MONGODB_URI), or Secret Files with a file named `.env` (pasted as-is).
4. In MongoDB Atlas > Network Access, allow Render to connect (Render free services have no fixed IP, so 0.0.0.0/0 with a strong password).

No login is built in, so anyone with the URL can use it.
