import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONSTANTS, getGameState } from './globals.js';
import { handleInput, isKeyDown, KEYS } from './input.js';
import { Fish, Projectile, Particle } from './entities.js';
import { checkCollisions } from './physics.js';
import { renderUI, renderStartScreen } from './ui.js';

// Automated Testing Import
import { get_automated_testing_action } from './automated_test.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        handleInput(p);
        
        // Initial Shop Selection
        gameState.shopSelection = 0;
        
        p.logs.game_info.push({ phase: "INIT", timestamp: Date.now() });
    };

    p.draw = function() {
        // Update Time
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        gameState.frameCount = p.frameCount;

        // Automated Testing Inputs
        const autoAction = get_automated_testing_action(gameState);
        if (autoAction) {
            handleAutoInput(p, autoAction);
        }

        p.background(20);

        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updatePlaying(p);
                renderPlaying(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderPlaying(p);
                renderUI(p);
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderPlaying(p);
                renderGameOver(p);
                break;
        }
    };
});

function handleAutoInput(p, action) {
    // Simulate key presses based on action
    // action: { key, keyCode, type: 'press'|'release' }
    // Or simpler: action is just keys to hold this frame.
    
    // Clear all keys first for robust simulation or rely on state?
    // Let's assume action returns the set of keys currently pressed.
    
    // Reset keys logic for test mode usually requires overriding input.js, 
    // but here we can just set gameState.keys based on the testing function return.
    
    // Ideally, the tester returns a list of KeyCodes to be "Down".
    if (action.keysDown) {
        // Reset specific control keys
        [KEYS.LEFT, KEYS.RIGHT, KEYS.SPACE, KEYS.ENTER, KEYS.Z].forEach(k => gameState.keys[k] = false);
        
        action.keysDown.forEach(code => {
            gameState.keys[code] = true;
            // Also trigger key pressed event logic if needed (like buying)
            // But simple boolean checks in update loop handle most continuous input.
            // For toggle inputs (Enter, Z), the update loop needs to handle "justPressed" logic or simple debounce.
            // Since our shop logic checks keys directly, we might need a debounce in the test script or here.
        });
    }
    
    if (action.pressOnce) {
        // Simulate a single frame press
        gameState.keys[action.pressOnce] = true;
        // In real loop, keyReleased happens later. 
        // For testing, we might need to rely on the logic handling "isDown".
    }
}

