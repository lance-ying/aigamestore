import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { Player } from './player.js';
import { InputHandler } from './input.js';
import { AIController } from './ai.js';
import { Spawner } from './spawner.js';
import { Renderer } from './renderer.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputHandler;
  let aiController;
  let spawner;
  let renderer;

  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game components
    gameState.player = new Player(p);
    gameState.entities.push(gameState.player);
    
    inputHandler = new InputHandler(p);
    aiController = new AIController(p);
    spawner = new Spawner(p);
    renderer = new Renderer(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame();
    }
    
    renderer.render();
  };

  function updateGame() {
    gameState.gameTime++;
    
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // AI control
    if (gameState.controlMode !== 'HUMAN') {
      const actions = aiController.update();
      aiController.executeActions(actions, inputHandler);
    }
    
    // Spawn entities
    spawner.update();
    
    // Update notes
    for (let i = gameState.notes.length - 1; i >= 0; i--) {
      const note = gameState.notes[i];
      note.update();
      if (!note.active) {
        gameState.notes.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(note);
        if (entityIndex > -1) {
          gameState.entities.splice(entityIndex, 1);
        }
      }
    }
    
    // Update elfins
    for (let i = gameState.elfins.length - 1; i >= 0; i--) {
      const elfin = gameState.elfins[i];
      elfin.update();
      if (!elfin.active) {
        gameState.elfins.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(elfin);
        if (entityIndex > -1) {
          gameState.entities.splice(entityIndex, 1);
        }
      }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      const particle = gameState.particles[i];
      particle.update();
      if (!particle.active) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update special ability
    if (gameState.specialActive) {
      gameState.specialDuration--;
      if (gameState.specialDuration <= 0) {
        gameState.specialActive = false;
        gameState.scoreMultiplier = Math.max(1.0, gameState.scoreMultiplier - 1.0);
      }
    }
    
    // Check win condition
    if (gameState.score >= gameState.winScore) {
      endGame(true);
    }
    
    // Check lose condition
    if (gameState.missedNotes >= gameState.maxMisses) {
      endGame(false);
    }
  }

  function endGame(win) {
    gameState.gamePhase = win ? GAME_PHASES.GAME_OVER_WIN : GAME_PHASES.GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase, 
        win: win,
        finalScore: gameState.score,
        maxCombo: gameState.maxCombo
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  p.keyPressed = function() {
    inputHandler.handleKeyPressed(p.key, p.keyCode);
    return false;
  };

  p.keyReleased = function() {
    inputHandler.handleKeyReleased(p.key, p.keyCode);
    return false;
  };
});

window.gameInstance = gameInstance;

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};