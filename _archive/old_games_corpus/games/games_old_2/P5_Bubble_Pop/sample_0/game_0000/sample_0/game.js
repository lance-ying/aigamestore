// game.js - Main game file

import { 
  gameState, 
  getGameState,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  BUBBLE_RADIUS,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  BUBBLE_COLORS,
  LAUNCHER_X,
  LAUNCHER_Y,
  DANGER_LINE_Y
} from './globals.js';

import { levels, generateLevelLayout } from './levels.js';
import { Bubble, FallingBubble } from './bubble.js';
import { Launcher, Projectile, calculateGuideLine } from './launcher.js';
import { 
  checkProjectileCollision, 
  attachBubbleToGrid, 
  findMatches, 
  findDetachedBubbles 
} from './collision.js';
import { 
  activateBomb, 
  activateBeamShot, 
  renderBombEffect, 
  renderBeamEffect 
} from './powerups.js';
import { TestController } from './testing.js';
import { renderUI, renderStartScreen, renderGameOverScreen } from './ui.js';

// Expose getGameState to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}

const p5 = window.p5;

let gameInstance = new p5(p => {
  let launcher;
  let projectile = null;
  let testController = null;
  let effectAnimations = [];
  
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
    
    // Initialize game state
    launcher = new Launcher();
    gameState.player = launcher;
    
    initializeLevel(1);
    
    // Log initial state
    logGameInfo('Game initialized', p);
  };
  
  p.draw = function() {
    p.background(20, 30, 50);
    
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN' && testController) {
      const action = testController.getAction();
      if (action) {
        handleTestAction(action, p);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === 'START') {
      renderStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      updateGame(p);
      renderGame(p);
    } else if (gameState.gamePhase === 'PAUSED') {
      renderGame(p);
      renderUI(p);
    } else if (gameState.gamePhase.startsWith('GAME_OVER')) {
      renderGame(p);
      const win = gameState.gamePhase === 'GAME_OVER_WIN';
      renderGameOverScreen(p, win);
    }
  };
  
  function updateGame(p) {
    // Update projectile
    if (projectile) {
      projectile.update();
      
      // Check collision
      const collision = checkProjectileCollision(
        projectile, 
        gameState.activeBubbles,
        gameState.gridOffsetY
      );
      
      if (collision) {
        const attachedBubble = attachBubbleToGrid(
          projectile,
          collision,
          gameState.bubbleGrid,
          gameState.activeBubbles,
          gameState.gridOffsetY
        );
        
        if (attachedBubble) {
          // Check for matches
          const matches = findMatches(
            attachedBubble,
            gameState.bubbleGrid,
            gameState.activeBubbles
          );
          
          if (matches.length > 0) {
            // Pop matched bubbles
            for (const bubble of matches) {
              bubble.markedForPop = true;
              gameState.bubblesPopped++;
              gameState.score += 10;
              gameState.levelScore += 10;
            }
            
            gameState.consecutiveCombos++;
            
            // Award power-ups
            if (gameState.bubblesPopped >= 20) {
              gameState.bombPowerups++;
              gameState.bubblesPopped = 0;
            }
            
            if (gameState.consecutiveCombos >= 3) {
              gameState.beamPowerups++;
              gameState.consecutiveCombos = 0;
            }
            
            // Check for detached bubbles
            setTimeout(() => {
              const detached = findDetachedBubbles(
                gameState.bubbleGrid,
                gameState.activeBubbles
              );
              
              for (const bubble of detached) {
                const fallingBubble = new FallingBubble(
                  bubble.x,
                  bubble.y,
                  bubble.color,
                  bubble.type
                );
                gameState.fallingBubbles.push(fallingBubble);
                
                bubble.active = false;
                if (gameState.bubbleGrid[bubble.gridRow]) {
                  gameState.bubbleGrid[bubble.gridRow][bubble.gridCol] = null;
                }
                
                gameState.score += 50;
                gameState.levelScore += 50;
              }
            }, 100);
          } else {
            gameState.consecutiveCombos = 0;
          }
        }
        
        projectile = null;
        prepareNextShot();
      }
    }
    
    // Update active bubbles
    for (const bubble of gameState.activeBubbles) {
      bubble.update();
    }
    
    // Update falling bubbles
    for (let i = gameState.fallingBubbles.length - 1; i >= 0; i--) {
      const bubble = gameState.fallingBubbles[i];
      bubble.update();
      
      if (bubble.isOffScreen()) {
        gameState.fallingBubbles.splice(i, 1);
      }
    }
    
    // Update effect animations
    for (let i = effectAnimations.length - 1; i >= 0; i--) {
      effectAnimations[i].progress += 0.05;
      if (effectAnimations[i].progress >= 1) {
        effectAnimations.splice(i, 1);
      }
    }
    
    // Check win/lose conditions
    checkGameConditions();
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      logPlayerInfo(p);
    }
  }
  
  function renderGame(p) {
    // Render guide line
    if (!projectile && gameState.gamePhase === 'PLAYING') {
      const guidePoints = calculateGuideLine(
        launcher, 
        gameState.activeBubbles, 
        p,
        gameState.gridOffsetY
      );
      
      p.stroke(150, 200, 255, 100);
      p.strokeWeight(2);
      for (let i = 0; i < guidePoints.length - 1; i++) {
        if (i % 2 === 0) {
          p.line(
            guidePoints[i].x,
            guidePoints[i].y,
            guidePoints[i + 1].x,
            guidePoints[i + 1].y
          );
        }
      }
      p.noStroke();
    }
    
    // Render active bubbles
    for (const bubble of gameState.activeBubbles) {
      if (bubble.active) {
        bubble.render(p);
      }
    }
    
    // Render falling bubbles
    for (const bubble of gameState.fallingBubbles) {
      bubble.render(p);
    }
    
    // Render projectile
    if (projectile) {
      projectile.render(p);
    }
    
    // Render next bubble indicator
    if (gameState.nextBubbleColor) {
      p.fill(...gameState.nextBubbleColor);
      p.stroke(255);
      p.strokeWeight(2);
      p.ellipse(LAUNCHER_X + 40, LAUNCHER_Y, BUBBLE_RADIUS * 1.5);
      p.noStroke();
      
      p.fill(200);
      p.textSize(10);
      p.textAlign(p.CENTER, p.TOP);
      p.text('NEXT', LAUNCHER_X + 40, LAUNCHER_Y + 15);
    }
    
    // Render launcher
    launcher.render(p);
    
    // Render effect animations
    for (const effect of effectAnimations) {
      if (effect.type === 'bomb') {
        renderBombEffect(effect.x, effect.y, effect.progress, p);
      } else if (effect.type === 'beam') {
        renderBeamEffect(launcher, effect.progress, p);
      }
    }
    
    // Render UI
    renderUI(p);
  }
  
  function initializeLevel(levelNum) {
    gameState.currentLevel = levelNum;
    
    if (levelNum > levels.length) {
      levelNum = levels.length;
    }
    
    const levelData = levels[levelNum - 1];
    
    gameState.shotsRemaining = levelData.shots;
    gameState.maxShots = levelData.shots;
    gameState.levelScore = 0;
    gameState.bubblesPopped = 0;
    gameState.consecutiveCombos = 0;
    gameState.descending = levelData.descendRate > 0;
    gameState.descentCounter = 0;
    gameState.gridOffsetY = GRID_OFFSET_Y;
    
    // Generate level layout
    gameState.bubbleGrid = generateLevelLayout(levelData, p);
    gameState.activeBubbles = [];
    gameState.fallingBubbles = [];
    
    // Create bubble objects from grid
    for (let row = 0; row < gameState.bubbleGrid.length; row++) {
      for (let col = 0; col < gameState.bubbleGrid[row].length; col++) {
        if (gameState.bubbleGrid[row][col]) {
          const bubbleData = gameState.bubbleGrid[row][col];
          const bubble = new Bubble(
            GRID_OFFSET_X + col * BUBBLE_RADIUS * 2,
            gameState.gridOffsetY + row * BUBBLE_RADIUS * 2,
            bubbleData.color,
            bubbleData.type
          );
          bubble.gridRow = row;
          bubble.gridCol = col;
          bubble.attached = true;
          gameState.bubbleGrid[row][col] = bubble;
          gameState.activeBubbles.push(bubble);
        }
      }
    }
    
    // Set initial bubble colors
    gameState.currentBubbleColor = getRandomBubbleColor(levelData.colors);
    gameState.nextBubbleColor = getRandomBubbleColor(levelData.colors);
    
    projectile = null;
    effectAnimations = [];
  }
  
  function prepareNextShot() {
    gameState.shotsRemaining--;
    gameState.currentBubbleColor = gameState.nextBubbleColor;
    gameState.nextBubbleColor = getRandomBubbleColor(
      levels[gameState.currentLevel - 1].colors
    );
    
    // Handle descending ceiling
    if (gameState.descending) {
      gameState.descentCounter++;
      const levelData = levels[gameState.currentLevel - 1];
      
      if (gameState.descentCounter >= levelData.descendRate) {
        gameState.descentCounter = 0;
        gameState.gridOffsetY += BUBBLE_RADIUS;
        
        // Move all bubbles down
        for (const bubble of gameState.activeBubbles) {
          bubble.y += BUBBLE_RADIUS;
        }
      }
    }
  }
  
  function getRandomBubbleColor(numColors) {
    const availableColors = BUBBLE_COLORS.slice(0, numColors);
    return availableColors[Math.floor(p.random(availableColors.length))];
  }
  
  function checkGameConditions() {
    // Check if all bubbles cleared (win)
    let activeBubbleCount = 0;
    for (const bubble of gameState.activeBubbles) {
      if (bubble.active && !bubble.markedForPop) {
        activeBubbleCount++;
      }
    }
    
    if (activeBubbleCount === 0) {
      handleLevelWin();
      return;
    }
    
    // Check if bubbles crossed danger line (lose)
    for (const bubble of gameState.activeBubbles) {
      if (bubble.active && !bubble.markedForPop && bubble.y > DANGER_LINE_Y) {
        handleLevelLose();
        return;
      }
    }
    
    // Check if out of shots (lose)
    if (gameState.shotsRemaining <= 0 && !projectile) {
      handleLevelLose();
      return;
    }
  }
  
  function handleLevelWin() {
    // Calculate stars
    const shotsPct = gameState.shotsRemaining / gameState.maxShots;
    let stars = 0;
    if (shotsPct >= 0.75) stars = 3;
    else if (shotsPct >= 0.5) stars = 2;
    else if (shotsPct >= 0.25) stars = 1;
    
    gameState.starsEarned = stars;
    
    // Award bonuses
    gameState.score += 100; // Board clear bonus
    gameState.levelScore += 100;
    gameState.score += gameState.shotsRemaining * 20; // Unused shots
    gameState.levelScore += gameState.shotsRemaining * 20;
    
    // Star bonus
    if (stars === 3) {
      gameState.score += 500;
      gameState.levelScore += 500;
    } else if (stars === 2) {
      gameState.score += 250;
      gameState.levelScore += 250;
    } else if (stars === 1) {
      gameState.score += 100;
      gameState.levelScore += 100;
    }
    
    gameState.gamePhase = 'GAME_OVER_WIN';
    logGameInfo('Level won', p);
  }
  
  function handleLevelLose() {
    gameState.gamePhase = 'GAME_OVER_LOSE';
    logGameInfo('Level lost', p);
  }
  
  p.keyPressed = function() {
    logInput('keyPressed', p.key, p.keyCode, p);
    
    if (gameState.gamePhase === 'START') {
      if (p.keyCode === 13) { // ENTER
        gameState.gamePhase = 'PLAYING';
        logGameInfo('Game started', p);
      }
    } else if (gameState.gamePhase === 'PLAYING') {
      if (p.keyCode === 27) { // ESC
        gameState.gamePhase = 'PAUSED';
        logGameInfo('Game paused', p);
      } else if (p.keyCode === 37) { // LEFT
        launcher.rotate(-1);
        gameState.launcherAngle = launcher.angle;
      } else if (p.keyCode === 39) { // RIGHT
        launcher.rotate(1);
        gameState.launcherAngle = launcher.angle;
      } else if (p.keyCode === 32 && !projectile && gameState.shotsRemaining > 0) { // SPACE
        const pos = launcher.getFirePosition();
        const vel = launcher.getFireVelocity();
        projectile = new Projectile(pos.x, pos.y, gameState.currentBubbleColor, vel.vx, vel.vy);
      } else if (p.keyCode === 90 && gameState.bombPowerups > 0 && !projectile) { // Z - Bomb
        gameState.bombPowerups--;
        const targetBubble = findCenterBubble();
        if (targetBubble) {
          effectAnimations.push({ type: 'bomb', x: targetBubble.x, y: targetBubble.y, progress: 0 });
          const popped = activateBomb(targetBubble, gameState.bubbleGrid, gameState.activeBubbles);
          gameState.score += popped * 10;
          gameState.levelScore += popped * 10;
        }
        prepareNextShot();
      } else if (p.keyCode === 16 && gameState.beamPowerups > 0 && !projectile) { // SHIFT - Beam
        gameState.beamPowerups--;
        effectAnimations.push({ type: 'beam', progress: 0 });
        const popped = activateBeamShot(launcher, gameState.bubbleGrid, gameState.activeBubbles);
        gameState.score += popped * 10;
        gameState.levelScore += popped * 10;
        prepareNextShot();
      }
    } else if (gameState.gamePhase === 'PAUSED') {
      if (p.keyCode === 27) { // ESC
        gameState.gamePhase = 'PLAYING';
        logGameInfo('Game resumed', p);
      }
    } else if (gameState.gamePhase.startsWith('GAME_OVER')) {
      if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === 'GAME_OVER_WIN') {
          if (gameState.currentLevel < levels.length) {
            initializeLevel(gameState.currentLevel + 1);
            gameState.gamePhase = 'PLAYING';
            logGameInfo('Next level started', p);
          } else {
            // All levels complete, restart from level 1
            gameState.score = 0;
            initializeLevel(1);
            gameState.gamePhase = 'START';
            logGameInfo('All levels complete, returned to start', p);
          }
        } else {
          // Retry current level
          initializeLevel(gameState.currentLevel);
          gameState.gamePhase = 'PLAYING';
          logGameInfo('Level retried', p);
        }
      }
    }
    
    // R key - restart to menu
    if (p.keyCode === 82) { // R
      gameState.score = 0;
      initializeLevel(1);
      gameState.gamePhase = 'START';
      launcher = new Launcher();
      gameState.player = launcher;
      logGameInfo('Restarted to menu', p);
    }
    
    return false;
  };
  
  function findCenterBubble() {
    let centerBubble = null;
    let minDist = Infinity;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 3;
    
    for (const bubble of gameState.activeBubbles) {
      if (bubble.active && !bubble.markedForPop) {
        const dist = Math.sqrt(
          Math.pow(bubble.x - centerX, 2) + 
          Math.pow(bubble.y - centerY, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          centerBubble = bubble;
        }
      }
    }
    
    return centerBubble;
  }
  
  function handleTestAction(action, p) {
    if (action.type === 'keyPressed') {
      p.keyCode = action.key;
      p.key = String.fromCharCode(action.key);
      p.keyPressed();
    }
  }
  
  function logGameInfo(data, p) {
    p.logs.game_info.push({
      data: data,
      gamePhase: gameState.gamePhase,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logInput(inputType, key, keyCode, p) {
    p.logs.inputs.push({
      input_type: inputType,
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logPlayerInfo(p) {
    if (launcher) {
      p.logs.player_info.push({
        screen_x: launcher.x,
        screen_y: launcher.y,
        game_x: launcher.x,
        game_y: launcher.y,
        angle: launcher.angle,
        framecount: p.frameCount
      });
    }
  }
}, 'game-canvas');

// Expose game instance
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  if (mode === 'HUMAN') {
    testController = null;
  } else {
    testController = new TestController(mode);
  }
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export { gameInstance };