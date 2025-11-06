// automated_testing_controller.js
import { GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return null;
  }

  const room = gameState.rooms[gameState.currentRoom];
  const player = gameState.player;
  
  // Room-specific strategies
  if (gameState.currentRoom === 0) {
    return room0Strategy(gameState, room, player);
  } else if (gameState.currentRoom === 1) {
    return room1Strategy(gameState, room, player);
  } else if (gameState.currentRoom === 2) {
    return room2Strategy(gameState, room, player);
  } else if (gameState.currentRoom === 3) {
    return room3Strategy(gameState, room, player);
  }
  
  return null;
}

function room0Strategy(gameState, room, player) {
  const crate = room.crates[0];
  const plate = room.pressurePlates[0];
  const exit = room.exitDoor;
  
  // Strategy: Push crate to pressure plate, then go to exit
  if (!plate.activated) {
    // Move crate to plate
    if (Math.abs(crate.x - plate.x) > 10 || Math.abs(crate.y - plate.y) > 10) {
      // Get behind the crate relative to the plate
      if (player.x > crate.x + 40) {
        return { keyCode: 37 }; // Left
      } else if (player.x < crate.x - 40) {
        return { keyCode: 39 }; // Right
      } else if (player.y > crate.y + 40) {
        return { keyCode: 38 }; // Up
      } else if (player.y < crate.y - 40) {
        return { keyCode: 40 }; // Down
      } else {
        // Close enough, push
        return { keyCode: 32 }; // Space
      }
    } else {
      return { keyCode: 32 }; // Push onto plate
    }
  } else {
    // Go to exit
    if (player.x < exit.x - 20) {
      return { keyCode: 39 }; // Right
    } else if (player.y < exit.y) {
      return { keyCode: 40 }; // Down
    } else if (player.y > exit.y + exit.height) {
      return { keyCode: 38 }; // Up
    } else {
      return { keyCode: 39 }; // Right to exit
    }
  }
}

function room1Strategy(gameState, room, player) {
  const lever = room.levers[0];
  const exit = room.exitDoor;
  const enemy = room.enemies[0];
  
  // Check if we need to hide from enemy
  if (enemy && canEnemySeePosition(enemy, player.x, player.y)) {
    // Move to hiding spot
    const hidingSpot = room.hidingSpots[0];
    if (Math.abs(player.x - hidingSpot.x) > 10 || Math.abs(player.y - hidingSpot.y) > 10) {
      if (player.x > hidingSpot.x) return { keyCode: 37 };
      if (player.x < hidingSpot.x) return { keyCode: 39 };
      if (player.y > hidingSpot.y) return { keyCode: 38 };
      if (player.y < hidingSpot.y) return { keyCode: 40 };
    } else {
      return { keyCode: 40 }; // Crouch/hide
    }
  }
  
  // Strategy: Activate lever when safe, then go to exit
  if (!lever.activated) {
    // Navigate to lever
    if (player.x > lever.x + 30) {
      return { keyCode: 37 }; // Left
    } else if (player.x < lever.x - 30) {
      return { keyCode: 39 }; // Right
    } else if (player.y > lever.y + 30) {
      return { keyCode: 38 }; // Up
    } else if (player.y < lever.y - 30) {
      return { keyCode: 40 }; // Down
    } else {
      return { keyCode: 90 }; // Z - Interact
    }
  } else {
    // Navigate to exit (avoiding enemy)
    if (player.x < 280) {
      if (player.y > 200) {
        return { keyCode: 38 }; // Up
      } else {
        return { keyCode: 39 }; // Right
      }
    } else if (player.x < exit.x - 20) {
      // Wait for enemy to be away
      if (enemy.x > 420 || enemy.y > 200) {
        return { keyCode: 39 }; // Right
      } else {
        return { keyCode: 40 }; // Wait/down
      }
    } else {
      if (player.y < exit.y) {
        return { keyCode: 40 }; // Down
      } else if (player.y > exit.y + exit.height) {
        return { keyCode: 38 }; // Up
      } else {
        return { keyCode: 39 }; // Right to exit
      }
    }
  }
}

function room2Strategy(gameState, room, player) {
  const crate = room.crates[0];
  const plate = room.pressurePlates[0];
  const exit = room.exitDoor;
  
  // Push crate onto pressure plate to deactivate spikes
  if (!plate.activated) {
    if (player.x < crate.x - 40) {
      return { keyCode: 39 }; // Right
    } else if (player.y < crate.y - 10) {
      return { keyCode: 40 }; // Down
    } else if (player.y > crate.y + 10) {
      return { keyCode: 38 }; // Up
    } else {
      return { keyCode: 32 }; // Push
    }
  } else {
    // Navigate to exit avoiding enemy
    const enemy = room.enemies[0];
    const hidingSpot = room.hidingSpots[0];
    
    if (player.x < 370 && player.y > 200 && player.y < 300) {
      // In corridor, move forward
      return { keyCode: 39 }; // Right
    } else if (player.x >= 370 && player.x < 450) {
      // Check enemy position
      if (canEnemySeePosition(enemy, player.x, player.y)) {
        // Go to hiding spot
        if (player.y < hidingSpot.y) {
          return { keyCode: 40 }; // Down
        } else if (Math.abs(player.x - hidingSpot.x) > 10) {
          if (player.x > hidingSpot.x) return { keyCode: 37 };
          return { keyCode: 39 };
        } else {
          return { keyCode: 40 }; // Hide
        }
      } else {
        return { keyCode: 39 }; // Continue right
      }
    } else if (player.x >= 450) {
      // Move to exit
      if (player.y > exit.y + 20) {
        return { keyCode: 38 }; // Up
      } else {
        return { keyCode: 39 }; // Right to exit
      }
    }
  }
  
  return { keyCode: 39 }; // Default right
}

