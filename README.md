# Sabotage

2D browser co-op multiplayer puzzle game. Prototype: two players move squares in a shared room.

- `shared/` – message names, payload types, map types and map JSON (`shared/maps/`)
- `server/` – Colyseus server (authoritative). Room `"game"`, max 2 players, port 2567
- `client/` – Phaser 3 + Vite + colyseus.js

See `backend_engineering_guide.md` and `frontend_team_prompt.md` for the team contracts.

## Install

Requires Node 22+.

```bash
npm install
```

## Run

```bash
npm run dev
```

This builds `shared`, then starts the server (`ws://localhost:2567`) and the client (`http://localhost:5173`) together.

Other commands:

```bash
npm run build   # build all three packages
npm test        # server movement/validation tests
```

## Test with two tabs

1. Run `npm run dev`.
2. Open http://localhost:5173 in two browser tabs (or two windows side by side).
3. Each tab shows two squares: **green is you**, red is the other player.
4. Click into one tab and use the arrow keys or WASD. Your square moves in both tabs.

A third tab gets its own new room, because a room holds only 2 players.

## How movement works

The client sends only a direction (`{ dx, dy }`, message `player:move`) every frame.
The server clamps it to -1..1, moves players at a fixed speed on a 60 Hz tick, and
syncs `x`/`y` back through the room state. Clients never send positions.

If you edit `shared/src`, rerun `npm run dev` (or `npm run build -w shared`) so the server and client pick up the change.
