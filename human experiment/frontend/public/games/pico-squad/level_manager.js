/**
 * Level Manager
 * Defines level layouts and loads them into game state.
 */

import { gameState, resetLevelState, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Pico, Wall, Block, Key, Door } from './entities.js';

// Level Data Definitions
const LEVELS = [
    // Level 1: Basics
    {
        startPos: [50, 200], // x, y for squad spawn
        walls: [
            { x: 0, y: 350, w: 600, h: 50 }, // Floor
            { x: 0, y: 0, w: 20, h: 400 }, // Left Wall
            { x: 580, y: 0, w: 20, h: 400 }, // Right Wall
            { x: 200, y: 270, w: 50, h: 80 }, // Obstacle 1 (Lowered for easier jump)
            { x: 350, y: 200, w: 100, h: 20 }  // Platform
        ],
        blocks: [],
        keyPos: [390, 160],
        doorPos: [500, 270]
    },
    // Level 2: Stacking
    // Redesigned to be solvable with a 2-Pico stack
    {
        startPos: [50, 300],
        walls: [
            { x: 0, y: 350, w: 600, h: 50 }, // Floor
            { x: 0, y: 0, w: 20, h: 400 },
            { x: 580, y: 0, w: 20, h: 400 },
            // Wall height 120 (Floor 350 - Top 230). Max jump 100.
            // Requires stacking at least 2 Picos to clear.
            { x: 250, y: 230, w: 60, h: 120 }, 
        ],
        blocks: [],
        keyPos: [270, 190], // On top of the wall
        doorPos: [500, 270]  // On the floor on the right side
    },
    // Level 3: Push Block
    {
        startPos: [50, 300],
        walls: [
            { x: 0, y: 350, w: 800, h: 50 }, // Wide floor
            { x: 0, y: 0, w: 20, h: 400 },
            { x: 780, y: 0, w: 20, h: 400 },
            // Platform height 110 (Floor 350 - Top 240).
            // Too high for single jump, requires block.
            { x: 300, y: 240, w: 200, h: 110 } 
        ],
        blocks: [
            { x: 150, y: 310 } // Pushable block
        ],
        keyPos: [400, 200], // On platform
        doorPos: [650, 270] // On floor after platform
    }
];

export function loadLevel(index) {
    resetLevelState();
    
    // Validate index
    if (index >= LEVELS.length) {
        // Game Complete
        gameState.gamePhase = "GAME_OVER_WIN";
        return;
    }
    
    gameState.currentLevelIndex = index;
    const data = LEVELS[index];
    
    // Spawn Picos (3 of them slightly offset)
    const [sx, sy] = data.startPos;
    gameState.picos.push(new Pico(sx, sy, COLORS.PICO_1));
    gameState.picos.push(new Pico(sx - 30, sy, COLORS.PICO_2));
    gameState.picos.push(new Pico(sx + 30, sy, COLORS.PICO_3));
    
    // Spawn Walls
    for (let w of data.walls) {
        gameState.walls.push(new Wall(w.x, w.y, w.w, w.h));
    }
    
    // Spawn Blocks
    for (let b of data.blocks) {
        gameState.blocks.push(new Block(b.x, b.y));
    }
    
    // Spawn Key
    if (data.keyPos) {
        const key = new Key(data.keyPos[0], data.keyPos[1]);
        gameState.collectibles.push(key);
    }
    
    // Spawn Door
    if (data.doorPos) {
        gameState.door = new Door(data.doorPos[0], data.doorPos[1]);
    }
    
    // Initial Camera
    gameState.camera.x = 0;
}

/**
 * Check Win Condition for Level
 */
export function checkLevelComplete() {
    if (!gameState.hasKey) return false;
    
    // Check if at least one pico is overlapping the door
    const d = gameState.door;
    const doorCX = d.x + d.width/2;
    const doorCY = d.y + d.height/2;
    
    for (let pico of gameState.picos) {
        const pcx = pico.x + pico.width/2;
        const pcy = pico.y + pico.height/2;
        
        // Simple distance check or AABB inclusion
        const dist = Math.abs(pcx - doorCX);
        const distY = Math.abs(pcy - doorCY);
        
        if (dist <= d.width * 0.6 && distY <= d.height * 0.6) {
            return true; // At least one pico is in the door
        }
    }
    
    return false; // No picos in the door
}

export function advanceLevel() {
    gameState.score += 100; // Award points for clearing the level
    loadLevel(gameState.currentLevelIndex + 1);
    gameState.gamePhase = "PLAYING";
}