function updatePlaying(p) {
    switch (gameState.subPhase) {
        case "SHOP":
            updateShop(p);
            break;
        case "DESCENT":
            updateDescent(p);
            break;
        case "ASCENT":
            updateAscent(p);
            break;
        case "SHOOTING":
            updateShooting(p);
            break;
        case "SUMMARY":
            updateSummary(p);
            break;
    }
    
    // Update Particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update();
        if (gameState.particles[i].life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

function updateShop(p) {
    // Navigate
    if (p.frameCount % 10 === 0) { // Simple Debounce
        if (isKeyDown(KEYS.DOWN)) gameState.shopSelection = (gameState.shopSelection + 1) % 3;
        if (isKeyDown(KEYS.UP)) gameState.shopSelection = (gameState.shopSelection + 2) % 3;
    }

    // Buy
    if (isKeyDown(KEYS.Z)) {
         // Simple Debounce handled by checking framecount or flag? 
         // Let's use a flag in gameState or just a cooldown
         if (!gameState.buyCooldown) {
            attemptBuy();
            gameState.buyCooldown = 15;
         }
    }
    if (gameState.buyCooldown > 0) gameState.buyCooldown--;

    // Start Fishing
    if (isKeyDown(KEYS.ENTER)) {
        if (!gameState.enterCooldown) {
            startFishing();
            gameState.enterCooldown = 30;
        }
    }
    if (gameState.enterCooldown > 0) gameState.enterCooldown--;
}

function attemptBuy() {
    const items = [
        { price: CONSTANTS.SHOP_PRICES.LINE * gameState.lineLengthLevel, action: () => gameState.lineLengthLevel++ },
        { price: CONSTANTS.SHOP_PRICES.GUN * gameState.gunLevel, action: () => gameState.gunLevel++ },
        { price: CONSTANTS.SHOP_PRICES.LURE * gameState.lureSpeedLevel, action: () => gameState.lureSpeedLevel++ }
    ];
    
    const item = items[gameState.shopSelection];
    if (gameState.money >= item.price) {
        gameState.money -= item.price;
        item.action();
    }
}

function startFishing() {
    gameState.subPhase = "DESCENT";
    gameState.depth = 0;
    gameState.fish = [];
    gameState.caughtFish = [];
    gameState.hookX = CANVAS_WIDTH / 2;
    gameState.hookVelocityY = 2 + gameState.lureSpeedLevel * 0.5;
    
    // Pre-generate some fish
    generateFishChunk(0, 1000);
}

function generateFishChunk(startDepth, endDepth) {
    const density = 0.005; // Fish per pixel
    const count = (endDepth - startDepth) * density;
    for (let i = 0; i < count; i++) {
        const y = startDepth + Math.random() * (endDepth - startDepth);
        if (y > 200) { // Don't spawn too close to surface
            gameState.fish.push(new Fish(y));
        }
    }
}

function updateDescent(p) {
    // Increase Depth
    gameState.depth += gameState.hookVelocityY;
    
    // Generate more fish as we go
    if (gameState.depth + CANVAS_HEIGHT > gameState.lastGenDepth) {
        // Not implemented for simplicity, relying on initial chunk + dynamic.
        // Actually, let's just generate on the fly
        if (Math.random() < 0.1) {
            gameState.fish.push(new Fish(gameState.depth + CANVAS_HEIGHT + 100));
        }
    }

    // Steering
    const speed = 4;
    if (isKeyDown(KEYS.LEFT)) gameState.hookX -= speed;
    if (isKeyDown(KEYS.RIGHT)) gameState.hookX += speed;
    gameState.hookX = p.constrain(gameState.hookX, 20, CANVAS_WIDTH - 20);

    // Max Depth Check
    const maxDepth = 200 + gameState.lineLengthLevel * 100;
    if (gameState.depth >= maxDepth) {
        gameState.subPhase = "ASCENT";
    }

    // Collisions
    checkCollisions(p);
}

function updateAscent(p) {
    // Decrease Depth
    gameState.depth -= 8; // Fast ascent

    // Steering
    const speed = 5;
    if (isKeyDown(KEYS.LEFT)) gameState.hookX -= speed;
    if (isKeyDown(KEYS.RIGHT)) gameState.hookX += speed;
    gameState.hookX = p.constrain(gameState.hookX, 20, CANVAS_WIDTH - 20);

    // Surface Check
    if (gameState.depth <= 0) {
        startShootingPhase();
    }

    // Collisions (Catching)
    checkCollisions(p);
}

function startShootingPhase() {
    gameState.subPhase = "SHOOTING";
    gameState.airborneFish = [];
    
    // Launch fish
    gameState.caughtFish.forEach((fish, i) => {
        // Reset properties for physics
        fish.x = CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 50;
        fish.y = CANVAS_HEIGHT;
        fish.vx = (Math.random() - 0.5) * 10;
        fish.vy = -12 - Math.random() * 5 - (i * 0.5); // Stagger launch
        fish.rotationSpeed = (Math.random() - 0.5) * 0.2;
        gameState.airborneFish.push(fish);
    });
    
    gameState.gunAngle = -Math.PI / 2; // Up
}

function updateShooting(p) {
    // Gun Aiming
    if (isKeyDown(KEYS.LEFT)) gameState.gunAngle -= 0.05;
    if (isKeyDown(KEYS.RIGHT)) gameState.gunAngle += 0.05;
    gameState.gunAngle = p.constrain(gameState.gunAngle, -Math.PI, 0);

    // Shooting
    if (isKeyDown(KEYS.SPACE)) {
        if (!gameState.shootCooldown) {
            const spread = (gameState.gunLevel - 1) * 0.1;
            // Base shot
            gameState.projectiles.push(new Projectile(CANVAS_WIDTH/2, CANVAS_HEIGHT - 20, gameState.gunAngle));
            // Spread shots
            if (gameState.gunLevel > 1) {
                gameState.projectiles.push(new Projectile(CANVAS_WIDTH/2, CANVAS_HEIGHT - 20, gameState.gunAngle - 0.1));
                gameState.projectiles.push(new Projectile(CANVAS_WIDTH/2, CANVAS_HEIGHT - 20, gameState.gunAngle + 0.1));
            }
            gameState.shootCooldown = 10;
        }
    }
    if (gameState.shootCooldown > 0) gameState.shootCooldown--;

    // Update Projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        gameState.projectiles[i].update();
        if (gameState.projectiles[i].isDead()) {
            gameState.projectiles.splice(i, 1);
        } else {
            gameState.projectiles[i].render(p);
        }
    }

    // Update Air Fish
    for (let i = gameState.airborneFish.length - 1; i >= 0; i--) {
        let fish = gameState.airborneFish[i];
        fish.update(p);
        fish.render(p);
        
        if (fish.y > CANVAS_HEIGHT + 100) {
            // Missed fish
            gameState.airborneFish.splice(i, 1);
        }
    }

    // Check End Condition
    if (gameState.airborneFish.length === 0 && gameState.caughtFish.length > 0 && gameState.projectiles.length === 0) {
        // Wait a bit then summary
         if (!gameState.endTimer) gameState.endTimer = 60;
         gameState.endTimer--;
         if (gameState.endTimer <= 0) {
             gameState.subPhase = "SUMMARY";
             gameState.endTimer = 0;
         }
    } else if (gameState.caughtFish.length === 0 && gameState.airborneFish.length === 0) {
         // Immediate end if no fish caught
         gameState.subPhase = "SUMMARY";
    }
    
    checkCollisions(p);
}

function updateSummary(p) {
    if (isKeyDown(KEYS.ENTER)) {
        if (!gameState.enterCooldown) {
            gameState.subPhase = "SHOP";
            gameState.enterCooldown = 30;
        }
    }
    if (gameState.enterCooldown > 0) gameState.enterCooldown--;
}


function renderPlaying(p) {
    // Background based on Phase
    if (gameState.subPhase === "SHOOTING") {
        p.background(135, 206, 235); // Sky Blue
        
        // Draw Water at bottom
        p.fill(0, 100, 150);
        p.noStroke();
        p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
        
        // Draw Billy
        p.push();
        p.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
        // Boat
        p.fill(139, 69, 19);
        p.arc(0, 20, 60, 40, 0, Math.PI, p.CHORD);
        // Man
        p.fill(255, 200, 150);
        p.rect(-5, -10, 10, 20); // Body
        p.circle(0, -15, 10); // Head
        // Gun Arm
        p.rotate(gameState.gunAngle + Math.PI/2);
        p.fill(50);
        p.rect(-2, -5, 4, 30);
        p.pop();

    } else {
        // Underwater Gradient approximation
        let c1 = p.color(0, 100, 150);
        let c2 = p.color(0, 20, 40);
        
        // Map depth to color
        let lerpVal = p.map(gameState.depth, 0, 1000, 0, 1);
        p.background(p.lerpColor(c1, c2, lerpVal));

        // Render Fish
        gameState.fish.forEach(fish => fish.render(p, gameState.depth - 200)); // Offset so Hook is roughly screen center
        
        // Render Hook
        p.push();
        // Hook is always centered horizontally relative to its x, fixed vertical render pos usually?
        // Let's keep hook at Y=200 on screen.
        p.translate(gameState.hookX, 200);
        p.stroke(255);
        p.strokeWeight(2);
        p.line(0, -200, 0, 0); // The Line going up
        
        p.noFill();
        p.arc(0, 0, 20, 20, 0, Math.PI);
        p.line(0, 10, 0, -5);
        
        // Render Caught Fish trailing
        if (gameState.subPhase === "ASCENT") {
            gameState.caughtFish.forEach(fish => {
                p.push();
                p.translate(fish.relativeX, fish.relativeY);
                p.fill(fish.color);
                p.noStroke();
                p.ellipse(0, 0, fish.width, fish.height);
                p.pop();
            });
        }
        
        p.pop();
    }
    
    // Render Particles
    gameState.particles.forEach(pt => pt.render(p));
}

function renderPaused(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

function renderGameOver(p) {
    // Not strictly used in current loop logic, but for completeness
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

window.gameInstance = gameInstance;