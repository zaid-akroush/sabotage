import { Server } from "colyseus";
import { GameRoom } from "./rooms/GameRoom.js";

const PORT = 2567;

const gameServer = new Server();

// Clients join this room with client.joinOrCreate("game").
gameServer.define("game", GameRoom);

gameServer.listen(PORT).then(() => {
  console.log(`Colyseus server listening on ws://localhost:${PORT}`);
});
