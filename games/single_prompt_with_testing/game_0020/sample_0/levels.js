// levels.js - Level generation and management
import { Platform, Box, Spike, Pit, Switch, Door, ExitPortal, Surveillance } from './entities.js';
import { CANVAS_HEIGHT } from './globals.js';

export function generateLevel(levelNum) {
  const obstacles = [];
  const interactables = [];
  const hazards = [];
  let exitPortal = null;
  let levelWidth = 1200;

  if (levelNum === 1) {
    // Tutorial level - basic movement and jumping
    levelWidth = 1000;
    
    // Ground
    obstacles.push(new Platform(0, CANVAS_HEIGHT - 50, 300, 50));
    obstacles.push(new Platform(350, CANVAS_HEIGHT - 50, 200, 50));
    obstacles.push(new Platform(600, CANVAS_HEIGHT - 50, 400, 50));
    
    // Elevated platforms
    obstacles.push(new Platform(150, CANVAS_HEIGHT - 120, 80, 20));
    obstacles.push(new Platform(380, CANVAS_HEIGHT - 140, 80, 20));
    
    // Simple spike hazard
    hazards.push(new Spike(320, CANVAS_HEIGHT - 50, 30));
    
    // Small pit
    hazards.push(new Pit(560, 40));
    
    // Exit at the end
    exitPortal = new ExitPortal(930, CANVAS_HEIGHT - 110);
    
  } else if (levelNum === 2) {
    // Puzzle level - boxes and switches
    levelWidth = 1400;
    
    // Ground sections
    obstacles.push(new Platform(0, CANVAS_HEIGHT - 50, 400, 50));
    obstacles.push(new Platform(500, CANVAS_HEIGHT - 50, 300, 50));
    obstacles.push(new Platform(900, CANVAS_HEIGHT - 50, 500, 50));
    
    // Platforms
    obstacles.push(new Platform(200, CANVAS_HEIGHT - 150, 100, 20));
    obstacles.push(new Platform(520, CANVAS_HEIGHT - 130, 100, 20));
    obstacles.push(new Platform(700, CANVAS_HEIGHT - 180, 80, 20));
    
    // High platform requiring box
    obstacles.push(new Platform(350, CANVAS_HEIGHT - 220, 120, 20));
    
    // Movable box
    interactables.push(new Box(250, CANVAS_HEIGHT - 80));
    
    // Switch and door mechanism
    const switch1 = new Switch(550, CANVAS_HEIGHT - 80, 1);
    interactables.push(switch1);
    
    const door1 = new Door(850, CANVAS_HEIGHT - 130, 1, 20, 80);
    interactables.push(door1);
    
    // Hazards
    hazards.push(new Spike(440, CANVAS_HEIGHT - 50, 60));
    hazards.push(new Pit(820, 30));
    
    exitPortal = new ExitPortal(1330, CANVAS_HEIGHT - 110);
    
  } else if (levelNum === 3) {
    // Advanced level - surveillance and complex puzzles
    levelWidth = 1800;
    
    // Ground sections
    obstacles.push(new Platform(0, CANVAS_HEIGHT - 50, 350, 50));
    obstacles.push(new Platform(450, CANVAS_HEIGHT - 50, 250, 50));
    obstacles.push(new Platform(800, CANVAS_HEIGHT - 50, 300, 50));
    obstacles.push(new Platform(1200, CANVAS_HEIGHT - 50, 600, 50));
    
    // Multi-level platforms
    obstacles.push(new Platform(150, CANVAS_HEIGHT - 130, 120, 20));
    obstacles.push(new Platform(500, CANVAS_HEIGHT - 150, 100, 20));
    obstacles.push(new Platform(650, CANVAS_HEIGHT - 120, 100, 20));
    obstacles.push(new Platform(850, CANVAS_HEIGHT - 170, 150, 20));
    obstacles.push(new Platform(1100, CANVAS_HEIGHT - 200, 100, 20));
    
    // Boxes for puzzle solving
    interactables.push(new Box(180, CANVAS_HEIGHT - 80));
    interactables.push(new Box(880, CANVAS_HEIGHT - 200));
    
    // Switch and door system
    const switch1 = new Switch(950, CANVAS_HEIGHT - 200, 1);
    interactables.push(switch1);
    
    const door1 = new Door(1150, CANVAS_HEIGHT - 130, 1, 20, 80);
    interactables.push(door1);
    
    // Surveillance cameras
    hazards.push(new Surveillance(300, CANVAS_HEIGHT - 200, 120, 1));
    hazards.push(new Surveillance(750, CANVAS_HEIGHT - 180, 150, -1));
    hazards.push(new Surveillance(1400, CANVAS_HEIGHT - 150, 140, 1));
    
    // Additional hazards
    hazards.push(new Spike(380, CANVAS_HEIGHT - 50, 70));
    hazards.push(new Spike(730, CANVAS_HEIGHT - 50, 70));
    hazards.push(new Pit(1120, 80));
    
    exitPortal = new ExitPortal(1730, CANVAS_HEIGHT - 110);
  }

  return {
    obstacles,
    interactables,
    hazards,
    exitPortal,
    levelWidth
  };
}