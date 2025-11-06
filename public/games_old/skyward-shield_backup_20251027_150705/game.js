import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  gameState, 
  GAME_PHASES,
  KEYS,
  LEVEL_CONFIG
} from './globals.js';
import { Balloon } from './balloon.js';
import { Shield } from './shield.js';
import { ObstacleManager } from './obstacleManager.js';
import { UI } from './ui.js';
import { TestingController } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let balloon;
  let shield;
  let obstacleManager;
  let ui;
  let testingController;
  let keys = {};
  let obstacles = [];

  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize - shield positioned ABOVE balloon to intercept falling obstacles
    balloon = new Balloon(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    shield = new Shield(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200);
    obstacleManager = new ObstacleManager(p);
    ui = new UI(p);
    testingController = new TestingController();
    
    gameState.player = balloon;
    gameState.entities = [balloon, shield];
    
    // Load high scores
    const savedScores = localStorage.getItem('skywardShieldHighScores');
    if (savedScores) {
      gameState.highScores = JSON.parse(savedScores);
    }
    
    logGameInfo("Game initialized", { gamePhase: gameState.gamePhase });
  };

  p.draw = function() {
    // Handle testing mode
    if (gameState.controlMode !== 'HUMAN') {
      const testKeys = testingController.getAction(gameState.controlMode);
      Object.keys(testKeys).forEach(key => {
        keys[parseInt(key)] = testKeys[key];
      });
    }
    
    // Draw based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartPhase();
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      drawPlayingPhase();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPlayingPhase();
      ui.drawPausedOverlay();
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
      drawLevelTransitionPhase();
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverPhase();
    }
  };

  function drawStartPhase() {
    ui.drawStartScreen();
  }

  function drawPlayingPhase() {
    // Draw background with gradient
    drawBackground();
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      const config = LEVEL_CONFIG[gameState.currentLevel];
      
      // Update balloon
      balloon.update(config.balloonSpeed);
      
      // Update shield
      shield.update(keys);
      
      // Update scroll offset to keep balloon in view
      const targetScreenY = CANVAS_HEIGHT * 0.7;
      const currentScreenY = balloon.y + gameState.worldScrollOffset;
      if (currentScreenY < targetScreenY) {
        gameState.worldScrollOffset += (targetScreenY - currentScreenY) * 0.1;
      }
      
      // Update obstacles
      gameState.obstacles = obstacles;
      const result = obstacleManager.update(obstacles, balloon, shield, config.balloonSpeed);
      
      if (result === 'COLLISION') {
        transitionToGameOver(false);
        return;
      }
      
      // Check level completion
      const currentHeight = -balloon.y;
      if (currentHeight >= config.targetHeight) {
        completeLevel();
        return;
      }
      
      // Update distance score
      const newDistanceScore = Math.floor(currentHeight / 100) * 5;
      if (newDistanceScore > gameState.distanceScore) {
        gameState.score += (newDistanceScore - gameState.distanceScore);
        gameState.distanceScore = newDistanceScore;
      }
      
      // Log player info periodically
      if (p.frameCount % 30 === 0) {
        logPlayerInfo();
      }
    }
    
    // Draw game objects
    for (const obstacle of obstacles) {
      obstacle.draw(gameState.worldScrollOffset);
    }
    
    balloon.draw(gameState.worldScrollOffset);
    shield.draw();
    
    // Draw UI
    const config = LEVEL_CONFIG[gameState.currentLevel];
    ui.drawPlayingUI(gameState.score, gameState.currentLevel, config.targetHeight, -balloon.y);
  }

  function drawLevelTransitionPhase() {
    drawBackground();
    
    // Draw game objects (frozen)
    for (const obstacle of obstacles) {
      obstacle.draw(gameState.worldScrollOffset);
    }
    balloon.draw(gameState.worldScrollOffset);
    shield.draw();
    
    ui.drawLevelTransition();
    
    // Timer
    gameState.levelTransitionTimer++;
    if (gameState.levelTransitionTimer > 180) { // 3 seconds at 60fps
      if (gameState.currentLevel <= 4) {
        startLevel(gameState.currentLevel);
      } else {
        transitionToGameOver(true);
      }
    }
  }

  function drawGameOverPhase() {
    const won = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
    ui.drawGameOverScreen(won);
  }

  function drawBackground() {
    // Gradient background
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = y / CANVAS_HEIGHT;
      const c = p.lerpColor(p.color(135, 206, 235), p.color(220, 240, 255), inter);
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }
  }

  function completeLevel() {
    gameState.score += 50;
    gameState.currentLevel++;
    gameState.levelTransitionTimer = 0;
    gameState.gamePhase = GAME_PHASES.LEVEL_TRANSITION;
    logGameInfo("Level completed", { level: gameState.currentLevel - 1, score: gameState.score });
  }

  function startLevel(level) {
    obstacles = [];
    gameState.obstacles = obstacles;
    gameState.lastObstacleSpawn = p.frameCount;
    gameState.gamePhase = GAME_PHASES.PLAYING;
    logGameInfo("Level started", { level: level });
  }

  function transitionToGameOver(won) {
    gameState.gamePhase = won ? GAME_PHASES.GAME_OVER_WIN : GAME_PHASES.GAME_OVER_LOSE;
    
    // Update high scores
    gameState.highScores.push(gameState.score);
    gameState.highScores.sort((a, b) => b - a);
    gameState.highScores = gameState.highScores.slice(0, 10);
    localStorage.setItem('skywardShieldHighScores', JSON.stringify(gameState.highScores));
    
    logGameInfo("Game over", { won: won, score: gameState.score });
  }

  function resetGame() {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.worldScrollOffset = 0;
    gameState.distanceScore = 0;
    gameState.comboCount = 0;
    gameState.lastClearedTime = 0;
    
    balloon = new Balloon(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    shield = new Shield(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 200);
    obstacles = [];
    gameState.obstacles = obstacles;
    
    gameState.player = balloon;
    gameState.entities = [balloon, shield];
    
    keys = {};
    
    logGameInfo("Game reset", { gamePhase: gameState.gamePhase });
  }

  p.keyPressed = function() {
    keys[p.keyCode] = true;
    
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Handle game phase transitions
    if (p.keyCode === KEYS.ENTER && gameState.gamePhase === GAME_PHASES.START) {
      startLevel(1);
    } else if ((p.keyCode === KEYS.ESC || p.keyCode === KEYS.SPACE) && 
               gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      logGameInfo("Game paused", { gamePhase: gameState.gamePhase });
    } else if ((p.keyCode === KEYS.ESC || p.keyCode === KEYS.SPACE) && 
               gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      logGameInfo("Game resumed", { gamePhase: gameState.gamePhase });
    } else if (p.keyCode === KEYS.R && 
               (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
      resetGame();
    }
    
    return false;
  };

  p.keyReleased = function() {
    keys[p.keyCode] = false;
    logInput("keyReleased", { key: p.key, keyCode: p.keyCode });
    return false;
  };

  function logGameInfo(message, data) {
    p.logs.game_info.push({
      message: message,
      data: data,
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

  function logPlayerInfo() {
    if (gameState.player) {
      p.logs.player_info.push({
        screen_x: balloon.x,
        screen_y: balloon.y + gameState.worldScrollOffset,
        game_x: balloon.x,
        game_y: balloon.y,
        framecount: p.frameCount
      });
    }
  }
});

// Expose game instance and functions globally
window.gameInstance = gameInstance;

window.getGameState = function() {
  return gameState;
};

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};

export { gameInstance };