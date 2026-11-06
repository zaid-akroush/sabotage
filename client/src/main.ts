import Phaser from "phaser";
import { Client, getStateCallbacks, type Room } from "colyseus.js";
import { MESSAGES, type MoveInput } from "@sabotage/shared";

// Same host as the page, Colyseus port. Works on localhost and on your LAN.
const SERVER_URL = `ws://${window.location.hostname}:2567`;

const PLAYER_SIZE = 32; // must match the server's PLAYER_SIZE
const MY_COLOR = 0x4ade80; // green = you
const OTHER_COLOR = 0xf87171; // red = the other player

// What we read from the synced room state (matches server/src/state.ts).
type PlayerState = { x: number; y: number };
type GameState = { players: Map<string, PlayerState> };

class GameScene extends Phaser.Scene {
  private room?: Room<GameState>;
  // One square per player, keyed by sessionId.
  private squares = new Map<string, Phaser.GameObjects.Rectangle>();
  private keys!: Record<"up" | "down" | "left" | "right" | "w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;

  constructor() {
    super("game");
  }

  async create() {
    const keyboard = this.input.keyboard!;
    this.keys = keyboard.addKeys({
      up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT",
      w: "W", a: "A", s: "S", d: "D",
    }) as typeof this.keys;

    const status = this.add.text(10, 10, "Connecting...", { color: "#fff" });

    try {
      this.room = await new Client(SERVER_URL).joinOrCreate<GameState>("game");
    } catch (err) {
      status.setText(`Could not join: ${String(err)}`);
      return;
    }
    status.setText(`Joined as ${this.room.sessionId} (you are green)`);

    // React when players appear in / disappear from the server state.
    const $ = getStateCallbacks(this.room);

    $(this.room.state).players.onAdd((player, sessionId) => {
      const color = sessionId === this.room!.sessionId ? MY_COLOR : OTHER_COLOR;
      const square = this.add.rectangle(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, color);
      this.squares.set(sessionId, square);
    });

    $(this.room.state).players.onRemove((_player, sessionId) => {
      this.squares.get(sessionId)?.destroy();
      this.squares.delete(sessionId);
    });
  }

  update() {
    if (!this.room) return;

    // 1. Send our input. Only a direction, never a position.
    const k = this.keys;
    const input: MoveInput = {
      dx: (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0),
      dy: (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0),
    };
    // ponytail: sends every frame as asked; send only on change if bandwidth matters.
    this.room.send(MESSAGES.MOVE, input);

    // 2. Draw every square where the server says it is.
    this.room.state.players.forEach((player, sessionId) => {
      this.squares.get(sessionId)?.setPosition(player.x, player.y);
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#222",
  scene: GameScene,
});
