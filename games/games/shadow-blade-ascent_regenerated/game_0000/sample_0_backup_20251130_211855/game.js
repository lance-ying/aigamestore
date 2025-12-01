import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, KEYS } from './globals.js';
import { Player } from './entities.js';
import { renderUI } from './ui.js';
import { handleInput, handleKeyPress, nextLevel, startNewGame } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = { game_info: [], inputs: [], player_info: [] };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        // Expose mode setter
        window.setControlMode = (mode) => {
            gameState.controlMode = mode;
            console.log("Control Mode Set:", mode);
            // Restart on mode change for clean test
            if (mode !== 'HUMAN') {
                startNewGame();
                gameState.gamePhase = 'START'; // Wait for auto-enter
            }
        };
    };

    p.draw = function() {
        // Time
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;

        // Auto Input
        const autoAction = get_automated_testing_action(gameState);
        if (autoAction) {
            // Simulate input logging
            p.logs.inputs.push({
                type: 'AUTO', action: autoAction, frame: gameState.frameCount
            });
            
            if (autoAction.type === 'press') {
               handleKeyPress(p, autoAction.keyCode);
            } else if (autoAction.type === 'hold') {
               // We need a way to mock p.keyIsDown for hold actions if we were fully mocking p5
               // Since we rely on p.keyIsDown in handleInput, we'll hack it for TEST mode logic injection
               // Ideally we abstract input provider. For this constraint, we'll modify the `keyIsDown` wrapper logic in input.js 
               // OR simply apply physics directly here for test mode. 
               // Let's modify handleInput to accept overrides or set a flag.
               // Actually simpler: Set a global mock keys map.
               p._mockKeys = p._mockKeys || {};
               p._mockKeys[autoAction.keyCode] = true;
            }
        }
        
        // Clear mock keys frame end
        p.drawPost = () => { if(p._mockKeys) p._mockKeys = {}; };

        // Render
        p.background(30, 30, 40);
        
        // Shake
        if (gameState.screenShake > 0) {
            p.translate(Math.random() * gameState.screenShake - gameState.screenShake/2, Math.random() * gameState.screenShake - gameState.screenShake/2);
            gameState.screenShake *= 0.9;
            if (gameState.screenShake < 0.5) gameState.screenShake = 0;
        }

        if (gameState.gamePhase === 'LEVEL_TRANSITION') {
            renderUI(p);
            if (p.frameCount % 180 === 0) { // 3 seconds approx
                nextLevel();
            }
            return;
        }

        if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED' || gameState.gamePhase.startsWith('GAME_OVER')) {
            updateGame(p);
            renderGame(p);
        }

        renderUI(p);
        
        if (p.drawPost) p.drawPost();
    };

    p.keyPressed = function() {
        p.logs.inputs.push({ key: p.key, keyCode: p.keyCode, type: 'press', frame: p.frameCount });
        handleKeyPress(p, p.keyCode);
    };
    
    // Wrap keyIsDown to support tests
    const originalKeyIsDown = p.keyIsDown;
    p.keyIsDown = function(code) {
        if (gameState.controlMode !== 'HUMAN' && p._mockKeys && p._mockKeys[code]) return true;
        return originalKeyIsDown.call(p, code);
    };
});

function updateGame(p) {
    if (gameState.gamePhase === 'PAUSED') return;
    if (gameState.gamePhase.startsWith('GAME_OVER')) return;

    // Handle Continuous Input
    handleInput(p);

    // Camera follow player
    if (gameState.player) {
        let targetX = gameState.player.x - CANVAS_WIDTH / 2 + gameState.player.width / 2;
        // Clamp
        targetX = Math.max(0, Math.min(targetX, gameState.levelWidth - CANVAS_WIDTH));
        
        // Smooth
        gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
    }

    // Entities Update
    // Rebuild active list dynamically for simple update loop
    const all = [gameState.player, ...gameState.enemies, ...gameState.projectiles, ...gameState.collectibles, ...gameState.particles];
    
    all.forEach(e => {
        if (e.active !== false) e.update(p);
    });

    // Cleanup particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        if (gameState.particles[i].life <= 0) gameState.particles.splice(i, 1);
    }
}

function renderGame(p) {
    p.push();
    p.translate(-gameState.cameraX, 0);

    // Parallax BG
    p.push();
    p.translate(gameState.cameraX * 0.5, 0); // Move slower
    for(let i=0; i<10; i++) {
        p.fill(50, 50, 60);
        p.rect(i * 300, 100, 100, CANVAS_HEIGHT); // Pillars/Trees
    }
    p.pop();

    // Platforms
    gameState.platforms.forEach(plat => {
        if (plat.type === 'LADDER') {
            p.fill(100, 50, 0);
            p.rect(plat.x + 10, plat.y, 5, plat.height);
            p.rect(plat.x + 25, plat.y, 5, plat.height);
            for(let y=0; y<plat.height; y+=20) {
                p.rect(plat.x + 10, plat.y + y, 20, 5);
            }
        } else {
            p.fill(20, 20, 30);
            p.stroke(100);
            p.rect(plat.x, plat.y, plat.width, plat.height);
            
            // Texture
            p.noStroke();
            p.fill(30, 30, 40);
            p.rect(plat.x+5, plat.y+5, plat.width-10, plat.height-10);
        }
    });

    // Collectibles
    gameState.collectibles.forEach(c => c.render(p));

    // Enemies
    gameState.enemies.forEach(e => e.render(p));

    // Player
    if (gameState.player) gameState.player.render(p);

    // Projectiles
    gameState.projectiles.forEach(pr => pr.render(p));

    // Particles
    gameState.particles.forEach(pt => pt.render(p));

    p.pop();
}

window.gameInstance = gameInstance;