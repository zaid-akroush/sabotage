// Network layer: the only file that talks to Colyseus directly.
// No Phaser in here.
import { Client, getStateCallbacks, type Room } from "colyseus.js";

// Same host as the page, Colyseus port. Works on localhost and on your LAN.
const SERVER_URL = `ws://${window.location.hostname}:2567`;

// What we read from the synced room state (must match server/src/state.ts).
export type PlayerState = { x: number; y: number };
export type GameState = { players: Map<string, PlayerState> };

export type GameRoom = Room<GameState>;

export function joinGame(): Promise<GameRoom> {
  return new Client(SERVER_URL).joinOrCreate<GameState>("game");
}

// Call `onAdd` / `onRemove` when players join or leave the room state.
// Returns a function that removes both listeners.
export function onPlayers(
  room: GameRoom,
  onAdd: (player: PlayerState, sessionId: string) => void,
  onRemove: (sessionId: string) => void,
): () => void {
  const $ = getStateCallbacks(room);
  const offAdd = $(room.state).players.onAdd((player, id) => onAdd(player, id));
  const offRemove = $(room.state).players.onRemove((_player, id) => onRemove(id));
  return () => {
    offAdd();
    offRemove();
  };
}
