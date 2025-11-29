// game_logic.js - Core game logic and state management

import { gameState, GAME_PHASES, CONFIG, PHYSICS, CANVAS_WIDTH } from './globals.js';
import { Player, Climber, Goat, createParticleBurst } from './entities.js';
import { getHighestPoint, checkWinCondition } from './physics.js';

// Initialize game
export function initGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentRound = 1;
  gameState.score = 0;
  gameState.climbers = [];
  gameState.entities = [];
  gameState.particles = [];
  gameState.eliminatedPlayers = [];
  gameState.player = null;
  gameState.goat = null;
  gameState.isGrabbing = false;
  gameState.grabbedLimb = null;
  gameState.roundComplete = false;
  
  // Create goat base
  gameState.goat = new Goat(CANVAS_WIDTH / 2, PHYSICS.GROUND_Y - 20);
  gameState.highestPoint = gameState.goat.getTopY();
}

// Start a new round
export function startRound() {
  // Clear particles
  gameState.particles = [];
  
  // Reset player
  if (gameState.player) {
    gameState.player = null;
  }
  
  // Create player
  const playerColor = [100, 200, 255];
  gameState.player = new Player(CANVAS_WIDTH / 2 - 100, PHYSICS.GROUND_Y - 100, playerColor);
  
  // Set target height (top of tower + threshold)
  gameState.targetHeight = getHighestPoint();
  
  // Reset timer
  gameState.roundTimer = CONFIG.ROUND_TIME * 60;
  gameState.roundComplete = false;
  gameState.eliminationTimer = 0;
  
  // Reset grab state
  gameState.isGrabbing = false;
  gameState.grabbedLimb = null;
}

// Advance to next round
export function advanceRound() {
  // Add current player to tower
  if (gameState.player) {
    // Convert player to regular climber
    const newClimber = new Climber(
      gameState.player.x,
      gameState.player.y,
      gameState.player.color,
      false
    );
    
    // Copy physics state
    newClimber.vx = gameState.player.vx;
    newClimber.vy = gameState.player.vy;
    newClimber.angle = gameState.player.angle;
    
    gameState.climbers.push(newClimber);
    
    // Create celebration particles
    createParticleBurst(newClimber.x, newClimber.y, [255, 255, 0], 20);
  }
  
  // Increment round
  gameState.currentRound++;
  gameState.score += 100;
  
  // Update highest point
  gameState.highestPoint = getHighestPoint();
  
  // Check if reached max rounds (win condition)
  if (gameState.currentRound > CONFIG.MAX_ROUNDS) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    return;
  }
  
  // Start next round
  startRound();
}

// Handle round failure
export function failRound() {
  gameState.eliminationTimer++;
  
  if (gameState.eliminationTimer > CONFIG.ELIMINATION_DELAY) {
    // Create failure particles
    if (gameState.player) {
      createParticleBurst(gameState.player.x, gameState.player.y, [255, 50, 50], 30);
    }
    
    // Game over - player eliminated
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
}

// Reset game to start
export function resetGame() {
  initGame();
}

// Update game logic
export function updateGameLogic() {
  // Update timer
  if (gameState.roundTimer > 0) {
    gameState.roundTimer--;
  }
  
  // Check win condition
  if (checkWinCondition() && !gameState.roundComplete) {
    gameState.roundComplete = true;
    // Small delay before advancing
    setTimeout(() => {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        advanceRound();
      }
    }, 500);
  }
  
  // Check time out
  if (gameState.roundTimer <= 0 && !gameState.roundComplete) {
    failRound();
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update();
    if (gameState.particles[i].isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Check if player fell off screen
  if (gameState.player && gameState.player.y > CANVAS_HEIGHT + 100) {
    if (!gameState.roundComplete) {
      gameState.roundTimer = 0; // Instant fail
    }
  }
}