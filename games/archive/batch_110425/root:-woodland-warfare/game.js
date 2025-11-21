// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState } from './globals.js';
import { createMapLayout } from './clearing.js';
import { createFactions, executeAITurn, MarquiseFaction } from './faction.js';
import { checkForCombat } from './combat.js';
import { renderStartScreen, renderGame, renderGameOver } from './rendering.js';
import { handleKeyPressed } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

export function initializeGame(p) {
  // Create map
  gameState.clearings = createMapLayout();
  
  // Create factions (player as Marquise)
  gameState.factions = createFactions("MARQUISE");
  gameState.player = gameState.factions[0];
  
  // Initial setup
  setupInitialPositions();
  
  // Add initial units
  gameState.clearings[0].addUnit("MARQUISE", 5);
  gameState.clearings[4].addUnit("MARQUISE", 3);
  gameState.clearings[7].addUnit("ALLIANCE", 3);
  gameState.clearings[10].addUnit("EYRIE", 4);
  
  // Set current faction
  gameState.currentFactionIndex = 0;
  gameState.turnPhase = "MOVE";
}

function setupInitialPositions() {
  // Give Marquise starting buildings
  const marquiseFaction = gameState.factions[0];
  if (marquiseFaction instanceof MarquiseFaction) {
    marquiseFaction.wood = 3;
  }
}

let gameInstance = new p5(p => {
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
    
    // Initialize game
    initializeGame(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { event: "INIT", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.frameCount % 5 === 0) { // Execute every 5 frames
        const action = get_automated_testing_action(gameState);
        if (action) {
          handleKeyPressed(p, String.fromCharCode(action), action);
        }
      }
    }
    
    // Update game time
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gameTime++;
      
      // Handle AI delays
      if (gameState.aiDelay > 0) {
        gameState.aiDelay--;
        if (gameState.aiDelay === 0) {
          const currentFaction = gameState.factions[gameState.currentFactionIndex];
          if (!currentFaction.isPlayer) {
            gameState.currentFactionIndex = (gameState.currentFactionIndex + 1) % gameState.factions.length;
          }
        }
      }
      
      // Resolve any pending combat
      if (gameState.combatQueue.length > 0 && p.frameCount % 60 === 0) {
        const combat = gameState.combatQueue.shift();
        combat.resolve(gameState.clearings);
      }
      
      // Check for new combat
      if (p.frameCount % 120 === 0) {
        const newCombats = checkForCombat(gameState.clearings);
        gameState.combatQueue.push(...newCombats);
      }
      
      // AI turns
      if (p.frameCount % 300 === 0) {
        for (let i = 1; i < gameState.factions.length; i++) {
          executeAITurn(gameState.factions[i], gameState.clearings);
        }
      }
      
      // Check victory every 60 frames
      if (p.frameCount % 60 === 0) {
        checkVictoryConditions(p);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || 
               gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOver(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOver(p, false);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
});

function checkVictoryConditions(p) {
  for (const faction of gameState.factions) {
    if (faction.hasWon()) {
      if (faction.isPlayer) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { event: "VICTORY", gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { event: "DEFEAT", gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
  }
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};