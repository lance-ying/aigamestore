import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Platform, Sawblade, Enemy, Goal } from './entities.js';

// Seeded random function
let rng;

function seededRandom() {
    if (!rng) return Math.random();
    return rng();
}

function randomInt(min, max) {
    return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(seededRandom() * arr.length)];
}

export function generateLevel(levelNum) {
    // Initialize seeded random for reproducible levels
    if (window.Math.seedrandom) {
        rng = new Math.seedrandom('level_' + levelNum);
    } else {
        rng = Math.random;
    }

    // Reset state lists
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.enemies = [];
    gameState.goal = null;

    let currentX = 50;
    let currentY = CANVAS_HEIGHT - 150;
    
    // Starting platform - always safe and stable
    gameState.platforms.push(new Platform(0, CANVAS_HEIGHT - 50, 250, 500));
    
    // Procedural generation parameters
    const segmentCount = 8 + levelNum * 3;
    const difficulty = Math.min(levelNum / 10, 1); // 0 to 1 scale
    
    // Segment types with weights based on difficulty
    const segmentTypes = [
        'FLAT_RUN',
        'SMALL_GAP', 
        'MEDIUM_GAP',
        'ASCENDING',
        'DESCENDING',
        'WALL_JUMP',
        'HAZARD_DODGE',
        'ENEMY_GAUNTLET',
        'STAIRCASE'
    ];
    
    let consecutiveType = 0;
    let lastType = null;
    
    for (let i = 0; i < segmentCount; i++) {
        // Avoid too many consecutive hard segments
        let availableTypes = [...segmentTypes];
        if (consecutiveType >= 2 && (lastType === 'WALL_JUMP' || lastType === 'HAZARD_DODGE')) {
            availableTypes = ['FLAT_RUN', 'SMALL_GAP', 'ASCENDING', 'DESCENDING'];
        }
        
        // Early segments are easier
        if (i < 3) {
            availableTypes = ['FLAT_RUN', 'SMALL_GAP', 'ASCENDING', 'ENEMY_GAUNTLET'];
        }
        
        const segmentType = randomChoice(availableTypes);
        
        if (segmentType === lastType) {
            consecutiveType++;
        } else {
            consecutiveType = 0;
            lastType = segmentType;
        }
        
        // Generate segment
        generateSegment(segmentType, currentX, currentY, difficulty);
        
        // Update position based on segment
        currentX += getSegmentWidth(segmentType);
        currentY += getSegmentYChange(segmentType, currentY);
        
        // Keep Y within reasonable bounds
        if (currentY < 50) currentY = 80;
        if (currentY > CANVAS_HEIGHT - 80) currentY = CANVAS_HEIGHT - 120;
    }
    
    // Final safe landing platform and goal
    gameState.platforms.push(new Platform(currentX + 100, currentY, 400, 500));
    gameState.goal = new Goal(currentX + 250, currentY - 35);
    
    gameState.worldWidth = currentX + 700;
    
    // Spawn/Reset player
    if (gameState.player) {
        gameState.player.x = 50;
        gameState.player.y = CANVAS_HEIGHT - 200;
        gameState.player.vx = 0;
        gameState.player.vy = 0;
        gameState.player.isDead = false;
        gameState.player.dashTimer = 0;
        gameState.player.dashCooldown = 0;
    }
}

function generateSegment(type, x, y, difficulty) {
    switch(type) {
        case 'FLAT_RUN':
            generateFlatRun(x, y, difficulty);
            break;
        case 'SMALL_GAP':
            generateSmallGap(x, y, difficulty);
            break;
        case 'MEDIUM_GAP':
            generateMediumGap(x, y, difficulty);
            break;
        case 'ASCENDING':
            generateAscending(x, y, difficulty);
            break;
        case 'DESCENDING':
            generateDescending(x, y, difficulty);
            break;
        case 'WALL_JUMP':
            generateWallJump(x, y, difficulty);
            break;
        case 'HAZARD_DODGE':
            generateHazardDodge(x, y, difficulty);
            break;
        case 'ENEMY_GAUNTLET':
            generateEnemyGauntlet(x, y, difficulty);
            break;
        case 'STAIRCASE':
            generateStaircase(x, y, difficulty);
            break;
    }
}

function generateFlatRun(x, y, difficulty) {
    const width = randomInt(200, 400);
    gameState.platforms.push(new Platform(x + 30, y, width, 50));
    
    // Occasional enemy
    if (seededRandom() > 0.6) {
        const enemyX = x + 100 + randomInt(0, width - 150);
        gameState.enemies.push(new Enemy(enemyX, y - 30));
    }
}

function generateSmallGap(x, y, difficulty) {
    // Platform before gap
    gameState.platforms.push(new Platform(x, y, 120, 50));
    
    // Jumpable gap: 60-100 pixels
    const gap = randomInt(60, 100);
    
    // Landing platform - slightly higher or lower
    const yChange = randomChoice([-20, 0, 20]);
    gameState.platforms.push(new Platform(x + 120 + gap, y + yChange, 150, 50));
    
    // Sometimes add a hazard below the gap
    if (seededRandom() > 0.5 && difficulty > 0.3) {
        gameState.hazards.push(new Sawblade(x + 120 + gap/2, y + 50, 18));
    }
}

function generateMediumGap(x, y, difficulty) {
    // Platform before gap
    gameState.platforms.push(new Platform(x, y, 100, 50));
    
    // Medium gap: 100-140 pixels (requires sprint or good timing)
    const gap = randomInt(100, 140);
    
    // Landing platform
    const yChange = randomChoice([-30, -15, 0]);
    gameState.platforms.push(new Platform(x + 100 + gap, y + yChange, 180, 50));
    
    // Hazard in gap
    if (difficulty > 0.4) {
        gameState.hazards.push(new Sawblade(x + 100 + gap/2, y + 30, 20));
    }
}

