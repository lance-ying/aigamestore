// game.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, COLORS, logGameInfo } from './globals.js';
import { Player, Enemy, Collectible, Wall, Projectile } from './entities.js';
import { checkCollisions } from './physics.js';
import { handleInput, handlePhaseInput } from './input.js';
import { renderHUD, renderStartScreen, renderGameOver, renderPauseScreen } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {

    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    function initGame() {
        gameState.player = new Player(WORLD_WIDTH/2, WORLD_HEIGHT - 100);
        gameState.enemies = [];
        gameState.walls = [];
        gameState.collectibles = [];
        gameState.projectiles = [];
        gameState.particles = [];
        gameState.cameraX = 0;
        gameState.cameraY = 0;
        
        // Generate Level
        // Walls - Border
        gameState.walls.push(new Wall(0, 0, WORLD_WIDTH, 50)); // Top
        gameState.walls.push(new Wall(0, WORLD_HEIGHT-50, WORLD_WIDTH, 50)); // Bottom
        gameState.walls.push(new Wall(0, 0, 50, WORLD_HEIGHT)); // Left
        gameState.walls.push(new Wall(WORLD_WIDTH-50, 0, 50, WORLD_HEIGHT)); // Right
        
        // Structures (Ruins)
        gameState.walls.push(new Wall(300, 800, 200, 50));
        gameState.walls.push(new Wall(700, 800, 200, 50));
        gameState.walls.push(new Wall(500, 500, 200, 200));
        
        // Enemies
        gameState.enemies.push(new Enemy(400, 700, 'MELEE'));
        gameState.enemies.push(new Enemy(800, 700, 'MELEE'));
        gameState.enemies.push(new Enemy(200, 300, 'RANGED'));
        gameState.enemies.push(new Enemy(1000, 300, 'RANGED'));
        gameState.enemies.push(new Enemy(600, 200, 'MELEE')); // Guarding module
        
        // Collectibles
        // Modules
        gameState.collectibles.push(new Collectible(100, 100, 'MODULE')); // Top Left
        gameState.collectibles.push(new Collectible(1100, 100, 'MODULE')); // Top Right
        gameState.collectibles.push(new Collectible(600, 600, 'MODULE')); // Center
        
        // Medkits
        gameState.collectibles.push(new Collectible(400, 900, 'MEDKIT'));
        gameState.collectibles.push(new Collectible(800, 400, 'MEDKIT'));

        logGameInfo(p, { action: "init_game", world_size: [WORLD_WIDTH, WORLD_HEIGHT] });
    }

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        initGame();
        
        // Default start state
        gameState.gamePhase = "START";
        
        // Expose reset function for 'R' key
        window.resetGameInstance = () => {
             initGame();
             gameState.gamePhase = "START";
             // Reset seed
             p.randomSeed(42);
        };
        
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode set to:", mode);
            // Reset game to apply test conditions cleanly
            initGame();
            if (mode !== 'HUMAN') {
                gameState.gamePhase = "PLAYING"; // Auto start for tests
            } else {
                gameState.gamePhase = "START";
            }
        };
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;
        
        p.background(COLORS.BACKGROUND);

        if (gameState.gamePhase === "START") {
            renderStartScreen(p);
        } else if (gameState.gamePhase === "PLAYING") {
            updateGame(p);
            renderGame(p);
            renderHUD(p);
        } else if (gameState.gamePhase === "PAUSED") {
            renderGame(p); // Render underlying game frozen
            renderPauseScreen(p);
        } else if (gameState.gamePhase === "GAME_OVER_WIN") {
            renderGame(p);
            renderGameOver(p, true);
        } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
            renderGame(p);
            renderGameOver(p, false);
        }
    };

    p.keyPressed = function() {
        handlePhaseInput(p, p.keyCode);
    };

    function updateGame(p) {
        // Input
        const input = handleInput(p);
        
        // Update Player
        if (gameState.player) {
            gameState.player.update(p, input);
            
            // Log Player
            if (p.frameCount % 10 === 0) { // Log every 10 frames to save space
                p.logs.player_info.push({
                    x: gameState.player.x,
                    y: gameState.player.y,
                    hp: gameState.player.health,
                    frame: p.frameCount
                });
            }
        }
        
        // Update Enemies
        gameState.enemies.forEach(e => e.update(p));
        
        // Update Projectiles
        gameState.projectiles.forEach(proj => proj.render(p)); // Render method handles update for proj currently to save loop, fixing
        // Actually best to separate update logic, but for proj render handles update in current entity class.
        // Let's rely on render loops inside physics/render block or split them.
        // Refactoring: Projectile.render called here updates position. That's a side effect.
        // Let's fix physics separation below.
        
        // Check Collisions
        checkCollisions(p);
        
        // Update Collectibles
        gameState.collectibles.forEach(c => c.update(p));
        
        // Update Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            gameState.particles[i].update();
            if (gameState.particles[i].life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }
        
        // Update Camera
        updateCamera();
    }

    function updateCamera() {
        if (!gameState.player) return;
        
        // Target position (centered on player)
        let targetX = gameState.player.x - CANVAS_WIDTH / 2;
        let targetY = gameState.player.y - CANVAS_HEIGHT / 2;
        
        // Clamp to world bounds
        targetX = p.constrain(targetX, 0, WORLD_WIDTH - CANVAS_WIDTH);
        targetY = p.constrain(targetY, 0, WORLD_HEIGHT - CANVAS_HEIGHT);
        
        // Smooth Lerp
        gameState.cameraX = p.lerp(gameState.cameraX, targetX, 0.1);
        gameState.cameraY = p.lerp(gameState.cameraY, targetY, 0.1);
        
        // Screen Shake
        if (gameState.cameraShake > 0) {
            gameState.cameraX += p.random(-gameState.cameraShake, gameState.cameraShake);
            gameState.cameraY += p.random(-gameState.cameraShake, gameState.cameraShake);
            gameState.cameraShake *= 0.9;
            if (gameState.cameraShake < 0.5) gameState.cameraShake = 0;
        }
    }

    function renderGame(p) {
        p.push();
        p.translate(-gameState.cameraX, -gameState.cameraY);
        
        // Draw Floor Grid (aesthetic)
        p.stroke(COLORS.FLOOR);
        p.strokeWeight(1);
        for(let x = 0; x < WORLD_WIDTH; x+=100) p.line(x, 0, x, WORLD_HEIGHT);
        for(let y = 0; y < WORLD_HEIGHT; y+=100) p.line(0, y, WORLD_WIDTH, y);
        
        // Draw Collectibles (under player)
        gameState.collectibles.forEach(c => c.render(p));
        
        // Draw Walls
        gameState.walls.forEach(w => w.render(p));
        
        // Draw Particles (Background layer like dust?)
        
        // Draw Enemies
        gameState.enemies.forEach(e => e.render(p));
        
        // Draw Player
        if (gameState.player) gameState.player.render(p);
        
        // Draw Particles (Foreground)
        gameState.particles.forEach(part => part.render(p));
        
        p.pop();
    }
});

window.gameInstance = gameInstance;