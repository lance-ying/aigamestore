// game.js - Main game file
import { gameState, GAME_PHASE, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT, WEAPONS } from './globals.js';
import { Buddy } from './buddy.js';
import { handleKeyPressed, handleKeyReleased, handleGameplayInput } from './input.js';
import { drawStartScreen, drawPausedIndicator, drawGameOverScreen, drawHUD } from './ui.js';
import { drawWeaponUI, drawLaser, drawBlackHole } from './weapons.js';
import { createLevelEnvironment, updateEnvironment, applyEnvironmentForces, drawEnvironment } from './environment.js';
import { getTestingAction, executeTestAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let Matter;
  let Engine, World, Bodies, Body;
  let engine;
  let buddy;
  let obstacles = [];
  
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
    
    // Initialize Matter.js
    Matter = window.Matter;
    Engine = Matter.Engine;
    World = Matter.World;
    Bodies = Matter.Bodies;
    Body = Matter.Body;
    
    engine = Engine.create();
    engine.world.gravity.y = 1;
    
    // Create buddy
    buddy = new Buddy(p, Matter, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    World.add(engine.world, buddy.composite);
    gameState.player = buddy;
    gameState.entities.push(buddy);
    
    // Create environment
    obstacles = createLevelEnvironment(p, Matter, engine, gameState.currentLevel);
    
    // Initial game state log
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASE.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(40, 40, 60);
    
    if (gameState.gamePhase === GAME_PHASE.START) {
      drawStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      // Update physics
      Engine.update(engine, 1000 / 60);
      
      // Update timer
      const currentTime = Date.now();
      const deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
      gameState.lastFrameTime = currentTime;
      gameState.timeRemaining -= deltaTime;
      
      // Update environment
      updateEnvironment(p, Matter, obstacles, p.frameCount);
      applyEnvironmentForces(Matter, buddy, obstacles);
      
      // Update buddy
      buddy.update();
      
      // Update projectiles
      for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        proj.update(buddy);
        if (!proj.isActive()) {
          gameState.projectiles.splice(i, 1);
        }
      }
      
      // Update particles
      for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const particle = gameState.particles[i];
        particle.update();
        if (particle.isDead()) {
          gameState.particles.splice(i, 1);
        }
      }
      
      // Update combo timer
      if (gameState.comboTimer > 0) {
        gameState.comboTimer--;
        if (gameState.comboTimer === 0) {
          gameState.comboCount = 0;
        }
      }
      
      // Check win/lose conditions
      const currentLevelData = LEVELS[gameState.currentLevel - 1];
      
      if (gameState.score >= currentLevelData.targetScore) {
        // Level complete
        gameState.coins += Math.floor(gameState.score / 100);
        
        if (gameState.currentLevel < LEVELS.length) {
          // Next level
          gameState.currentLevel++;
          const nextLevelData = LEVELS[gameState.currentLevel - 1];
          gameState.timeRemaining = nextLevelData.timeLimit;
          gameState.targetScore = nextLevelData.targetScore;
          gameState.score = 0;
          
          // Unlock weapons for new levels
          if (gameState.currentLevel === 2) {
            WEAPONS[2].unlocked = true; // Grenade
          } else if (gameState.currentLevel === 3) {
            WEAPONS[3].unlocked = true; // Laser
          } else if (gameState.currentLevel === 4) {
            WEAPONS[4].unlocked = true; // Black Hole
          }
          
          // Reset environment
          World.clear(engine.world, false);
          Engine.clear(engine);
          
          buddy = new Buddy(p, Matter, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
          World.add(engine.world, buddy.composite);
          gameState.player = buddy;
          
          obstacles = createLevelEnvironment(p, Matter, engine, gameState.currentLevel);
          
          gameState.projectiles = [];
          gameState.particles = [];
          
          p.logs.game_info.push({
            data: { level: gameState.currentLevel },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Game won
          gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
          p.logs.game_info.push({
            data: { gamePhase: GAME_PHASE.GAME_OVER_WIN },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      if (gameState.timeRemaining <= 0) {
        // Time's up
        gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASE.GAME_OVER_LOSE },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Handle input
      if (gameState.controlMode === "HUMAN") {
        handleGameplayInput(p, Matter, buddy);
      } else {
        const action = getTestingAction(p, buddy);
        executeTestAction(p, Matter, buddy, action);
      }
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        const center = buddy.getCenter();
        p.logs.player_info.push({
          screen_x: center.x,
          screen_y: center.y,
          game_x: center.x,
          game_y: center.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Render
    drawEnvironment(p, obstacles);
    
    // Draw particles
    for (let particle of gameState.particles) {
      particle.draw();
    }
    
    // Draw projectiles
    for (let proj of gameState.projectiles) {
      proj.draw();
    }
    
    // Draw buddy
    if (buddy) {
      buddy.draw();
    }
    
    // Draw weapon effects
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      const weapon = WEAPONS[gameState.selectedWeaponIndex];
      
      if (weapon.name === "Laser" && p.keyIsDown(90) && weapon.unlocked) {
        const center = buddy.getCenter();
        drawLaser(p, center.x, center.y, p.mouseX, p.mouseY);
      }
      
      if (weapon.name === "Black Hole" && p.keyIsDown(90) && weapon.unlocked) {
        drawBlackHole(p, p.mouseX, p.mouseY);
      }
    }
    
    // Draw UI
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      drawHUD(p);
      drawWeaponUI(p);
    }
    
    if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      drawHUD(p);
      drawWeaponUI(p);
      drawPausedIndicator(p);
    }
    
    if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
      drawGameOverScreen(p, gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, Matter, buddy, p.key, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode switching
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' :
                    mode === 'TEST_1' ? 'test_1_ModeBtn' :
                    mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};