function generateAscending(x, y, difficulty) {
    // Series of platforms going up
    const steps = randomInt(2, 4);
    const stepWidth = randomInt(80, 120);
    const stepHeight = randomInt(40, 60);
    const stepGap = randomInt(40, 80);
    
    for (let i = 0; i < steps; i++) {
        const px = x + i * (stepWidth + stepGap);
        const py = y - i * stepHeight;
        gameState.platforms.push(new Platform(px, py, stepWidth, 50));
        
        // Occasional hazard
        if (i > 0 && seededRandom() > 0.7) {
            gameState.hazards.push(new Sawblade(px - stepGap/2, py + 25, 15));
        }
    }
}

function generateDescending(x, y, difficulty) {
    // Series of platforms going down
    const steps = randomInt(2, 3);
    const stepWidth = randomInt(100, 140);
    const stepHeight = randomInt(30, 50);
    const stepGap = randomInt(50, 90);
    
    for (let i = 0; i < steps; i++) {
        const px = x + i * (stepWidth + stepGap);
        const py = y + i * stepHeight;
        gameState.platforms.push(new Platform(px, py, stepWidth, 50));
    }
}

function generateWallJump(x, y, difficulty) {
    // Starting platform
    gameState.platforms.push(new Platform(x, y, 80, 50));
    
    // Vertical wall to climb
    const wallHeight = randomInt(120, 200);
    const wallX = x + 120;
    gameState.platforms.push(new Platform(wallX, y - wallHeight, 40, wallHeight + 50));
    
    // Optional second wall
    if (seededRandom() > 0.5 && difficulty > 0.4) {
        gameState.platforms.push(new Platform(wallX + 140, y - wallHeight - 80, 40, wallHeight + 100));
        // Landing platform after second wall
        gameState.platforms.push(new Platform(wallX + 220, y - wallHeight - 80, 150, 50));
    } else {
        // Landing platform after wall
        gameState.platforms.push(new Platform(wallX + 80, y - wallHeight - 50, 150, 50));
    }
    
    // Hazard on wall sometimes
    if (difficulty > 0.5 && seededRandom() > 0.6) {
        gameState.hazards.push(new Sawblade(wallX + 20, y - wallHeight/2, 15));
    }
}

function generateHazardDodge(x, y, difficulty) {
    // Long platform with hazards to jump over
    const platformWidth = randomInt(300, 450);
    gameState.platforms.push(new Platform(x, y, platformWidth, 50));
    
    // Place 2-3 sawblades
    const hazardCount = randomInt(2, 3);
    const spacing = platformWidth / (hazardCount + 1);
    
    for (let i = 0; i < hazardCount; i++) {
        const hx = x + spacing * (i + 1);
        const hy = y - randomInt(10, 25);
        gameState.hazards.push(new Sawblade(hx, hy, randomInt(18, 25)));
    }
}

function generateEnemyGauntlet(x, y, difficulty) {
    // Platform with multiple enemies
    const platformWidth = randomInt(300, 400);
    gameState.platforms.push(new Platform(x, y, platformWidth, 50));
    
    const enemyCount = Math.min(1 + Math.floor(difficulty * 3), 3);
    const spacing = platformWidth / (enemyCount + 1);
    
    for (let i = 0; i < enemyCount; i++) {
        const ex = x + spacing * (i + 1);
        gameState.enemies.push(new Enemy(ex, y - 30));
    }
}

function generateStaircase(x, y, difficulty) {
    // Ascending or descending stairs
    const isAscending = seededRandom() > 0.5;
    const steps = randomInt(3, 5);
    const stepWidth = randomInt(60, 90);
    const stepHeight = 35;
    
    for (let i = 0; i < steps; i++) {
        const px = x + i * stepWidth;
        const py = isAscending ? (y - i * stepHeight) : (y + i * stepHeight);
        gameState.platforms.push(new Platform(px, py, stepWidth + 10, 50));
    }
    
    // Enemy at the top/bottom
    if (difficulty > 0.3 && seededRandom() > 0.5) {
        const enemyStep = isAscending ? steps - 1 : 0;
        const ex = x + enemyStep * stepWidth + stepWidth/2;
        const ey = isAscending ? (y - enemyStep * stepHeight - 30) : (y + enemyStep * stepHeight - 30);
        gameState.enemies.push(new Enemy(ex, ey));
    }
}

function getSegmentWidth(type) {
    switch(type) {
        case 'FLAT_RUN': return randomInt(250, 450);
        case 'SMALL_GAP': return randomInt(300, 400);
        case 'MEDIUM_GAP': return randomInt(350, 450);
        case 'ASCENDING': return randomInt(350, 500);
        case 'DESCENDING': return randomInt(350, 450);
        case 'WALL_JUMP': return randomInt(400, 500);
        case 'HAZARD_DODGE': return randomInt(350, 500);
        case 'ENEMY_GAUNTLET': return randomInt(350, 450);
        case 'STAIRCASE': return randomInt(300, 400);
        default: return 350;
    }
}

function getSegmentYChange(type, currentY) {
    // Ensure Y changes keep the level playable
    switch(type) {
        case 'ASCENDING': return randomInt(-120, -60);
        case 'DESCENDING': return randomInt(30, 80);
        case 'WALL_JUMP': return randomInt(-100, -50);
        case 'STAIRCASE': return randomChoice([-70, 70]);
        default: return randomInt(-30, 30);
    }
}