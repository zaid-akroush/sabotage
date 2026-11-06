// Players: keyboard input and drawing one square per player.
// Owner: Frontend 1 (player controller and combat).
import Phaser from "phaser";
import { MESSAGES, type MoveInput } from "@sabotage/shared";
import { onPlayers, type GameRoom } from "./network";

const PLAYER_SIZE = 32; // must match the server's PLAYER_SIZE
const MY_COLOR = 0x4ade80; // green = you
const OTHER_COLOR = 0xf87171; // red = the other player

type Keys = Record<"up" | "down" | "left" | "right" | "w" | "a" | "s" | "d", Phaser.Input.Keyboard.Key>;

export class PlayerController {
  // One square per player, keyed by sessionId.
  private squares = new Map<string, Phaser.GameObjects.Rectangle>();
  private keys: Keys;
  private stopListening: () => void;

  constructor(private scene: Phaser.Scene, private room: GameRoom) {
    this.keys = scene.input.keyboard!.addKeys({
      up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT",
      w: "W", a: "A", s: "S", d: "D",
    }) as Keys;

    this.stopListening = onPlayers(
      room,
      (player, sessionId) => {
        const color = sessionId === room.sessionId ? MY_COLOR : OTHER_COLOR;
        this.squares.set(sessionId, scene.add.rectangle(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE, color));
      },
      (sessionId) => {
        this.squares.get(sessionId)?.destroy();
        this.squares.delete(sessionId);
      },
    );
  }

  // Called every frame by the scene.
  update() {
    // 1. Send our input. Only a direction, never a position.
    const k = this.keys;
    const input: MoveInput = {
      dx: (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0),
      dy: (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0),
    };
    // ponytail: sends every frame; send only on change if bandwidth matters.
    this.room.send(MESSAGES.MOVE, input);

    // 2. Draw every square where the server says it is.
    this.room.state.players.forEach((player, sessionId) => {
      this.squares.get(sessionId)?.setPosition(player.x, player.y);
    });
  }

  destroy() {
    this.stopListening();
    this.squares.forEach((square) => square.destroy());
    this.squares.clear();
  }
}
