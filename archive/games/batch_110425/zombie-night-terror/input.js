// input.js - Input handling

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  MUTATION_BLOCKER,
  MUTATION_EXPLODER,
  MUTATION_JUMPER,
  MUTATION_RUNNER,
  MUTATION_TANK,
  MUTATION_COSTS
} from './globals.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Start game
  if (keyCode === 13 && gameState.gamePhase === PHASE_START) { // ENTER
    return { action: "START_GAME" };
  }
  
  // Restart
  if (keyCode === 82) { // R
    return { action: "RESTART" };
  }
  
  // Pause/Unpause
  if (keyCode === 27 && (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) { // ESC
    return { action: "TOGGLE_PAUSE" };
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === PHASE_PLAYING) {
    // Mutation selection
    if (keyCode === 49) { // 1
      return { action: "SELECT_MUTATION", mutation: MUTATION_BLOCKER };
    }
    if (keyCode === 50) { // 2
      return { action: "SELECT_MUTATION", mutation: MUTATION_EXPLODER };
    }
    if (keyCode === 51) { // 3
      return { action: "SELECT_MUTATION", mutation: MUTATION_JUMPER };
    }
    if (keyCode === 52) { // 4
      return { action: "SELECT_MUTATION", mutation: MUTATION_RUNNER };
    }
    if (keyCode === 53) { // 5
      return { action: "SELECT_MUTATION", mutation: MUTATION_TANK };
    }
    
    // Quick select blocker
    if (keyCode === 90) { // Z
      return { action: "SELECT_MUTATION", mutation: MUTATION_BLOCKER };
    }
    
    // Apply mutation
    if (keyCode === 32) { // SPACE
      return { action: "APPLY_MUTATION" };
    }
  }
  
  return null;
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Camera panning
  if (p.keyIsDown(37)) { // LEFT
    gameState.cameraX -= 5;
    gameState.cameraX = Math.max(0, gameState.cameraX);
  }
  if (p.keyIsDown(39)) { // RIGHT
    gameState.cameraX += 5;
    gameState.cameraX = Math.min(gameState.levelWidth - 600, gameState.cameraX);
  }
  
  // Time scale
  if (p.keyIsDown(16)) { // SHIFT
    gameState.timeScale = 2.0;
  } else {
    gameState.timeScale = 1.0;
  }
}

export function applyMutation(p) {
  const cost = MUTATION_COSTS[gameState.selectedMutation];
  
  if (gameState.mutationPoints < cost) {
    return false;
  }
  
  // Find nearest zombie to camera center
  const cameraCenterX = gameState.cameraX + 300;
  let nearestZombie = null;
  let minDistance = Infinity;
  
  for (let zombie of gameState.zombies) {
    if (!zombie.active || zombie.mutation) continue;
    
    const distance = Math.abs(zombie.x - cameraCenterX);
    if (distance < minDistance) {
      minDistance = distance;
      nearestZombie = zombie;
    }
  }
  
  if (nearestZombie && minDistance < 200) {
    nearestZombie.applyMutation(gameState.selectedMutation);
    gameState.mutationPoints -= cost;
    gameState.score += 10;
    
    p.logs.game_info.push({
      data: { event: "mutation_applied", type: gameState.selectedMutation },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return true;
  }
  
  return false;
}