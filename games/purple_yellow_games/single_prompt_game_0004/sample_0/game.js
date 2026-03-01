// game.js - Main game loop and initialization
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES, 
  BATTLE_PHASES,
  gameState, 
  getGameState 
} from './globals.js';
import { Player } from './player.js';
import { createEnemyByIndex, ENEMY_ACTS } from './enemies.js';
import { AttackPatternManager } from './projectiles.js';
import { 
  drawBattleUI, 
  drawMenu, 
  drawSubMenu, 
  drawDialogue, 
  drawAttackBar,
  drawVictoryMessage 
} from './battle_ui.js';
import {
  drawStartScreen,
  drawPausedIndicator,
  drawGameOver,
  drawScore
} from './screens.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game objects
  let keys = {};
  let attackManager;
  let lastSubMenuType = null;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game objects
    attackManager = new AttackPatternManager();
    
    // Log initial state
    logGameInfo("Game initialized");
  };
  
  p.draw = function() {
    p.background(0);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      handleAutomatedAction(action);
    }
    
    // Update dodge cooldown
    if (gameState.dodgeCooldown > 0) {
      gameState.dodgeCooldown--;
    }
    
    // Decrease damage flash
    if (gameState.damageFlash > 0) {
      gameState.damageFlash--;
    }
    
    // Game phase rendering
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        updateGame();
        drawGame();
        break;
        
      case GAME_PHASES.PAUSED:
        drawGame();
        drawPausedIndicator(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
        drawGameOver(p, true);
        break;
        
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOver(p, false);
        break;
    }
  };
  
  function updateGame() {
    switch (gameState.battlePhase) {
      case BATTLE_PHASES.MENU:
        // Waiting for player input
        break;
        
      case BATTLE_PHASES.ATTACK_INPUT:
        // Update attack timing bar
        gameState.attackTiming += 2;
        if (gameState.attackTiming > 100) {
          gameState.attackTiming = 0;
        }
        break;
        
      case BATTLE_PHASES.ENEMY_TURN:
        // Update attack pattern
        if (gameState.player && gameState.currentEnemy) {
          const dodgeActivated = gameState.player.update(p, keys, gameState.dodgeCooldown);
          if (dodgeActivated) {
            gameState.dodgeCooldown = 60; // 1 second cooldown
          }
          
          const finished = attackManager.update(p);
          
          // Check collisions
          if (attackManager.checkCollisions(gameState.player, p)) {
            takeDamage(2);
          }
          
          // Log player position periodically
          if (p.frameCount % 10 === 0) {
            logPlayerInfo();
          }
          
          if (finished) {
            endEnemyTurn();
          }
        }
        break;
        
      case BATTLE_PHASES.DIALOGUE:
        // Waiting for Z press to continue
        break;
        
      case BATTLE_PHASES.VICTORY:
        // Waiting for Z press to continue
        break;
    }
  }
  
  function drawGame() {
    drawScore(p);
    drawBattleUI(p);
    
    switch (gameState.battlePhase) {
      case BATTLE_PHASES.MENU:
        drawMenu(p);
        if (gameState.inSubMenu) {
          drawSubMenu(p, lastSubMenuType);
        }
        break;
        
      case BATTLE_PHASES.ATTACK_INPUT:
        drawAttackBar(p, gameState.attackTiming);
        break;
        
      case BATTLE_PHASES.ENEMY_TURN:
        if (gameState.player) {
          gameState.player.draw(p, gameState.damageFlash);
        }
        attackManager.draw(p);
        break;
        
      case BATTLE_PHASES.DIALOGUE:
        if (gameState.currentDialogue) {
          drawDialogue(p, gameState.currentDialogue);
        }
        break;
        
      case BATTLE_PHASES.VICTORY:
        drawVictoryMessage(p, gameState.currentDialogue);
        break;
    }
  }
  
  function handleAutomatedAction(action) {
    if (!action) return;
    
    // Simulate key press
    if (action.keyCode) {
      keys[action.keyCode] = action.pressed;
      
      if (action.pressed) {
        handleKeyPress(action.keyCode, action.key);
      }
    }
  }
  
  p.keyPressed = function() {
    keys[p.keyCode] = true;
    
    logInput("keyPressed", p.key, p.keyCode);
    
    // Global controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame();
      }
      return;
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo("Game paused");
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo("Game resumed");
      }
      return;
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame();
      }
      return;
    }
    
    // Game controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleKeyPress(p.keyCode, p.key);
    }
  };
  
  function handleKeyPress(keyCode, key) {
    switch (gameState.battlePhase) {
      case BATTLE_PHASES.MENU:
        handleMenuInput(keyCode);
        break;
        
      case BATTLE_PHASES.ATTACK_INPUT:
        if (keyCode === 90) { // Z
          executeAttack();
        }
        break;
        
      case BATTLE_PHASES.DIALOGUE:
        if (keyCode === 90) { // Z
          if (gameState.dialogueQueue.length > 0) {
            gameState.currentDialogue = gameState.dialogueQueue.shift();
          } else {
            startEnemyTurn();
          }
        }
        break;
        
      case BATTLE_PHASES.VICTORY:
        if (keyCode === 90) { // Z
          nextEncounter();
        }
        break;
    }
  }
  
  function handleMenuInput(keyCode) {
    if (gameState.inSubMenu) {
      // Submenu navigation
      if (keyCode === 37) { // LEFT
        gameState.subMenuSelection = Math.max(0, gameState.subMenuSelection - 1);
      } else if (keyCode === 39) { // RIGHT
        const maxOptions = lastSubMenuType === "ACT" ? 
          (ENEMY_ACTS[gameState.currentEnemy.name]?.length || 0) + 1 : 2;
        gameState.subMenuSelection = Math.min(maxOptions - 1, gameState.subMenuSelection + 1);
      } else if (keyCode === 38) { // UP
        gameState.subMenuSelection = Math.max(0, gameState.subMenuSelection - 2);
      } else if (keyCode === 40) { // DOWN
        const maxOptions = lastSubMenuType === "ACT" ? 
          (ENEMY_ACTS[gameState.currentEnemy.name]?.length || 0) + 1 : 2;
        gameState.subMenuSelection = Math.min(maxOptions - 1, gameState.subMenuSelection + 2);
      } else if (keyCode === 90) { // Z - confirm
        executeSubMenuAction();
      }
    } else {
      // Main menu navigation
      if (keyCode === 37) { // LEFT
        gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
      } else if (keyCode === 39) { // RIGHT
        gameState.menuSelection = Math.min(3, gameState.menuSelection + 1);
      } else if (keyCode === 90) { // Z - confirm
        executeMenuAction();
      }
    }
  }
  
  function executeMenuAction() {
    const actions = ["FIGHT", "ACT", "ITEM", "SPARE"];
    const action = actions[gameState.menuSelection];
    
    switch (action) {
      case "FIGHT":
        gameState.battlePhase = BATTLE_PHASES.ATTACK_INPUT;
        gameState.attackTiming = 0;
        gameState.isAttacking = true;
        break;
        
      case "ACT":
        gameState.inSubMenu = true;
        gameState.subMenuSelection = 0;
        lastSubMenuType = "ACT";
        break;
        
      case "ITEM":
        gameState.inSubMenu = true;
        gameState.subMenuSelection = 0;
        lastSubMenuType = "ITEM";
        break;
        
      case "SPARE":
        if (gameState.currentEnemy && gameState.currentEnemy.canSpare) {
          spareEnemy();
        } else {
          showDialogue("The enemy isn't ready to be spared.");
          setTimeout(() => startEnemyTurn(), 1000);
        }
        break;
    }
  }
  
  function executeSubMenuAction() {
    gameState.inSubMenu = false;
    
    if (lastSubMenuType === "ACT") {
      const actOptions = ENEMY_ACTS[gameState.currentEnemy.name] || [];
      if (gameState.subMenuSelection < actOptions.length) {
        const result = gameState.currentEnemy.performAct(gameState.subMenuSelection);
        showDialogue(result);
        setTimeout(() => startEnemyTurn(), 1500);
      } else {
        // Check option
        showDialogue(gameState.currentEnemy.getCheckText());
        setTimeout(() => startEnemyTurn(), 2000);
      }
    } else if (lastSubMenuType === "ITEM") {
      if (gameState.subMenuSelection === 0) {
        // Bandage
        gameState.playerHP = Math.min(gameState.maxHP, gameState.playerHP + 10);
        showDialogue("You used a Bandage. Recovered 10 HP!");
      } else {
        // Monster Candy
        gameState.playerHP = Math.min(gameState.maxHP, gameState.playerHP + 5);
        showDialogue("You ate Monster Candy. Recovered 5 HP!");
      }
      setTimeout(() => startEnemyTurn(), 1500);
    }
  }
  
  function executeAttack() {
    gameState.battlePhase = BATTLE_PHASES.DIALOGUE;
    
    // Calculate damage based on timing
    const timing = gameState.attackTiming;
    let damage = 3;
    
    // Perfect hit zone (40-60)
    if (timing >= 40 && timing <= 60) {
      damage = 8;
      gameState.currentDialogue = "Perfect hit! Dealt 8 damage!";
    } else if (timing >= 30 && timing <= 70) {
      damage = 5;
      gameState.currentDialogue = "Good hit! Dealt 5 damage!";
    } else {
      gameState.currentDialogue = "Weak hit. Dealt 3 damage.";
    }
    
    gameState.currentEnemy.takeDamage(damage);
    
    if (gameState.currentEnemy.hp <= 0) {
      defeatEnemy();
    } else {
      setTimeout(() => startEnemyTurn(), 1500);
    }
  }
  
  function showDialogue(text) {
    gameState.battlePhase = BATTLE_PHASES.DIALOGUE;
    gameState.currentDialogue = text;
  }
  
  function startEnemyTurn() {
    if (!gameState.currentEnemy || gameState.currentEnemy.hp <= 0) return;
    
    gameState.battlePhase = BATTLE_PHASES.ENEMY_TURN;
    gameState.currentDialogue = "";
    
    // Initialize player position
    if (!gameState.player) {
      gameState.player = new Player(CANVAS_WIDTH / 2, 305);
    }
    
    // Start attack pattern
    attackManager.startPattern(gameState.currentEnemy.getAttackPattern(), p);
    
    logPlayerInfo();
  }
  
  function endEnemyTurn() {
    attackManager.clear();
    gameState.battlePhase = BATTLE_PHASES.MENU;
    gameState.menuSelection = 0;
  }
  
  function takeDamage(amount) {
    gameState.playerHP -= amount;
    gameState.damageFlash = 20;
    
    if (gameState.playerHP <= 0) {
      gameState.playerHP = 0;
      gameOverLose();
    }
  }
  
  function spareEnemy() {
    gameState.enemiesSpared++;
    gameState.score++; // Increment score for sparing
    gameState.currentDialogue = `You spared ${gameState.currentEnemy.name}!`;
    gameState.battlePhase = BATTLE_PHASES.VICTORY;
  }
  
  function defeatEnemy() {
    gameState.enemiesDefeated++;
    gameState.score++; // Increment score for defeating
    gameState.currentDialogue = `${gameState.currentEnemy.name} was defeated...`;
    gameState.battlePhase = BATTLE_PHASES.VICTORY;
  }
  
  function nextEncounter() {
    gameState.enemyIndex++;
    
    if (gameState.enemyIndex >= gameState.totalEnemies) {
      gameOverWin();
    } else {
      startEncounter();
    }
  }
  
  function startEncounter() {
    gameState.currentEnemy = createEnemyByIndex(gameState.enemyIndex);
    gameState.battlePhase = BATTLE_PHASES.MENU;
    gameState.menuSelection = 0;
    gameState.inSubMenu = false;
    gameState.player = null;
    attackManager.clear();
  }
  
  function startGame() {
    resetGameState();
    gameState.gamePhase = GAME_PHASES.PLAYING;
    startEncounter();
    logGameInfo("Game started");
  }
  
  function resetGameState() {
    gameState.player = null;
    gameState.entities = [];
    gameState.score = 0;
    gameState.enemyIndex = 0;
    gameState.enemiesDefeated = 0;
    gameState.enemiesSpared = 0;
    gameState.playerHP = gameState.maxHP;
    gameState.menuSelection = 0;
    gameState.subMenuSelection = 0;
    gameState.inSubMenu = false;
    gameState.dodgeCooldown = 0;
    gameState.attackTiming = 0;
    gameState.damageFlash = 0;
    gameState.currentDialogue = "";
    gameState.dialogueQueue = [];
  }
  
  function resetGame() {
    resetGameState();
    gameState.gamePhase = GAME_PHASES.START;
    logGameInfo("Game reset");
  }
  
  function gameOverWin() {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    logGameInfo("Game over - WIN");
  }
  
  function gameOverLose() {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    logGameInfo("Game over - LOSE");
  }
  
  p.keyReleased = function() {
    keys[p.keyCode] = false;
    logInput("keyReleased", p.key, p.keyCode);
  };
  
  // Logging functions
  function logGameInfo(data) {
    p.logs.game_info.push({
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logInput(inputType, key, keyCode) {
    p.logs.inputs.push({
      input_type: inputType,
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logPlayerInfo() {
    if (gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};