# Backend

VaultShare REST API in Node.js + Express, with a MySQL database.

## Structure
- `server.js`: starts the server and mounts the routers
- `routes/auth.js`: register, login, current user
- `routes/folders.js`: folders (create, list, rename, delete)
- `middleware/auth.js`: checks the JWT on protected routes
- `db/schema.sql`: database tables

## Run
1. Copy `.env.example` to `.env` and fill in the values
2. `npm install`
3. `npm run dev`

The server never receives plaintext files, names or keys.