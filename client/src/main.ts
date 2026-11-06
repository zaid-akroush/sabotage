// Entry point: Phaser config only. Add new scenes to the `scene` list.
import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#222",
  scene: [GameScene],
});
