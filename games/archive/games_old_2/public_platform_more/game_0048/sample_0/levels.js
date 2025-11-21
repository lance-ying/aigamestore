// levels.js - Level definitions

import { Platform, Hazard, Goal, Switch } from './entities.js';
import { CANVAS_HEIGHT } from './globals.js';

export function createLevel(p, levelIndex) {
  const level = {
    platforms: [],
    hazards: [],
    interactableObjects: [],
    goal: null,
    startX: 50,
    startY: 300,
    description: ""
  };

  const groundY = CANVAS_HEIGHT - 40;

  if (levelIndex === 0) {
    // Tutorial level - simple jump and platform activation
    level.description = "Learn to jump and manipulate platforms";
    
    // Ground platforms
    level.platforms.push(new Platform(p, 0, groundY, 200, 40));
    level.platforms.push(new Platform(p, 350, groundY, 250, 40));
    
    // Gap with a movable platform
    const bridgePlatform = new Platform(p, 220, groundY - 80, 100, 20, true, false);
    level.platforms.push(bridgePlatform);
    
    // Switch to activate bridge
    const switchObj = new Switch(p, 100, groundY - 15, [bridgePlatform]);
    level.interactableObjects.push(switchObj);
    
    // Goal
    level.goal = new Goal(p, 540, groundY - 60);
    
  } else if (levelIndex === 1) {
    // Level 2 - Multiple obstacles and timing
    level.description = "Precise timing creates miracles";
    
    // Platforms
    level.platforms.push(new Platform(p, 0, groundY, 150, 40));
    level.platforms.push(new Platform(p, 300, groundY, 100, 40));
    level.platforms.push(new Platform(p, 500, groundY, 100, 40));
    
    // Hazards
    level.hazards.push(new Hazard(p, 150, groundY, 50, 40, 'spike'));
    level.hazards.push(new Hazard(p, 400, groundY, 50, 40, 'spike'));
    
    // Movable platforms to avoid hazards
    const platform1 = new Platform(p, 150, groundY - 60, 80, 20, true, false);
    const platform2 = new Platform(p, 380, groundY - 60, 80, 20, true, false);
    level.platforms.push(platform1);
    level.platforms.push(platform2);
    
    // Switches
    level.interactableObjects.push(new Switch(p, 50, groundY - 15, [platform1]));
    level.interactableObjects.push(new Switch(p, 320, groundY - 15, [platform2]));
    
    // Goal
    level.goal = new Goal(p, 540, groundY - 60);
    
  } else if (levelIndex === 2) {
    // Level 3 - Complex puzzle with multiple paths
    level.description = "Create Sally's path through the impossible";
    
    // Multi-level platforms
    level.platforms.push(new Platform(p, 0, groundY, 120, 40));
    level.platforms.push(new Platform(p, 180, groundY - 80, 100, 20));
    level.platforms.push(new Platform(p, 350, groundY - 120, 120, 20));
    level.platforms.push(new Platform(p, 480, groundY, 120, 40));
    
    // Hazards
    level.hazards.push(new Hazard(p, 120, groundY, 60, 40, 'pit'));
    level.hazards.push(new Hazard(p, 280, groundY - 80, 70, 20, 'spike'));
    
    // Rising platforms
    const lift1 = new Platform(p, 120, groundY - 20, 60, 20, true, false);
    lift1.targetY = groundY - 100;
    const lift2 = new Platform(p, 280, groundY - 140, 70, 20, true, false);
    lift2.targetY = groundY - 80;
    
    level.platforms.push(lift1);
    level.platforms.push(lift2);
    
    // Switches
    level.interactableObjects.push(new Switch(p, 40, groundY - 15, [lift1]));
    level.interactableObjects.push(new Switch(p, 200, groundY - 95, [lift2]));
    
    // Goal
    level.goal = new Goal(p, 520, groundY - 60);
  }

  return level;
}

export function getTotalLevels() {
  return 3;
}