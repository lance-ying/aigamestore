// game_logic.js - Core game logic
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function updateCamera(camera, player) {
  // Center camera on player
  camera.x = player.x - CANVAS_WIDTH / 2;
  camera.y = player.y - CANVAS_HEIGHT / 2;
}

export function handlePlayerActions(p, inputs) {
  const player = gameState.player;
  
  // Attack
  if (inputs.attack) {
    const attackHit = player.attack(p);
    if (attackHit) {
      // Check collision with enemies
      for (const enemy of gameState.enemies) {
        if (!enemy.active) continue;
        
        const dx = enemy.x - attackHit.x;
        const dy = enemy.y - attackHit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < attackHit.radius + enemy.width / 2) {
          const died = enemy.takeDamage(attackHit.damage, p);
          if (died) {
            gameState.experience += enemy.xp;
            gameState.score += enemy.xp;
            checkLevelUp();
          }
        }
      }
    }
  }

  // Interact
  if (inputs.interact) {
    // Check destructibles
    for (const obj of gameState.destructibles) {
      if (!obj.active) continue;
      
      const dx = player.x - obj.x;
      const dy = player.y - obj.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 50) {
        obj.interact(p);
      }
    }

    // Check crafting stations
    for (const station of gameState.craftingStations) {
      const dx = player.x - station.x;
      const dy = player.y - station.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < station.interactRange) {
        // Try to craft available items
        for (const recipe of gameState.unlockedRecipes) {
          if (station.canCraft(recipe)) {
            station.craft(recipe);
            break;
          }
        }
      }
    }

    // Check escape point
    if (gameState.escapePoint) {
      const dx = player.x - gameState.escapePoint.x;
      const dy = player.y - gameState.escapePoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < gameState.escapePoint.interactRange) {
        gameState.escapePoint.activate();
      }
    }
  }

  // Log player info
  p.logs.player_info.push({
    screen_x: player.x - gameState.camera.x,
    screen_y: player.y - gameState.camera.y,
    game_x: player.x,
    game_y: player.y,
    framecount: p.frameCount
  });
}

function checkLevelUp() {
  if (gameState.experience >= gameState.experienceToNextLevel) {
    gameState.level++;
    gameState.experience -= gameState.experienceToNextLevel;
    gameState.experienceToNextLevel = Math.floor(gameState.experienceToNextLevel * 1.5);
    
    // Unlock new recipes
    if (gameState.level >= 2 && !gameState.unlockedRecipes.includes("iron_sword")) {
      gameState.unlockedRecipes.push("iron_sword", "iron_pickaxe");
    }
    if (gameState.level >= 4 && !gameState.unlockedRecipes.includes("steel_axe")) {
      gameState.unlockedRecipes.push("steel_axe", "steel_hammer");
    }
  }
}