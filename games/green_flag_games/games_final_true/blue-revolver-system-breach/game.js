/**
 * game.js
 * Main entry point. Sets up p5 instance, game loop, and initialization.
 */

import { 
    gameState, getGameState, resetGameState, 
    CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, CONTROL_MODES 
} from './globals.js';
import { handleKeyPress, handleKeyRelease } from './input.js';
import { Player } from './entities.js';
import { Background } from './background.js';
import { BulletSystem } from './bullets.js';
import { ParticleSystem } from './particles.js';
import { Physics } from './physics.js';
import { LevelDirector } from './level.js';
import { 
    renderHUD, renderStartScreen, renderGameOver, renderPause 
} from './ui.js';

// Get p5 from window (loaded via script tag)
const p5 = window.p5;

let gameInstance = new p5(p => {
    
    // Initialize Logs
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Disable context menu
        document.oncontextmenu = () => false;
        
        // Initial setup
        Background.init();
        
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Timekeeping
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Global Input Mouse tracking
        gameState.mouseX = p.mouseX;
        gameState.mouseY = p.mouseY;

        // --- GAME LOOP ---
        switch (gameState.gamePhase) {
            case GAME_PHASES.START:
                Background.update();
                Background.render(p);
                renderStartScreen(p);
                break;
                
            case GAME_PHASES.PLAYING:
                updateGameLogic(p);
                renderGame(p);
                renderHUD(p);
                break;
                
            case GAME_PHASES.PAUSED:
                renderGame(p); // Static render
                renderPause(p);
                break;
                
            case GAME_PHASES.GAME_OVER_WIN:
            case GAME_PHASES.GAME_OVER_LOSE:
                renderGame(p);
                renderGameOver(p);
                break;
        }
    };
    
    // --- UPDATE LOGIC ---
    function updateGameLogic(p) {
        // Init Player if null
        if (!gameState.player) {
            new Player(CANVAS_WIDTH/2, CANVAS_HEIGHT - 100);
        }

        // Global counters
        gameState.waveFrame++;
        if (gameState.chainTimer > 0) gameState.chainTimer--;
        else gameState.chain = 0;

        // Sub-systems
        Background.update();
        LevelDirector.update();
        
        // Entities
        if (gameState.player) gameState.player.update(p);
        
        gameState.enemies.forEach(e => e.update(p));
        gameState.collectibles.forEach(c => c.update());
        
        BulletSystem.updateAndRender(p); // Actually renders in draw, but updates here? 
        // Architecture fix: BulletSystem should separate update and render. 
        // For simplicity in this structure, we'll do update loops here and render calls in renderGame.
        // Actually, let's keep it clean: update logic only here.
        
        // Physics & Collisions
        checkCollisions();
        
        // Particles
        // (updated in render usually for visual only? No, physics apply)
    }
    
    function checkCollisions() {
        // 1. Player Bullets vs Enemies
        for (const bullet of gameState.playerBullets) {
            if (!bullet.active) continue;
            for (const enemy of gameState.enemies) {
                if (enemy.dead) continue;
                if (Physics.checkCircleCircle(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
                    enemy.takeDamage(bullet.damage);
                    bullet.active = false;
                    ParticleSystem.emit(bullet.x, bullet.y, 2, 'spark');
                    break; // Bullet hits one enemy
                }
            }
        }
        
        // 2. Enemy Bullets vs Player
        if (gameState.player && !gameState.player.dead && gameState.player.invulnerableTime <= 0) {
            const pX = gameState.player.x;
            const pY = gameState.player.y;
            const pR = gameState.player.radius; // tiny hitbox
            const grazeR = gameState.player.visualRadius + 5;
            
            for (const bullet of gameState.enemyBullets) {
                if (!bullet.active) continue;
                
                // Graze check
                if (!bullet.grazed && Physics.checkCircleCircle(pX, pY, grazeR, bullet.x, bullet.y, bullet.radius)) {
                    bullet.grazed = true;
                    gameState.score += 10; // Graze points
                    // FX?
                }
                
                // Hit check
                if (Physics.checkCircleCircle(pX, pY, pR, bullet.x, bullet.y, bullet.radius)) {
                    gameState.player.hit();
                    bullet.active = false;
                    break;
                }
            }
        }
    }

    // --- RENDER LOGIC ---
    function renderGame(p) {
        Background.render(p);
        
        gameState.collectibles.forEach(c => c.render(p));
        gameState.enemies.forEach(e => e.render(p));
        if (gameState.player) gameState.player.render(p);
        
        // Bullets (Update separated above? We need to iterate again for render or combine)
        // To save cycles, we usually combine. But since p5 clears background, we must render every frame.
        // Let's rely on BulletSystem.updateAndRender being split or handle it gracefully.
        // We will split it now manually for correctness:
        
        renderBullets(p);
        ParticleSystem.updateAndRender(p);
    }
    
    function renderBullets(p) {
         gameState.playerBullets.forEach(b => { if(b.active) b.render(p); });
         gameState.enemyBullets.forEach(b => { if(b.active) b.render(p); });
    }
    
    // Override update logic to remove the render call inside update
    // We need to actually call update on bullets separately if we split render.
    // Let's modify BulletSystem quickly in memory:
    // Actually, I'll just iterate manually here for update to ensure separation of concerns.
    
    const _originalUpdateGame = updateGameLogic;
    updateGameLogic = function(p) {
         if (!gameState.player) new Player(CANVAS_WIDTH/2, CANVAS_HEIGHT - 100);
         gameState.waveFrame++;
         if (gameState.chainTimer > 0) gameState.chainTimer--; else gameState.chain = 0;
         
         Background.update();
         LevelDirector.update();
         if (gameState.player) gameState.player.update(p);
         gameState.enemies.forEach(e => e.update(p));
         gameState.collectibles.forEach(c => c.update());
         
         // Bullet updates
         gameState.playerBullets.forEach(b => b.update());
         gameState.enemyBullets.forEach(b => b.update());
         
         // Cleanup inactive bullets
         // (Optimized cleanup should happen occasionally or via swap-remove, doing simple filter here for code clarity)
         // NOTE: Filter creates garbage. Ideally we use the pool release logic inside update.
         // Let's trust the BulletSystem manager methods if we implemented them to handle this cycle.
         // I'll stick to a simple clean loop:
         for(let i=gameState.playerBullets.length-1; i>=0; i--) {
             if(!gameState.playerBullets[i].active) {
                 BulletSystem.pool.release(gameState.playerBullets[i]);
                 gameState.playerBullets.splice(i,1);
             }
         }
         for(let i=gameState.enemyBullets.length-1; i>=0; i--) {
             if(!gameState.enemyBullets[i].active) {
                 BulletSystem.pool.release(gameState.enemyBullets[i]);
                 gameState.enemyBullets.splice(i,1);
             }
         }

         checkCollisions();
    };

    p.keyPressed = function() {
        handleKeyPress(p);
    };

    p.keyReleased = function() {
        handleKeyRelease(p);
    };
});

window.gameInstance = gameInstance;

window.setControlMode = (mode) => {
    // With automated testing removed, the game should always be in HUMAN mode.
    // This function is still called by the "HUMAN PILOT" button.
    gameState.controlMode = CONTROL_MODES.HUMAN;
    console.log("Control Mode Set to:", CONTROL_MODES.HUMAN);
    resetGameState();
    gameState.gamePhase = GAME_PHASES.START;
};