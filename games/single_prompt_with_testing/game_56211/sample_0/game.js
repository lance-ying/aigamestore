import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState } from './globals.js';
import { Player, Background, Zapper, Missile, Coin } from './entities.js';
import { ParticleSystem } from './particles.js';
import { updatePhysics } from './physics.js';
import { handleInput, checkPlayerControls } from './input.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    let background;
    let nextObstacleDist = 0;
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        resetGameState();
        background = new Background();
        
        // Expose reset internal to window for input.js to use
        gameInstance.resetGameInternal = function() {
            resetGameState();
            createPlayer();
            background = new Background();
            gameState.gamePhase = "START";
            nextObstacleDist = 500;
        };

        // Initialize first player instance (invisible until start)
        createPlayer();
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };
    
    function createPlayer() {
        gameState.player = new Player();
        gameState.entities = [gameState.player];
    }

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;

        // Common background render
        if (background) {
             if (gameState.gamePhase === 'PLAYING') background.update();
             background.render(p);
        } else {
             p.background(50);
        }

        switch (gameState.gamePhase) {
            case "START":
                renderGameObjects(p); // Render idle game behind
                renderStartScreen(p);
                break;
            case "PLAYING":
                checkPlayerControls(p);
                updateGameLogic(p);
                renderGameObjects(p);
                renderHUD(p);
                logPlayerInfo();
                break;
            case "PAUSED":
                renderGameObjects(p);
                renderHUD(p);
                renderPausedOverlay(p);
                break;
            case "GAME_OVER_LOSE":
                renderGameObjects(p);
                renderGameOver(p);
                break;
        }
    };

    function updateGameLogic(p) {
        // Update Globals
        gameState.distance += gameState.scrollSpeed * 0.1; // Meters?
        updatePhysics();
        
        // Spawn Obstacles & Coins
        spawnManager(p);

        // Update Entities
        if (gameState.player) gameState.player.update();
        
        // Update Obstacles
        gameState.obstacles.forEach(obs => obs.update(gameState.player.y));
        
        // Update Coins
        gameState.coins.forEach(coin => coin.update());
        
        // Update Projectiles (visual)
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            let proj = gameState.projectiles[i];
            proj.y += proj.vy;
            proj.life--;
            p.stroke(255, 200, 0, 150);
            p.line(proj.x, proj.y, proj.x, proj.y - 10);
            if (proj.life <= 0) gameState.projectiles.splice(i, 1);
        }
        
        // Particles
        ParticleSystem.updateAndRender(p);

        // Cleanup offscreen
        cleanupEntities();

        // Collisions
        checkCollisions();
    }
    
    function spawnManager(p) {
        // Basic linear spawning logic
        if (gameState.distance > nextObstacleDist) {
            const rand = p.random();
            
            // Spawn Pattern
            if (rand < 0.6) {
                // Zapper
                const isVertical = p.random() > 0.5;
                const len = p.random(100, 200);
                const x = CANVAS_WIDTH + 50;
                // Ensure zapper is within bounds
                let y;
                if (isVertical) {
                    y = p.random(50, CANVAS_HEIGHT - 50 - len);
                } else {
                    y = p.random(50, CANVAS_HEIGHT - 50);
                }
                gameState.obstacles.push(new Zapper(x, y, len, isVertical));
                
                // Spawn coins near zapper sometimes
                spawnCoins(x, y, isVertical);
                
            } else {
                // Missile
                const y = p.random(50, CANVAS_HEIGHT - 50);
                gameState.obstacles.push(new Missile(y));
            }
            
            // Next spawn distance (decreases as speed increases)
            nextObstacleDist = gameState.distance + p.random(40, 80); 
        }
    }
    
    function spawnCoins(x, y, isVertical) {
        // Pattern of coins
        if (Math.random() > 0.5) return;
        
        let startX = x + 100;
        let startY = isVertical ? y + 50 : y - 50;
        
        // Clamp Y
        if (startY < 50) startY = 150;
        if (startY > CANVAS_HEIGHT - 50) startY = CANVAS_HEIGHT - 150;
        
        for(let i=0; i<5; i++) {
            gameState.coins.push(new Coin(startX + i * 40, startY + Math.sin(i)*30));
        }
    }

    function cleanupEntities() {
        gameState.obstacles = gameState.obstacles.filter(o => o.x > -200);
        gameState.coins = gameState.coins.filter(c => c.x > -50 && !c.collected);
    }

    function checkCollisions() {
        const player = gameState.player;
        
        // Obstacles
        for (let obs of gameState.obstacles) {
            if (obs.checkCollision(player)) {
                // BOOM
                ParticleSystem.emit(player.x, player.y, 'FIRE', 20);
                ParticleSystem.emit(player.x, player.y, 'SMOKE', 20);
                gameState.gamePhase = 'GAME_OVER_LOSE';
                p.logs.game_info.push({ event: "GAME_OVER", score: gameState.score, distance: gameState.distance });
            }
        }
        
        // Coins
        gameState.coins.forEach(coin => {
            if (coin.checkCollision(player)) {
                coin.collected = true;
                gameState.score += 1;
                ParticleSystem.emit(coin.x, coin.y, 'SPARK', 5);
            }
        });
    }

    function renderGameObjects(p) {
        if (gameState.player) gameState.player.render(p);
        
        gameState.obstacles.forEach(obs => obs.render(p));
        gameState.coins.forEach(coin => coin.render(p));
        
        // Projectiles rendered inside update due to simple line nature, or move here?
        // Rendered in update loop for simplicity of local vars, but strictly should be here.
        // Re-rendering projectiles here:
        gameState.projectiles.forEach(proj => {
            p.stroke(255, 200, 0, 150);
            p.strokeWeight(2);
            p.line(proj.x, proj.y, proj.x, proj.y - 10);
        });
        
        // Particles already rendered in updateAndRender, split if needed. 
        // For particle systems usually update and render are coupled or managed by manager.
        // We called updateAndRender in updateGameLogic. In PAUSED/GAME_OVER, we should render them but not update.
        if (gameState.gamePhase !== 'PLAYING') {
            gameState.particles.forEach(part => part.render(p));
        }
    }
    
    function logPlayerInfo() {
        if (p.frameCount % 5 === 0 && gameState.player) {
            p.logs.player_info.push({
                x: gameState.player.x,
                y: gameState.player.y,
                vy: gameState.player.vy,
                score: gameState.score,
                dist: gameState.distance,
                frame: p.frameCount
            });
        }
    }

    p.keyPressed = function() {
        handleInput(p, 'pressed', p.keyCode);
        
        // Log input
        p.logs.inputs.push({
            type: 'pressed',
            key: p.key,
            code: p.keyCode,
            frame: p.frameCount,
            timestamp: Date.now()
        });
    };
    
    p.keyReleased = function() {
        handleInput(p, 'released', p.keyCode);
    };
});

window.gameInstance = gameInstance;

// Helper for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Reset focus to canvas so keyboard works immediately
    document.querySelector('canvas').focus();
};