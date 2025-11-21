import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { RECIPES } from './recipes.js';
import { ChopMinigame, MixMinigame, CookMinigame } from './minigames.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let spacePressed = false;
  let spaceWasPressed = false;
  let enterPressed = false;
  let rPressed = false;
  let escPressed = false;
  let lastEscPress = 0;
  
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  function logGameInfo(data) {
    p.logs.game_info.push({
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
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    gameState.player = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    gameState.entities = [gameState.player];
    
    initializeGame();
    
    logGameInfo({ phase: gameState.gamePhase, message: "Game initialized" });
  };
  
  function initializeGame() {
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.currentRecipeIndex = 0;
    gameState.currentStepIndex = 0;
    gameState.lives = 3;
    
    loadLevelRecipes();
  }
  
  function loadLevelRecipes() {
    const levelKey = `level${gameState.currentLevel}`;
    gameState.recipes = RECIPES[levelKey] || [];
    gameState.levelProgress.totalRecipes = gameState.recipes.length;
    gameState.levelProgress.recipesCompleted = 0;
  }
  
  function startMinigame() {
    const recipe = gameState.recipes[gameState.currentRecipeIndex];
    if (!recipe) return;
    
    const step = recipe.steps[gameState.currentStepIndex];
    if (!step) return;
    
    switch (step.type) {
      case "CHOP":
        gameState.currentMinigame = new ChopMinigame(p, step.ingredient, step.targetCuts, step.difficulty);
        break;
      case "MIX":
        gameState.currentMinigame = new MixMinigame(p, step.ingredient, step.targetRotations, step.difficulty);
        break;
      case "COOK":
        gameState.currentMinigame = new CookMinigame(p, step.ingredient, step.flipCount, step.difficulty);
        break;
    }
  }
  
  p.draw = function() {
    p.background(40, 40, 50);
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen();
        break;
      case GAME_PHASES.PLAYING:
        drawPlayingScreen();
        break;
      case GAME_PHASES.PAUSED:
        drawPlayingScreen();
        drawPauseOverlay();
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen();
        break;
    }
    
    spaceWasPressed = spacePressed;
  };
  
  function drawStartScreen() {
    p.push();
    p.fill(255, 220, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("Chef's Kitchen", CANVAS_WIDTH / 2, 100);
    p.textSize(32);
    p.text("Challenge", CANVAS_WIDTH / 2, 140);
    
    p.fill(255);
    p.textSize(18);
    p.text("Master the art of cooking through", CANVAS_WIDTH / 2, 200);
    p.text("precision mini-games!", CANVAS_WIDTH / 2, 225);
    
    p.textSize(16);
    p.text("CHOP ingredients with precise cuts", CANVAS_WIDTH / 2, 260);
    p.text("MIX batters with circular motions", CANVAS_WIDTH / 2, 280);
    p.text("COOK to perfection with perfect timing", CANVAS_WIDTH / 2, 300);
    
    p.textSize(14);
    p.fill(200, 200, 255);
    p.text("ARROW KEYS: Navigate menus", CANVAS_WIDTH / 2, 330);
    p.text("SPACE: Confirm / Timed actions", CANVAS_WIDTH / 2, 350);
    p.text("ESC: Pause game", CANVAS_WIDTH / 2, 370);
    
    p.fill(100, 255, 100);
    p.textSize(24);
    const flash = p.sin(p.frameCount * 0.1) * 0.5 + 0.5;
    p.fill(100 + flash * 155, 255, 100 + flash * 155);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 390);
    p.pop();
  }
  
  function drawPlayingScreen() {
    if (!gameState.currentMinigame) {
      startMinigame();
    }
    
    if (gameState.currentMinigame) {
      if (gameState.controlMode === "HUMAN") {
        gameState.currentMinigame.update(
          p.mouseIsPressed,
          p.mouseX,
          p.mouseY,
          p.pmouseX,
          p.pmouseY
        );
        
        if (gameState.currentMinigame.constructor.name === "CookMinigame") {
          gameState.currentMinigame.update(spacePressed && !spaceWasPressed);
        }
      }
      
      gameState.currentMinigame.draw();
      
      if (gameState.currentMinigame.isComplete) {
        handleMinigameComplete();
      }
      
      if (gameState.currentMinigame.isFailed) {
        handleMinigameFail();
      }
    }
    
    drawUI();
  }
  
  function handleMinigameComplete() {
    gameState.currentStepIndex++;
    
    const recipe = gameState.recipes[gameState.currentRecipeIndex];
    if (gameState.currentStepIndex >= recipe.steps.length) {
      handleRecipeComplete();
    } else {
      gameState.currentMinigame = null;
    }
  }
  
  function handleRecipeComplete() {
    gameState.score += 100;
    gameState.levelProgress.recipesCompleted++;
    gameState.currentRecipeIndex++;
    gameState.currentStepIndex = 0;
    gameState.currentMinigame = null;
    
    if (gameState.currentRecipeIndex >= gameState.recipes.length) {
      handleLevelComplete();
    }
  }
  
  function handleLevelComplete() {
    gameState.score += 500;
    
    if (gameState.currentLevel >= 5) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      logGameInfo({ phase: gameState.gamePhase, message: "Game won!" });
    } else {
      gameState.currentLevel++;
      gameState.currentRecipeIndex = 0;
      gameState.currentStepIndex = 0;
      loadLevelRecipes();
      gameState.currentMinigame = null;
    }
  }
  
  function handleMinigameFail() {
    gameState.lives--;
    
    if (gameState.lives <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      logGameInfo({ phase: gameState.gamePhase, message: "Game over - out of lives" });
    } else {
      gameState.currentStepIndex = 0;
      gameState.currentMinigame = null;
    }
  }
  
  function drawUI() {
    p.push();
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    p.text(`LEVEL: ${gameState.currentLevel}`, 20, 20);
    
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`SCORE: ${String(gameState.score).padStart(5, '0')}`, CANVAS_WIDTH - 20, 20);
    
    p.textAlign(p.LEFT, p.TOP);
    p.text(`LIVES: ${gameState.lives}`, 20, 45);
    
    const recipe = gameState.recipes[gameState.currentRecipeIndex];
    if (recipe) {
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(16);
      p.fill(255, 255, 200);
      p.text(`Recipe: ${recipe.name}`, CANVAS_WIDTH / 2, 20);
      p.text(`Step ${gameState.currentStepIndex + 1}/${recipe.steps.length}`, CANVAS_WIDTH / 2, 40);
    }
    p.pop();
  }
  
  function drawPauseOverlay() {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    p.textSize(20);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    p.pop();
    
    p.push();
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
  
  function drawGameOverScreen() {
    p.push();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      p.fill(100, 255, 100);
      p.textSize(48);
      p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 100);
      p.fill(255);
      p.textSize(24);
      p.text("You Mastered the Kitchen!", CANVAS_WIDTH / 2, 150);
    } else {
      p.fill(255, 100, 100);
      p.textSize(48);
      p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
      p.fill(255);
      p.textSize(24);
      p.text("Better luck next time!", CANVAS_WIDTH / 2, 150);
    }
    
    p.fill(255, 220, 100);
    p.textSize(32);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    
    p.fill(255);
    p.textSize(20);
    p.text(`Level Reached: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 270);
    
    p.fill(200, 200, 255);
    p.textSize(24);
    const flash = p.sin(p.frameCount * 0.1) * 0.5 + 0.5;
    p.fill(200 + flash * 55, 200 + flash * 55, 255);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
    p.pop();
  }
  
  p.keyPressed = function() {
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    if (p.keyCode === 32) {
      spacePressed = true;
    }
    
    if (p.keyCode === 13) {
      enterPressed = true;
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo({ phase: gameState.gamePhase, message: "Game started" });
      }
    }
    
    if (p.keyCode === 82) {
      rPressed = true;
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        initializeGame();
        gameState.gamePhase = GAME_PHASES.START;
        gameState.currentMinigame = null;
        logGameInfo({ phase: gameState.gamePhase, message: "Game restarted" });
      }
    }
    
    if (p.keyCode === 27) {
      const now = p.millis();
      if (now - lastEscPress > 300) {
        escPressed = true;
        lastEscPress = now;
        
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
          gameState.gamePhase = GAME_PHASES.PAUSED;
          logGameInfo({ phase: gameState.gamePhase, message: "Game paused" });
        } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
          gameState.gamePhase = GAME_PHASES.PLAYING;
          logGameInfo({ phase: gameState.gamePhase, message: "Game resumed" });
        }
      }
    }
    
    if (p.keyCode === 16 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      logGameInfo({ phase: gameState.gamePhase, message: "Game paused (SHIFT)" });
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    logInput("keyReleased", { key: p.key, keyCode: p.keyCode });
    
    if (p.keyCode === 32) {
      spacePressed = false;
    }
    
    return false;
  };
});

window.gameInstance = gameInstance;

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode + '_ModeBtn'}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};