// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASE, COMBAT_STATE, BOOKS } from './globals.js';
import { initializeStarterDeck, drawCards, discardHand, playCard, endPlayerTurn, generateRewardCards, addCardToDeck } from './card_system.js';
import { generateEnemies, planEnemyIntents, executeEnemyTurn, startNewTurn } from './enemy_system.js';
import { renderStartScreen, renderBookSelection, renderCombat, renderRewards, renderPaused, renderGameOver } from './rendering.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game loop variables
  let enemyTurnTimer = 0;
  let transitionTimer = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initial state
    logGameInfo("Game initialized");
    
    // Initialize player
    gameState.player.x = CANVAS_WIDTH / 2;
    gameState.player.y = CANVAS_HEIGHT - 50;
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      handleAutomatedTesting();
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASE.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASE.BOOK_SELECT:
        renderBookSelection(p);
        break;
        
      case GAME_PHASE.PLAYING:
        renderCombat(p);
        
        // Handle enemy turn
        if (gameState.combatState === COMBAT_STATE.ENEMY_TURN) {
          enemyTurnTimer++;
          if (enemyTurnTimer > 60) {
            const result = executeEnemyTurn();
            
            if (result === "DEFEAT") {
              gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
              logGameInfo("Game Over - Defeat");
            } else {
              gameState.combatState = COMBAT_STATE.PLAYER_TURN;
              planEnemyIntents();
              startNewTurn();
            }
            
            enemyTurnTimer = 0;
          }
        }
        
        // Handle transitions
        if (gameState.combatState === COMBAT_STATE.TRANSITIONING) {
          transitionTimer++;
          if (transitionTimer > 30) {
            advanceFloor();
            transitionTimer = 0;
          }
        }
        
        // Log player info periodically
        if (p.frameCount % 60 === 0) {
          logPlayerInfo();
        }
        break;
        
      case GAME_PHASE.PAUSED:
        renderCombat(p);
        renderPaused(p);
        break;
        
      case GAME_PHASE.GAME_OVER_WIN:
        renderGameOver(p, true);
        break;
        
      case GAME_PHASE.GAME_OVER_LOSE:
        renderGameOver(p, false);
        break;
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase control keys
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASE.START) {
        gameState.gamePhase = GAME_PHASE.BOOK_SELECT;
        gameState.menuSelection = 0;
        logGameInfo("Entered book selection");
      }
      return;
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASE.PLAYING) {
        gameState.gamePhase = GAME_PHASE.PAUSED;
        logGameInfo("Game paused");
      } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
        gameState.gamePhase = GAME_PHASE.PLAYING;
        logGameInfo("Game resumed");
      }
      return;
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
        resetGame();
        logGameInfo("Game restarted");
      }
      return;
    }
    
    // Game-specific controls
    handleGameInput(p.keyCode);
  };
  
  function handleGameInput(keyCode) {
    if (gameState.gamePhase === GAME_PHASE.BOOK_SELECT) {
      if (keyCode === 37) { // LEFT
        gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
      } else if (keyCode === 39) { // RIGHT
        gameState.menuSelection = Math.min(BOOKS.length - 1, gameState.menuSelection + 1);
      } else if (keyCode === 32) { // SPACE
        selectBook(gameState.menuSelection);
      } else if (keyCode === 90) { // Z
        gameState.gamePhase = GAME_PHASE.START;
      }
    } else if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      if (gameState.combatState === COMBAT_STATE.PLAYER_TURN) {
        handleCombatInput(keyCode);
      } else if (gameState.combatState === COMBAT_STATE.REWARD) {
        handleRewardInput(keyCode);
      }
    }
  }
  
  function handleCombatInput(keyCode) {
    if (keyCode === 37) { // LEFT
      gameState.selectedCardIndex = Math.max(0, gameState.selectedCardIndex - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedCardIndex = Math.min(gameState.hand.length - 1, gameState.selectedCardIndex + 1);
    } else if (keyCode === 38) { // UP
      const aliveEnemies = gameState.enemies.filter(e => !e.isDead);
      if (aliveEnemies.length > 0) {
        do {
          gameState.selectedEnemyIndex = (gameState.selectedEnemyIndex - 1 + gameState.enemies.length) % gameState.enemies.length;
        } while (gameState.enemies[gameState.selectedEnemyIndex].isDead);
      }
    } else if (keyCode === 40) { // DOWN
      const aliveEnemies = gameState.enemies.filter(e => !e.isDead);
      if (aliveEnemies.length > 0) {
        do {
          gameState.selectedEnemyIndex = (gameState.selectedEnemyIndex + 1) % gameState.enemies.length;
        } while (gameState.enemies[gameState.selectedEnemyIndex].isDead);
      }
    } else if (keyCode === 32) { // SPACE - play card
      if (gameState.hand.length > 0 && gameState.selectedCardIndex >= 0) {
        const success = playCard(gameState.selectedCardIndex, gameState.selectedEnemyIndex);
        if (success) {
          gameState.selectedCardIndex = Math.min(gameState.selectedCardIndex, gameState.hand.length - 1);
          
          // Check if all enemies dead
          const allDead = gameState.enemies.every(e => e.isDead);
          if (allDead) {
            handleVictory();
          }
        }
      }
    } else if (keyCode === 90) { // Z - end turn
      const result = endPlayerTurn();
      if (result === "VICTORY") {
        handleVictory();
      } else {
        gameState.combatState = COMBAT_STATE.ENEMY_TURN;
        enemyTurnTimer = 0;
      }
    }
  }
  
  function handleRewardInput(keyCode) {
    if (keyCode === 37) { // LEFT
      gameState.selectedRewardIndex = Math.max(0, gameState.selectedRewardIndex - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedRewardIndex = Math.min(gameState.rewardCards.length - 1, gameState.selectedRewardIndex + 1);
    } else if (keyCode === 32) { // SPACE
      const selectedCard = gameState.rewardCards[gameState.selectedRewardIndex];
      addCardToDeck(selectedCard);
      gameState.combatState = COMBAT_STATE.TRANSITIONING;
      transitionTimer = 0;
    }
  }
  
  function selectBook(index) {
    gameState.currentBook = BOOKS[index].id;
    gameState.currentFloor = 1;
    
    // Initialize deck
    initializeStarterDeck();
    
    // Reset player stats
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.mana = gameState.player.maxMana;
    gameState.player.block = 0;
    
    // Start first combat
    startCombat();
    
    gameState.gamePhase = GAME_PHASE.PLAYING;
    logGameInfo(`Entered book ${gameState.currentBook}, floor ${gameState.currentFloor}`);
  }
  
  function startCombat() {
    generateEnemies(gameState.currentFloor);
    gameState.combatState = COMBAT_STATE.PLAYER_TURN;
    gameState.selectedCardIndex = 0;
    gameState.selectedEnemyIndex = 0;
    gameState.hand = [];
    gameState.discardPile = [];
    
    planEnemyIntents();
    startNewTurn();
  }
  
  function handleVictory() {
    gameState.score += 50 * gameState.currentFloor;
    generateRewardCards();
    gameState.combatState = COMBAT_STATE.REWARD;
    gameState.selectedRewardIndex = 0;
  }
  
  function advanceFloor() {
    gameState.currentFloor++;
    
    if (gameState.currentFloor > gameState.maxFloor) {
      // Book completed!
      gameState.booksCompleted.push(gameState.currentBook);
      gameState.resources += 100;
      gameState.score += 500;
      gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
      logGameInfo("Book completed - Victory!");
    } else {
      // Next floor
      startCombat();
      logGameInfo(`Advanced to floor ${gameState.currentFloor}`);
    }
  }
  
  function handleAutomatedTesting() {
    if (p.frameCount % 5 !== 0) return; // Throttle automated actions
    
    const action = get_automated_testing_action(gameState);
    if (action) {
      // Simulate key press
      p.keyCode = action.keyCode;
      p.key = action.key;
      p.keyPressed();
    }
  }
  
  function resetGame() {
    gameState.gamePhase = GAME_PHASE.START;
    gameState.currentBook = null;
    gameState.currentFloor = 1;
    gameState.player.health = gameState.player.maxHealth;
    gameState.deck = [];
    gameState.hand = [];
    gameState.discardPile = [];
    gameState.enemies = [];
    gameState.score = 0;
    gameState.menuSelection = 0;
  }
  
  function logGameInfo(data) {
    p.logs.game_info.push({
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logPlayerInfo() {
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

// Expose getGameState
window.getGameState = function() {
  return gameState;
};

// Control mode setter
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;