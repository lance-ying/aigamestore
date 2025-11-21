// game.js - Main game file

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES,
  LEVELS,
  loadHighScore,
  saveHighScore
} from './globals.js';

import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { TimingBar } from './timingBar.js';
import { 
  handlePlayerAttack, 
  handleSpecialAttack, 
  handleEnemyTurn, 
  checkLevelComplete,
  updateCombatMessages,
  drawCombatMessages
} from './combat.js';
import { TestController } from './testController.js';

const p5 = window.p5;

let testController = null;

const gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  let lastLoggedPhase = null;
  let enemyTurnTimer = 0;
  let enemyTurnDelay = 60;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    loadHighScore();
    
    logGameInfo({ event: "game_started", phase: gameState.gamePhase });
  };

  p.draw = function() {
    p.background(40, 80, 120);
    
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN' && testController) {
      const action = testController.getAction(p);
      if (action) {
        simulateKeyPress(action.keyCode, action.key);
      }
    }

    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen();
        break;
      case GAME_PHASES.PLAYING:
        updatePlaying();
        drawPlaying();
        break;
      case GAME_PHASES.PAUSED:
        drawPlaying();
        drawPauseOverlay();
        break;
      case GAME_PHASES.LEVEL_TRANSITION:
        drawLevelTransition();
        break;
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOver(false);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
        drawGameOver(true);
        break;
    }

    // Log phase changes
    if (gameState.gamePhase !== lastLoggedPhase) {
      logGameInfo({ event: "phase_change", phase: gameState.gamePhase });
      lastLoggedPhase = gameState.gamePhase;
    }

    // Log player position periodically
    if (gameState.player && p.frameCount % 30 === 0) {
      logPlayerInfo();
    }
  };

  function drawStartScreen() {
    p.push();
    
    // Title
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.strokeWeight(4);
    p.stroke(100, 50, 0);
    p.text("PIRATE TIMING CLASH", CANVAS_WIDTH / 2, 80);
    
    // Subtitle
    p.fill(200, 200, 255);
    p.noStroke();
    p.textSize(18);
    p.text("Master the timing to defeat your foes!", CANVAS_WIDTH / 2, 130);
    
    // Instructions box
    const boxY = 180;
    p.fill(30, 50, 70, 200);
    p.rect(80, boxY, CANVAS_WIDTH - 160, 140, 10);
    
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    const instructX = 100;
    let instructY = boxY + 15;
    p.text("HOW TO PLAY:", instructX, instructY);
    instructY += 25;
    p.textSize(12);
    p.text("• Press SPACE when the target enters colored zones", instructX, instructY);
    instructY += 20;
    p.text("• PERFECT (green) = Most damage & gauge fill", instructX, instructY);
    instructY += 20;
    p.text("• GREAT (yellow) = Good damage", instructX, instructY);
    instructY += 20;
    p.text("• GOOD (orange) = Basic damage", instructX, instructY);
    instructY += 20;
    p.text("• Press SHIFT for Special Attack when gauge is full", instructX, instructY);
    instructY += 20;
    p.text("• Defeat all enemies to progress through 5 levels!", instructX, instructY);
    
    // High score
    if (gameState.highScore > 0) {
      p.fill(255, 215, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 340);
    }
    
    // Start prompt
    p.fill(255, 255, 100);
    p.textSize(20);
    const flashAlpha = Math.abs(Math.sin(p.frameCount * 0.05)) * 255;
    p.fill(255, 255, 100, flashAlpha);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
    
    p.pop();
  }

  function drawPlaying() {
    p.push();
    
    // UI - Level and Score
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
    
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
    
    // Draw entities
    if (gameState.player) {
      gameState.player.draw();
    }
    
    gameState.enemies.forEach(enemy => {
      enemy.draw();
    });
    
    // Draw timing bar
    if (gameState.timingBar) {
      gameState.timingBar.draw();
    }
    
    // Draw combat messages
    drawCombatMessages(p);
    
    // Turn indicator
    const turnText = gameState.isPlayerTurn ? "YOUR TURN" : "ENEMY TURN";
    const turnColor = gameState.isPlayerTurn ? [100, 255, 100] : [255, 100, 100];
    p.fill(...turnColor);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.text(turnText, CANVAS_WIDTH / 2, 40);
    
    p.pop();
  }

  function drawPauseOverlay() {
    p.push();
    
    // Semi-transparent overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Paused text
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.strokeWeight(4);
    p.stroke(0);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.noStroke();
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    
    // Small PAUSED indicator in top right
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.fill(255, 255, 0);
    p.text("PAUSED", CANVAS_WIDTH - 10, 40);
    
    p.pop();
  }

  function drawLevelTransition() {
    p.push();
    
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.strokeWeight(3);
    p.stroke(100, 50, 0);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    if (gameState.currentLevel < LEVELS.length) {
      p.fill(200, 200, 255);
      p.noStroke();
      p.textSize(24);
      p.text(`NEXT: ${LEVELS[gameState.currentLevel].name}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      
      p.fill(100, 255, 100);
      p.textSize(20);
      p.text(`Bonus: +1000 points`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      
      p.fill(255, 255, 100);
      p.textSize(18);
      const flashAlpha = Math.abs(Math.sin(p.frameCount * 0.08)) * 255;
      p.fill(255, 255, 100, flashAlpha);
      p.text("PRESS SPACE TO CONTINUE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }
    
    p.pop();
  }

  function drawGameOver(isWin) {
    p.push();
    
    if (isWin) {
      // Victory screen
      p.fill(255, 215, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(48);
      p.strokeWeight(4);
      p.stroke(100, 50, 0);
      p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
      
      p.fill(200, 255, 200);
      p.noStroke();
      p.textSize(24);
      p.text("You defeated all enemies!", CANVAS_WIDTH / 2, 160);
    } else {
      // Defeat screen
      p.fill(255, 100, 100);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(48);
      p.strokeWeight(4);
      p.stroke(100, 0, 0);
      p.text("DEFEATED", CANVAS_WIDTH / 2, 100);
      
      p.fill(200, 200, 200);
      p.noStroke();
      p.textSize(20);
      p.text("Your journey ends here...", CANVAS_WIDTH / 2, 160);
    }
    
    // Final score
    p.fill(255, 255, 255);
    p.textSize(28);
    p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    
    // High score
    if (gameState.score >= gameState.highScore && gameState.highScore > 0) {
      p.fill(255, 215, 0);
      p.textSize(20);
      p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 260);
    } else if (gameState.highScore > 0) {
      p.fill(200, 200, 200);
      p.textSize(18);
      p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 260);
    }
    
    // Restart prompt
    p.fill(255, 255, 100);
    p.textSize(20);
    const flashAlpha = Math.abs(Math.sin(p.frameCount * 0.05)) * 255;
    p.fill(255, 255, 100, flashAlpha);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
    
    p.pop();
  }

  function updatePlaying() {
    // Update player
    if (gameState.player) {
      gameState.player.update();
    }
    
    // Update enemies
    gameState.enemies.forEach(enemy => {
      enemy.update();
    });
    
    // Update timing bar
    if (gameState.timingBar) {
      gameState.timingBar.update();
    }
    
    // Update combat messages
    updateCombatMessages();
    
    // Handle enemy turns
    if (!gameState.isPlayerTurn) {
      enemyTurnTimer++;
      
      if (enemyTurnTimer >= enemyTurnDelay) {
        enemyTurnTimer = 0;
        const allAttacked = handleEnemyTurn();
        
        if (allAttacked) {
          gameState.isPlayerTurn = true;
          gameState.currentEnemyTurnIndex = 0;
          
          // Check if level complete
          if (checkLevelComplete()) {
            if (gameState.currentLevel >= LEVELS.length) {
              // Game won!
              saveHighScore();
              gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
            } else {
              gameState.gamePhase = GAME_PHASES.LEVEL_TRANSITION;
            }
          } else {
            // Activate timing bar for next player turn
            if (gameState.timingBar) {
              gameState.timingBar.activate();
            }
          }
        }
      }
    }
  }

  function startGame() {
    gameState.currentLevel = 1;
    gameState.score = 0;
    startLevel(1);
    gameState.gamePhase = GAME_PHASES.PLAYING;
  }

  function startLevel(levelNum) {
    gameState.currentLevel = levelNum;
    const levelConfig = LEVELS[levelNum - 1];
    
    // Create player
    gameState.player = new Player(p);
    gameState.entities = [gameState.player];
    
    // Create enemies
    gameState.enemies = [];
    levelConfig.enemies.forEach((enemyData, index) => {
      const enemy = new Enemy(
        p,
        enemyData.type,
        enemyData.hp,
        enemyData.maxHp,
        enemyData.attack,
        index,
        levelConfig.enemies.length,
        enemyData.isBoss || false
      );
      gameState.enemies.push(enemy);
      gameState.entities.push(enemy);
    });
    
    // Create timing bar
    gameState.timingBar = new TimingBar(
      p,
      levelConfig.timingSpeed,
      levelConfig.perfectZoneWidth,
      levelConfig.greatZoneWidth,
      levelConfig.goodZoneWidth
    );
    
    gameState.isPlayerTurn = true;
    gameState.currentEnemyTurnIndex = 0;
    enemyTurnTimer = 0;
    
    // Activate timing bar
    gameState.timingBar.activate();
  }

  p.keyPressed = function() {
    logInput('keyPressed', p.key, p.keyCode);
    
    // ENTER - Start game
    if (p.keyCode === 13) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame();
      } else if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
        gameState.currentLevel++;
        startLevel(gameState.currentLevel);
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
    }
    
    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
    }
    
    // R - Restart
    if (p.keyCode === 82 || p.key === 'r' || p.key === 'R') {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.START;
      }
    }
    
    // SPACE - Timed attack
    if (p.keyCode === 32 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.isPlayerTurn && gameState.timingBar && gameState.timingBar.isActive) {
        const hitResult = gameState.timingBar.checkHit();
        if (hitResult) {
          gameState.player.performAttack();
          handlePlayerAttack(hitResult);
          gameState.timingBar.deactivate();
          
          // End player turn
          gameState.isPlayerTurn = false;
          enemyTurnTimer = 0;
        }
      }
    }
    
    // SHIFT - Special attack
    if (p.keyCode === 16 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.isPlayerTurn && gameState.player && 
          gameState.player.specialGauge >= gameState.player.specialMaxGauge) {
        gameState.player.useSpecial();
        handleSpecialAttack();
        
        if (gameState.timingBar) {
          gameState.timingBar.deactivate();
        }
        
        // End player turn
        gameState.isPlayerTurn = false;
        enemyTurnTimer = 0;
      }
    }
  };

  function simulateKeyPress(keyCode, key) {
    p.keyCode = keyCode;
    p.key = key;
    p.keyPressed();
  }

  function logInput(inputType, key, keyCode) {
    p.logs.inputs.push({
      input_type: inputType,
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logGameInfo(data) {
    p.logs.game_info.push({
      data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logPlayerInfo() {
    if (!gameState.player) return;
    
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
});

// Expose globally
window.gameInstance = gameInstance;

window.getGameState = function() {
  return gameState;
};

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
    testController = null;
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
    testController = new TestController('TEST_1');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
    testController = new TestController('TEST_2');
  }
};