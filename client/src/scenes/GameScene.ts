// Scene: connects to the server and wires the systems together.
// Keep game logic out of here. Put it in its own file and call it from update().
import Phaser from "phaser";
import { joinGame, type GameRoom } from "../network";
import { PlayerController } from "../PlayerController";

export class GameScene extends Phaser.Scene {
  private room?: GameRoom;
  private players?: PlayerController;

  constructor() {
    super("game");
  }

  async create() {
    const status = this.add.text(10, 10, "Connecting...", { color: "#fff" });

    try {
      this.room = await joinGame();
    } catch (err) {
      status.setText(`Could not join: ${String(err)}`);
      return;
    }
    status.setText(`Joined as ${this.room.sessionId} (you are green)`);

    this.players = new PlayerController(this, this.room);
    // Frontend 2: create the level / HUD here, e.g. new Level(this, this.room).

    // Clean up listeners and leave the room if the scene shuts down.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.players?.destroy();
      this.room?.leave();
    });
  }

  update() {
    this.players?.update();
  }
}
