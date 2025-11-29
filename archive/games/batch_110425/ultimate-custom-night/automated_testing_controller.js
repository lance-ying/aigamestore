// automated_testing_controller.js - Automated testing functions

import {
  gameState,
  KEY_SPACE,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_UP,
  KEY_DOWN,
  KEY_Z,
  KEY_SHIFT,
  PHASE_PLAYING
} from './globals.js';

const UI_ELEMENT_ORDER = [
  "LEFT_DOOR", "RIGHT_DOOR", "LEFT_VENT", "RIGHT_VENT",
  "LEFT_HOSE", "RIGHT_HOSE", "GENERATOR", "MUSIC_BOX",
  "LEFT_CAMERA", "RIGHT_CAMERA"
];

function getMostThreateningAnimatronic() {
  let maxThreat = null;
  let maxPosition = 0;
  
  for (const anim of gameState.animatronics) {
    if (anim.position > maxPosition) {
      maxPosition = anim.position;
      maxThreat = anim;
    }
  }
  
  return maxThreat;
}

function getSystemForAnimatronicType(type) {
  const mapping = {
    DOOR_LEFT: "LEFT_DOOR",
    DOOR_RIGHT: "RIGHT_DOOR",
    VENT_LEFT: "LEFT_VENT",
    VENT_RIGHT: "RIGHT_VENT",
    HOSE_LEFT: "LEFT_HOSE",
    HOSE_RIGHT: "RIGHT_HOSE",
    MUSIC_BOX: "MUSIC_BOX",
    CAMERA_LEFT: "LEFT_CAMERA",
    CAMERA_RIGHT: "RIGHT_CAMERA"
  };
  return mapping[type];
}

function navigateToElement(targetElement) {
  if (gameState.selectedElement === targetElement) {
    return { key: " ", keyCode: KEY_SPACE };
  }
  
  const currentIndex = UI_ELEMENT_ORDER.indexOf(gameState.selectedElement);
  const targetIndex = UI_ELEMENT_ORDER.indexOf(targetElement);
  
  if (targetIndex > currentIndex) {
    return { key: "ArrowRight", keyCode: KEY_RIGHT };
  } else {
    return { key: "ArrowLeft", keyCode: KEY_LEFT };
  }
}

function isSystemActive(systemKey) {
  const mapping = {
    LEFT_DOOR: "leftDoor",
    RIGHT_DOOR: "rightDoor",
    LEFT_VENT: "leftVent",
    RIGHT_VENT: "rightVent",
    LEFT_HOSE: "leftHose",
    RIGHT_HOSE: "rightHose",
    GENERATOR: "generator",
    MUSIC_BOX: "musicBox",
    LEFT_CAMERA: "leftCamera",
    RIGHT_CAMERA: "rightCamera"
  };
  
  const stateKey = mapping[systemKey];
  const state = gameState.systems[stateKey];
  
  if (stateKey === "musicBox") {
    return state > 50;
  }
  return state;
}

// TEST_1: Basic survival testing
function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Priority 1: Wind music box if low
  if (gameState.systems.musicBox < 30) {
    return navigateToElement("MUSIC_BOX");
  }
  
  // Priority 2: Handle immediate threats
  const threat = getMostThreateningAnimatronic();
  if (threat && threat.position > 70) {
    const requiredSystem = getSystemForAnimatronicType(threat.type);
    if (requiredSystem && !isSystemActive(requiredSystem)) {
      return navigateToElement(requiredSystem);
    }
  }
  
  // Priority 3: Manage power - turn off systems when no immediate threat
  let systemsToManage = ["LEFT_DOOR", "RIGHT_DOOR", "LEFT_VENT", "RIGHT_VENT"];
  for (const system of systemsToManage) {
    if (isSystemActive(system)) {
      // Check if there's still a threat for this system
      let hasThreat = false;
      const mapping = {
        LEFT_DOOR: "DOOR_LEFT",
        RIGHT_DOOR: "DOOR_RIGHT",
        LEFT_VENT: "VENT_LEFT",
        RIGHT_VENT: "VENT_RIGHT"
      };
      
      const animType = mapping[system];
      for (const anim of gameState.animatronics) {
        if (anim.type === animType && anim.position > 60) {
          hasThreat = true;
          break;
        }
      }
      
      if (!hasThreat) {
        return navigateToElement(system);
      }
    }
  }
  
  // Default: cycle through elements
  return { key: "ArrowRight", keyCode: KEY_RIGHT };
}

