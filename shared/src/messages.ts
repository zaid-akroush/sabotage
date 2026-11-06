// Message names used by both client and server.
// Keep them here so a typo can't make the two sides disagree.
export const MESSAGES = {
  // Client -> Server: "I want to move in this direction" (intent, not a position).
  MOVE: "player:move",
} as const;

// Payload of MESSAGES.MOVE.
// dx / dy are directions: -1 (left/up), 0 (none), 1 (right/down).
// The server clamps them to -1..1, so a cheating client can't move faster.
export type MoveInput = {
  dx: number;
  dy: number;
};
