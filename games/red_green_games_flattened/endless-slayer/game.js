/**
 * Main game loop and p5 instance setup.
 */
import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, gameState, resetGameState, 
    GROUND_Y, SPAWN_RATE_INITIAL, CLASSES 
} from './globals.js';
import { handleInput, handleKeyPressed, handleKeyReleased } from './input.js';
import { Player, Enemy, Loot } from './entities.js';
import { renderUI } from './ui.js';
import { handleCollisions } from './physics.js';
import { randomChoice, randomInt } from './utils.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize p.logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        gameState.gamePhase = "START";
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Input Handling
        handleInput(p);
        
        // Logic Update
        if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
        }
        
        // Rendering
        renderGame(p);
    };

    p.keyPressed = function() {
        handleKeyPressed(p);
    };
    
    p.keyReleased = function() {
        handleKeyReleased(p);
    };

    // --- GAME LOGIC ---

    function updateGame(p) {
        // Init player if needed (transition from START)
        if (!gameState.player) {
            resetGameState();
            const classes = [CLASSES.KNIGHT, CLASSES.WIZARD, CLASSES.KNAVE];
            gameState.player = new Player(CANVAS_WIDTH / 2, GROUND_Y - 50, classes[gameState.selectedClassIndex]);
            gameState.gamePhase = "PLAYING"; // Ensure phase is set
        }

        gameState.frameCount++;

        // Update Entities
        gameState.player.update(p);
        
        // Cleanup dead entities
        gameState.enemies = gameState.enemies.filter(e => !e.dead);
        gameState.projectiles = gameState.projectiles.filter(e => !e.dead);
        gameState.particles = gameState.particles.filter(e => !e.dead);
        gameState.loot = gameState.loot.filter(e => !e.dead);
        
        gameState.entities.forEach(e => e.update(p));
        gameState.particles.forEach(pt => pt.update(p));

        // Physics
        handleCollisions(p);

        // Spawning System
        gameState.spawnTimer++;
        // Speed up spawns as level increases
        const spawnRate = Math.max(30, SPAWN_RATE_INITIAL - (gameState.level * 5));
        
        if (gameState.spawnTimer >= spawnRate) {
            gameState.spawnTimer = 0;
            spawnWave(p);
        }
        
        // Boss Spawn Check
        // ... (Simplified: Random boss chance or score based?)
        if (gameState.score > gameState.wave * 1000 && !gameState.enemies.some(e => e.enemyType === 'BOSS')) {
            new Enemy(CANVAS_WIDTH/2, -100, 'BOSS');
            gameState.wave++;
        }
    }

    function spawnWave(p) {
        // Determine side
        const side = p.random() > 0.5 ? -30 : CANVAS_WIDTH + 30;
        
        // Determine Type based on level
        const types = ['SLIME'];
        if (gameState.level > 2) types.push('BAT');
        if (gameState.level > 4) types.push('SKELETON');
        
        const type = randomChoice(p, types);
        new Enemy(side, GROUND_Y - 20, type);
    }

    // --- RENDERING ---

    function renderGame(p) {
        // Shake
        p.push();
        if (gameState.cameraShake > 0) {
            p.translate(p.random(-gameState.cameraShake, gameState.cameraShake), p.random(-gameState.cameraShake, gameState.cameraShake));
        }

        // Background
        drawBackground(p);
        
        // Ground
        p.noStroke();
        p.fill(30, 20, 10);
        p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
        p.fill(50, 150, 50); // Grass top
        p.rect(0, GROUND_Y, CANVAS_WIDTH, 10);

        // Render Entities
        // Order: Loot -> Enemies -> Player -> Projectiles -> Particles
        gameState.loot.forEach(e => e.render(p));
        gameState.enemies.forEach(e => e.render(p));
        if (gameState.player) gameState.player.render(p);
        gameState.projectiles.forEach(e => e.render(p));
        gameState.particles.forEach(pt => pt.render(p));
        
        p.pop(); // End shake

        // UI Layer (No Shake)
        renderUI(p);
    }
    
    function drawBackground(p) {
        // Sky gradient
        p.background(40, 30, 60);
        
        // Distant mountains
        p.fill(20, 15, 30);
        p.beginShape();
        p.vertex(0, GROUND_Y);
        p.vertex(0, 250);
        p.vertex(100, 150);
        p.vertex(300, 280);
        p.vertex(450, 120);
        p.vertex(600, 260);
        p.vertex(600, GROUND_Y);
        p.endShape(p.CLOSE);
        
        // Moon
        p.fill(220, 220, 200);
        p.circle(500, 80, 60);
        p.fill(40, 30, 60);
        p.circle(490, 80, 50); // Crescent
    }
});

window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Reset if testing
    if (mode.startsWith("TEST")) {
        gameState.gamePhase = "START";
        resetGameState();
    }
};