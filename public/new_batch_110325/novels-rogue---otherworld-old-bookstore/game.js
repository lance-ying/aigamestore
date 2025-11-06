// game.js - Main game file

import { gameState, GAME_PHASES, COMBAT_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Player, createEnemiesForFloor } from './entities.js';
import { createStarterDeck, getAllPossibleCards, startNewCombat, endTurn } from './card_system.js';
import { executeEnemyTurn, checkCombatEnd, updateAnimations } from './combat.js';
import { renderStartScreen, renderPlayingScreen, renderPauseOverlay, renderGameOverScreen } from './rendering.js';
import { handleKeyPressed } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPressed(p, null, action.keyCode);
      }
    }
    
    // Update animations
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateAnimations(p);
      
      // Handle animation timer
      if (gameState.combatPhase === COMBAT_PHASES.ANIMATING) {
        gameState.animationTimer--;
        if (gameState.animationTimer <= 0) {
          // Check if combat ended
          const result = checkCombatEnd();
          if (result === "WIN") {
            // Generate reward cards
            const allCards = getAllPossibleCards();
            gameState.rewardCards = [];
            for (let i = 0; i < 3; i++) {
              const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
              gameState.rewardCards.push(randomCard);
            }
            gameState.selectedRewardIndex = 0;
            gameState.combatPhase = COMBAT_PHASES.REWARD;
          } else if (result === "LOSE") {
            gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
            p.logs.game_info.push({
              data: { phase: "GAME_OVER_LOSE" },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          } else {
            // Continue to enemy turn
            gameState.combatPhase = COMBAT_PHASES.ENEMY_TURN;
            gameState.animationTimer = 60;
          }
        }
      } else if (gameState.combatPhase === COMBAT_PHASES.ENEMY_TURN) {
        gameState.animationTimer--;
        if (gameState.animationTimer <= 0) {
          executeEnemyTurn();
          endTurn();
          
          // Check if player died
          const result = checkCombatEnd();
          if (result === "LOSE") {
            gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
            p.logs.game_info.push({
              data: { phase: "GAME_OVER_LOSE" },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          } else {
            gameState.combatPhase = COMBAT_PHASES.SELECT_CARD;
            gameState.selectedCardIndex = 0;
          }
        }
      }
      
      // Log player info periodically
      if (p.frameCount % 10 === 0 && gameState.player) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          hp: gameState.player.hp,
          maxHp: gameState.player.maxHp,
          framecount: p.frameCount
        });
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      renderPlayingScreen(p);
      if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        renderPauseOverlay(p);
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPlayingScreen(p);
      renderPauseOverlay(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOverScreen(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p, false);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
});

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = getGameState;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.combatPhase = COMBAT_PHASES.SELECT_CARD;
  gameState.currentFloor = 1;
  gameState.score = 0;
  
  // Initialize player
  gameState.player = new Player();
  gameState.player.masterDeck = createStarterDeck();
  gameState.entities = [gameState.player];
  
  // Create enemies
  gameState.enemies = createEnemiesForFloor(1);
  gameState.enemies.forEach(e => {
    e.decideIntent();
    gameState.entities.push(e);
  });
  
  // Start combat
  startNewCombat();
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", floor: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.deck = [];
  gameState.hand = [];
  gameState.discardPile = [];
  gameState.animations = [];
  gameState.currentFloor = 1;
  
  p.logs.game_info.push({
    data: { phase: "START", message: "Game restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function advanceFloor(p) {
  gameState.currentFloor++;
  
  if (gameState.currentFloor > gameState.maxFloors) {
    // Win!
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Next floor
    gameState.combatPhase = COMBAT_PHASES.NEXT_FLOOR;
    gameState.animationTimer = 60;
    
    setTimeout(() => {
      // Heal player slightly
      gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + 10);
      
      // Create new enemies
      gameState.enemies = createEnemiesForFloor(gameState.currentFloor);
      gameState.enemies.forEach(e => {
        e.decideIntent();
      });
      
      // Start new combat
      startNewCombat();
      gameState.combatPhase = COMBAT_PHASES.SELECT_CARD;
      
      p.logs.game_info.push({
        data: { phase: "PLAYING", floor: gameState.currentFloor },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }, 1000);
  }
}

export default gameInstance;