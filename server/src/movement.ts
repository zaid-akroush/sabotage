// Movement rules as plain functions: no Colyseus here, so they are easy to test.
import type { MapData, MoveInput } from "@sabotage/shared";

// Pixels per second.
export const PLAYER_SPEED = 200;

// Size of a player square in pixels (client draws the same size).
export const PLAYER_SIZE = 32;

// Turn untrusted network data into a safe MoveInput, or null if it's garbage.
export function parseMoveInput(data: unknown): MoveInput | null {
  if (typeof data !== "object" || data === null) return null;
  const { dx, dy } = data as Record<string, unknown>;
  if (typeof dx !== "number" || typeof dy !== "number") return null;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
  return { dx: clamp(dx, -1, 1), dy: clamp(dy, -1, 1) };
}

// New position after moving for `deltaMs` milliseconds, kept inside the map.
// ponytail: walls are ignored for now; add collision when the client draws them.
export function step(
  pos: { x: number; y: number },
  input: MoveInput,
  deltaMs: number,
  map: MapData,
): { x: number; y: number } {
  const distance = PLAYER_SPEED * (deltaMs / 1000);
  const half = PLAYER_SIZE / 2;
  return {
    x: clamp(pos.x + input.dx * distance, half, map.width - half),
    y: clamp(pos.y + input.dy * distance, half, map.height - half),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
