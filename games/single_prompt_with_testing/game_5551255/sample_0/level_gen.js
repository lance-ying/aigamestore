import { gameState, CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Wall, Coin, Enemy } from './entities.js';

// Define some room templates (20x20 grid roughly, or chunks)
// 0 = Empty, 1 = Wall, 2 = Coin, 3 = Enemy
// We'll generate chunks of height 20 cells (400px)
const CHUNK_HEIGHT_CELLS = 20;
const COLS = Math.floor(CANVAS_WIDTH / CELL_SIZE); // 30

const TEMPLATES = [
    // Template 1: Basic pillars
    (yOffset) => {
        for (let y = 0; y < CHUNK_HEIGHT_CELLS; y++) {
            // Borders
            createWall(0, y + yOffset);
            createWall(COLS - 1, y + yOffset);
            
            // Random pillars
            if (y % 4 === 0) {
                const hole = Math.floor(Math.random() * (COLS - 4)) + 2;
                for(let x=2; x < COLS-2; x++) {
                     if (Math.abs(x - hole) > 2) createWall(x, y + yOffset);
                }
                if (Math.random() > 0.5) createCoin(hole, y + yOffset);
            }
        }
    },
    // Template 2: Zig Zag
    (yOffset) => {
        for (let y = 0; y < CHUNK_HEIGHT_CELLS; y++) {
            createWall(0, y + yOffset);
            createWall(COLS - 1, y + yOffset);
            
            let xPos = Math.floor((Math.sin(y * 0.5) + 1) * (COLS/3)) + 2;
            createWall(xPos, y + yOffset);
            createWall(xPos+1, y + yOffset);
            
            if (y % 5 === 0) createCoin(COLS - 5, y + yOffset);
            if (y % 7 === 0) createEnemy(5, y + yOffset);
        }
    },
    // Template 3: Random Noise (Sparse)
    (yOffset) => {
        for (let y = 0; y < CHUNK_HEIGHT_CELLS; y++) {
            createWall(0, y + yOffset);
            createWall(COLS - 1, y + yOffset);
            
            for (let x = 1; x < COLS - 1; x++) {
                if (Math.random() < 0.1) createWall(x, y + yOffset);
                else if (Math.random() < 0.05) createCoin(x, y + yOffset);
            }
        }
    }
];

function createWall(cx, cy) {
    // Avoid duplicates or overlap if needed, but array push is fine for now
    gameState.walls.push(new Wall(cx * CELL_SIZE, cy * CELL_SIZE, CELL_SIZE, CELL_SIZE));
}

function createCoin(cx, cy) {
    gameState.coins.push(new Coin(cx * CELL_SIZE, cy * CELL_SIZE));
}

function createEnemy(cx, cy) {
    gameState.enemies.push(new Enemy(cx * CELL_SIZE, cy * CELL_SIZE));
}

export function initLevel() {
    gameState.walls = [];
    gameState.coins = [];
    gameState.enemies = [];
    gameState.tideY = CANVAS_HEIGHT + 200; // Start tide well below
    gameState.generatedMaxY = 0; // Top of the world so far (growing negative)
    
    // Create floor
    for(let x=0; x<COLS; x++) createWall(x, CANVAS_HEIGHT/CELL_SIZE - 1);
    
    // Generate initial chunks going UP
    generateChunk(-CHUNK_HEIGHT_CELLS); 
    generateChunk(0);
}

export function updateLevelGen() {
    // If player is getting close to the generated top, generate more
    // Player Y is negative going up. generatedMaxY is the highest negative index (smallest number)
    
    // Convert pixels to cells
    const playerGridY = Math.floor(gameState.player.y / CELL_SIZE);
    
    // If we are within 2 chunks of the top
    const topLimit = gameState.generatedMaxY;
    if (playerGridY < topLimit + CHUNK_HEIGHT_CELLS) {
        generateChunk(topLimit - CHUNK_HEIGHT_CELLS);
    }
    
    // Cleanup entities far below
    const cleanupY = gameState.cameraY + CANVAS_HEIGHT + 400;
    
    gameState.walls = gameState.walls.filter(e => e.y < cleanupY);
    gameState.coins = gameState.coins.filter(e => e.y < cleanupY);
    // Keep enemies for now, or cull them too
    gameState.enemies = gameState.enemies.filter(e => e.y < cleanupY);
}

function generateChunk(yStartCell) {
    const templateIdx = Math.floor(Math.random() * TEMPLATES.length);
    TEMPLATES[templateIdx](yStartCell);
    gameState.generatedMaxY = yStartCell;
}