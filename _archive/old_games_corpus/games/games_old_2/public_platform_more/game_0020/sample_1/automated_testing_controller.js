import { COMMAND_TYPES, PHASE, GRID_COLS, GRID_ROWS } from './globals.js';

let testState = {
  initialized: false,
  currentStep: 0,
  waitFrames: 0,
  levelsProgrammed: new Set()
};

function getTestWinAction(gameState) {
  // TEST_2: Win the game
  if (gameState.gamePhase !== PHASE.PLAYING) {
    return null;
  }

  // Wait for simulation to finish
  if (gameState.simulation.running) {
    return null;
  }

  const currentLevel = gameState.currentLevel;
  const levelKey = `level_${currentLevel}`;

  // If we already programmed this level, execute
  if (testState.levelsProgrammed.has(levelKey)) {
    testState.levelsProgrammed.delete(levelKey);
    return { keyCode: 90, key: 'z' }; // Execute
  }

  // Program the robots for this level
  const robot = gameState.robots[gameState.programming.selectedRobot];
  if (!robot) return null;

  // Level-specific strategies
  switch (currentLevel) {
    case 0: // Level 1: Basic movement - move right to exit
      return programLevel0(gameState, robot);
    case 1: // Level 2: Navigation
      return programLevel1(gameState, robot);
    case 2: // Level 3: First enemy
      return programLevel2(gameState, robot);
    case 3: // Level 4: Multiple enemies
      return programLevel3(gameState, robot);
    case 4: // Level 5: Two robots cooperation
      return programLevel4(gameState, robot);
    default:
      return null;
  }
}

function programLevel0(gameState, robot) {
  const levelKey = 'level_0';
  
  if (robot.commands.length < 12) {
    // Select MOVE_FORWARD and add it
    if (gameState.programming.selectedCommand !== 0) {
      return { keyCode: 37, key: 'ArrowLeft' }; // Navigate to MOVE_FORWARD
    }
    return { keyCode: 32, key: ' ' }; // Add command
  } else {
    testState.levelsProgrammed.add(levelKey);
    return { keyCode: 90, key: 'z' }; // Execute
  }
}

function programLevel1(gameState, robot) {
  const levelKey = 'level_1';
  const targetCommands = [
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.TURN_RIGHT,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.TURN_RIGHT,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD
  ];

  return addCommandSequence(gameState, robot, targetCommands, levelKey);
}

function programLevel2(gameState, robot) {
  const levelKey = 'level_2';
  const targetCommands = [
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.ATTACK,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD
  ];

  return addCommandSequence(gameState, robot, targetCommands, levelKey);
}

function programLevel3(gameState, robot) {
  const levelKey = 'level_3';
  const targetCommands = [
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.ATTACK,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.ATTACK,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.ATTACK,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.TURN_RIGHT,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD,
    COMMAND_TYPES.MOVE_FORWARD
  ];

  return addCommandSequence(gameState, robot, targetCommands, levelKey);
}

function programLevel4(gameState, robot) {
  const levelKey = 'level_4';
  const robotIndex = gameState.programming.selectedRobot;

  if (robotIndex === 0) {
    // First robot
    const targetCommands = [
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.ATTACK,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.TURN_RIGHT,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD
    ];

    if (robot.commands.length < targetCommands.length) {
      return addCommandToRobot(gameState, targetCommands[robot.commands.length]);
    } else {
      // Switch to second robot
      return { keyCode: 40, key: 'ArrowDown' };
    }
  } else {
    // Second robot
    const targetCommands = [
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.ATTACK,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.TURN_LEFT,
      COMMAND_TYPES.MOVE_FORWARD,
      COMMAND_TYPES.MOVE_FORWARD
    ];

    if (robot.commands.length < targetCommands.length) {
      return addCommandToRobot(gameState, targetCommands[robot.commands.length]);
    } else {
      testState.levelsProgrammed.add(levelKey);
      return { keyCode: 90, key: 'z' }; // Execute
    }
  }
}

function addCommandSequence(gameState, robot, targetCommands, levelKey) {
  if (robot.commands.length < targetCommands.length) {
    return addCommandToRobot(gameState, targetCommands[robot.commands.length]);
  } else {
    testState.levelsProgrammed.add(levelKey);
    return { keyCode: 90, key: 'z' }; // Execute
  }
}

function addCommandToRobot(gameState, commandType) {
  const commandIndex = Object.values(COMMAND_TYPES).indexOf(commandType);
  
  if (gameState.programming.selectedCommand !== commandIndex) {
    // Navigate to the command
    const diff = commandIndex - gameState.programming.selectedCommand;
    if (Math.abs(diff) === 1 || Math.abs(diff) === 4) {
      return diff > 0 ? { keyCode: 39, key: 'ArrowRight' } : { keyCode: 37, key: 'ArrowLeft' };
    } else {
      return diff > 0 ? { keyCode: 39, key: 'ArrowRight' } : { keyCode: 37, key: 'ArrowLeft' };
    }
  }
  
  return { keyCode: 32, key: ' ' }; // Add command
}

function getBasicTestAction(gameState) {
  // TEST_1: Basic functionality test
  if (gameState.gamePhase !== PHASE.PLAYING) {
    return null;
  }

  if (gameState.simulation.running) {
    return null;
  }

  const robot = gameState.robots[0];
  if (!robot) return null;

  // Add a few commands and test execution
  if (robot.commands.length < 3) {
    if (gameState.programming.selectedCommand !== 0) {
      return { keyCode: 37, key: 'ArrowLeft' };
    }
    return { keyCode: 32, key: ' ' };
  } else if (robot.commands.length === 3) {
    return { keyCode: 90, key: 'z' }; // Execute
  }

  return null;
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 37, key: 'ArrowLeft' },
    { keyCode: 39, key: 'ArrowRight' },
    { keyCode: 32, key: ' ' }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;