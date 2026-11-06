// Run with: npm test -w server
import assert from "node:assert/strict";
import { test } from "node:test";
import type { MapData } from "@sabotage/shared";
import { parseMoveInput, step, PLAYER_SPEED } from "./movement.js";

const map: MapData = { width: 800, height: 600, spawnPoints: [], walls: [] };

test("parseMoveInput rejects bad payloads and clamps big numbers", () => {
  assert.equal(parseMoveInput(null), null);
  assert.equal(parseMoveInput("left"), null);
  assert.equal(parseMoveInput({ dx: "1", dy: 0 }), null);
  assert.equal(parseMoveInput({ dx: NaN, dy: 0 }), null);
  assert.deepEqual(parseMoveInput({ dx: 50, dy: -9 }), { dx: 1, dy: -1 });
});

test("step moves at PLAYER_SPEED and stays inside the map", () => {
  assert.deepEqual(step({ x: 100, y: 100 }, { dx: 1, dy: 0 }, 1000, map), {
    x: 100 + PLAYER_SPEED,
    y: 100,
  });
  const edge = step({ x: 790, y: 5 }, { dx: 1, dy: -1 }, 1000, map);
  assert.deepEqual(edge, { x: 784, y: 16 });
});
