import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING
} from './globals.js';
import { createBoard, createChanceCards, createCommunityChestCards } from './board.js';
import { createPlayers } from './player.js';
import { renderGame } from './render.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';
import { handleAITurn, getCurrentPlayer, moveCurrentPlayer, handleSpaceLanding } from './game_logic.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Store p5 instance in gameState for access in other modules
  gameState.p = p;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    renderGame(p);
    
    if (gameState.gamePhase === PHASE_PLAYING) {
      // Process automated testing
      if (gameState.controlMode !== "HUMAN") {
        if (p.frameCount % 15 === 0) { // Slow down automated actions
          processAutomatedInput(p);
        }
      }
      
      // Handle movement animation
      if (gameState.turnPhase === "MOVE" && gameState.animationProgress < 60) {
        gameState.animationProgress++;
        if (gameState.animationProgress >= 60) {
          moveCurrentPlayer();
          handleSpaceLanding(p);
        }
      }
      
      // AI turn handling
      const currentPlayer = getCurrentPlayer();
      if (currentPlayer && currentPlayer.isAI && gameState.controlMode === "HUMAN") {
        if (p.frameCount % 30 === 0) { // AI acts every 30 frames
          handleAITurn(p);
        }
      }
      
      // Hide dice after showing
      if (gameState.showingDice && p.frameCount % 120 === 0) {
        gameState.showingDice = false;
      }
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Setup control mode switching
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
  
  const activeBtn = mode === "HUMAN" ? 'humanModeBtn' : 
                    mode === "TEST_1" ? 'test_1_ModeBtn' :
                    mode === "TEST_2" ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};

export function setupGame(p) {
  // Create board
  gameState.board = createBoard();
  
  // Create card decks
  gameState.chanceCards = createChanceCards();
  gameState.communityChestCards = createCommunityChestCards();
  
  // Create players (1 human + 2 AI)
  gameState.players = createPlayers(3, 2);
  gameState.player = gameState.players[0]; // Human player
  gameState.entities = [...gameState.players];
  
  // Initialize game state
  gameState.currentPlayerIndex = 0;
  gameState.turnPhase = "ROLL";
  gameState.diceRolled = false;
  gameState.diceValues = [0, 0];
  gameState.messageQueue = [];
  gameState.turnCount = 0;
  gameState.doublesCount = 0;
  
  // Log player initial position
  const player = gameState.player;
  const pos = player.getScreenPosition();
  p.logs.player_info.push({
    screen_x: pos.x,
    screen_y: pos.y,
    game_x: player.position,
    game_y: 0,
    framecount: p.frameCount
  });
}