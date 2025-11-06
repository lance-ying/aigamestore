import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, SCROLL_SPEED, gameState, keys, previousKeys, isKeyJustPressed, setControlMode } from './globals.js';
import { Player } from './player.js';
import { Level } from './level.js';
import { checkCollisions } from './collision.js';
import { game_testing_controller } from './automated_testing_controller.js';

// Create p5 instance
const p5 = window.p5;
let gameInstance = new p5(p => {
  // Initialize variables
  let lastTime = 0;

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
    
    // Initialize game state
    resetGame();
    
    // Log initial game state
    logGameInfo("Game initialized", {});
  };

  p.draw = function() {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Update game based on current phase
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen();
        break;
      case "PLAYING":
        updateGame(deltaTime);
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
  };

  function updateGame(deltaTime) {
    // Update elapsed time
    gameState.elapsedTime = Date.now() - gameState.startTime;
    
    // Handle player input
    handleInput();
    
    // Update player
    gameState.player.update(p);
    
    // Move player forward
    gameState.player.x += SCROLL_SPEED;
    
    // Update camera
    gameState.camera.x = gameState.player.x - 200;
    
    // Check collisions
    const collisionResult = checkCollisions(p, gameState.player, gameState.obstacles, gameState.portals, gameState);
    
    if (collisionResult === true) {
      // Player died
      gameState.deathCount++;
      logGameInfo("Player died", { deathCount: gameState.deathCount });
      gameState.gamePhase = "GAME_OVER_LOSE";
    } else if (collisionResult === 'win') {
      // Player won
      logGameInfo("Player won", { time: gameState.elapsedTime });
      gameState.gamePhase = "GAME_OVER_WIN";
    }
    
    // Update progress
    gameState.progress = Math.min(100, Math.floor((gameState.player.x / gameState.level.length) * 100));
    
    // Log player position periodically
    if (p.frameCount % 10 === 0) {
      logPlayerInfo();
    }
    
    // Update previous key states at end of frame for next frame's tap detection
    previousKeys.space = p.keyIsDown(32);
    previousKeys.up = p.keyIsDown(38);
  }

  function drawGame() {
    // Draw level
    gameState.level.draw(p, gameState.camera.x);
    
    // Draw player
    gameState.player.draw(p, gameState.camera.x);
    
    // Draw UI
    drawUI();
  }

  function drawUI() {
    // Draw progress bar
    p.push();
    p.noStroke();
    p.fill(50, 50, 50, 150);
    p.rect(20, 20, CANVAS_WIDTH - 40, 10);
    p.fill(255, 255, 0);
    p.rect(20, 20, (CANVAS_WIDTH - 40) * (gameState.progress / 100), 10);
    p.pop();
    
    // Draw progress percentage
    p.push();
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.RIGHT);
    p.text(`${gameState.progress}%`, CANVAS_WIDTH - 20, 45);
    p.pop();
    
    // Draw mode indicator
    p.push();
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.LEFT);
    p.text(`Mode: ${gameState.player.mode.toUpperCase()}`, 20, 45);
    p.pop();
    
    // Draw attempt counter
    p.push();
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.CENTER);
    p.text(`Attempt ${gameState.deathCount + 1}`, CANVAS_WIDTH / 2, 45);
    p.pop();
  }

  function drawStartScreen() {
    p.background(30, 30, 50);
    
    // Title
    p.push();
    p.fill(255, 255, 0);
    p.textSize(40);
    p.textAlign(p.CENTER);
    p.text("GEOMETRY DASH", CANVAS_WIDTH / 2, 80);
    p.pop();
    
    // Controls
    p.push();
    p.fill(200, 200, 255);
    p.textSize(12);
    p.textAlign(p.CENTER);
    p.text("TAP SPACE / UP: Jump (cube) or fly (ship)", CANVAS_WIDTH / 2, 200);
    p.text("ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 220);
    p.pop();
    
    // Start prompt
    p.push();
    p.fill(255);
    p.textSize(20);
    p.textAlign(p.CENTER);
    const blinkRate = Math.floor(p.frameCount / 30) % 2;
    if (blinkRate === 0) {
      p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 280);
    }
    p.pop();
    
    // Draw player preview
    p.push();
    p.translate(CANVAS_WIDTH / 2, 320);
    p.fill(255, 50, 50);
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(-15, -15, 30, 30);
    p.pop();
  }

  function drawPauseScreen() {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textSize(30);
    p.textAlign(p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    p.textSize(16);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    p.pop();
  }

  function drawGameOverScreen(isWin) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (isWin) {
      p.fill(255, 255, 0);
      p.textSize(40);
      p.textAlign(p.CENTER);
      p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      p.fill(255);
      p.textSize(20);
      p.text(`Time: ${(gameState.elapsedTime / 1000).toFixed(2)}s`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      p.text(`Attempts: ${gameState.deathCount + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    } else {
      p.fill(255, 50, 50);
      p.textSize(40);
      p.textAlign(p.CENTER);
      p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
      
      p.fill(255);
      p.textSize(20);
      p.text(`Progress: ${gameState.progress}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      p.text(`Attempts: ${gameState.deathCount + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
    
    // Restart prompt
    p.fill(255);
    p.textSize(20);
    const blinkRate = Math.floor(p.frameCount / 30) % 2;
    if (blinkRate === 0) {
      p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    }
    p.pop();
  }

  function handleInput() {
    // If in test mode, get input from test controller
    if (gameState.controlMode !== "HUMAN") {
      const testAction = game_testing_controller(gameState);
      if (testAction === 32 || testAction === 38) { // SPACE or UP
        gameState.player.jump();
      }
      return;
    }
    
    // Human controls - TAP BASED (only trigger on NEW key press, not held keys)
    const spacePressed = p.keyIsDown(32);
    const upPressed = p.keyIsDown(38);
    
    // Check if either key was just pressed (not held from previous frame)
    const spaceJustPressed = isKeyJustPressed(spacePressed, previousKeys.space);
    const upJustPressed = isKeyJustPressed(upPressed, previousKeys.up);
    
    // Only jump on NEW tap, not while key is held
    if (spaceJustPressed || upJustPressed) {
      gameState.player.jump();
    }
  }

  p.keyPressed = function() {
    // Log key input
    logKeyInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Handle key presses based on game phase
    switch (gameState.gamePhase) {
      case "START":
        if (p.keyCode === 13) { // ENTER
          startGame();
        }
        break;
      case "PLAYING":
        if (p.keyCode === 27) { // ESC
          pauseGame();
        } else if (p.keyCode === 82) { // R
          resetGame();
        }
        break;
      case "PAUSED":
        if (p.keyCode === 27) { // ESC
          resumeGame();
        } else if (p.keyCode === 82) { // R
          resetGame();
        }
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        if (p.keyCode === 82) { // R
          resetGame();
        }
        break;
    }
    
    // Prevent default for game keys
    if ([32, 38, 37, 39, 40, 27, 13, 82].includes(p.keyCode)) {
      return false;
    }
  };

  function startGame() {
    gameState.gamePhase = "PLAYING";
    gameState.startTime = Date.now();
    gameState.elapsedTime = 0;
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
    // Always use level 1
    gameState.level = new Level(1);
    gameState.obstacles = gameState.level.obstacles;
    gameState.portals = gameState.level.portals;
    
    // Initialize player
    gameState.player = new Player(gameState.level.startX, gameState.level.startY);
    
    // Reset game state
    gameState.camera = { x: 0 };
    gameState.progress = 0;
    gameState.deathCount = 0;
    gameState.gamePhase = "START";
    gameState.levelLength = gameState.level.length;
    gameState.startTime = 0;
    gameState.elapsedTime = 0;
    
    // Reset key tracking
    previousKeys.space = false;
    previousKeys.up = false;
    
    logGameInfo("Game reset", {});
  }

  // Logging functions
  function logGameInfo(status, data) {
    p.logs.game_info.push({
      "game_status": status,
      "data": data,
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }

  function logPlayerInfo() {
    if (gameState.player) {
      p.logs.player_info.push({
        "screen_x": gameState.player.x - gameState.camera.x,
        "screen_y": gameState.player.y,
        "game_x": gameState.player.x,
        "game_y": gameState.player.y,
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
    }
  }

  function logKeyInput(inputType, data) {
    p.logs.inputs.push({
      "input_type": inputType,
      "data": data,
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Expose getGameState globally
import { getGameState } from './globals.js';
window.getGameState = getGameState;