// levels.js - Level designs and data
// 0: Floor, 1: Wall, 2: Start, 3: Exit
import { gameState } from './globals.js'; // Import gameState

export const LEVELS = [
    {
        // Level 1: Straight line tutorial
        id: 1,
        title: "INITIATION",
        layout: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 0, 0, 0, 0, 0, 3, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        enemies: [],
        maxCommands: 10
    },
    {
        // Level 2: Turning required
        id: 2,
        title: "THE BEND",
        layout: [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 2, 0, 0, 1, 1, 1],
            [1, 1, 1, 0, 1, 1, 1],
            [1, 1, 1, 0, 0, 3, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        enemies: [],
        maxCommands: 15
    },
    {
        // Level 3: Combat introduction
        id: 3,
        title: "OBSTRUCTION",
        layout: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 0, 0, 0, 0, 3, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ],
        enemies: [
            { x: 4, y: 1, type: 'scout' } // Enemy blocking the path
        ],
        maxCommands: 15
    },
    {
        // Level 4: Maze
        id: 4,
        title: "LABYRINTH",
        layout: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 2, 0, 1, 3, 0, 1, 1],
            [1, 0, 0, 1, 1, 0, 1, 1],
            [1, 0, 1, 1, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1]
        ],
        enemies: [
            { x: 5, y: 2, type: 'scout' }
        ],
        maxCommands: 25
    }
];

export function loadLevel(p, index) {
    if (index >= LEVELS.length) {
        return false; // No more levels
    }

    const levelData = LEVELS[index];
    const rows = levelData.layout.length;
    const cols = levelData.layout[0].length;
    
    // Initialize Grid
    gameState.grid = [];
    gameState.cols = cols;
    gameState.rows = rows;
    
    let startPos = { x: 1, y: 1 };
    
    for (let y = 0; y < rows; y++) {
        let row = [];
        for (let x = 0; x < cols; x++) {
            const tileType = levelData.layout[y][x];
            row.push(tileType);
            if (tileType === 2) {
                startPos = { x, y };
            }
        }
        gameState.grid.push(row);
    }
    
    // Import entities here to avoid circular dependencies at top level if possible, 
    // but standard ES6 imports are hoisted. We rely on the game setup to instantiate.
    
    // Reset State
    gameState.programQueue = [];
    gameState.executionStep = 0;
    gameState.maxCommands = levelData.maxCommands;
    gameState.subPhase = "PROGRAMMING";
    
    return { startPos, enemies: levelData.enemies, title: levelData.title };
}