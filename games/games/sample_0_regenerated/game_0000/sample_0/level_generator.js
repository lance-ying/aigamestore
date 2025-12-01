import { gameState, CANVAS_HEIGHT, LEVEL_LENGTH } from './globals.js';
import { Platform, Enemy, Coin, Flagpole } from './entities.js';

// Define chunk types (array of strings or config objects)
// W = Wall/Block, P = Pipe, C = Coin, E = Enemy, _ = Empty, # = Ground
// Each char represents roughly a 40x40 block area

const CHUNK_WIDTH = 40;
const CHUNK_HEIGHT = 40;

const CHUNKS = [
    // Flat run with coins
    [
        "________________",
        "___CCC__________",
        "________________",
        "################"
    ],
    // Jump over gap
    [
        "________________",
        "___CC___________",
        "______CCC_______",
        "####_____#######"
    ],
    // Pipe jump
    [
        "________________",
        "_____C___C______",
        "____PP__________",
        "##########___###"
    ],
    // Enemy encounter
    [
        "________________",
        "_______C________",
        "____E_____E_____",
        "################"
    ],
    // High platforms
    [
        "___CCC__________",
        "__WWWW__________",
        "_______WW_______",
        "###########__###"
    ],
    // Staircase
    [
        "__________C__F__",
        "________WW______",
        "______WW________",
        "####WW##########"
    ]
];

export function resetLevel() {
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.decorations = [];
    gameState.distanceTraveled = 0;
    
    // Generate initial floor
    generateLevel();
}

function generateLevel() {
    let currentX = 0;
    
    // Start area (safe)
    addPlatform(currentX, CANVAS_HEIGHT - 50, 600, 200);
    currentX += 600;
    
    // Generate chunks until we reach LEVEL_LENGTH
    while (currentX < LEVEL_LENGTH) {
        const chunkIndex = Math.floor(Math.random() * (CHUNKS.length - 1)); // Exclude last one (flagpole-ish) mostly
        const chunk = CHUNKS[chunkIndex];
        
        parseChunk(chunk, currentX);
        currentX += chunk[0].length * CHUNK_WIDTH;
    }
    
    // End area (Flagpole)
    addPlatform(currentX, CANVAS_HEIGHT - 50, 800, 200);
    const flagpole = new Flagpole(currentX + 400, CANVAS_HEIGHT - 350);
    gameState.collectibles.push(flagpole); // Hack: Push to collectibles to render? No, separate render list or generic entity list?
    // We'll push flagpole to decorations/entities logic or just handle it as a special interactable. 
    // Actually, Flagpole is an Entity. Let's put it in collectibles for now or create a generic entities list properly.
    // The physics loop checks collectibles. Flagpole collision triggers win.
    
    // Let's modify the entities logic to have a 'triggers' list or check specialized entities.
    // For simplicity, make Flagpole a 'Platform' type 'flag' or just an object.
    // Let's use `gameState.decorations` for non-colliding, but we need collision.
    // Let's add it to `platforms` but with a special flag, or just check x coord in Player update (which we did).
    gameState.decorations.push(flagpole);
}

function parseChunk(chunkData, startX) {
    const rows = chunkData.length;
    const cols = chunkData[0].length;
    
    // Align bottom of chunk to near bottom of screen
    const startY = CANVAS_HEIGHT - (rows * CHUNK_HEIGHT) - 10;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const char = chunkData[r][c];
            const x = startX + c * CHUNK_WIDTH;
            const y = startY + r * CHUNK_HEIGHT;
            
            if (char === '#') {
                // Ground
                addPlatform(x, y, CHUNK_WIDTH, CHUNK_HEIGHT, "normal");
            } else if (char === 'W') {
                // Brick/Block
                addPlatform(x, y, CHUNK_WIDTH, CHUNK_HEIGHT, "brick");
            } else if (char === 'P') {
                // Pipe (usually taller)
                addPlatform(x, y, CHUNK_WIDTH, CHUNK_HEIGHT * 2, "pipe");
            } else if (char === 'E') {
                // Enemy
                gameState.enemies.push(new Enemy(x, y));
            } else if (char === 'C') {
                // Coin
                gameState.collectibles.push(new Coin(x + 10, y + 10));
            }
        }
    }
}

function addPlatform(x, y, w, h, type="normal") {
    gameState.platforms.push(new Platform(x, y, w, h, type));
}