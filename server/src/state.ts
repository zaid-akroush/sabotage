import { MapSchema, Schema, type } from "@colyseus/schema";

// Only fields marked with @type(...) are synced to clients.

export class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
}

export class GameState extends Schema {
  // Key = the player's sessionId (given by Colyseus when they join).
  @type({ map: Player }) players = new MapSchema<Player>();
}
