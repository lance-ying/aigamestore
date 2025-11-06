// game.js
import { gameState, GAME_PHASES, TURN_PHASES, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initGame, deployArmy, handleAttackSelection, handleFortifySelection, 
         endAttackPhase, endTurn, navigateTerritories, updateAI } from './gameLogic.js';
import { drawStartScreen, drawPausedOverlay, drawGameOver, drawUI, 
         drawCombatLog, drawInstructions } from './rendering.js';
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
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(40, 50, 70);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        handleAutomatedInput(action);
      }
    }
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        drawGame(p);
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
          updateAI(p);
        }
        break;
        
      case GAME_PHASES.PAUSED:
        drawGame(p);
        drawPausedOverlay(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
        drawGameOver(p, true);
        break;
        
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOver(p, false);
        break;
    }
  };

  function drawGame(p) {
    // Draw connections first
    for (const territory of gameState.territories) {
      territory.drawConnections(p, gameState.territories);
    }
    
    // Draw territories
    for (let i = 0; i < gameState.territories.length; i++) {
      const territory = gameState.territories[i];
      const isSelected = territory === gameState.selectedTerritory;
      const isHovered = i === gameState.navigationIndex;
      const isAttacking = territory === gameState.attackingTerritory;
      
      territory.draw(p, isSelected, isHovered, isAttacking);
    }
    
    // Draw UI
    drawUI(p);
    drawCombatLog(p);
    drawInstructions(p);
  }

  function handleAutomatedInput(action) {
    if (!action) return;
    
    // Simulate key press
    p.keyCode = action.keyCode;
    p.key = action.key;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: action.key, keyCode: action.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    handleKeyPress();
  }

  p.keyPressed = function() {
    // Log all inputs
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase transitions (reserved keys)
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        initGame(p);
        p.logs.game_info.push({
          data: { phase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        gameState.score = 0;
        p.logs.game_info.push({
          data: { phase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Only handle game controls in HUMAN mode during PLAYING phase
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleKeyPress();
    }
  };

  function handleKeyPress() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Skip if AI turn
    if (currentPlayer && currentPlayer.isAI) return;
    
    // Arrow key navigation
    if (p.keyCode === 37) { // LEFT
      navigateTerritories('left');
    } else if (p.keyCode === 39) { // RIGHT
      navigateTerritories('right');
    } else if (p.keyCode === 38) { // UP
      navigateTerritories('up');
    } else if (p.keyCode === 40) { // DOWN
      navigateTerritories('down');
    }
    
    // Space - confirm action
    else if (p.keyCode === 32) {
      switch (gameState.turnPhase) {
        case TURN_PHASES.DEPLOYMENT:
          deployArmy(p);
          break;
        case TURN_PHASES.ATTACK:
          handleAttackSelection(p);
          break;
        case TURN_PHASES.FORTIFY:
          handleFortifySelection(p);
          break;
      }
    }
    
    // Z - end phase
    else if (p.keyCode === 90) {
      switch (gameState.turnPhase) {
        case TURN_PHASES.DEPLOYMENT:
          if (gameState.reinforcementsToPlace === 0) {
            gameState.turnPhase = TURN_PHASES.ATTACK;
          }
          break;
        case TURN_PHASES.ATTACK:
          endAttackPhase();
          break;
        case TURN_PHASES.FORTIFY:
          endTurn();
          break;
      }
    }
    
    // Log player info
    if (gameState.player) {
      const humanTerritories = gameState.territories.filter(t => t.owner === gameState.player);
      if (humanTerritories.length > 0) {
        const firstTerritory = humanTerritories[0];
        p.logs.player_info.push({
          screen_x: firstTerritory.x,
          screen_y: firstTerritory.y,
          game_x: firstTerritory.x,
          game_y: firstTerritory.y,
          framecount: p.frameCount
        });
      }
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if ((mode === 'HUMAN' && btnId === 'humanModeBtn') ||
          (mode === 'TEST_1' && btnId === 'test_1_ModeBtn') ||
          (mode === 'TEST_2' && btnId === 'test_2_ModeBtn')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
};