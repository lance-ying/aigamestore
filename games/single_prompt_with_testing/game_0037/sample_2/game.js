// game.js - Main game loop and p5.js instance

import { gameState, initGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPress, handleKeyRelease, applyAutomatedInput } from './input.js';
import { Player } from './entities.js';
import { updateCamera, isOnScreen } from './physics.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver, 
         renderSpecialStage, renderBackground } from './ui.js';
import { generateLevel, generateSpecialStage } from './level.js';
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
    
    // Initialize game state
    initGameState();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Apply automated testing input if enabled
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        applyAutomatedInput(action);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        renderHUD(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
    
    // Render special stage if active
    if (gameState.specialStageActive) {
      renderSpecialStage(p);
      updateSpecialStage(p);
      renderSpecialStageRings(p);
    }
  };
  
  function updateGame(p) {
    // Increment game time
    if (gameState.gamePhase === "PLAYING") {
      gameState.gameTime++;
    }
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    // Update entities
    for (const entity of [...gameState.entities]) {
      if (entity.update && entity !== gameState.player) {
        entity.update(p);
      }
    }
    
    // Update rings
    for (const ring of [...gameState.rings]) {
      ring.update(p);
    }
    
    // Update scattered rings
    for (const ring of [...gameState.scatteredRings]) {
      ring.update();
    }
    
    // Update enemies
    for (const enemy of [...gameState.enemies]) {
      enemy.update();
    }
    
    // Update springs
    for (const spring of [...gameState.springs]) {
      spring.update();
    }
    
    // Update giant rings
    for (const giantRing of [...gameState.giantRings]) {
      giantRing.update();
    }
    
    // Update particles
    for (const particle of [...gameState.particles]) {
      particle.update();
    }
    
    // Update camera
    updateCamera();
    
    // Check level completion
    if (gameState.levelComplete) {
      gameState.completionTimer--;
      if (gameState.completionTimer <= 0) {
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_WIN" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  function renderGame(p) {
    // Background
    p.background(100, 150, 255);
    renderBackground(p);
    
    // Render platforms
    for (const platform of gameState.platforms) {
      if (isOnScreen(platform)) {
        platform.render(p);
      }
    }
    
    // Render loops
    for (const loop of gameState.loops) {
      loop.render(p);
    }
    
    // Render rings
    for (const ring of gameState.rings) {
      if (isOnScreen(ring)) {
        ring.render(p);
      }
    }
    
    // Render scattered rings
    for (const ring of gameState.scatteredRings) {
      ring.render(p);
    }
    
    // Render springs
    for (const spring of gameState.springs) {
      if (isOnScreen(spring)) {
        spring.render(p);
      }
    }
    
    // Render enemies
    for (const enemy of gameState.enemies) {
      if (isOnScreen(enemy)) {
        enemy.render(p);
      }
    }
    
    // Render giant rings
    for (const giantRing of gameState.giantRings) {
      giantRing.render(p);
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render particles
    for (const particle of gameState.particles) {
      particle.render(p);
    }
  }
  
  function updateSpecialStage(p) {
    // Update special stage rings
    for (const ring of [...gameState.specialStageRings]) {
      ring.update();
    }
    
    // Check completion
    if (gameState.specialStageComplete) {
      setTimeout(() => {
        gameState.specialStageActive = false;
        gameState.specialStageComplete = false;
      }, 120);
    }
  }
  
  function renderSpecialStageRings(p) {
    for (const ring of gameState.specialStageRings) {
      ring.render(p);
    }
  }
  
  p.keyPressed = function() {
    handleKeyPress(p);
    
    // Start game on ENTER
    if (p.keyCode === 13 && gameState.gamePhase === "START") {
      startGame(p);
    }
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
});

// Start game function
function startGame(p) {
  initGameState();
  generateLevel();
  
  // Create player
  new Player(100, 200);
  
  gameState.gamePhase = "PLAYING";
  gameState.gameTime = 0;
  
  p.logs.game_info.push({
    data: { gamePhase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Reset game function
export function resetGame(p) {
  initGameState();
  
  p.logs.game_info.push({
    data: { gamePhase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Expose game instance globally
window.gameInstance = gameInstance;