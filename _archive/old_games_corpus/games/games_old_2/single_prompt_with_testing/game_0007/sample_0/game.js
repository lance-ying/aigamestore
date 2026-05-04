// game.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, KEY_CODES, gameState } from './globals.js';
import { Ball } from './ball.js';
import { Tool } from './tool.js';
import { LevelGenerator } from './levels.js';
import { renderStartScreen, renderPauseIndicator, renderGameOverScreen, renderUI, renderBox } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let levelGenerator;
  
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
    
    // Initialize level generator
    levelGenerator = new LevelGenerator();
    
    // Initialize game
    initializeGame();
    
    logGameInfo("Game initialized", { phase: gameState.gamePhase });
  };
  
  function initializeGame() {
    gameState.level = 1;
    gameState.score = 0;
    gameState.gamePhase = GAME_PHASES.START;
    gameState.appliedOperations = [];
    gameState.selectedToolIndex = 0;
    gameState.lastInputFrame = 0;
  }
  
  function startLevel(levelNum) {
    const level = levelGenerator.getLevel(levelNum);
    
    // Create current ball
    gameState.currentBall = new Ball(p, 150, gameState.ballY);
    
    // Create target ball
    gameState.targetBall = new Ball(p, 450, gameState.ballY);
    for (let op of level.solution) {
      gameState.targetBall.applyOperation(op);
    }
    
    // Create tools
    gameState.tools = [];
    const toolStartX = 100;
    const toolSpacing = 60;
    for (let i = 0; i < level.tools.length; i++) {
      const toolData = level.tools[i];
      const tool = new Tool(
        p,
        toolData.type,
        toolData.type,
        toolData.data,
        toolStartX + i * toolSpacing,
        gameState.toolPaletteY,
        45
      );
      gameState.tools.push(tool);
    }
    
    if (gameState.tools.length > 0) {
      gameState.tools[0].isSelected = true;
      gameState.selectedToolIndex = 0;
    }
    
    gameState.appliedOperations = [];
  }
  
  p.draw = function() {
    p.background(40, 50, 60);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && p.frameCount - gameState.lastInputFrame > gameState.inputCooldown) {
        handleAutomatedAction(action);
        gameState.lastInputFrame = p.frameCount;
      }
    }
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderPlaying();
        break;
        
      case GAME_PHASES.PAUSED:
        renderPlaying();
        renderPauseIndicator(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
        renderPlaying();
        renderGameOverScreen(p, true);
        break;
        
      case GAME_PHASES.GAME_OVER_LOSE:
        renderPlaying();
        renderGameOverScreen(p, false);
        break;
    }
  };
  
  function renderPlaying() {
    // UI
    renderUI(p);
    
    // Render boxes and labels
    renderBox(p, 150, gameState.ballY, "YOUR BALL");
    renderBox(p, 450, gameState.ballY, "TARGET");
    
    // Render balls
    if (gameState.currentBall) {
      gameState.currentBall.render();
    }
    if (gameState.targetBall) {
      gameState.targetBall.render();
    }
    
    // Tool palette background
    p.fill(50, 60, 70);
    p.stroke(80, 90, 100);
    p.strokeWeight(2);
    p.rect(10, gameState.toolPaletteY - 35, CANVAS_WIDTH - 20, 70, 10);
    
    p.fill(180, 190, 200);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text("TOOLS:", 20, gameState.toolPaletteY - 25);
    
    // Render tools
    for (let tool of gameState.tools) {
      tool.render();
    }
  }
  
  p.keyPressed = function() {
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Global controls
    if (p.keyCode === KEY_CODES.ENTER) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        startLevel(gameState.level);
        logGameInfo("Game started", { phase: gameState.gamePhase, level: gameState.level });
      } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        checkSubmission();
      }
      return;
    }
    
    if (p.keyCode === KEY_CODES.ESC) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo("Game paused", { phase: gameState.gamePhase });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo("Game resumed", { phase: gameState.gamePhase });
      }
      return;
    }
    
    if (p.keyCode === KEY_CODES.R) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        initializeGame();
        logGameInfo("Game restarted", { phase: gameState.gamePhase });
      }
      return;
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.frameCount - gameState.lastInputFrame < gameState.inputCooldown) {
        return;
      }
      
      if (p.keyCode === KEY_CODES.LEFT) {
        selectPreviousTool();
        gameState.lastInputFrame = p.frameCount;
      } else if (p.keyCode === KEY_CODES.RIGHT) {
        selectNextTool();
        gameState.lastInputFrame = p.frameCount;
      } else if (p.keyCode === KEY_CODES.SPACE) {
        applySelectedTool();
        gameState.lastInputFrame = p.frameCount;
      } else if (p.keyCode === KEY_CODES.Z) {
        resetBall();
        gameState.lastInputFrame = p.frameCount;
      }
    }
  };
  
  function handleAutomatedAction(action) {
    if (!action) return;
    
    if (action.left) {
      selectPreviousTool();
    } else if (action.right) {
      selectNextTool();
    } else if (action.space) {
      applySelectedTool();
    } else if (action.z) {
      resetBall();
    } else if (action.enter) {
      checkSubmission();
    }
  }
  
  function selectPreviousTool() {
    if (gameState.tools.length === 0) return;
    
    gameState.tools[gameState.selectedToolIndex].isSelected = false;
    gameState.selectedToolIndex = (gameState.selectedToolIndex - 1 + gameState.tools.length) % gameState.tools.length;
    gameState.tools[gameState.selectedToolIndex].isSelected = true;
  }
  
  function selectNextTool() {
    if (gameState.tools.length === 0) return;
    
    gameState.tools[gameState.selectedToolIndex].isSelected = false;
    gameState.selectedToolIndex = (gameState.selectedToolIndex + 1) % gameState.tools.length;
    gameState.tools[gameState.selectedToolIndex].isSelected = true;
  }
  
  function applySelectedTool() {
    if (gameState.tools.length === 0 || !gameState.currentBall) return;
    
    const tool = gameState.tools[gameState.selectedToolIndex];
    const operation = tool.getOperation();
    gameState.currentBall.applyOperation(operation);
    gameState.appliedOperations.push(operation);
    
    logPlayerInfo();
  }
  
  function resetBall() {
    if (!gameState.currentBall) return;
    
    gameState.currentBall.reset();
    gameState.appliedOperations = [];
    logPlayerInfo();
  }
  
  function checkSubmission() {
    if (!gameState.currentBall || !gameState.targetBall) return;
    
    if (gameState.currentBall.matches(gameState.targetBall)) {
      // Win!
      gameState.score += 100;
      gameState.level++;
      
      if (gameState.level > gameState.maxLevels) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        logGameInfo("All levels completed", { 
          phase: gameState.gamePhase, 
          finalLevel: gameState.level - 1,
          score: gameState.score 
        });
      } else {
        // Next level
        setTimeout(() => {
          startLevel(gameState.level);
        }, 100);
        logGameInfo("Level completed", { 
          phase: gameState.gamePhase, 
          level: gameState.level,
          score: gameState.score 
        });
      }
    }
  }
  
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
    if (!gameState.currentBall) return;
    
    p.logs.player_info.push({
      screen_x: gameState.currentBall.x,
      screen_y: gameState.currentBall.y,
      game_x: gameState.currentBall.x,
      game_y: gameState.currentBall.y,
      appliedOperations: gameState.appliedOperations.length,
      framecount: p.frameCount
    });
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const modes = ['HUMAN', 'TEST_1', 'TEST_2', 'TEST_3', 'TEST_4', 'TEST_5'];
  modes.forEach(m => {
    const btnId = m === 'HUMAN' ? 'humanModeBtn' : `${m.toLowerCase()}_ModeBtn`;
    const btn = document.getElementById(btnId);
    if (btn) {
      if (m === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
};

export default gameInstance;