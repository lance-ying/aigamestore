// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, SLINGSHOT_X, SLINGSHOT_Y, BIRD_TYPES } from './globals.js';
import { Bird, Pig, Structure } from './entities.js';
import { checkCollisions } from './physics.js';
import { generateLevel } from './levels.js';
import { drawStartScreen, drawPausedIndicator, drawGameOverScreen, drawHUD, drawSlingshot, drawAimingLine, drawGround, drawSky } from './ui.js';
import { handleKeyPressed, processAutomatedAction, logPlayerInfo } from './input.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

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
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Create control mode buttons
    createControlButtons();
  };
  
  p.draw = function() {
    // Single background call
    p.background(135, 206, 235);
    
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      drawGameplay(p);
      updateGame(p);
      
      // Process automated testing actions
      if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        processAutomatedAction(p, action);
      }
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        logPlayerInfo(p);
      }
      
      // Track position for stalling detection
      if (gameState.launchedBird) {
        gameState.positionHistory.push({
          x: gameState.launchedBird.x,
          y: gameState.launchedBird.y
        });
        if (gameState.positionHistory.length > 300) {
          gameState.positionHistory.shift();
        }
      }
    } else if (gameState.gamePhase === "PAUSED") {
      drawGameplay(p);
      drawPausedIndicator(p);
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
      drawGameplay(p);
      drawGameOverScreen(p, gameState.gamePhase === "GAME_OVER_WIN");
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  function drawGameplay(p) {
    drawSky(p);
    drawGround(p);
    drawSlingshot(p);
    
    // Draw structures
    gameState.structures.forEach(s => s.draw());
    
    // Draw pigs
    gameState.pigs.forEach(pig => pig.draw());
    
    // Draw birds
    gameState.birds.forEach(bird => bird.draw());
    
    // Draw particles
    gameState.particles.forEach(particle => particle.draw());
    
    // Draw aiming line if not launched
    if (!gameState.launchedBird && gameState.birdsRemaining > 0) {
      drawAimingLine(p);
    }
    
    drawHUD(p);
  }
  
  function updateGame(p) {
    // Update all entities
    gameState.birds.forEach(bird => bird.update());
    gameState.pigs.forEach(pig => pig.update());
    gameState.structures.forEach(structure => structure.update());
    gameState.particles.forEach(particle => particle.update());
    
    // Check collisions
    checkCollisions(p);
    
    // Clean up inactive entities
    gameState.birds = gameState.birds.filter(b => b.active);
    gameState.pigs = gameState.pigs.filter(p => p.active);
    gameState.structures = gameState.structures.filter(s => s.active);
    gameState.particles = gameState.particles.filter(p => p.active);
    
    // Check if current bird is done
    if (gameState.launchedBird && !gameState.launchedBird.active) {
      gameState.launchedBird = null;
      gameState.abilityUsed = false;
      
      // Check win condition
      if (gameState.pigs.length === 0) {
        const gemsEarned = Math.floor(gameState.score / 10);
        gameState.gems += gemsEarned;
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, score: gameState.score, gemsEarned },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.birdsRemaining <= 0 && gameState.birds.length === 0) {
        // Check lose condition
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  function createControlButtons() {
    const buttonContainer = p.createDiv('');
    buttonContainer.position(10, CANVAS_HEIGHT + 10);
    buttonContainer.style('display', 'flex');
    buttonContainer.style('gap', '10px');
    
    const modes = ['HUMAN', 'TEST_1', 'TEST_2', 'TEST_3', 'TEST_4', 'TEST_5'];
    const buttons = {};
    
    modes.forEach(mode => {
      const btn = p.createButton(mode);
      btn.parent(buttonContainer);
      btn.id(mode === 'HUMAN' ? 'humanModeBtn' : `test_${mode.split('_')[1]}_ModeBtn`);
      btn.style('padding', '8px 16px');
      btn.style('cursor', 'pointer');
      btn.style('border', '2px solid #333');
      btn.style('background-color', mode === gameState.controlMode ? '#4CAF50' : '#ddd');
      btn.style('color', mode === gameState.controlMode ? 'white' : 'black');
      
      btn.mousePressed(() => {
        gameState.controlMode = mode;
        // Update all button styles
        Object.entries(buttons).forEach(([m, b]) => {
          b.style('background-color', m === mode ? '#4CAF50' : '#ddd');
          b.style('color', m === mode ? 'white' : 'black');
        });
      });
      
      buttons[mode] = btn;
    });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Additional async function for level initialization
async function initializeLevel(p) {
  const levelData = generateLevel(p, gameState.level);
  gameState.pigs = levelData.pigs;
  gameState.structures = levelData.structures;
}