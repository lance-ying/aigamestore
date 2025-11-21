import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES } from './globals.js';
import { Board } from './board.js';
import { Player } from './player.js';
import { Spinner } from './spinner.js';
import { Minigame } from './minigame.js';
import { drawUI, drawPauseIndicator, drawDecisionUI } from './ui.js';
import { drawStartScreen, drawGameOverScreen } from './screens.js';
import { 
  spinSpinner, 
  updateSpinner, 
  updateMovement, 
  handleDecisionInput,
  updateMinigame,
  handleMinigameInput
} from './game_logic.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let board;
let spinner;
let currentMinigame = null;

function resetGame() {
  gameState.currentSpace = 0;
  gameState.money = 5000;
  gameState.lifePoints = 0;
  gameState.assets = 0;
  gameState.score = 0;
  gameState.careerLevel = 0;
  gameState.hasCollege = false;
  gameState.spacesVisited = [];
  
  gameState.spinnerValue = 0;
  gameState.isSpinning = false;
  gameState.spinnerAngle = 0;
  gameState.isMoving = false;
  gameState.targetSpace = 0;
  gameState.moveProgress = 0;
  gameState.awaitingDecision = false;
  gameState.decisionOptions = [];
  gameState.selectedOption = 0;
  gameState.inMinigame = false;
  gameState.minigameType = null;
  gameState.minigameComplete = false;
  
  currentMinigame = null;
  
  if (gameState.player && board) {
    const startPos = board.getPosition(0);
    gameState.player.setPosition(startPos.x, startPos.y);
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
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Create game objects
    board = new Board(gameState.totalSpaces);
    const startPos = board.getPosition(0);
    gameState.player = new Player(startPos.x, startPos.y);
    gameState.entities = [gameState.player];
    
    spinner = new Spinner(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 80);
  };
  
  p.draw = function() {
    p.background(30, 40, 60);
    
    // Handle different game phases
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        // Update game logic
        updateSpinner(spinner);
        updateMovement(gameState.player, board);
        
        // Handle minigame
        if (gameState.inMinigame && gameState.minigameType) {
          if (!currentMinigame) {
            currentMinigame = new Minigame(p, gameState.minigameType);
          }
          updateMinigame(p, currentMinigame);
        } else {
          currentMinigame = null;
        }
        
        // Draw game
        board.draw(p, gameState.currentSpace);
        gameState.player.draw(p);
        
        // Draw UI
        drawUI(p);
        
        if (!gameState.inMinigame && !gameState.awaitingDecision && !gameState.isMoving) {
          spinner.draw(p);
        }
        
        // Draw decision UI
        if (gameState.awaitingDecision) {
          drawDecisionUI(p, gameState.decisionOptions, gameState.selectedOption);
        }
        
        // Draw minigame
        if (gameState.inMinigame && currentMinigame) {
          currentMinigame.draw(p);
          
          if (gameState.minigameComplete) {
            p.push();
            p.fill(255, 215, 0);
            p.noStroke();
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(24);
            const reward = currentMinigame.getReward();
            p.text(`+$${reward}!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
            p.pop();
          }
        }
        
        // Handle automated testing
        if (gameState.controlMode !== "HUMAN") {
          const action = get_automated_testing_action(gameState);
          if (action && action.keyCode) {
            handleKeyPress(action.keyCode);
          }
        }
        
        // Log player info periodically
        if (p.frameCount % 30 === 0) {
          p.logs.player_info.push({
            screen_x: gameState.player.x,
            screen_y: gameState.player.y,
            game_x: gameState.currentSpace,
            game_y: 0,
            framecount: p.frameCount
          });
        }
        break;
        
      case GAME_PHASES.PAUSED:
        // Draw the game state (frozen)
        board.draw(p, gameState.currentSpace);
        gameState.player.draw(p);
        drawUI(p);
        
        if (!gameState.inMinigame && !gameState.awaitingDecision && !gameState.isMoving) {
          spinner.draw(p);
        }
        
        if (gameState.awaitingDecision) {
          drawDecisionUI(p, gameState.decisionOptions, gameState.selectedOption);
        }
        
        drawPauseIndicator(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };
  
  function handleKeyPress(keyCode) {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Global controls
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        resetGame();
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (keyCode === 82) { // R
      gameState.gamePhase = GAME_PHASES.START;
      resetGame();
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Gameplay controls (only during PLAYING phase)
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    // Handle minigame input
    if (gameState.inMinigame && currentMinigame) {
      if (handleMinigameInput(keyCode, currentMinigame)) {
        return;
      }
    }
    
    // Handle decision input
    if (handleDecisionInput(keyCode)) {
      return;
    }
    
    // Handle spinner
    if (keyCode === 32) { // SPACE
      spinSpinner(p, spinner);
    }
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPress(p.keyCode);
    }
  };
});

// Expose game instance and state globally
window.gameInstance = gameInstance;
window.getGameState = function() {
  return gameState;
};

// Control mode switching
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};