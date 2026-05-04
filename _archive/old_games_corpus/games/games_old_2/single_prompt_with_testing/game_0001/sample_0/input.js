// input.js
import { gameState, GAME_PHASES, MUTATION_TYPES, MUTATION_COSTS, MUTATION_COOLDOWNS, CANVAS_WIDTH } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function setupInput(p) {
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame(p);
      }
      return;
    }

    if (p.keyCode === 82) { // R
      restartGame(p);
      return;
    }

    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }

    // Gameplay inputs (only in PLAYING phase)
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

    if (p.keyCode === 32) { // SPACE - select zombie
      selectZombieAtCursor();
    } else if (p.keyCode === 90) { // Z - cycle mutation
      cycleMutation();
    } else if (p.keyCode === 16) { // SHIFT - apply mutation
      applyMutation();
    }
  };
}

export function handleContinuousInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  if (gameState.controlMode === "HUMAN") {
    // Camera movement
    if (p.keyIsDown(37)) { // LEFT
      gameState.cameraX -= 5;
    }
    if (p.keyIsDown(39)) { // RIGHT
      gameState.cameraX += 5;
    }

    // Clamp camera
    gameState.cameraX = p.constrain(gameState.cameraX, 0, gameState.levelWidth - CANVAS_WIDTH);
  } else {
    // Automated testing
    const action = get_automated_testing_action(gameState);
    if (action) {
      processAutomatedAction(action, p);
    }
  }
}

function selectZombieAtCursor() {
  const cursorWorldX = gameState.selectorX + gameState.cameraX;
  
  let closestZombie = null;
  let closestDist = Infinity;

  for (const zombie of gameState.zombies) {
    const dist = Math.abs(zombie.x + zombie.width / 2 - cursorWorldX);
    if (dist < 30 && dist < closestDist) {
      closestDist = dist;
      closestZombie = zombie;
    }
  }

  if (closestZombie) {
    gameState.selectedZombie = closestZombie;
  } else {
    gameState.selectedZombie = null;
  }
}

function cycleMutation() {
  const mutations = [MUTATION_TYPES.OVERLORD, MUTATION_TYPES.EXPLODER, MUTATION_TYPES.RUNNER];
  const currentIndex = mutations.indexOf(gameState.selectedMutation);
  const nextIndex = (currentIndex + 1) % mutations.length;
  gameState.selectedMutation = mutations[nextIndex];
}

function applyMutation() {
  if (!gameState.selectedZombie) return;
  
  const mutation = gameState.selectedMutation;
  const cost = MUTATION_COSTS[mutation];
  const cooldown = gameState.mutationCooldowns[mutation];

  if (cooldown > 0) return; // Still on cooldown
  if (gameState.dnaPoints < cost) return; // Not enough DNA

  // Apply mutation
  gameState.selectedZombie.applyMutation(mutation);
  gameState.dnaPoints -= cost;
  gameState.mutationCooldowns[mutation] = MUTATION_COOLDOWNS[mutation];
}

function startGame(p) {
  const { initializeLevel } = require('./level.js');
  gameState.gamePhase = GAME_PHASES.PLAYING;
  initializeLevel(p);
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  const { initializeLevel } = require('./level.js');
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  initializeLevel(p);
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function processAutomatedAction(action, p) {
  if (action.cameraMove) {
    gameState.cameraX += action.cameraMove;
    gameState.cameraX = p.constrain(gameState.cameraX, 0, gameState.levelWidth - CANVAS_WIDTH);
  }

  if (action.selectZombie !== undefined) {
    if (action.selectZombie >= 0 && action.selectZombie < gameState.zombies.length) {
      gameState.selectedZombie = gameState.zombies[action.selectZombie];
    }
  }

  if (action.cycleMutation) {
    cycleMutation();
  }

  if (action.applyMutation) {
    applyMutation();
  }
}