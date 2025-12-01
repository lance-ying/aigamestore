import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { handleInput } from './input.js';
import { renderUI, renderStartScreen, renderGameOver, renderPaused } from './ui.js';
import { checkAABB } from './physics.js';

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
        
        // Input Init
        handleInput(p);
        
        gameState.gamePhase = "START";
        
        // Initial Log
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Time management
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        p.background(COLORS.BACKGROUND);
        
        // --- State Machine ---
        switch(gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
                
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
                
            case "PAUSED":
                renderGame(p); // Static Render
                renderPaused(p);
                break;
                
            case "GAME_OVER_WIN":
                renderGame(p);
                renderGameOver(p, true);
                break;
                
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p, false);
                break;
        }
    };
});

function updateGame(p) {
    if (!gameState.player) return;

    // Update Camera
    let targetCamX = gameState.player.x - CANVAS_WIDTH / 3;
    // targetCamX = p.constrain(targetCamX, 0, gameState.levelWidth - CANVAS_WIDTH);
    // Smooth lerp
    gameState.cameraX = p.lerp(gameState.cameraX, targetCamX, 0.1);

    // Update Player
    gameState.player.update(p);
    
    // Update Entities (Enemies, Projectiles)
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
        let e = gameState.entities[i];
        if (e === gameState.player) continue;
        
        e.update(p);
        
        if (e.markedForDeletion) {
            gameState.entities.splice(i, 1);
            // Also remove from specific arrays
            let eIdx = gameState.enemies.indexOf(e);
            if (eIdx > -1) gameState.enemies.splice(eIdx, 1);
            
            let pIdx = gameState.projectiles.indexOf(e);
            if (pIdx > -1) gameState.projectiles.splice(pIdx, 1);
        }
    }
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update();
        if (gameState.particles[i].markedForDeletion) {
            gameState.particles.splice(i, 1);
        }
    }
}

function renderGame(p) {
    p.push();
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    // Draw Background Detail (Parallax Pillars)
    p.fill(15, 10, 20);
    for (let i = 0; i < 20; i++) {
        let x = i * 400 - (gameState.cameraX * 0.5); 
        p.rect(x, 0, 50, CANVAS_HEIGHT * 2);
    }
    
    // Draw Platforms
    p.fill(COLORS.PLATFORM);
    p.stroke(COLORS.PLATFORM_TOP);
    p.strokeWeight(2);
    for (let plat of gameState.platforms) {
        // Culling
        if (plat.x + plat.width < gameState.cameraX || plat.x > gameState.cameraX + CANVAS_WIDTH) continue;
        
        p.rect(plat.x, plat.y, plat.width, plat.height);
        // Grass/Top detail
        p.line(plat.x, plat.y, plat.x + plat.width, plat.y);
    }
    
    // Draw Exit Door
    if (gameState.exitDoor) {
        p.fill(50, 20, 0);
        p.rect(gameState.exitDoor.x, gameState.exitDoor.y, gameState.exitDoor.width, gameState.exitDoor.height);
        p.fill(255, 200, 0, 100); // Glow
        p.circle(gameState.exitDoor.x + gameState.exitDoor.width/2, gameState.exitDoor.y + gameState.exitDoor.height/2, 20);
    }
    
    // Draw Collectibles
    for (let c of gameState.collectibles) {
        c.render(p);
    }

    // Draw Entities (Player, Enemy, Proj)
    // Draw Particles behind player? Or front?
    // Let's do Particles Back -> Enemies -> Player -> Particles Front
    
    // Render Enemies
    for (let e of gameState.enemies) {
        if (e.x + e.width < gameState.cameraX || e.x > gameState.cameraX + CANVAS_WIDTH) continue;
        e.render(p);
    }
    
    // Render Projectiles
    p.fill(255, 255, 0);
    p.noStroke();
    for (let proj of gameState.projectiles) {
        p.circle(proj.x, proj.y, 8);
    }

    // Render Player
    if (gameState.player) gameState.player.render(p);
    
    // Render Particles
    for (let part of gameState.particles) {
        part.render(p);
    }

    p.pop();
}

// Global hook for controls UI
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to: " + mode);
    
    // UI Update
    document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
    if (mode === 'HUMAN') document.getElementById('humanModeBtn').classList.add('active');
    if (mode === 'TEST_1') document.getElementById('test_1_ModeBtn').classList.add('active');
    if (mode === 'TEST_2') document.getElementById('test_2_ModeBtn').classList.add('active');
};