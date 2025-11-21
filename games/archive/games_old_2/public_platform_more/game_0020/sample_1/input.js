import { gameState, PHASE } from './globals.js';
import { loadLevel } from './levels.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE.START) {
      startGame(p);
    }
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE.PLAYING) {
      gameState.gamePhase = PHASE.PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE.PAUSED) {
      gameState.gamePhase = PHASE.PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (keyCode === 82) { // R
    restartGame(p);
    return;
  }

  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== PHASE.PLAYING) return;

  // Only allow programming when simulation is not running
  if (!gameState.simulation.running) {
    handleProgrammingInput(p, keyCode);
  }
}

function handleProgrammingInput(p, keyCode) {
  const prog = gameState.programming;
  const currentRobot = gameState.robots[prog.selectedRobot];

  if (!currentRobot) return;

  if (keyCode === 37) { // LEFT
    if (prog.isInMenu) {
      prog.selectedCommand = (prog.selectedCommand - 1 + prog.commandMenu.length) % prog.commandMenu.length;
    }
  } else if (keyCode === 39) { // RIGHT
    if (prog.isInMenu) {
      prog.selectedCommand = (prog.selectedCommand + 1) % prog.commandMenu.length;
    }
  } else if (keyCode === 38) { // UP
    prog.selectedRobot = (prog.selectedRobot - 1 + gameState.robots.length) % gameState.robots.length;
  } else if (keyCode === 40) { // DOWN
    prog.selectedRobot = (prog.selectedRobot + 1) % gameState.robots.length;
  } else if (keyCode === 32) { // SPACE
    const commandType = prog.commandMenu[prog.selectedCommand];
    currentRobot.addCommand(commandType);
  } else if (keyCode === 16) { // SHIFT
    currentRobot.removeLastCommand();
  } else if (keyCode === 90) { // Z - Execute simulation
    executeSimulation(p);
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE.PLAYING;
  gameState.score = 0;
  gameState.currentLevel = 0;
  loadLevel(0, gameState);
  
  p.logs.game_info.push({
    data: { phase: PHASE.PLAYING, level: 0 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = PHASE.START;
  gameState.score = 0;
  gameState.currentLevel = 0;
  gameState.robots = [];
  gameState.enemies = [];
  gameState.entities = [];
  gameState.simulation.running = false;
  
  p.logs.game_info.push({
    data: { phase: PHASE.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function executeSimulation(p) {
  gameState.simulation.running = true;
  gameState.simulation.timeElapsed = 0;
  
  // Reset all robots
  gameState.robots.forEach(robot => robot.reset());
  
  p.logs.game_info.push({
    data: { event: "simulation_start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  const action = window.get_automated_testing_action(gameState);
  if (action && action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode);
  }
}