# Sabotage: notes for Claude coding assistants

Before changing code, read the guide for your area:
- Backend (`server/`): `backend_engineering_guide.md`
- Frontend (`client/`): `frontend_team_prompt.md`

Those docs were written for a 2v2 design. Where they conflict with the current code
(room size, message payloads), the code and `shared/` are the source of truth until
the team agrees otherwise.

## Commands
- `npm install`: install everything (run from the repo root)
- `npm run dev`: server on :2567 plus client on :5173
- `npm run build`: type-check and build shared, server and client
- `npm test`: server unit tests (node:test via tsx)

Run `npm run build && npm test` before you say a change is done. CI runs the same.

## Layout
- `shared/src/`: message names (`MESSAGES`) and payload types. **The contract.**
- `shared/maps/`: map JSON files (`MapData` type in `shared/src/maps.ts`)
- `server/src/rooms/GameRoom.ts`: Colyseus room: lifecycle and message routing only
- `server/src/state.ts`: synced Schema state (only `@type` fields reach clients)
- `server/src/movement.ts`: game rules as plain functions (no Colyseus, unit-tested)
- `client/src/network.ts`: the only client file that imports colyseus.js
- `client/src/PlayerController.ts`: input and player rendering (Frontend 1)
- `client/src/scenes/GameScene.ts`: wires the systems together. Keep it thin.

## Rules
- Server is authoritative. Clients send intent (a direction, "interact with X"), never results (positions, "door open").
- Validate every client payload at runtime on the server (see `parseMoveInput`).
- New message or payload: add it to `shared/src/messages.ts` first, then use the constant on both sides. Never use raw strings.
- If you change a field in `server/src/state.ts`, update the matching types in `client/src/network.ts`.
- After editing `shared/src`, rebuild it (`npm run build -w shared`); `npm run dev` does this on start.
- Colyseus is pinned to 0.16 (server `colyseus`, client `colyseus.js`, `@colyseus/schema` 3). Use the 0.16 API, e.g. `getStateCallbacks(room)` for onAdd/onRemove. Don't upgrade one side alone.
- Phaser is 3.x. Don't use Phaser 4 APIs.
- Stay in your own files. Changing `shared/` or another person's file needs a heads-up to the team.
- Work on a branch and open a PR to `master`. Keep PRs small.
