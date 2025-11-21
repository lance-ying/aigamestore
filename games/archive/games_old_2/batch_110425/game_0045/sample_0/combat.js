import { gameState, TILE_TYPES, GAME_PHASES } from './globals.js';
import { spawnEnemies, refillGrid } from './grid.js';

export function processPath(p) {
  if (gameState.currentPath.length === 0) return;
  
  let totalDamage = 0;
  let totalDefense = 0;
  let totalGold = 0;
  let totalHealth = 0;
  let targetsHit = [];
  
  // Process each tile in the path
  for (const pathTile of gameState.currentPath) {
    const tile = gameState.grid[pathTile.y][pathTile.x];
    
    switch (tile.type) {
      case TILE_TYPES.WEAPON:
        totalDamage += tile.value + Math.floor(gameState.attack * 0.5);
        break;
      case TILE_TYPES.MAGIC:
        totalDamage += tile.value + Math.floor(gameState.magicPower * 0.7);
        break;
      case TILE_TYPES.DEFENSE:
        totalDefense += tile.value;
        break;
      case TILE_TYPES.GOLD:
        totalGold += tile.value;
        break;
      case TILE_TYPES.HEALTH:
        totalHealth += tile.value;
        break;
      case TILE_TYPES.ENEMY:
      case TILE_TYPES.SPECIAL_ENEMY:
        targetsHit.push(tile);
        break;
      case TILE_TYPES.ABILITY:
        unlockAbility(tile.abilityIndex);
        break;
    }
  }
  
  // Apply damage to enemies
  if (totalDamage > 0 && targetsHit.length > 0) {
    const damagePerEnemy = totalDamage / targetsHit.length;
    
    for (const enemy of targetsHit) {
      enemy.health -= damagePerEnemy;
      
      if (enemy.health <= 0) {
        const exp = enemy.type === TILE_TYPES.SPECIAL_ENEMY ? 50 : 20;
        const goldReward = enemy.type === TILE_TYPES.SPECIAL_ENEMY ? 100 : 30;
        
        gameState.experience += exp;
        gameState.gold += goldReward;
        gameState.score += enemy.type === TILE_TYPES.SPECIAL_ENEMY ? 500 : 100;
        
        if (enemy.type === TILE_TYPES.SPECIAL_ENEMY) {
          gameState.specialMonstersDefeated++;
        }
        
        // Remove enemy from board
        const index = gameState.enemiesOnBoard.indexOf(enemy);
        if (index > -1) {
          gameState.enemiesOnBoard.splice(index, 1);
        }
        
        gameState.grid[enemy.y][enemy.x] = { type: TILE_TYPES.EMPTY, x: enemy.x, y: enemy.y };
      }
    }
  }
  
  // Apply bonuses
  gameState.gold += totalGold;
  gameState.health = Math.min(gameState.maxHealth, gameState.health + totalHealth);
  
  // Clear used tiles
  for (const pathTile of gameState.currentPath) {
    const tile = gameState.grid[pathTile.y][pathTile.x];
    if (tile.type !== TILE_TYPES.ENEMY && tile.type !== TILE_TYPES.SPECIAL_ENEMY) {
      gameState.grid[pathTile.y][pathTile.x] = { type: TILE_TYPES.EMPTY, x: pathTile.x, y: pathTile.y };
    }
  }
  
  // Check level up
  while (gameState.experience >= gameState.experienceToLevel) {
    levelUp();
  }
  
  // Apply temporary defense for this turn
  gameState.temporaryDefense = totalDefense;
  
  gameState.currentPath = [];
  
  // Enemy turn
  enemyTurn(p);
  
  // Refill grid
  refillGrid(p);
  
  // Spawn new enemies periodically
  if (gameState.turnCount % 3 === 0) {
    spawnEnemies(p, 1 + Math.floor(gameState.turnCount / 10));
  }
  
  gameState.turnCount++;
  
  // Check win condition
  if (gameState.specialMonstersDefeated >= 25) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.GAME_OVER_WIN, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function enemyTurn(p) {
  let totalDamage = 0;
  
  for (const enemy of gameState.enemiesOnBoard) {
    enemy.moveTimer--;
    
    if (enemy.moveTimer <= 0) {
      totalDamage += enemy.damage;
      enemy.moveTimer = p.floor(p.random(2, 5));
    }
  }
  
  // Apply damage to player
  const actualDamage = Math.max(0, totalDamage - gameState.defense - (gameState.temporaryDefense || 0));
  gameState.health -= actualDamage;
  gameState.temporaryDefense = 0;
  
  if (gameState.health <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.GAME_OVER_LOSE, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function levelUp() {
  gameState.level++;
  gameState.experience -= gameState.experienceToLevel;
  gameState.experienceToLevel = Math.floor(gameState.experienceToLevel * 1.5);
  
  // Increase stats
  gameState.maxHealth += 20;
  gameState.health = gameState.maxHealth;
  gameState.attack += 3;
  gameState.defense += 2;
  gameState.magicPower += 2;
  
  gameState.score += 200;
}

function unlockAbility(abilityIndex) {
  const abilities = [
    { name: "Heal", cost: 0, effect: "heal" },
    { name: "Fireball", cost: 20, effect: "damage" },
    { name: "Shield", cost: 15, effect: "defense" },
    { name: "Cleave", cost: 25, effect: "aoe" },
    { name: "Teleport", cost: 10, effect: "move" }
  ];
  
  const ability = abilities[abilityIndex % abilities.length];
  
  if (!gameState.unlockedAbilities.some(a => a.name === ability.name)) {
    gameState.unlockedAbilities.push(ability);
    if (gameState.unlockedAbilities.length === 1) {
      gameState.currentAbility = ability;
    }
  }
}

export function useAbility(p) {
  if (!gameState.currentAbility || gameState.abilityCooldown > 0) return;
  
  const ability = gameState.currentAbility;
  
  switch (ability.effect) {
    case "heal":
      gameState.health = Math.min(gameState.maxHealth, gameState.health + 30);
      gameState.abilityCooldown = 5;
      break;
    case "damage":
      // Damage all enemies on board
      for (const enemy of gameState.enemiesOnBoard) {
        enemy.health -= 40;
        if (enemy.health <= 0) {
          const exp = enemy.type === TILE_TYPES.SPECIAL_ENEMY ? 50 : 20;
          const goldReward = enemy.type === TILE_TYPES.SPECIAL_ENEMY ? 100 : 30;
          
          gameState.experience += exp;
          gameState.gold += goldReward;
          gameState.score += enemy.type === TILE_TYPES.SPECIAL_ENEMY ? 500 : 100;
          
          if (enemy.type === TILE_TYPES.SPECIAL_ENEMY) {
            gameState.specialMonstersDefeated++;
          }
          
          gameState.grid[enemy.y][enemy.x] = { type: TILE_TYPES.EMPTY, x: enemy.x, y: enemy.y };
        }
      }
      gameState.enemiesOnBoard = gameState.enemiesOnBoard.filter(e => e.health > 0);
      gameState.abilityCooldown = 8;
      break;
    case "defense":
      gameState.temporaryDefense = (gameState.temporaryDefense || 0) + 20;
      gameState.abilityCooldown = 6;
      break;
    case "aoe":
      // Damage random 3 enemies heavily
      const targets = [...gameState.enemiesOnBoard].sort(() => p.random() - 0.5).slice(0, 3);
      for (const enemy of targets) {
        enemy.health -= 60;
        if (enemy.health <= 0) {
          const exp = enemy.type === TILE_TYPES.SPECIAL_ENEMY ? 50 : 20;
          const goldReward = enemy.type === TILE_TYPES.SPECIAL_ENEMY ? 100 : 30;
          
          gameState.experience += exp;
          gameState.gold += goldReward;
          gameState.score += enemy.type === TILE_TYPES.SPECIAL_ENEMY ? 500 : 100;
          
          if (enemy.type === TILE_TYPES.SPECIAL_ENEMY) {
            gameState.specialMonstersDefeated++;
          }
          
          gameState.grid[enemy.y][enemy.x] = { type: TILE_TYPES.EMPTY, x: enemy.x, y: enemy.y };
        }
      }
      gameState.enemiesOnBoard = gameState.enemiesOnBoard.filter(e => e.health > 0);
      gameState.abilityCooldown = 10;
      break;
    case "move":
      // Teleport cursor to a random location
      gameState.cursorX = p.floor(p.random(GRID_SIZE));
      gameState.cursorY = p.floor(p.random(GRID_SIZE));
      gameState.abilityCooldown = 4;
      break;
  }
  
  // Check win condition after ability use
  if (gameState.specialMonstersDefeated >= 25) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.GAME_OVER_WIN, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}