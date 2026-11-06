// Shape of a map file in shared/maps/*.json.
// All units are pixels, with (0, 0) at the top-left corner.

export type Point = {
  x: number;
  y: number;
};

export type Wall = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MapData = {
  width: number;
  height: number;
  spawnPoints: Point[];
  walls: Wall[];
};
