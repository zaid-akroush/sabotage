import { Client, Room } from "colyseus";
import { MESSAGES, type MapData, type MoveInput } from "@sabotage/shared";
import exampleMap from "@sabotage/shared/maps/example.json" with { type: "json" };
import { GameState, Player } from "../state.js";
import { parseMoveInput, step } from "../movement.js";

// Server ticks 60 times per second.
const TICK_MS = 1000 / 60;

export class GameRoom extends Room<GameState> {
  maxClients = 2;
  state = new GameState();

  // Loaded on the server only. Not sent to clients yet.
  private map: MapData = exampleMap;

  // Latest input per player. Server-only: not part of the synced state.
  private inputs = new Map<string, MoveInput>();

  onCreate() {
    // The client only sends a direction. The server decides the new position.
    this.onMessage(MESSAGES.MOVE, (client, data: unknown) => {
      const input = parseMoveInput(data);
      if (!input) return; // ignore malformed messages
      this.inputs.set(client.sessionId, input);
    });

    // Move everyone on a fixed tick, so speed doesn't depend on how often
    // a client sends messages.
    this.setSimulationInterval((deltaMs) => this.update(deltaMs), TICK_MS);
  }

  onJoin(client: Client) {
    // First player gets spawn 0, second gets spawn 1, and so on.
    const index = this.state.players.size % this.map.spawnPoints.length;
    const spawn = this.map.spawnPoints[index];

    const player = new Player();
    player.x = spawn.x;
    player.y = spawn.y;
    this.state.players.set(client.sessionId, player);
    console.log(`${client.sessionId} joined at (${spawn.x}, ${spawn.y})`);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    this.inputs.delete(client.sessionId);
    console.log(`${client.sessionId} left`);
  }

  private update(deltaMs: number) {
    this.state.players.forEach((player, sessionId) => {
      const input = this.inputs.get(sessionId);
      if (!input) return;
      const next = step(player, input, deltaMs, this.map);
      player.x = next.x;
      player.y = next.y;
    });
  }
}
