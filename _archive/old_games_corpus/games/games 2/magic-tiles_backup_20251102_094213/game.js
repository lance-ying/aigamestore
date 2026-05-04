import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, LANE_COUNT, LANE_WIDTH, 
  TARGET_ZONE_HEIGHT, TARGET_ZONE_Y, TILE_HEIGHT, 
  PERFECT_SCORE, GOOD_SCORE, WIN_SCORE, STARTING_SPEED, 
  MAX_SPEED, SPEED_INCREMENT, SPEED_INCREASE_THRESHOLD,
  TAP_DEBOUNCE_MS,
  gameState, LANE_KEYS, getGameState, setControlMode
} from './globals.js';
import { Tile } from './tile.js';
import { game_testing_controller } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize variables
  let lastFrameCount = 0;
  let keyQueue = [];
  let controllerAction = null;
  let lastProcessedKeys = {}; // Track last processed time per keyCode
  
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Log initial game state
    logGameInfo("Game initialized", {});
  };
  
  p.draw = function() {
    p.background(220);
    
    // Handle game state
    switch(gameState.gamePhase) {
      case "START":
        drawStartScreen();
        break;
      case "PLAYING":
        updateGame();
        drawGame();
        break;
      case "PAUSED":
        drawGame();
        drawPauseScreen();
        break;
      case "GAME_OVER_WIN":
        drawGame();
        drawGameOverScreen(true);
        break;
      case "GAME_OVER_LOSE":
        drawGame();
        drawGameOverScreen(false);
        break;
    }
    
    // Process automated testing if not in HUMAN mode
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
      processAutomatedTesting();
    }
    
    // Process any queued key presses
    processKeyQueue();
  };
  
  // Key handling - only queue press events, ignore releases for game logic
  p.keyPressed = function() {
    // Log key press
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Queue the key press to be processed in the next draw cycle
    keyQueue.push({ type: "press", keyCode: p.keyCode, frameCount: p.frameCount, timestamp: Date.now() });
    
    // Prevent default behavior for game control keys
    if ([13, 27, 32, 37, 38, 39, 40, 82, 16, 90].includes(p.keyCode)) {
      return false;
    }
  };
  
  p.keyReleased = function() {
    // Log key release for debugging, but don't queue for processing
    logInput("keyReleased", { key: p.key, keyCode: p.keyCode });
    
    // Prevent default behavior for game control keys
    if ([13, 27, 32, 37, 38, 39, 40, 82, 16, 90].includes(p.keyCode)) {
      return false;
    }
  };
  
  // Process queued key events with debouncing
  function processKeyQueue() {
    const currentTime = Date.now();
    
    while (keyQueue.length > 0) {
      const keyEvent = keyQueue.shift();
      
      if (keyEvent.type === "press") {
        // Debounce: Check if this key was recently processed
        const lastTime = lastProcessedKeys[keyEvent.keyCode] || 0;
        const timeSinceLastPress = currentTime - lastTime;
        
        // Only process if enough time has passed since last press of this key
        if (timeSinceLastPress >= TAP_DEBOUNCE_MS) {
          lastProcessedKeys[keyEvent.keyCode] = currentTime;
          handleKeyPress(keyEvent.keyCode);
        } else {
          // Skip this repeated keypress (from holding key down)
          logInput("keyPress_debounced", { 
            keyCode: keyEvent.keyCode, 
            timeSinceLastPress: timeSinceLastPress 
          });
        }
      }
    }
  }
  
  // Handle key press - each key press is ONE discrete action
  function handleKeyPress(keyCode) {
    switch(gameState.gamePhase) {
      case "START":
        if (keyCode === 13) { // ENTER
          startGame();
        }
        break;
      case "PLAYING":
        if (keyCode === 27) { // ESC
          pauseGame();
        } else if (gameState.controlMode === "HUMAN") {
          handleGameplayControls(keyCode);
        }
        break;
      case "PAUSED":
        if (keyCode === 27) { // ESC
          resumeGame();
        }
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        if (keyCode === 82) { // R
          resetGame();
        }
        break;
    }
  }
  
  // Handle gameplay controls - single tap per action
  function handleGameplayControls(keyCode) {
    const currentTime = Date.now();
    
    // Check if the key corresponds to a lane
    for (let i = 0; i < LANE_COUNT; i++) {
      if (keyCode === LANE_KEYS[i]) {
        // Additional per-lane debouncing
        const timeSinceLastTap = currentTime - gameState.lanes[i].lastTapTime;
        
        if (timeSinceLastTap >= TAP_DEBOUNCE_MS) {
          gameState.lanes[i].lastTapTime = currentTime;
          tapLane(i);
        }
        break;
      }
    }
  }
  
  // Process automated testing - also respects debouncing
  function processAutomatedTesting() {
    if (p.frameCount !== lastFrameCount) {
      lastFrameCount = p.frameCount;
      
      // Get action from testing controller
      controllerAction = game_testing_controller(getGameState());
      
      // Process the action if one is returned
      if (controllerAction !== null) {
        const currentTime = Date.now();
        
        // Check if this action was recently processed (debounce for controller too)
        const lastTime = lastProcessedKeys[controllerAction] || 0;
        const timeSinceLastPress = currentTime - lastTime;
        
        if (timeSinceLastPress >= TAP_DEBOUNCE_MS) {
          lastProcessedKeys[controllerAction] = currentTime;
          handleGameplayControls(controllerAction);
        }
      }
    }
  }
  
  // Game state functions
  function startGame() {
    gameState.gamePhase = "PLAYING";
    gameState.player.score = 0;
    gameState.player.combo = 0;
    gameState.player.maxCombo = 0;
    gameState.player.misses = 0;
    gameState.player.lastHitTime = p.frameCount;
    gameState.tiles = [];
    gameState.speed = STARTING_SPEED;
    gameState.lastSpawnTime = 0;
    gameState.spawnInterval = 60;
    gameState.spawnCountdown = 60;
    gameState.difficultyLevel = 1;
    
    // Reset lane states and debounce timers
    for (let i = 0; i < LANE_COUNT; i++) {
      gameState.lanes[i].active = false;
      gameState.lanes[i].lastPressed = 0;
      gameState.lanes[i].lastTapTime = 0;
      gameState.lanes[i].pressAnimation = 0;
      gameState.lanes[i].glowIntensity = 0;
    }
    
    // Clear debounce tracking
    lastProcessedKeys = {};
    
    logGameInfo("Game started", {});
  }
  
  function pauseGame() {
    gameState.gamePhase = "PAUSED";
    logGameInfo("Game paused", {});
  }
  
  function resumeGame() {
    gameState.gamePhase = "PLAYING";
    logGameInfo("Game resumed", {});
  }
  
  function resetGame() {
    gameState.gamePhase = "START";
    // Clear debounce tracking on reset
    lastProcessedKeys = {};
    logGameInfo("Game reset", {});
  }
  
  function gameOver(win) {
    gameState.gamePhase = win ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
    logGameInfo("Game over", { 
      win: win, 
      score: gameState.player.score, 
      maxCombo: gameState.player.maxCombo,
      misses: gameState.player.misses
    });
  }
  
  // Game update logic
  function updateGame() {
    // Update tiles
    updateTiles();
    
    // Spawn new tiles
    spawnTiles();
    
    // Update lane animations
    updateLaneAnimations();
    
    // Update particles
    updateParticles();
    
    // Check for win condition
    if (gameState.player.score >= WIN_SCORE) {
      gameOver(true);
    }
    
    // Update difficulty based on score
    updateDifficulty();
    
    // Log player info periodically
    if (p.frameCount % 30 === 0) {
      logPlayerInfo();
    }
  }
  
  function updateTiles() {
    for (let i = gameState.tiles.length - 1; i >= 0; i--) {
      const tile = gameState.tiles[i];
      tile.update(gameState.speed);
      
      // Check if tile was missed
      if (tile.missed && tile.active === false) {
        handleMissedTile();
        gameState.tiles.splice(i, 1);
      } else if (!tile.active && tile.y > CANVAS_HEIGHT) {
        // Remove inactive tiles that are off screen
        gameState.tiles.splice(i, 1);
      }
    }
  }
  
  function spawnTiles() {
    gameState.spawnCountdown--;
    
    if (gameState.spawnCountdown <= 0) {
      // Choose a random lane for the new tile
      const laneIndex = Math.floor(p.random(LANE_COUNT));
      
      // Create a new tile
      const newTile = new Tile(laneIndex);
      gameState.tiles.push(newTile);
      
      // Reset spawn countdown with some randomness
      gameState.spawnCountdown = gameState.spawnInterval - 10 + Math.floor(p.random(20));
      
      // Decrease spawn interval as game progresses (for difficulty)
      if (gameState.spawnInterval > 30) {
        gameState.spawnInterval -= 0.1;
      }
    }
  }
  
  function updateDifficulty() {
    // Increase speed based on score
    const newLevel = Math.floor(gameState.player.score / SPEED_INCREASE_THRESHOLD) + 1;
    
    if (newLevel > gameState.difficultyLevel) {
      gameState.difficultyLevel = newLevel;
      gameState.speed = Math.min(MAX_SPEED, STARTING_SPEED + (newLevel - 1) * SPEED_INCREMENT);
      logGameInfo("Difficulty increased", { level: gameState.difficultyLevel, speed: gameState.speed });
    }
  }
  
  // Animation update functions
  function updateLaneAnimations() {
    for (let i = 0; i < LANE_COUNT; i++) {
      const lane = gameState.lanes[i];
      
      // Decay press animation
      if (lane.pressAnimation > 0) {
        lane.pressAnimation = Math.max(0, lane.pressAnimation - 0.05);
      }
      
      // Decay glow intensity
      if (lane.glowIntensity > 0) {
        lane.glowIntensity = Math.max(0, lane.glowIntensity - 0.02);
      }
    }
  }
  
  // Particle system
  let particles = [];
  
  function createParticles(x, y, type) {
    const count = type === "perfect" ? 8 : 5;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: p.random(-4, 4),
        vy: p.random(-6, -2),
        life: 1.0,
        type: type,
        size: p.random(4, 8)
      });
    }
  }
  
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // gravity
      particle.life -= 0.02;
      
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }
  
  // Single discrete tap action for a lane
  function tapLane(laneIndex) {
    gameState.lanes[laneIndex].active = true;
    gameState.lanes[laneIndex].lastPressed = p.frameCount;
    gameState.lanes[laneIndex].pressAnimation = 1.0;
    
    // Check for tiles in this lane
    let hitTile = false;
    let hitResult = "miss";
    
    for (let i = 0; i < gameState.tiles.length; i++) {
      const tile = gameState.tiles[i];
      
      if (tile.laneIndex === laneIndex && tile.isInTargetZone() && !tile.hit) {
        hitResult = tile.checkHit();
        hitTile = true;
        
        // Set hit animation properties
        tile.hitAnimation = 1.0;
        tile.hitTime = p.frameCount;
        
        // Award points based on hit quality
        if (hitResult === "perfect") {
          gameState.player.score += PERFECT_SCORE * (1 + gameState.player.combo * 0.1);
          gameState.player.combo++;
          gameState.lanes[laneIndex].glowIntensity = 1.0;
          // Create particle effect for perfect hit
          createParticles(laneIndex * LANE_WIDTH + LANE_WIDTH/2, tile.y + tile.height/2, "perfect");
        } else if (hitResult === "good") {
          gameState.player.score += GOOD_SCORE * (1 + gameState.player.combo * 0.05);
          gameState.player.combo++;
          gameState.lanes[laneIndex].glowIntensity = 0.7;
          // Create particle effect for good hit
          createParticles(laneIndex * LANE_WIDTH + LANE_WIDTH/2, tile.y + tile.height/2, "good");
        }
        
        // Update max combo
        if (gameState.player.combo > gameState.player.maxCombo) {
          gameState.player.maxCombo = gameState.player.combo;
        }
        
        gameState.player.lastHitTime = p.frameCount;
        break;
      }
    }
    
    // Check if player tapped a white space (miss)
    if (!hitTile) {
      handleMissedTile();
    }
    
    // Log the tap
    logGameInfo("Lane tapped", { 
      lane: laneIndex, 
      result: hitResult, 
      score: gameState.player.score, 
      combo: gameState.player.combo 
    });
  }
  
  function handleMissedTile() {
    gameState.player.combo = 0;
    gameState.player.misses++;
    
    // Game over after missing a tile
    gameOver(false);
  }
  
  // Drawing functions
  function drawStartScreen() {
    // Animated background
    p.background(20);
    for (let i = 0; i < 50; i++) {
      const alpha = p.sin(p.frameCount * 0.02 + i) * 50 + 100;
      p.fill(40, 40, 60, alpha);
      p.noStroke();
      p.ellipse(p.random(CANVAS_WIDTH), p.random(CANVAS_HEIGHT), 3, 3);
    }
    
    // Draw title with glow effect
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title glow
    p.fill(100, 100, 255, 100);
    for (let i = 0; i < 3; i++) {
      p.textSize(42 + i * 2);
      p.text("MAGIC TILES", CANVAS_WIDTH / 2 + i, CANVAS_HEIGHT / 4 + i);
    }
    
    // Main title
    p.fill(255);
    p.textSize(40);
    p.text("MAGIC TILES", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 4);
    
    // Draw instructions
    p.textSize(16);
    p.fill(200, 200, 255);
    p.text("Tap the black tiles as they reach the bottom", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    p.fill(255, 200, 200);
    p.text("Don't miss any black tiles or tap white spaces!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 25);
    
    // Draw visual control mapping
    p.textSize(14);
    p.fill(255, 255, 150);
    p.text("Use arrow keys to tap lanes:", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    // Draw lane preview with arrows
    const previewY = CANVAS_HEIGHT / 2 + 40;
    const previewHeight = 30;
    const lanePreviewWidth = LANE_WIDTH * 0.8;
    const startX = (CANVAS_WIDTH - (lanePreviewWidth * LANE_COUNT)) / 2;
    
    const arrows = ["↓", "←", "↑", "→"];
    
    for (let i = 0; i < LANE_COUNT; i++) {
      const x = startX + i * lanePreviewWidth;
      
      // Lane preview
      p.fill(100, 100, 100);
      p.stroke(150);
      p.strokeWeight(1);
      p.rect(x, previewY, lanePreviewWidth, previewHeight);
      
      // Arrow indicator
      p.fill(255, 255, 100);
      p.textSize(20);
      p.text(arrows[i], x + lanePreviewWidth/2, previewY + previewHeight + 20);
      
      // Lane number
      p.fill(200);
      p.textSize(12);
      p.text(`Lane ${i+1}`, x + lanePreviewWidth/2, previewY + previewHeight/2);
    }
    
    // Draw start prompt with pulsing effect
    const pulseFactor = 1 + 0.2 * p.sin(p.frameCount * 0.1);
    p.push();
    p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 3/4);
    p.scale(pulseFactor);
    p.fill(255, 255, 0);
    p.textSize(20);
    p.text("PRESS ENTER TO START", 0, 0);
    p.pop();
  }
  
  function drawGame() {
    // Gradient background
    for (let i = 0; i <= CANVAS_HEIGHT; i += 5) {
      const alpha = p.map(i, 0, CANVAS_HEIGHT, 250, 220);
      p.stroke(alpha);
      p.line(0, i, CANVAS_WIDTH, i);
    }
    
    // Draw lane backgrounds with glow effects
    p.noStroke();
    for (let i = 0; i < LANE_COUNT; i++) {
      const lane = gameState.lanes[i];
      
      // Lane glow effect
      if (lane.glowIntensity > 0) {
        const glowAlpha = lane.glowIntensity * 50;
        p.fill(100, 255, 100, glowAlpha);
        p.rect(i * LANE_WIDTH - 5, 0, LANE_WIDTH + 10, CANVAS_HEIGHT);
      }
      
      // Press animation effect
      if (lane.pressAnimation > 0) {
        const pressAlpha = lane.pressAnimation * 80;
        p.fill(150, 150, 255, pressAlpha);
        p.rect(i * LANE_WIDTH, 0, LANE_WIDTH, CANVAS_HEIGHT);
      }
    }
    
    // Draw lane dividers
    p.stroke(180);
    p.strokeWeight(3);
    for (let i = 1; i < LANE_COUNT; i++) {
      p.line(i * LANE_WIDTH, 0, i * LANE_WIDTH, CANVAS_HEIGHT);
    }
    
    // Draw target zone with pulsing effect
    p.noStroke();
    const pulseAlpha = 100 + 30 * p.sin(p.frameCount * 0.1);
    p.fill(220, 220, 255, pulseAlpha);
    p.rect(0, TARGET_ZONE_Y, CANVAS_WIDTH, TARGET_ZONE_HEIGHT);
    
    // Draw target zone border
    p.stroke(200, 200, 255);
    p.strokeWeight(2);
    p.noFill();
    p.rect(0, TARGET_ZONE_Y, CANVAS_WIDTH, TARGET_ZONE_HEIGHT);
    
    // Draw tiles
    gameState.tiles.forEach(tile => tile.draw(p));
    
    // Draw particles
    drawParticles();
    
    // Draw arrow key indicators
    drawArrowIndicators();
    
    // Draw HUD
    drawHUD();
  }
  
  function drawHUD() {
    // Score with shadow effect
    p.fill(50);
    p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Score: ${Math.floor(gameState.player.score)}`, 12, 12);
    p.fill(255);
    p.text(`Score: ${Math.floor(gameState.player.score)}`, 10, 10);
    
    // Combo with glow effect
    if (gameState.player.combo > 0) {
      p.textAlign(p.RIGHT, p.TOP);
      // Glow effect for combo
      p.fill(255, 100, 150, 100);
      for (let i = 0; i < 3; i++) {
        p.text(`Combo: ${gameState.player.combo}x`, CANVAS_WIDTH - 8 + i, 12 + i);
      }
      p.fill(255, 0, 100);
      p.text(`Combo: ${gameState.player.combo}x`, CANVAS_WIDTH - 10, 10);
    }
    
    // Level indicator with pulsing effect
    p.textAlign(p.CENTER, p.TOP);
    const levelPulse = 1 + 0.1 * p.sin(p.frameCount * 0.1);
    p.push();
    p.translate(CANVAS_WIDTH / 2, 20);
    p.scale(levelPulse);
    p.fill(50);
    p.text(`Level ${gameState.difficultyLevel}`, 2, 2);
    p.fill(100, 150, 255);
    p.text(`Level ${gameState.difficultyLevel}`, 0, 0);
    p.pop();
  }
  
  function drawParticles() {
    p.noStroke();
    particles.forEach(particle => {
      const alpha = particle.life * 255;
      
      if (particle.type === "perfect") {
        p.fill(0, 255, 0, alpha);
      } else {
        p.fill(255, 255, 0, alpha);
      }
      
      const size = particle.size * particle.life;
      p.ellipse(particle.x, particle.y, size, size);
    });
  }
  
  function drawArrowIndicators() {
    const arrowSize = 20;
    const arrowY = CANVAS_HEIGHT - 30;
    
    // Arrow symbols and their rotations
    const arrows = [
      { symbol: "↓", rotation: 0 }, // DOWN
      { symbol: "←", rotation: 0 }, // LEFT  
      { symbol: "↑", rotation: 0 }, // UP
      { symbol: "→", rotation: 0 }  // RIGHT
    ];
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(arrowSize);
    
    for (let i = 0; i < LANE_COUNT; i++) {
      const x = i * LANE_WIDTH + LANE_WIDTH / 2;
      const lane = gameState.lanes[i];
      
      // Background circle for arrow
      p.fill(0, 0, 0, 100);
      p.ellipse(x, arrowY, arrowSize + 10, arrowSize + 10);
      
      // Highlight if lane was recently pressed
      if (lane.pressAnimation > 0) {
        const highlightAlpha = lane.pressAnimation * 200;
        p.fill(255, 255, 100, highlightAlpha);
        p.ellipse(x, arrowY, arrowSize + 15, arrowSize + 15);
      }
      
      // Draw arrow
      p.fill(255);
      if (lane.pressAnimation > 0) {
        p.fill(255, 255, 0);
      }
      p.text(arrows[i].symbol, x, arrowY - 2);
    }
  }
  
  function drawPauseScreen() {
    // Animated overlay
    const overlayAlpha = 150 + 20 * p.sin(p.frameCount * 0.05);
    p.fill(0, 0, 0, overlayAlpha);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Pause text with glow
    p.textAlign(p.CENTER, p.CENTER);
    
    // Glow effect
    p.fill(100, 100, 255, 100);
    for (let i = 0; i < 3; i++) {
      p.textSize(26 + i * 2);
      p.text("PAUSED", CANVAS_WIDTH / 2 + i, CANVAS_HEIGHT / 2 + i);
    }
    
    // Main text
    p.fill(255, 255, 100);
    p.textSize(24);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Instructions with pulsing
    const pulseFactor = 1 + 0.1 * p.sin(p.frameCount * 0.15);
    p.push();
    p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    p.scale(pulseFactor);
    p.fill(200, 200, 255);
    p.textSize(16);
    p.text("Press ESC to resume", 0, 0);
    p.pop();
  }
  
  function drawGameOverScreen(win) {
    // Animated overlay
    const overlayAlpha = 180 + 30 * p.sin(p.frameCount * 0.03);
    p.fill(0, 0, 0, overlayAlpha);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Game over text with effects
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
      // Victory effects
      // Glow effect
      p.fill(0, 255, 0, 100);
      for (let i = 0; i < 4; i++) {
        p.textSize(42 + i * 3);
        p.text("YOU WIN!", CANVAS_WIDTH / 2 + i, CANVAS_HEIGHT / 3 + i);
      }
      
      // Main text with pulsing
      const winPulse = 1 + 0.2 * p.sin(p.frameCount * 0.1);
      p.push();
      p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
      p.scale(winPulse);
      p.fill(100, 255, 100);
      p.textSize(40);
      p.text("YOU WIN!", 0, 0);
      p.pop();
      
      // Celebration particles
      for (let i = 0; i < 5; i++) {
        const x = CANVAS_WIDTH / 2 + p.sin(p.frameCount * 0.05 + i) * 100;
        const y = CANVAS_HEIGHT / 4 + p.cos(p.frameCount * 0.07 + i) * 30;
        p.fill(255, 255, 0, 150);
        p.ellipse(x, y, 8, 8);
      }
    } else {
      // Game over effects
      // Red glow
      p.fill(255, 0, 0, 100);
      for (let i = 0; i < 4; i++) {
        p.textSize(42 + i * 3);
        p.text("GAME OVER", CANVAS_WIDTH / 2 + i, CANVAS_HEIGHT / 3 + i);
      }
      
      // Main text
      p.fill(255, 100, 100);
      p.textSize(40);
      p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    }
    
    // Score summary with better styling
    p.fill(255, 255, 150);
    p.textSize(22);
    p.text(`Final Score: ${Math.floor(gameState.player.score)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    p.fill(150, 255, 150);
    p.textSize(18);
    p.text(`Max Combo: ${gameState.player.maxCombo}x`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
    
    // Performance rating
    const accuracy = gameState.player.maxCombo > 0 ? (gameState.player.score / (gameState.player.score + gameState.player.misses * 10)) : 0;
    let rating = "Try Again!";
    let ratingColor = [255, 150, 150];
    
    if (accuracy > 0.9) {
      rating = "PERFECT!";
      ratingColor = [100, 255, 100];
    } else if (accuracy > 0.7) {
      rating = "Great!";
      ratingColor = [150, 255, 150];
    } else if (accuracy > 0.5) {
      rating = "Good!";
      ratingColor = [255, 255, 150];
    }
    
    p.fill(ratingColor[0], ratingColor[1], ratingColor[2]);
    p.textSize(16);
    p.text(rating, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    
    // Restart prompt with pulsing
    const restartPulse = 1 + 0.15 * p.sin(p.frameCount * 0.12);
    p.push();
    p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 3/4);
    p.scale(restartPulse);
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text("PRESS R TO RESTART", 0, 0);
    p.pop();
  }
  
  // Logging functions
  function logGameInfo(status, data) {
    p.logs.game_info.push({
      game_status: status,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logPlayerInfo() {
    p.logs.player_info.push({
      screen_x: 0, // Not applicable for this game
      screen_y: 0, // Not applicable for this game
      game_x: 0,   // Not applicable for this game
      game_y: 0,   // Not applicable for this game
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logInput(inputType, data) {
    p.logs.inputs.push({
      input_type: inputType,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;