function room3Strategy(gameState, room, player) {
  const plates = room.pressurePlates;
  const crates = room.crates;
  const exit = room.exitDoor;
  
  // Complex strategy: activate both pressure plates
  const allActivated = plates.every(p => p.activated);
  
  if (!allActivated) {
    // Work on pressure plates
    if (!plates[0].activated) {
      // Push first crate to first plate
      const crate = crates[0];
      if (player.x < crate.x - 40) {
        return { keyCode: 39 }; // Right
      } else if (player.y < crate.y - 10) {
        return { keyCode: 40 }; // Down
      } else if (player.y > crate.y + 10) {
        return { keyCode: 38 }; // Up
      } else {
        return { keyCode: 32 }; // Push
      }
    } else {
      // Push second crate to second plate
      const crate = crates[1];
      if (player.x < crate.x - 40) {
        return { keyCode: 39 }; // Right
      } else if (player.y > crate.y + 40) {
        return { keyCode: 38 }; // Up
      } else {
        return { keyCode: 32 }; // Push
      }
    }
  } else {
    // Navigate to exit avoiding enemies and pit
    if (player.x < 200) {
      if (player.y < 150) {
        return { keyCode: 39 }; // Right
      } else {
        return { keyCode: 38 }; // Up
      }
    } else if (player.x < 350) {
      if (player.y < 150) {
        return { keyCode: 39 }; // Right
      } else {
        return { keyCode: 38 }; // Up
      }
    } else if (player.x < 480) {
      if (player.y > 120) {
        return { keyCode: 38 }; // Up
      } else {
        return { keyCode: 39 }; // Right
      }
    } else {
      if (player.y < exit.y) {
        return { keyCode: 40 }; // Down
      } else if (player.y > exit.y + exit.height) {
        return { keyCode: 38 }; // Up
      } else {
        return { keyCode: 39 }; // Right to exit
      }
    }
  }
}

function canEnemySeePosition(enemy, x, y) {
  const dist = Math.sqrt((x - enemy.x) ** 2 + (y - enemy.y) ** 2);
  if (dist > enemy.visionRange) return false;
  
  const angleToPos = Math.atan2(y - enemy.y, x - enemy.x) * 180 / Math.PI;
  let angleDiff = Math.abs(angleToPos - enemy.facing);
  
  while (angleDiff > 180) angleDiff -= 360;
  while (angleDiff < -180) angleDiff += 360;
  angleDiff = Math.abs(angleDiff);
  
  return angleDiff < enemy.visionAngle;
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return null;
  }
  
  // Simple movement test - move right and down
  const frame = gameState.player.animFrame || 0;
  
  if (frame % 60 < 15) {
    return { keyCode: 39 }; // Right
  } else if (frame % 60 < 30) {
    return { keyCode: 40 }; // Down
  } else if (frame % 60 < 45) {
    return { keyCode: 37 }; // Left
  } else {
    return { keyCode: 38 }; // Up
  }
}

function getEnemyTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return null;
  }
  
  const room = gameState.rooms[gameState.currentRoom];
  if (room.enemies.length > 0) {
    const enemy = room.enemies[0];
    // Move toward enemy to test detection
    if (gameState.player.x < enemy.x) {
      return { keyCode: 39 }; // Right
    } else if (gameState.player.y < enemy.y) {
      return { keyCode: 40 }; // Down
    }
  }
  
  return { keyCode: 39 };
}

function getTrapTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return null;
  }
  
  // Navigate to nearest spike
  const room = gameState.rooms[gameState.currentRoom];
  if (room.spikes.length > 0) {
    const spike = room.spikes[0];
    if (gameState.player.x < spike.x) {
      return { keyCode: 39 }; // Right
    } else if (gameState.player.y < spike.y) {
      return { keyCode: 40 }; // Down
    }
  }
  
  return { keyCode: 39 };
}

function getCrateTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) {
    return null;
  }
  
  const room = gameState.rooms[gameState.currentRoom];
  if (room.crates.length > 0) {
    const crate = room.crates[0];
    const player = gameState.player;
    
    // Get next to crate
    if (Math.abs(player.x - crate.x) > 40 || Math.abs(player.y - crate.y) > 40) {
      if (player.x < crate.x - 40) return { keyCode: 39 };
      if (player.x > crate.x + 40) return { keyCode: 37 };
      if (player.y < crate.y - 40) return { keyCode: 40 };
      if (player.y > crate.y + 40) return { keyCode: 38 };
    } else {
      // Push it
      return { keyCode: 32 };
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 37 }, // Left
    { keyCode: 38 }, // Up
    { keyCode: 39 }, // Right
    { keyCode: 40 }, // Down
    { keyCode: 32 }, // Space
    { keyCode: 90 }, // Z
    null
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getEnemyTestAction(gameState);
    case "TEST_4":
      return getTrapTestAction(gameState);
    case "TEST_5":
      return getCrateTestAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;