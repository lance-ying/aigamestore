import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  OBSTACLE_SPEED_INITIAL,
  OBSTACLE_SPEED_INCREMENT,
  OBSTACLE_SPAWN_INITIAL,
  OBSTACLE_SPAWN_MIN,
  COIN_VALUE,
  WIN_SCORE,
  gameState, 
  getGameState 
} from './globals.js';

import { Player, Obstacle, Coin } from './entities.js';
import { checkCollision, checkCoinCollision } from './physics.js';
import { 
  drawBackground, 
  drawPlayer, 
  drawObstacles, 
  drawCoins, 
  drawUI, 
  drawStartScreen, 
  drawGameOverScreen 
} from './renderer.js';

import { game_testing_controller } from './automated_testing_controller.js';

// Expose getGameState globally
window.getGameState = getGameState;

// Create control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Add active class to selected button
  const activeButton = document.getElementById(`${mode.toLowerCase()}ModeBtn`) || 
                      document.getElementById('humanModeBtn');
  if (activeButton) {
    activeButton.classList.add('active');
  }
  
  // Log the control mode change
  if (window.gameInstance && window.gameInstance.logs) {
    window.gameInstance.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: { controlMode: mode },
      framecount: window.gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
};

// Initialize p5.js in instance mode
const p5 = window.p5;
let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "player_info": [],
      "inputs": []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: {},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    resetGame();
  };
  
  // Draw function
  p.draw = function() {
    handleGameState();
    
    // Draw appropriate screen based on game phase
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      // Draw game elements
      drawBackground(p, gameState.speed);
      drawObstacles(p, gameState.obstacles);
      drawCoins(p, gameState.coins, p.frameCount);
      drawPlayer(p, gameState.player);
      drawUI(p, gameState);
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      // Draw game elements with overlay
      drawBackground(p, gameState.speed);
      drawObstacles(p, gameState.obstacles);
      drawCoins(p, gameState.coins, p.frameCount);
      drawPlayer(p, gameState.player);
      drawUI(p, gameState);
      drawGameOverScreen(p, gameState);
    }
  };
  
  // Handle different game states
  function handleGameState() {
    if (gameState.gamePhase === "PLAYING") {
      // Update game logic
      updateGame();
      
      // Handle automated testing inputs
      if (gameState.controlMode !== "HUMAN") {
        handleAutomatedInputs();
      }
    }
  }
  
  // Update game logic
  function updateGame() {
    // Update player
    gameState.player.update();
    
    // Update game speed
    gameState.speed += OBSTACLE_SPEED_INCREMENT;
    gameState.distance += gameState.speed / 10;
    
    // Spawn obstacles and coins
    if (p.frameCount - gameState.lastSpawn > getSpawnRate()) {
      spawnObstacleOrCoin();
      gameState.lastSpawn = p.frameCount;
    }
    
    // Update obstacles
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
      const obstacle = gameState.obstacles[i];
      obstacle.update(gameState.speed);
      
      // Check collision with player
      if (checkCollision(p, gameState.player, obstacle)) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        
        // Log game over
        p.logs.game_info.push({
          game_status: gameState.gamePhase,
          data: { score: gameState.score, distance: Math.floor(gameState.distance) },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Remove if out of view
      if (!obstacle.isVisible()) {
        gameState.obstacles.splice(i, 1);
      }
    }
    
    // Update coins
    for (let i = gameState.coins.length - 1; i >= 0; i--) {
      const coin = gameState.coins[i];
      coin.update(gameState.speed);
      
      // Check collision with player
      if (!coin.collected && checkCoinCollision(p, gameState.player, coin)) {
        coin.collected = true;
        gameState.score += COIN_VALUE;
        
        // Check for win condition
        if (gameState.score >= WIN_SCORE) {
          gameState.gamePhase = "GAME_OVER_WIN";
          
          // Log win
          p.logs.game_info.push({
            game_status: gameState.gamePhase,
            data: { score: gameState.score, distance: Math.floor(gameState.distance) },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      // Remove if out of view or collected
      if (!coin.isVisible()) {
        gameState.coins.splice(i, 1);
      }
    }
    
    // Log player position if it has changed
    if (p.frameCount % 10 === 0 || p.frameCount !== gameState.lastFrameCount) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      gameState.lastFrameCount = p.frameCount;
    }
  }
  
  // Handle automated testing inputs
  function handleAutomatedInputs() {
    const actionKey = game_testing_controller(gameState);
    
    if (actionKey) {
      // Simulate key press
      handleKeyAction(actionKey);
      
      // Log the automated input
      p.logs.inputs.push({
        input_type: "automatedKeyPressed",
        data: { key: String.fromCharCode(actionKey), keyCode: actionKey },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Handle key action
  function handleKeyAction(keyCode) {
    if (!gameState.player) return;
    
    switch (keyCode) {
      case 37: // LEFT
        gameState.player.moveLeft();
        break;
      case 39: // RIGHT
        gameState.player.moveRight();
        break;
      case 38: // UP
        gameState.player.jump();
        break;
      case 40: // DOWN
        gameState.player.slide();
        break;
    }
  }
  
  // Key pressed event
  p.keyPressed = function() {
    // Log key press
    if ([13, 27, 82, 37, 38, 39, 40, 32, 16, 90].includes(p.keyCode)) {
      p.logs.inputs.push({
        input_type: "keyPressed",
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Handle game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        startGame();
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        pauseGame();
      } else if (gameState.gamePhase === "PAUSED") {
        resumeGame();
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame();
      }
    }
    
    // Handle gameplay controls
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
      handleKeyAction(p.keyCode);
    }
  };
  
  // Spawn obstacle or coin
  function spawnObstacleOrCoin() {
    const laneIndex = Math.floor(p.random(3));
    
    // 70% chance of obstacle, 30% chance of coin
    if (p.random() < 0.7) {
      // Choose obstacle type
      const types = ['train', 'barrier', 'tunnel'];
      const typeIndex = Math.floor(p.random(types.length));
      const obstacle = new Obstacle(types[typeIndex], laneIndex);
      gameState.obstacles.push(obstacle);
    } else {
      const coin = new Coin(laneIndex);
      gameState.coins.push(coin);
    }
  }
  
  // Get spawn rate based on game progress
  function getSpawnRate() {
    const minRate = OBSTACLE_SPAWN_MIN;
    const maxRate = OBSTACLE_SPAWN_INITIAL;
    const decreaseRate = 0.05; // How quickly spawn rate decreases
    
    // Decrease spawn rate over time, but never below minimum
    return Math.max(minRate, maxRate - gameState.distance * decreaseRate);
  }
  
  // Start the game
  function startGame() {
    gameState.gamePhase = "PLAYING";
    
    // Log game start
    p.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: {},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Pause the game
  function pauseGame() {
    gameState.gamePhase = "PAUSED";
    
    // Log pause
    p.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: {},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Resume the game
  function resumeGame() {
    gameState.gamePhase = "PLAYING";
    
    // Log resume
    p.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: {},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Reset the game
  function resetGame() {
    // Reset game state
    gameState.player = new Player();
    gameState.obstacles = [];
    gameState.coins = [];
    gameState.score = 0;
    gameState.distance = 0;
    gameState.speed = OBSTACLE_SPEED_INITIAL;
    gameState.spawnRate = OBSTACLE_SPAWN_INITIAL;
    gameState.lastSpawn = 0;
    gameState.gamePhase = "START";
    
    // Log reset
    p.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: {},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;