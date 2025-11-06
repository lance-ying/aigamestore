// game.js - Main game file

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES,
  LEVELS,
  ABILITIES,
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
  drawCombatMessages,
  addCombatMessage
} from './combat.js';
import { TestController } from './testController.js';

const p5 = window.p5;

let testController = null;
let levelUpMessages = [];

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

    // Draw level up messages
    drawLevelUpMessages();

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
    p.text("Master timing & unlock powerful abilities!", CANVAS_WIDTH / 2, 130);
    
    // Instructions box
    const boxY = 170;
    p.fill(30, 50, 70, 200);
    p.rect(60, boxY, CANVAS_WIDTH - 120, 150, 10);
    
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    const instructX = 80;
    let instructY = boxY + 12;
    p.text("HOW TO PLAY:", instructX, instructY);
    instructY += 22;
    p.textSize(11);
    p.text("• Use number keys 1-4 to select abilities (unlock as you level up)", instructX, instructY);
    instructY += 18;
    p.text("• Press SPACE when target enters colored zones for timed attacks", instructX, instructY);
    instructY += 18;
    p.text("• PERFECT = Max damage, GREAT = Good, GOOD = Basic", instructX, instructY);
    instructY += 18;
    p.text("• Gain XP from combat to level up and unlock new abilities", instructX, instructY);
    instructY += 18;
    p.text("• Restore HP after completing each level", instructX, instructY);
    instructY += 18;
    p.text("• Press SHIFT for Special Attack when gauge is full", instructX, instructY);
    instructY += 18;
    p.text("• Defeat all enemies through 5 levels to win!", instructX, instructY);
    
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
    
    // Ability selection UI
    if (gameState.isPlayerTurn && gameState.player) {
      drawAbilityUI();
    }
    
    p.pop();
  }

  function drawAbilityUI() {
    const player = gameState.player;
    const p = this.p || p;
    
    p.push();
    
    const startX = CANVAS_WIDTH / 2 - 180;
    const y = 70;
    const boxWidth = 90;
    const boxHeight = 40;
    const spacing = 5;
    
    // Draw ability boxes
    let x = startX;
    for (const abilityKey in ABILITIES) {
      const ability = ABILITIES[abilityKey];
      const isUnlocked = player.unlockedAbilities.includes(ability);
      const isCurrent = player.currentAbility === ability;
      
      // Box background
      if (isCurrent) {
        p.fill(100, 200, 100, 200);
        p.stroke(150, 255, 150);
      } else if (isUnlocked) {
        p.fill(50, 50, 80, 180);
        p.stroke(100, 100, 150);
      } else {
        p.fill(40, 40, 40, 150);
        p.stroke(80, 80, 80);
      }
      
      p.strokeWeight(2);
      p.rect(x, y, boxWidth, boxHeight, 5);
      
      // Key indicator
      p.fill(255, 255, 255);
      p.noStroke();
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(12);
      p.text(ability.key, x + 5, y + 5);
      
      // Ability name
      if (isUnlocked) {
        p.textSize(9);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(ability.name.split(' ')[0], x + boxWidth / 2, y + boxHeight / 2 + 5);
      } else {
        p.textSize(8);
        p.fill(150, 150, 150);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`LV${ability.unlockLevel}`, x + boxWidth / 2, y + boxHeight / 2 + 5);
      }
      
      x += boxWidth + spacing;
    }
    
    // Current ability description
    if (player.currentAbility) {
      p.fill(255, 255, 255);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(10);
      p.text(player.currentAbility.description, CANVAS_WIDTH / 2, y + boxHeight + 8);
    }
    
    p.pop();
  }

  function drawLevelUpMessages() {
    const p = this.p || p;
    
    for (let i = levelUpMessages.length - 1; i >= 0; i--) {
      const msg = levelUpMessages[i];
      msg.timer--;
      
      if (msg.timer <= 0) {
        levelUpMessages.splice(i, 1);
        continue;
      }
      
      p.push();
      const alpha = Math.min(255, msg.timer * 3);
      const y = msg.y - (60 - msg.timer) * 0.8;
      
      // Background
      p.fill(255, 215, 0, alpha * 0.8);
      p.noStroke();
      p.rect(CANVAS_WIDTH / 2 - 100, y - 15, 200, 30, 5);
      
      // Text
      p.fill(0, 0, 0, alpha);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.strokeWeight(2);
      p.text(msg.text, CANVAS_WIDTH / 2, y);
      
      p.pop();
    }
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
    
    p.pop();
  }

  function drawLevelTransition() {
    p.push();
    
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.strokeWeight(3);
    p.stroke(100, 50, 0);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    if (gameState.currentLevel < LEVELS.length) {
      p.fill(200, 200, 255);
      p.noStroke();
      p.textSize(24);
      p.text(`NEXT: ${LEVELS[gameState.currentLevel].name}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      
      p.fill(100, 255, 100);
      p.textSize(18);
      p.text(`+40% HP Restored!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      
      p.fill(100, 200, 255);
      const levelConfig = LEVELS[gameState.currentLevel - 1];
      p.text(`+${levelConfig.xpReward} XP`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
      
      p.fill(255, 255, 100);
      p.text(`+1000 Score Bonus`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      
      p.textSize(18);
      const flashAlpha = Math.abs(Math.sin(p.frameCount * 0.08)) * 255;
      p.fill(255, 255, 100, flashAlpha);
      p.text("PRESS SPACE TO CONTINUE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
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
    
    // Final stats
    if (gameState.player) {
      p.fill(200, 220, 255);
      p.textSize(18);
      p.text(`Final Level: ${gameState.player.level}`, CANVAS_WIDTH / 2, 200);
    }
    
    // Final score
    p.fill(255, 255, 255);
    p.textSize(28);
    p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
    
    // High score
    if (gameState.score >= gameState.highScore && gameState.highScore > 0) {
      p.fill(255, 215, 0);
      p.textSize(20);
      p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 280);
    } else if (gameState.highScore > 0) {
      p.fill(200, 200, 200);
      p.textSize(18);
      p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 280);
    }
    
    // Restart prompt
    p.fill(255, 255, 100);
    p.textSize(20);
    const flashAlpha = Math.abs(Math.sin(p.frameCount * 0.05)) * 255;
    p.fill(255, 255, 100, flashAlpha);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
    
    p.pop();
  }

  function updatePlaying() {
    // Check for level ups
    if (gameState.player) {
      const oldLevel = gameState.player.level;
      gameState.player.update();
      
      // Detect level up
      if (gameState.player.level > oldLevel) {
        levelUpMessages.push({
          text: `LEVEL UP! Now Level ${gameState.player.level}`,
          y: CANVAS_HEIGHT / 2 - 50,
          timer: 90
        });
        
        // Check for new abilities
        const newAbilities = gameState.player.unlockedAbilities.filter(
          ability => ability.unlockLevel === gameState.player.level
        );
        
        if (newAbilities.length > 0) {
          newAbilities.forEach((ability, idx) => {
            levelUpMessages.push({
              text: `New Ability: ${ability.name}!`,
              y: CANVAS_HEIGHT / 2 - 10 + (idx * 30),
              timer: 90
            });
          });
        }
      }
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
            if (gameState.timingBar && gameState.player) {
              gameState.timingBar.activate(gameState.player.getCurrentAbility());
            }
          }
        }
      }
    }
  }

  function startGame() {
    gameState.currentLevel = 1;
    gameState.score = 0;
    levelUpMessages = [];
    startLevel(1);
    gameState.gamePhase = GAME_PHASES.PLAYING;
  }

  function startLevel(levelNum) {
    gameState.currentLevel = levelNum;
    const levelConfig = LEVELS[levelNum - 1];
    
    // Create or update player
    if (!gameState.player) {
      gameState.player = new Player(p);
    }
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
    
    // Activate timing bar with current ability
    if (gameState.player) {
      gameState.timingBar.activate(gameState.player.getCurrentAbility());
    }
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
        gameState.player = null;
      }
    }
    
    // Number keys - Select abilities
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.isPlayerTurn && gameState.player) {
      if (p.key === '1') {
        if (gameState.player.selectAbility('QUICK_STRIKE')) {
          gameState.timingBar.activate(gameState.player.getCurrentAbility());
        }
      } else if (p.key === '2') {
        if (gameState.player.selectAbility('POWER_SLASH')) {
          gameState.timingBar.activate(gameState.player.getCurrentAbility());
        }
      } else if (p.key === '3') {
        if (gameState.player.selectAbility('MULTI_STRIKE')) {
          gameState.timingBar.activate(gameState.player.getCurrentAbility());
        }
      } else if (p.key === '4') {
        if (gameState.player.selectAbility('HEALING_STRIKE')) {
          gameState.timingBar.activate(gameState.player.getCurrentAbility());
        }
      }
    }
    
    // SPACE - Timed attack
    if (p.keyCode === 32 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.isPlayerTurn && gameState.timingBar && gameState.timingBar.isActive) {
        const hitResult = gameState.timingBar.checkHit();
        if (hitResult) {
          const currentAbility = gameState.player.getCurrentAbility();
          gameState.player.performAttack();
          handlePlayerAttack(hitResult, currentAbility);
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