// TEST_2: Win strategy - optimal gameplay
function getWinTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Critical: Music box management (Puppet is high priority)
  if (gameState.systems.musicBox < 40) {
    if (gameState.selectedElement !== "MUSIC_BOX") {
      return navigateToElement("MUSIC_BOX");
    } else {
      return { key: " ", keyCode: KEY_SPACE };
    }
  }
  
  // Check each animatronic and defend appropriately
  const threats = [];
  for (const anim of gameState.animatronics) {
    if (anim.position > 80 && !anim.isBlockedByDefense()) {
      threats.push({
        anim: anim,
        system: getSystemForAnimatronicType(anim.type),
        priority: anim.position
      });
    }
  }
  
  // Sort by priority (position)
  threats.sort((a, b) => b.priority - a.priority);
  
  // Handle highest priority threat
  if (threats.length > 0) {
    const topThreat = threats[0];
    if (!isSystemActive(topThreat.system)) {
      if (gameState.selectedElement !== topThreat.system) {
        return navigateToElement(topThreat.system);
      } else {
        return { key: " ", keyCode: KEY_SPACE };
      }
    }
  }
  
  // Power management: Turn off systems when animatronics retreat
  const activeDefenses = ["LEFT_DOOR", "RIGHT_DOOR", "LEFT_VENT", "RIGHT_VENT", "LEFT_HOSE", "RIGHT_HOSE"];
  for (const defense of activeDefenses) {
    if (isSystemActive(defense)) {
      // Check if animatronic is still nearby
      const mapping = {
        LEFT_DOOR: "DOOR_LEFT",
        RIGHT_DOOR: "DOOR_RIGHT",
        LEFT_VENT: "VENT_LEFT",
        RIGHT_VENT: "VENT_RIGHT",
        LEFT_HOSE: "HOSE_LEFT",
        RIGHT_HOSE: "HOSE_RIGHT"
      };
      
      const animType = mapping[defense];
      let shouldStayActive = false;
      
      for (const anim of gameState.animatronics) {
        if (anim.type === animType && anim.position > 60) {
          shouldStayActive = true;
          break;
        }
      }
      
      if (!shouldStayActive && gameState.power < 80) {
        if (gameState.selectedElement !== defense) {
          return navigateToElement(defense);
        } else {
          return { key: " ", keyCode: KEY_SPACE };
        }
      }
    }
  }
  
  // Use power boost if critically low
  if (gameState.power < 15 && gameState.currentHour >= 4) {
    return { key: "z", keyCode: KEY_Z };
  }
  
  // Collect coins from Prize Counter if we have enough and need items
  if (gameState.fazCoins >= 15 && gameState.power < 50 && gameState.currentHour >= 3) {
    if (!gameState.prizeCounterOpen) {
      return { key: "Shift", keyCode: KEY_SHIFT };
    } else {
      // Buy power boost
      if (gameState.selectedPrizeIndex === 0) {
        return { key: " ", keyCode: KEY_SPACE };
      } else {
        return { key: "ArrowUp", keyCode: KEY_UP };
      }
    }
  }
  
  // Default: stay alert, cycle cameras occasionally
  if (Math.random() < 0.1) {
    return navigateToElement("LEFT_CAMERA");
  }
  
  return null;
}

// TEST_3: Threat detection and response
function getThreatTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Test all defense types systematically
  const allDefenses = [
    "LEFT_DOOR", "RIGHT_DOOR", "LEFT_VENT", "RIGHT_VENT",
    "LEFT_HOSE", "RIGHT_HOSE", "MUSIC_BOX"
  ];
  
  // Find animatronics at entry points
  for (const anim of gameState.animatronics) {
    if (anim.atEntryPoint) {
      const requiredSystem = getSystemForAnimatronicType(anim.type);
      if (requiredSystem && !isSystemActive(requiredSystem)) {
        return navigateToElement(requiredSystem);
      }
    }
  }
  
  // Maintain music box
  if (gameState.systems.musicBox < 50) {
    return navigateToElement("MUSIC_BOX");
  }
  
  // Cycle through defenses to test them
  const currentIndex = allDefenses.indexOf(gameState.selectedElement);
  const nextIndex = (currentIndex + 1) % allDefenses.length;
  return navigateToElement(allDefenses[nextIndex]);
}

// TEST_4: Prize Counter and economy
function getPrizeTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Accumulate coins first
  if (gameState.fazCoins < 10) {
    // Block animatronics to earn coins
    const threat = getMostThreateningAnimatronic();
    if (threat && threat.position > 70) {
      const requiredSystem = getSystemForAnimatronicType(threat.type);
      if (requiredSystem && !isSystemActive(requiredSystem)) {
        return navigateToElement(requiredSystem);
      }
    }
    return { key: "ArrowRight", keyCode: KEY_RIGHT };
  }
  
  // Open Prize Counter
  if (!gameState.prizeCounterOpen) {
    return { key: "Shift", keyCode: KEY_SHIFT };
  }
  
  // Navigate and purchase items
  if (gameState.fazCoins >= 10 && gameState.inventory.length < 2) {
    return { key: " ", keyCode: KEY_SPACE };
  }
  
  // Close counter
  return { key: "Shift", keyCode: KEY_SHIFT };
}

// Random action for fallback
function getRandomAction(gameState) {
  const actions = [
    { key: "ArrowLeft", keyCode: KEY_LEFT },
    { key: "ArrowRight", keyCode: KEY_RIGHT },
    { key: " ", keyCode: KEY_SPACE }
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getWinTestAction(gameState);
    case "TEST_3":
      return getThreatTestAction(gameState);
    case "TEST_4":
      return getPrizeTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;