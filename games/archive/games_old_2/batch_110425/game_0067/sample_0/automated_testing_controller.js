// automated_testing_controller.js - Automated testing strategies
import { gameState, KEY_SPACE, KEY_Z, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SHIFT } from './globals.js';

let moveHistory = [];
let stuckCounter = 0;
let currentStrategy = null;

function getTestWinAction(gameState) {
  if (!gameState.player) return null;

  const player = gameState.player;
  gameState.framesSinceLastAction = (gameState.framesSinceLastAction || 0) + 1;

  // Strategy: Solve puzzles systematically
  
  // Step 1: Pick up available tools if not holding any
  if (!player.heldTool) {
    for (let tool of gameState.tools) {
      if (!tool.placed && !tool.held) {
        const dx = tool.x - player.x;
        const dy = tool.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 40) {
          return { keyCode: KEY_SPACE };
        } else if (dist < 200) {
          const targetAngle = Math.atan2(dy, dx);
          return navigateToAngle(player, targetAngle, dist);
        }
      }
    }
  }

  // Step 2: Place tool strategically
  if (player.heldTool) {
    // Find optimal placement location based on tool type
    let targetX, targetY;

    if (player.heldTool.type === 'JAMMER') {
      // Place jammer near turrets
      const turret = gameState.entities.find(e => e.type === 'TURRET' && !e.jammed);
      if (turret) {
        targetX = turret.x - 60;
        targetY = turret.y;
      }
    } else if (player.heldTool.type === 'CONNECTOR') {
      // Place connector to create energy link
      const receiver = gameState.entities.find(e => e.type === 'RECEIVER');
      if (receiver) {
        // Check if we need first or second connector
        const placedConnectors = gameState.tools.filter(t => t.type === 'CONNECTOR' && t.placed).length;
        if (placedConnectors === 0) {
          targetX = receiver.x - 100;
          targetY = receiver.y;
        } else {
          targetX = receiver.x - 50;
          targetY = receiver.y;
        }
      }
    }

    if (targetX && targetY) {
      const dx = targetX - player.x;
      const dy = targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 50) {
        return { keyCode: KEY_SPACE };
      } else {
        const targetAngle = Math.atan2(dy, dx);
        return navigateToAngle(player, targetAngle, dist);
      }
    }
  }

  // Step 3: Collect Sigil when gate is open
  const sigil = gameState.entities.find(e => e.type === 'SIGIL' && !e.collected);
  if (sigil) {
    const gate = gameState.entities.find(e => e.type === 'GATE');
    if (!gate || gate.open) {
      const dx = sigil.x - player.x;
      const dy = sigil.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 40) {
        return { keyCode: KEY_SPACE };
      } else {
        const targetAngle = Math.atan2(dy, dx);
        return navigateToAngle(player, targetAngle, dist);
      }
    }
  }

  // Default: explore
  return { keyCode: KEY_UP };
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;

  const player = gameState.player;

  // Simple test: move around and interact periodically
  if (Math.random() < 0.3) {
    return { keyCode: KEY_SPACE };
  }

  if (Math.random() < 0.1) {
    return { keyCode: KEY_Z };
  }

  const actions = [KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT];
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

function navigateToAngle(player, targetAngle, distance) {
  const angleDiff = normalizeAngle(targetAngle - player.angle);

  if (Math.abs(angleDiff) > 0.2) {
    return { keyCode: angleDiff > 0 ? KEY_RIGHT : KEY_LEFT };
  } else {
    return { keyCode: distance > 30 ? KEY_UP : KEY_SPACE };
  }
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: KEY_UP },
    { keyCode: KEY_DOWN },
    { keyCode: KEY_LEFT },
    { keyCode: KEY_RIGHT },
    { keyCode: KEY_SPACE }
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