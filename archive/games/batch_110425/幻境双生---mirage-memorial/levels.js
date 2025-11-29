// levels.js - Level definitions
import { Platform, MovableBlock, Switch, Door, Crystal, ExitPortal, Hazard } from './entities.js';
import { TILE_SIZE, WORLD_NORMAL, WORLD_INNER } from './globals.js';

export function createLevel(levelNum) {
  const level = {
    platforms: [],
    movableBlocks: [],
    switches: [],
    doors: [],
    crystals: [],
    exitPortal: null,
    hazards: [],
    playerStart: { x: 40, y: 300 }
  };

  switch (levelNum) {
    case 1:
      // Tutorial level - Basic movement and world switching
      level.playerStart = { x: 40, y: 300 };
      
      // Normal world platforms
      level.platforms.push(new Platform(0, 360, 200, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(300, 360, 300, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(200, 300, 100, 20, WORLD_NORMAL));
      
      // Inner world platforms - different layout
      level.platforms.push(new Platform(0, 360, 150, 40, WORLD_INNER));
      level.platforms.push(new Platform(250, 360, 350, 40, WORLD_INNER));
      level.platforms.push(new Platform(150, 260, 100, 20, WORLD_INNER));
      
      // Crystals
      level.crystals.push(new Crystal(250, 280, WORLD_NORMAL));
      level.crystals.push(new Crystal(200, 240, WORLD_INNER));
      
      // Exit portal
      level.exitPortal = new ExitPortal(520, 320, WORLD_NORMAL);
      break;

    case 2:
      // Movable blocks introduction
      level.playerStart = { x: 40, y: 300 };
      
      // Normal world
      level.platforms.push(new Platform(0, 360, 250, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(400, 300, 200, 100, WORLD_NORMAL));
      
      // Inner world
      level.platforms.push(new Platform(0, 360, 200, 40, WORLD_INNER));
      level.platforms.push(new Platform(350, 360, 250, 40, WORLD_INNER));
      level.platforms.push(new Platform(300, 260, 100, 20, WORLD_INNER));
      
      // Movable block
      level.movableBlocks.push(new MovableBlock(180, 340));
      
      // Crystals
      level.crystals.push(new Crystal(450, 260, WORLD_NORMAL));
      level.crystals.push(new Crystal(350, 240, WORLD_INNER));
      level.crystals.push(new Crystal(100, 340, WORLD_NORMAL));
      
      // Exit
      level.exitPortal = new ExitPortal(500, 260, WORLD_NORMAL);
      break;

    case 3:
      // Switch and door mechanics
      level.playerStart = { x: 40, y: 300 };
      
      // Normal world
      level.platforms.push(new Platform(0, 360, 200, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(400, 360, 200, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(250, 280, 100, 20, WORLD_NORMAL));
      
      // Inner world
      level.platforms.push(new Platform(0, 360, 600, 40, WORLD_INNER));
      level.platforms.push(new Platform(200, 260, 100, 20, WORLD_INNER));
      
      // Switch in normal world
      level.switches.push(new Switch(300, 260, 1, WORLD_NORMAL));
      
      // Door in inner world (blocks path)
      level.doors.push(new Door(350, 260, 20, 100, 1, WORLD_INNER));
      
      // Crystals
      level.crystals.push(new Crystal(270, 260, WORLD_NORMAL));
      level.crystals.push(new Crystal(250, 240, WORLD_INNER));
      level.crystals.push(new Crystal(480, 240, WORLD_INNER));
      
      // Exit in inner world
      level.exitPortal = new ExitPortal(520, 320, WORLD_INNER);
      break;

    case 4:
      // Hazards and complex puzzle
      level.playerStart = { x: 40, y: 300 };
      
      // Normal world
      level.platforms.push(new Platform(0, 360, 150, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(300, 360, 150, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(150, 280, 100, 20, WORLD_NORMAL));
      level.platforms.push(new Platform(500, 300, 100, 100, WORLD_NORMAL));
      
      // Inner world
      level.platforms.push(new Platform(0, 360, 250, 40, WORLD_INNER));
      level.platforms.push(new Platform(400, 360, 200, 40, WORLD_INNER));
      level.platforms.push(new Platform(300, 240, 100, 20, WORLD_INNER));
      
      // Hazards
      level.hazards.push(new Hazard(200, 360, 80, 40, WORLD_NORMAL));
      level.hazards.push(new Hazard(300, 360, 80, 40, WORLD_INNER));
      
      // Movable blocks
      level.movableBlocks.push(new MovableBlock(100, 340));
      
      // Switches and doors
      level.switches.push(new Switch(200, 260, 2, WORLD_NORMAL));
      level.doors.push(new Door(500, 240, 20, 60, 2, WORLD_NORMAL));
      
      // Crystals
      level.crystals.push(new Crystal(180, 260, WORLD_NORMAL));
      level.crystals.push(new Crystal(350, 220, WORLD_INNER));
      level.crystals.push(new Crystal(520, 200, WORLD_NORMAL));
      level.crystals.push(new Crystal(480, 340, WORLD_INNER));
      
      // Exit
      level.exitPortal = new ExitPortal(540, 260, WORLD_NORMAL);
      break;

    case 5:
      // Final complex level
      level.playerStart = { x: 40, y: 300 };
      
      // Normal world - challenging layout
      level.platforms.push(new Platform(0, 360, 120, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(200, 360, 100, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(450, 360, 150, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(150, 260, 80, 20, WORLD_NORMAL));
      level.platforms.push(new Platform(350, 220, 80, 20, WORLD_NORMAL));
      
      // Inner world
      level.platforms.push(new Platform(0, 360, 200, 40, WORLD_INNER));
      level.platforms.push(new Platform(350, 360, 250, 40, WORLD_INNER));
      level.platforms.push(new Platform(250, 280, 80, 20, WORLD_INNER));
      level.platforms.push(new Platform(450, 200, 80, 20, WORLD_INNER));
      
      // Hazards in both worlds
      level.hazards.push(new Hazard(150, 360, 40, 40, WORLD_NORMAL));
      level.hazards.push(new Hazard(320, 360, 20, 40, WORLD_INNER));
      
      // Multiple movable blocks
      level.movableBlocks.push(new MovableBlock(80, 340));
      level.movableBlocks.push(new MovableBlock(220, 340));
      
      // Multiple switches and doors
      level.switches.push(new Switch(180, 240, 3, WORLD_NORMAL));
      level.switches.push(new Switch(280, 260, 4, WORLD_INNER));
      level.doors.push(new Door(350, 160, 20, 60, 3, WORLD_NORMAL));
      level.doors.push(new Door(450, 160, 20, 40, 4, WORLD_INNER));
      
      // Many crystals
      level.crystals.push(new Crystal(100, 340, WORLD_NORMAL));
      level.crystals.push(new Crystal(180, 240, WORLD_NORMAL));
      level.crystals.push(new Crystal(380, 200, WORLD_NORMAL));
      level.crystals.push(new Crystal(280, 260, WORLD_INNER));
      level.crystals.push(new Crystal(470, 180, WORLD_INNER));
      
      // Exit in inner world
      level.exitPortal = new ExitPortal(520, 160, WORLD_INNER);
      break;

    default:
      // Default level (same as level 1)
      level.playerStart = { x: 40, y: 300 };
      level.platforms.push(new Platform(0, 360, 600, 40, WORLD_NORMAL));
      level.platforms.push(new Platform(0, 360, 600, 40, WORLD_INNER));
      level.crystals.push(new Crystal(300, 340, WORLD_NORMAL));
      level.exitPortal = new ExitPortal(520, 320, WORLD_NORMAL);
  }

  return level;
}