// level.js - Level generation
import { gameState, TILE_SIZE } from './globals.js';
import { Player, Enemy, Ring, Spring, GoalPost } from './entities.js';

// Legend:
// . = Empty
// # = Ground (Dirt)
// G = Grass Top
// B = Block (Floating)
// S = Spikes
// R = Ring
// E = Enemy (Ladybug)
// C = Enemy (Crab)
// ^ = Spring
// F = Goal Post
// P = Player Start

const LEVEL_STRING = `
................................................................................
................................................................................
................................................................................
................................................................................
................................................................................
...................RRR..........................................................
..................BBBBB.........................................................
..........................RRR...................................................
.........................BBBBB..................................................
....RRRR............................................RRRRR.......................
...G####G..........E...............................G#####G..........F...........
...#####B.........G#G..........G###G.......E.......#######......................
P..#####B....E....###.........G#####......G#G......#######.......G#####G........
G#######B...G#G...###...^.....######......###......#######.......#######........
########B...###...###..G#G....######...S..###...^..#######.......#######........
################################################################################
`;

export function loadLevel() {
    gameState.entities = [];
    gameState.particles = [];
    
    const lines = LEVEL_STRING.trim().split('\n');
    gameState.levelHeight = lines.length;
    gameState.levelWidth = lines[0].length;
    gameState.levelMap = [];
    
    for (let r = 0; r < lines.length; r++) {
        const rowData = [];
        const line = lines[r];
        for (let c = 0; c < line.length; c++) {
            const char = line[c];
            
            // Map geometry
            if (['#', 'G', 'B', 'S'].includes(char)) {
                rowData.push(char);
            } else {
                rowData.push('.'); // Empty space in physics map
                
                // Entity Spawning
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;
                
                if (char === 'P') {
                    gameState.player = new Player(x, y);
                    gameState.entities.push(gameState.player);
                } else if (char === 'R') {
                    gameState.entities.push(new Ring(x, y));
                } else if (char === 'E' || char === 'C') {
                    gameState.entities.push(new Enemy(x, y, char === 'E' ? 'LADYBUG' : 'CRAB'));
                } else if (char === '^') {
                    gameState.entities.push(new Spring(x, y + 20)); // Adjust to sit on floor
                } else if (char === 'F') {
                    gameState.entities.push(new GoalPost(x, y - 40));
                }
            }
        }
        gameState.levelMap.push(rowData);
    }
}

export function renderLevel(p) {
    const startCol = Math.floor(gameState.cameraX / TILE_SIZE);
    const endCol = startCol + (p.width / TILE_SIZE) + 1;
    const startRow = Math.floor(gameState.cameraY / TILE_SIZE);
    const endRow = startRow + (p.height / TILE_SIZE) + 1;
    
    for (let r = Math.max(0, startRow); r < Math.min(gameState.levelHeight, endRow); r++) {
        for (let c = Math.max(0, startCol); c < Math.min(gameState.levelWidth, endCol); c++) {
            const char = gameState.levelMap[r][c];
            if (char === '.') continue;
            
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;
            
            p.noStroke();
            if (char === '#') {
                // Dirt
                p.fill(139, 69, 19);
                p.rect(x, y, TILE_SIZE, TILE_SIZE);
                // Texture
                p.fill(100, 50, 10);
                p.rect(x + 5, y + 5, 10, 10);
                p.rect(x + 25, y + 20, 8, 8);
            } else if (char === 'G') {
                // Grass Top
                p.fill(139, 69, 19);
                p.rect(x, y, TILE_SIZE, TILE_SIZE);
                p.fill(34, 139, 34); // Green
                p.rect(x, y, TILE_SIZE, 10); // Top layer
                // Checkered pattern side (Green Hill style)
                p.fill(200, 150, 50);
                p.rect(x, y + 10, 20, 30);
            } else if (char === 'B') {
                // Block
                p.fill(150, 100, 50);
                p.rect(x, y, TILE_SIZE, TILE_SIZE);
                p.stroke(100, 50, 0);
                p.strokeWeight(2);
                p.rect(x+2, y+2, TILE_SIZE-4, TILE_SIZE-4);
            } else if (char === 'S') {
                // Spike
                p.fill(200);
                p.stroke(100);
                p.triangle(x, y + TILE_SIZE, x + TILE_SIZE/2, y, x + TILE_SIZE, y + TILE_SIZE);
            }
        }
    }
}