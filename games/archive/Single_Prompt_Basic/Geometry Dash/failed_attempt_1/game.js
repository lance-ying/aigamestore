import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, PLAYER_SIZE, SCROLL_SPEED, COLORS, gameState, getGameState } from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './level.js';
import { checkCollision, checkPitCollision } from './collision.js';
import { setupInputHandling, handleGameInput, KEYS } from './input.js';
import { game_testing_controller } from './automated_testing_controller.js';

const p5 = window.p5;
let gameInstance = new p5(p => {
  // Initialize variables
  let level = null;
  
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
    
    // Set up input handling
    setupInputHandling(p);
    
    // Initialize game state
    resetGame();
    
    // Log initial game state
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    // Expose the getGameState function globally
    window.getGameState = getGameState;
  };
  
  p.draw = function() {
    p.background(...COLORS.background);
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen();
        break;
      case "PLAYING":
        updateGame();
        drawGame();
        break;
      case "PAUSED":
        drawGame();
        drawPauseOverlay();
        break;
      case "GAME_OVER_WIN":
        drawGame();
        drawGameOverWin();
        break;
      case "GAME_OVER_LOSE":
        drawGame();
        drawGameOverLose();
        break;
    }
  };
  
  function resetGame() {
    // Create player
    gameState.player = new Player(100, CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE);
    
    // Reset game state
    gameState.score = 0;
    gameState.distanceTraveled = 0;
    gameState.gamePhase = "START";
    gameState.lastJumpFrame = 0;
    
    // Generate level
    level = generateLevel(gameState.levelLength);
    gameState.obstacles = level.obstacles;
    gameState.stars = level.stars;
    gameState.levelEnd = level.levelEnd;
  }
  
  function updateGame() {
    // Handle input
    handleGameInput(p);
    
    // Update player
    gameState.player.update(p);
    
    // Log player info
    p.logs.player_info.push({
      "screen_x": gameState.player.x,
      "screen_y": gameState.player.y,
      "game_x": gameState.player.x + gameState.distanceTraveled,
      "game_y": gameState.player.y,
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    // Update game distance
    gameState.distanceTraveled += SCROLL_SPEED;
    
    // Update obstacles
    for (const obstacle of gameState.obstacles) {
      obstacle.update(SCROLL_SPEED);
      
      // Check collision with obstacles
      if (!obstacle.passed) {
        if (obstacle.type === 'pit') {
          if (checkPitCollision(gameState.player, obstacle)) {
            gameOver(false);
            return;
          }
        } else if (checkCollision(gameState.player, obstacle)) {
          gameOver(false);
          return;
        }
        
        // Mark obstacle as passed
        if (obstacle.x + obstacle.width < gameState.player.x) {
          obstacle.passed = true;
        }
      }
    }
    
    // Update stars
    for (const star of gameState.stars) {
      star.update(SCROLL_SPEED);
      
      // Check collision with stars
      if (!star.collected && checkCollision(gameState.player, star)) {
        star.collected = true;
        gameState.score += 100;
      }
    }
    
    // Update level end
    if (gameState.levelEnd) {
      gameState.levelEnd.update(SCROLL_SPEED);
      
      // Check if player reached the end
      if (checkCollision(gameState.player, gameState.levelEnd)) {
        gameOver(true);
        return;
      }
    }
  }
  
  function gameOver(win) {
    gameState.gamePhase = win ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
    
    // Log game over
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": { score: gameState.score },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }
  
  function drawStartScreen() {
    // Draw ground
    p.fill(...COLORS.ground);
    p.rect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    // Draw title
    p.fill(...COLORS.titleText);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("GEOMETRY DASH CLONE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 4);
    
    // Draw instructions
    p.fill(...COLORS.text);
    p.textSize(16);
    p.text("Navigate through obstacles by jumping at the right time", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    p.text("Collect stars to increase your score", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.text("Reach the end of the level to win!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    
    // Draw controls
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    
    // Draw player preview
    gameState.player.draw(p);
  }
  
  function drawGame() {
    // Draw ground
    p.fill(...COLORS.ground);
    p.rect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    // Draw obstacles
    for (const obstacle of gameState.obstacles) {
      if (obstacle.isVisible()) {
        obstacle.draw(p);
      }
    }
    
    // Draw stars
    for (const star of gameState.stars) {
      if (star.isVisible() && !star.collected) {
        star.draw(p);
      }
    }
    
    // Draw level end
    if (gameState.levelEnd && gameState.levelEnd.x < CANVAS_WIDTH) {
      gameState.levelEnd.draw(p);
    }
    
    // Draw player
    gameState.player.draw(p);
    
    // Draw score
    p.fill(...COLORS.text);
    p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Score: ${gameState.score}`, 20, 20);
    
    // Draw progress
    const progress = Math.min(100, Math.floor((gameState.distanceTraveled / gameState.levelLength) * 100));
    p.text(`Progress: ${progress}%`, 20, 50);
  }
  
  function drawPauseOverlay() {
    // Semi-transparent overlay
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Pause text
    p.fill(...COLORS.text);
    p.textSize(20);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 20, 20);
    
    // Instructions
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  }
  
  function drawGameOverWin() {
    // Semi-transparent overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Win text
    p.fill(0, 255, 0);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    
    // Score
    p.fill(...COLORS.text);
    p.textSize(30);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Restart instructions
    p.textSize(20);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
  }
  
  function drawGameOverLose() {
    // Semi-transparent overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Game over text
    p.fill(255, 0, 0);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    
    // Score
    p.fill(...COLORS.text);
    p.textSize(30);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Restart instructions
    p.textSize(20);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Function to set the control mode
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Add active class to the selected button
  const activeButton = document.getElementById(`${mode.toLowerCase()}ModeBtn`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
  
  // Log control mode change
  gameInstance.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": { controlMode: mode },
    "framecount": gameInstance.frameCount,
    "timestamp": Date.now()
  });
};