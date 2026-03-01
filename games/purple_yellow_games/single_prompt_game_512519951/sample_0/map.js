import { TILE_SIZE, GRID_W, GRID_H, COLORS } from './globals.js';
import { randomInt } from './utils.js';

export class Tile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'WALL', 'FLOOR', 'STAIRS'
        this.visible = false;
        this.seen = false; // Fog of war memory
    }
}

export class DungeonGenerator {
    static generate(level) {
        // Initialize grid with walls
        let map = [];
        for (let y = 0; y < GRID_H; y++) {
            let row = [];
            for (let x = 0; x < GRID_W; x++) {
                row.push(new Tile(x, y, 'WALL'));
            }
            map.push(row);
        }

        const rooms = [];
        const MAX_ROOMS = 8 + level; // More rooms as level increases
        const MIN_SIZE = 3;
        const MAX_SIZE = 8;

        for (let i = 0; i < MAX_ROOMS; i++) {
            const w = randomInt(MIN_SIZE, MAX_SIZE);
            const h = randomInt(MIN_SIZE, MAX_SIZE);
            const x = randomInt(1, GRID_W - w - 1);
            const y = randomInt(1, GRID_H - h - 1);

            const newRoom = { x, y, w, h, cx: Math.floor(x + w/2), cy: Math.floor(y + h/2) };

            // Check overlap
            let failed = false;
            for (let other of rooms) {
                if (newRoom.x <= other.x + other.w && newRoom.x + newRoom.w >= other.x &&
                    newRoom.y <= other.y + other.h && newRoom.y + newRoom.h >= other.y) {
                    failed = true;
                    break;
                }
            }

            if (!failed) {
                rooms.push(newRoom);
                // Carve room
                for (let ry = newRoom.y; ry < newRoom.y + newRoom.h; ry++) {
                    for (let rx = newRoom.x; rx < newRoom.x + newRoom.w; rx++) {
                        map[ry][rx].type = 'FLOOR';
                    }
                }

                // Connect to previous room
                if (rooms.length > 1) {
                    const prev = rooms[rooms.length - 2];
                    // Horizontal then vertical
                    if (Math.random() < 0.5) {
                        DungeonGenerator.carveH(map, prev.cx, newRoom.cx, prev.cy);
                        DungeonGenerator.carveV(map, prev.cy, newRoom.cy, newRoom.cx);
                    } else {
                        DungeonGenerator.carveV(map, prev.cy, newRoom.cy, prev.cx);
                        DungeonGenerator.carveH(map, prev.cx, newRoom.cx, newRoom.cy);
                    }
                }
            }
        }
        
        // Place Stairs in the last room
        const lastRoom = rooms[rooms.length - 1];
        map[lastRoom.cy][lastRoom.cx].type = 'STAIRS';

        return { map, rooms };
    }

    static carveH(map, x1, x2, y) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            map[y][x].type = 'FLOOR';
        }
    }

    static carveV(map, y1, y2, x) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            map[y][x].type = 'FLOOR';
        }
    }
}