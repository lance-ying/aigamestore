// automated_testing_controller.js - Automated testing

import { PHASE_PLAYING, KEY_Z, KEY_SPACE, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN } from './globals.js';

let actionHistory = [];
let stateHistory = [];
let lastCamera = 0;
let tabletOpenFrames = 0;
let actionCooldown = 0;

function getTestWinAction(gameState) {
  // Strategy: Monitor Springtrap, use audio lures and vent seals proactively
  
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  actionCooldown--;
  
  // Track state
  stateHistory.push({
    time: gameState.timeElapsed,
    springtrapLoc: gameState.springtrap ? gameState.springtrap.currentLocation : -1,
    springtrapState: gameState.springtrap ? gameState.springtrap.state : 'none'
  });
  
  if (stateHistory.length > 100) {
    stateHistory.shift();
  }
  
  // Priority 1: Reboot broken systems immediately
  if (gameState.tabletOpen && gameState.selectedSystem === 'maintenance') {
    const systems = ['audio', 'camera', 'ventilation'];
    for (const sys of systems) {
      if (!gameState.systems[sys].working && !gameState.rebootingSystem) {
        return KEY_SPACE;
      }
    }
  }
  
  // Priority 2: Check if any system is broken, open maintenance
  const anyBroken = !gameState.systems.audio.working || 
                    !gameState.systems.camera.working || 
                    !gameState.systems.ventilation.working;
  
  if (anyBroken) {
    if (!gameState.tabletOpen) {
      return KEY_Z;
    }
    if (gameState.selectedSystem !== 'maintenance') {
      return KEY_DOWN; // Cycle to maintenance
    }
    return KEY_SPACE;
  }
  
  // Priority 3: Monitor Springtrap location
  if (!gameState.tabletOpen) {
    tabletOpenFrames = 0;
    if (actionCooldown <= 0) {
      actionCooldown = 5;
      return KEY_Z; // Open tablet
    }
  } else {
    tabletOpenFrames++;
  }
  
  const springtrap = gameState.springtrap;
  if (!springtrap) return null;
  
  // Priority 4: If Springtrap is at vent, seal it
  if (springtrap.state === 'AT_VENT') {
    if (gameState.selectedSystem !== 'vents') {
      return KEY_UP; // Cycle to vents
    }
    return KEY_SPACE; // Seal vent
  }
  
  // Priority 5: If Springtrap is close (camera 4+), use audio lure
  if (springtrap.currentLocation >= 4) {
    if (gameState.selectedSystem !== 'audio') {
      return KEY_UP; // Cycle to audio
    }
    // Lure to camera 0 or 1
    if (gameState.selectedCamera > 1) {
      return KEY_LEFT;
    }
    if (actionCooldown <= 0 && gameState.systems.audio.cooldown === 0) {
      actionCooldown = 30;
      return KEY_SPACE;
    }
  }
  
  // Priority 6: Navigate cameras to track Springtrap
  if (gameState.selectedSystem === null) {
    if (gameState.selectedCamera !== springtrap.currentLocation) {
      if (gameState.selectedCamera < springtrap.currentLocation) {
        return KEY_RIGHT;
      } else {
        return KEY_LEFT;
      }
    }
  }
  
  // Priority 7: Scan through cameras
  if (tabletOpenFrames > 120) {
    // Check all cameras periodically
    if (actionCooldown <= 0) {
      actionCooldown = 10;
      if (gameState.selectedCamera < 5) {
        return KEY_RIGHT;
      } else {
        return KEY_LEFT;
      }
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Simple test: open tablet, navigate cameras, try systems
  
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  actionCooldown--;
  
  if (actionCooldown > 0) return null;
  
  const actions = [KEY_Z, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE];
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  actionCooldown = 15;
  return action;
}

function getSystemTestAction(gameState) {
  // Test system management
  
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  actionCooldown--;
  
  // Focus on rebooting systems and using vents
  if (!gameState.tabletOpen) {
    return KEY_Z;
  }
  
  const anyBroken = !gameState.systems.audio.working || 
                    !gameState.systems.camera.working || 
                    !gameState.systems.ventilation.working;
  
  if (anyBroken && gameState.selectedSystem !== 'maintenance') {
    return KEY_DOWN;
  }
  
  if (anyBroken && gameState.selectedSystem === 'maintenance') {
    return KEY_SPACE;
  }
  
  if (actionCooldown <= 0) {
    actionCooldown = 20;
    return [KEY_UP, KEY_SPACE][Math.floor(Math.random() * 2)];
  }
  
  return null;
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  if (Math.random() < 0.9) return null;
  
  const actions = [KEY_Z, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getSystemTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;