// world.js - World initialization and entity spawning

import { gameState, RESOURCE_TYPES, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { Player, Resource, Artifact, Leviathan, Pengwing, ThermalLily } from './entities.js';
import { generateBiomes } from './biomes.js';

export function initializeWorld(p) {
  gameState.entities = [];
  gameState.habitats = [];
  gameState.biomes = generateBiomes(p);
  
  // Create player
  gameState.player = new Player(300, 200);
  gameState.entities.push(gameState.player);
  
  // Spawn resources
  spawnResources(p);
  
  // Spawn artifacts
  spawnArtifacts(p);
  
  // Spawn creatures
  spawnCreatures(p);
  
  // Reset game state
  gameState.score = 0;
  gameState.resources = {
    TITANIUM: 0,
    COPPER: 0,
    QUARTZ: 0
  };
  gameState.artifactsCollected = 0;
  gameState.camera = { x: 0, y: 0 };
}

function spawnResources(p) {
  const resourceLocations = [
    // Safe shallows - easy to get
    { x: 200, y: 250, type: RESOURCE_TYPES.TITANIUM },
    { x: 400, y: 300, type: RESOURCE_TYPES.COPPER },
    { x: 500, y: 200, type: RESOURCE_TYPES.QUARTZ },
    
    // Twisty bridges
    { x: 700, y: 250, type: RESOURCE_TYPES.TITANIUM },
    { x: 900, y: 300, type: RESOURCE_TYPES.COPPER },
    { x: 1100, y: 200, type: RESOURCE_TYPES.QUARTZ },
    
    // Crystal caverns
    { x: 1300, y: 250, type: RESOURCE_TYPES.QUARTZ },
    { x: 1500, y: 300, type: RESOURCE_TYPES.QUARTZ },
    { x: 1700, y: 200, type: RESOURCE_TYPES.TITANIUM },
    
    // Glacial basin
    { x: 200, y: 550, type: RESOURCE_TYPES.TITANIUM },
    { x: 400, y: 650, type: RESOURCE_TYPES.COPPER },
    { x: 500, y: 700, type: RESOURCE_TYPES.QUARTZ },
    
    // Thermal vents
    { x: 700, y: 550, type: RESOURCE_TYPES.COPPER },
    { x: 900, y: 650, type: RESOURCE_TYPES.COPPER },
    { x: 1100, y: 700, type: RESOURCE_TYPES.TITANIUM },
    
    // Deep trench
    { x: 1300, y: 550, type: RESOURCE_TYPES.TITANIUM },
    { x: 1500, y: 650, type: RESOURCE_TYPES.TITANIUM },
    { x: 1700, y: 700, type: RESOURCE_TYPES.COPPER }
  ];
  
  resourceLocations.forEach(loc => {
    gameState.entities.push(new Resource(loc.x, loc.y, loc.type));
  });
}

function spawnArtifacts(p) {
  const artifactLocations = [
    { x: 1000, y: 250 },  // Twisty bridges
    { x: 1600, y: 250 },  // Crystal caverns
    { x: 900, y: 600 }    // Thermal vents
  ];
  
  artifactLocations.forEach((loc, index) => {
    gameState.entities.push(new Artifact(loc.x, loc.y, index));
  });
}

function spawnCreatures(p) {
  // Leviathans with patrol paths
  const leviathan1Path = [
    { x: 1300, y: 400 },
    { x: 1600, y: 300 },
    { x: 1500, y: 150 },
    { x: 1300, y: 200 }
  ];
  gameState.entities.push(new Leviathan(1400, 300, leviathan1Path));
  
  const leviathan2Path = [
    { x: 600, y: 600 },
    { x: 900, y: 700 },
    { x: 1100, y: 600 },
    { x: 900, y: 500 }
  ];
  gameState.entities.push(new Leviathan(800, 600, leviathan2Path));
  
  // Friendly pengwings in safe areas
  for (let i = 0; i < 5; i++) {
    gameState.entities.push(new Pengwing(100 + i * 80, 150 + i * 30));
  }
  
  // Thermal lilies near vents
  const lilyPositions = [
    { x: 750, y: 720 },
    { x: 850, y: 680 },
    { x: 950, y: 720 },
    { x: 1050, y: 680 }
  ];
  lilyPositions.forEach(pos => {
    gameState.entities.push(new ThermalLily(pos.x, pos.y));
  });
}