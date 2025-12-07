/**
 * Level Designs and Data
 */
import { DIR, COLORS } from './globals.js';

// Tile Types: 0: Floor, 1: Wall, 2: Goal, 3: Hazard
export const TILES = {
    FLOOR: 0,
    WALL: 1,
    GOAL: 2,
    HAZARD: 3
};

const LEVEL_1 = {
    width: 10,
    height: 7,
    layout: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 2, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    units: [
        { x: 1, y: 1, dir: DIR.RIGHT }
    ],
    enemies: [],
    description: "Initialize Movement Protocols. Reach the Green Sector."
};

const LEVEL_2 = {
    width: 10,
    height: 7,
    layout: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 2, 1],
        [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 3, 1, 0, 0, 0, 1],
        [1, 1, 1, 1, 3, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    units: [
        { x: 1, y: 5, dir: DIR.RIGHT }
    ],
    enemies: [],
    description: "Hazard Detected. Avoid Red Zones."
};

const LEVEL_3 = {
    width: 10,
    height: 7,
    layout: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 1, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 2, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    units: [
        { x: 8, y: 1, dir: DIR.LEFT },
        { x: 1, y: 5, dir: DIR.RIGHT }
    ],
    enemies: [
        { x: 5, y: 3, type: 'STATIC' }
    ],
    description: "Multi-Thread Processing. Coordinate two units."
};

export const LEVELS = [LEVEL_1, LEVEL_2, LEVEL_3];