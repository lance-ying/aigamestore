// automated_testing_controller.js - Automated testing functions
import { gameState } from './globals.js';

let testState = {
  moveHistory: [],
  stuckCounter: 0,
  lastX: 0,
  lastY: 0,
  phaseStartFrame: 0,
  targetReached: false
};

function getTestWinAction(gs) {
  const player = gs.player;
  if (!player || !player.alive) return {};
  
  const exit = gs.entities.find(e => e.type === 'exit');
  if (!exit) return {};
  
  const actions = {};
  
  // Check if near exit
  if (Math.abs(player.x - exit.x) < 50 && Math.abs(player.y - exit.y) < 80) {
    actions.right = true;
    return actions;
  }
  
  // Find switches that need activation
  const switches = gs.interactables.filter(s => s.type === 'switch' && !s.activated);
  
  if (switches.length > 0) {
    const targetSwitch = switches[0];
    const dx = targetSwitch.x - player.x;
    const dy = targetSwitch.y - player.y;
    
    // Check if near switch
    if (Math.abs(dx) < 30 && Math.abs(dy) < 40) {
      actions.z = true;
      return actions;
    }
    
    // Navigate to switch
    if (Math.abs(dx) > 10) {
      if (dx > 0) actions.right = true;
      else actions.left = true;
      actions.shift = true;
    }
    
    // Jump if needed
    if (dy < -20 && player.onGround) {
      actions.up = true;
    }
    
    return actions;
  }
  
  // Check for boxes that might be needed
  const boxes = gs.interactables.filter(b => b.type === 'box');
  const doors = gs.interactables.filter(d => d.type === 'door' && d.isBlocking && d.isBlocking());
  
  // If door is blocking and we have a switch, work on that first
  if (doors.length > 0 && switches.length === 0) {
    // Door should be open, proceed
  }
  
  // Navigate toward exit
  const dx = exit.x - player.x;
  const dy = exit.y - player.y;
  
  if (Math.abs(dx) > 20) {
    if (dx > 0) actions.right = true;
    else actions.left = true;
    
    // Sprint when far away
    if (Math.abs(dx) > 100) actions.shift = true;
  }
  
  // Jump over obstacles
  const nearestObstacle = findNearestObstacleAhead(player, gs.obstacles, player.facing || 1);
  if (nearestObstacle && nearestObstacle.distance < 40 && player.onGround) {
    actions.up = true;
  }
  
  // Jump if need to go up
  if (dy < -30 && player.onGround && Math.abs(dx) < 100) {
    actions.up = true;
  }
  
  // Handle pits
  const nearestPit = findNearestHazard(player, gs.hazards.filter(h => h.type === 'pit'));
  if (nearestPit && nearestPit.distance < 60 && player.onGround) {
    actions.up = true;
    if (dx > 0) actions.right = true;
    else actions.left = true;
  }
  
  return actions;
}

function getBasicTestAction(gs) {
  const player = gs.player;
  if (!player || !player.alive) return {};
  
  const actions = {};
  const frame = gs.timeInLevel || 0;
  
  // Simple movement pattern
  if (frame % 120 < 60) {
    actions.right = true;
  } else {
    actions.left = true;
  }
  
  // Jump occasionally
  if (frame % 90 === 0 && player.onGround) {
    actions.up = true;
  }
  
  // Test sprint
  if (frame % 180 < 90) {
    actions.shift = true;
  }
  
  return actions;
}

function getObjectInteractionTest(gs) {
  const player = gs.player;
  if (!player || !player.alive) return {};
  
  const actions = {};
  
  // Find nearest box
  const boxes = gs.interactables.filter(b => b.type === 'box');
  if (boxes.length > 0) {
    const box = boxes[0];
    const dx = box.x - player.x;
    
    if (Math.abs(dx) < 40) {
      actions.space = true;
      if (dx > 0) actions.right = true;
      else actions.left = true;
    } else {
      if (dx > 0) actions.right = true;
      else actions.left = true;
    }
  }
  
  // Find switches
  const switches = gs.interactables.filter(s => s.type === 'switch' && !s.activated);
  if (switches.length > 0) {
    const sw = switches[0];
    const dx = sw.x - player.x;
    
    if (Math.abs(dx) < 30) {
      actions.z = true;
    } else {
      if (dx > 0) actions.right = true;
      else actions.left = true;
    }
  }
  
  if (player.onGround && Math.random() < 0.1) {
    actions.up = true;
  }
  
  return actions;
}

function getHazardAvoidanceTest(gs) {
  const player = gs.player;
  if (!player || !player.alive) return {};
  
  const actions = {};
  
  // Check for nearby hazards
  const nearbyHazards = gs.hazards.filter(h => {
    const dx = Math.abs(h.x - player.x);
    return dx < 100;
  });
  
  if (nearbyHazards.length > 0) {
    const hazard = nearbyHazards[0];
    const dx = hazard.x - player.x;
    
    // Jump over spikes
    if (hazard.type === 'spike' && Math.abs(dx) < 60) {
      if (player.onGround) actions.up = true;
      if (dx > 0) actions.right = true;
      else actions.left = true;
    }
    
    // Jump over pits
    if (hazard.type === 'pit' && Math.abs(dx) < 80) {
      if (player.onGround) actions.up = true;
      actions.right = true;
      actions.shift = true;
    }
    
    // Avoid surveillance
    if (hazard.type === 'surveillance' && Math.abs(dx) < 150) {
      // Move carefully or wait
      if (hazard.detected) {
        // Try to move out of cone
        if (dx > 0) actions.left = true;
        else actions.right = true;
        actions.shift = true;
      }
    }
  } else {
    // No hazards nearby, move right
    actions.right = true;
  }
  
  return actions;
}

function findNearestObstacleAhead(player, obstacles, direction) {
  let nearest = null;
  let minDist = Infinity;
  
  for (let obs of obstacles) {
    const dx = obs.x - player.x;
    if ((direction > 0 && dx > 0) || (direction < 0 && dx < 0)) {
      const dist = Math.abs(dx);
      if (dist < minDist) {
        minDist = dist;
        nearest = { obstacle: obs, distance: dist };
      }
    }
  }
  
  return nearest;
}

function findNearestHazard(player, hazards) {
  let nearest = null;
  let minDist = Infinity;
  
  for (let h of hazards) {
    const dx = h.x - player.x;
    const dist = Math.abs(dx);
    if (dist < minDist) {
      minDist = dist;
      nearest = { hazard: h, distance: dist };
    }
  }
  
  return nearest;
}

function getRandomAction(gs) {
  const actions = {};
  if (Math.random() < 0.4) actions.right = true;
  if (Math.random() < 0.2) actions.left = true;
  if (Math.random() < 0.1) actions.up = true;
  if (Math.random() < 0.05) actions.space = true;
  return actions;
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    case "TEST_3":
      return getObjectInteractionTest(gs);
    case "TEST_4":
      return getHazardAvoidanceTest(gs);
    default:
      return getRandomAction(gs);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;