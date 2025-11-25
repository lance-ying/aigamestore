// input.js
import { gameState, MATERIAL_TYPES } from './globals.js';
import { BridgeNode, BridgeSegment, Vehicle } from './entities.js';

export function handleGameplayInput(p, keyCode) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  const mode = gameState.controlMode;
  
  if (mode === "HUMAN") {
    handleHumanInput(p, keyCode);
  } else if (mode === "TEST_1") {
    handleTest1Input(p, keyCode);
  } else if (mode === "TEST_2") {
    handleTest2Input(p, keyCode);
  }
}

function handleHumanInput(p, keyCode) {
  if (gameState.isSimulating) return;
  
  const moveSpeed = 10;
  
  // Arrow keys - move cursor
  if (keyCode === 37) { // LEFT
    gameState.cursor.x = Math.max(0, gameState.cursor.x - moveSpeed);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursor.x = Math.min(600, gameState.cursor.x + moveSpeed);
  } else if (keyCode === 38) { // UP
    gameState.cursor.y = Math.max(0, gameState.cursor.y - moveSpeed);
  } else if (keyCode === 40) { // DOWN
    gameState.cursor.y = Math.min(400, gameState.cursor.y + moveSpeed);
  }
  
  // Space - place/connect node
  if (keyCode === 32) {
    placeNode(p);
  }
  
  // A/D - cycle materials
  if (keyCode === 65) { // A
    cycleMaterial(-1);
  } else if (keyCode === 68) { // D
    cycleMaterial(1);
  }
  
  // S - start simulation
  if (keyCode === 83) {
    startSimulation(p);
  }
}

function handleTest1Input(p, keyCode) {
  // Automated test for basic construction
  if (!gameState.isSimulating) {
    const testPhase = p.frameCount % 300;
    
    if (testPhase === 50) {
      gameState.cursor = { x: 100, y: 280 };
      placeNode(p);
    } else if (testPhase === 100) {
      gameState.cursor = { x: 250, y: 200 };
      placeNode(p);
    } else if (testPhase === 150) {
      gameState.cursor = { x: 400, y: 280 };
      placeNode(p);
    } else if (testPhase === 200) {
      cycleMaterial(1); // Switch to wood
    } else if (testPhase === 250) {
      startSimulation(p);
    }
  }
}

function handleTest2Input(p, keyCode) {
  // Automated test for winning
  if (!gameState.isSimulating) {
    const testPhase = p.frameCount % 400;
    
    // Build a strong bridge
    if (testPhase === 30) {
      gameState.currentMaterial = "STEEL";
      gameState.cursor = { x: 100, y: 290 };
      placeNode(p);
    } else if (testPhase === 60) {
      gameState.cursor = { x: 150, y: 250 };
      placeNode(p);
    } else if (testPhase === 90) {
      gameState.cursor = { x: 200, y: 280 };
      placeNode(p);
    } else if (testPhase === 120) {
      gameState.cursor = { x: 250, y: 250 };
      placeNode(p);
    } else if (testPhase === 150) {
      gameState.cursor = { x: 300, y: 280 };
      placeNode(p);
    } else if (testPhase === 180) {
      gameState.cursor = { x: 350, y: 250 };
      placeNode(p);
    } else if (testPhase === 210) {
      gameState.cursor = { x: 400, y: 280 };
      placeNode(p);
    } else if (testPhase === 240) {
      gameState.cursor = { x: 450, y: 250 };
      placeNode(p);
    } else if (testPhase === 270) {
      gameState.cursor = { x: 500, y: 290 };
      placeNode(p);
    } else if (testPhase === 300) {
      gameState.currentMaterial = "ROAD";
      gameState.cursor = { x: 75, y: 280 };
      placeNode(p);
    } else if (testPhase === 320) {
      gameState.cursor = { x: 525, y: 280 };
      placeNode(p);
    } else if (testPhase === 350) {
      startSimulation(p);
    }
  }
}

function placeNode(p) {
  const snapDistance = 20;
  
  // Check if near an anchor point
  let nearAnchor = null;
  for (const anchor of gameState.anchorPoints) {
    const dist = Math.sqrt(
      Math.pow(gameState.cursor.x - anchor.x, 2) +
      Math.pow(gameState.cursor.y - anchor.y, 2)
    );
    if (dist < snapDistance) {
      nearAnchor = anchor;
      break;
    }
  }
  
  let newNode = null;
  
  if (nearAnchor) {
    newNode = nearAnchor;
  } else {
    // Create new node
    newNode = new BridgeNode(gameState.cursor.x, gameState.cursor.y, false);
  }
  
  // If there's a previous node, connect them
  if (gameState.placedNodes.length > 0) {
    const prevNode = gameState.placedNodes[gameState.placedNodes.length - 1];
    const materialProps = MATERIAL_TYPES[gameState.currentMaterial];
    const segmentCost = materialProps.cost;
    
    // Check budget
    if (gameState.spentBudget + segmentCost <= gameState.budget) {
      const segment = new BridgeSegment(p, prevNode, newNode, gameState.currentMaterial);
      gameState.segments.push(segment);
      gameState.spentBudget += segmentCost;
      
      // Log placement
      p.logs.game_info.push({
        data: { 
          action: "segment_placed",
          material: gameState.currentMaterial,
          cost: segmentCost,
          remaining: gameState.budget - gameState.spentBudget
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (!nearAnchor) {
    gameState.placedNodes.push(newNode);
  }
}

function cycleMaterial(direction) {
  const materials = Object.keys(MATERIAL_TYPES);
  const currentIndex = materials.indexOf(gameState.currentMaterial);
  let newIndex = currentIndex + direction;
  
  if (newIndex < 0) newIndex = materials.length - 1;
  if (newIndex >= materials.length) newIndex = 0;
  
  gameState.currentMaterial = materials[newIndex];
}

function startSimulation(p) {
  if (gameState.segments.length === 0) return;
  
  gameState.isSimulating = true;
  gameState.simulationStarted = true;
  
  // Spawn first vehicle
  spawnVehicle(p);
  
  p.logs.game_info.push({
    data: { action: "simulation_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function spawnVehicle(p) {
  if (gameState.vehiclesSpawned < gameState.totalVehicles) {
    const vehicle = new Vehicle(p, gameState.startPoint.x, gameState.startPoint.y - 50);
    gameState.vehicles.push(vehicle);
    gameState.vehiclesSpawned++;
  }
}

export function updateSimulation(p) {
  if (!gameState.isSimulating) return;
  
  // Spawn vehicles at intervals
  if (p.frameCount % 120 === 0 && gameState.vehiclesSpawned < gameState.totalVehicles) {
    spawnVehicle(p);
  }
}