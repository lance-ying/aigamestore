// level.js - Level creation and management

import { gameState } from './globals.js';
import { Platform, Hazard, Crate, Lever, Gate, Checkpoint } from './entities.js';

export function createLevel() {
  gameState.platforms = [];
  gameState.hazards = [];
  gameState.interactables = [];
  gameState.checkpoints = [];
  gameState.entities = [];

  // Checkpoint 0 - Tutorial area
  gameState.checkpoints.push(new Checkpoint(50, 320, 0));
  
  // Starting platform
  gameState.platforms.push(new Platform(0, 380, 400, 20));
  
  // Small gap with trap
  gameState.platforms.push(new Platform(450, 380, 200, 20));
  gameState.hazards.push(new Hazard(420, 360, 'trap'));
  
  // Checkpoint 1 - Crate puzzle
  gameState.checkpoints.push(new Checkpoint(700, 320, 1));
  gameState.platforms.push(new Platform(700, 380, 300, 20));
  
  // High platform that needs crate
  gameState.platforms.push(new Platform(900, 280, 150, 20));
  const crate1 = new Crate(750, 340, 1);
  gameState.interactables.push(crate1);
  
  // Spider hazard
  gameState.hazards.push(new Hazard(1050, 320, 'spider', 40, 40));
  
  // Checkpoint 2 - Lever and gate
  gameState.checkpoints.push(new Checkpoint(1200, 320, 2));
  gameState.platforms.push(new Platform(1100, 380, 400, 20));
  
  // Gate blocking path
  const gate1 = new Gate(1350, 300, 30, 80, 'gate1');
  gameState.entities.push(gate1);
  
  // Lever to open gate (on lower platform)
  gameState.platforms.push(new Platform(1250, 340, 100, 20));
  const lever1 = new Lever(1280, 300, 'gate1', 2);
  gameState.interactables.push(lever1);
  
  // Spikes after gate
  gameState.hazards.push(new Hazard(1400, 365, 'spike', 60, 15));
  
  // Checkpoint 3 - Complex puzzle
  gameState.checkpoints.push(new Checkpoint(1600, 280, 3));
  gameState.platforms.push(new Platform(1550, 380, 200, 20));
  gameState.platforms.push(new Platform(1600, 320, 100, 20));
  
  // Multiple crates needed
  const crate2 = new Crate(1580, 340, 3);
  const crate3 = new Crate(1720, 340, 3);
  gameState.interactables.push(crate2);
  gameState.interactables.push(crate3);
  
  // High platform
  gameState.platforms.push(new Platform(1800, 220, 150, 20));
  
  // Spider patrol
  gameState.hazards.push(new Hazard(1900, 180, 'spider', 40, 40));
  
  // Checkpoint 4 - Multi-stage puzzle
  gameState.checkpoints.push(new Checkpoint(2000, 180, 4));
  gameState.platforms.push(new Platform(2000, 220, 300, 20));
  
  // Two gates with two levers
  const gate2 = new Gate(2150, 140, 30, 80, 'gate2');
  const gate3 = new Gate(2250, 140, 30, 80, 'gate3');
  gameState.entities.push(gate2);
  gameState.entities.push(gate3);
  
  gameState.platforms.push(new Platform(2050, 180, 80, 20));
  const lever2 = new Lever(2070, 140, 'gate2', 4);
  gameState.interactables.push(lever2);
  
  gameState.platforms.push(new Platform(2200, 280, 80, 20));
  const lever3 = new Lever(2220, 240, 'gate3', 4);
  gameState.interactables.push(lever3);
  
  // Trap gauntlet
  gameState.platforms.push(new Platform(2350, 220, 300, 20));
  gameState.hazards.push(new Hazard(2400, 200, 'trap'));
  gameState.hazards.push(new Hazard(2480, 200, 'trap'));
  gameState.hazards.push(new Hazard(2560, 200, 'trap'));
  
  // Final checkpoint
  const finalCheckpoint = new Checkpoint(2700, 180, 5);
  finalCheckpoint.isFinal = true;
  gameState.checkpoints.push(finalCheckpoint);
  
  gameState.platforms.push(new Platform(2650, 220, 200, 20));
  
  // Add all entities to main entity list
  gameState.entities.push(...gameState.platforms);
  gameState.entities.push(...gameState.hazards);
  gameState.entities.push(...gameState.interactables);
  gameState.entities.push(...gameState.checkpoints);
}