import { gameState, GAME_PHASES, SCREEN_MODES, HERO_CLASSES, addFloatingText, addParticles, addFlashEffect, triggerResourceAnimation } from './globals.js';
import { Hero } from './hero.js';
import { generateDungeon, canMoveTo, exploreCell } from './dungeon.js';
import { startCombat, updateCombat, heroAttack, heroAbility } from './combat.js';

export function initializeGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.controlMode = "HUMAN";
  gameState.screenMode = SCREEN_MODES.BASE;
  
  gameState.population = 10;
  gameState.workers = { food: 0, materials: 0 };
  gameState.resources = { food: 50, materials: 20 };
  gameState.resourceTimer = 0;
  
  gameState.heroes = [];
  gameState.selectedHeroIndex = 0;
  gameState.party = [];
  
  gameState.currentZone = 1;
  gameState.dungeonMap = [];
  gameState.playerX = 0;
  gameState.playerY = 0;
  gameState.exploredCells = [];
  gameState.dungeonProgress = 0;
  
  gameState.inCombat = false;
  gameState.enemies = [];
  gameState.combatLog = [];
  gameState.selectedPartyMember = 0;
  gameState.turnTimer = 0;
  
  gameState.score = 0;
  gameState.experience = 0;
  gameState.gold = 0;
  gameState.arenaUnlocked = false;
  
  gameState.menuSelection = 0;
  gameState.menuOptions = [];
  gameState.menuScrollOffset = 0;
  
  gameState.actionFeedback = {
    type: null,
    timer: 0,
    message: ""
  };
  
  gameState.floatingTexts = [];
  gameState.particles = [];
  gameState.flashEffects = [];
  gameState.resourceAnimations = { food: 0, materials: 0 };
  
  gameState.testingState = {
    actionQueue: [],
    waitFrames: 0,
    phase: "INIT"
  };
  
  if (p && p.logs) {
    p.logs.game_info.push({
      data: { event: "game_initialized", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.screenMode = SCREEN_MODES.BASE;
  
  if (p && p.logs) {
    p.logs.game_info.push({
      data: { event: "game_started", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Update resources
  updateResources(p);
  
  // Update combat if active
  if (gameState.inCombat) {
    updateCombat(p);
  }
  
  // Update visual effects
  updateVisualEffects(p);
  
  // Update visual feedback timer
  if (gameState.actionFeedback.timer > 0) {
    gameState.actionFeedback.timer--;
    if (gameState.actionFeedback.timer <= 0) {
      gameState.actionFeedback.type = null;
      gameState.actionFeedback.message = "";
    }
  }
  
  // Log player info periodically
  if (p.frameCount % 60 === 0 && gameState.party.length > 0) {
    const player = gameState.party[0];
    p.logs.player_info.push({
      screen_x: gameState.playerX,
      screen_y: gameState.playerY,
      game_x: gameState.playerX,
      game_y: gameState.playerY,
      framecount: p.frameCount
    });
  }
}

export function updateVisualEffects(p) {
  // Update floating texts
  gameState.floatingTexts = gameState.floatingTexts.filter(text => {
    text.x += text.vx;
    text.y += text.vy;
    text.timer--;
    return text.timer > 0;
  });
  
  // Update particles
  gameState.particles = gameState.particles.filter(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.1; // Gravity
    particle.timer--;
    return particle.timer > 0;
  });
  
  // Update flash effects
  gameState.flashEffects = gameState.flashEffects.filter(flash => {
    flash.timer--;
    return flash.timer > 0;
  });
  
  // Update resource animations
  if (gameState.resourceAnimations.food > 0) {
    gameState.resourceAnimations.food--;
  }
  if (gameState.resourceAnimations.materials > 0) {
    gameState.resourceAnimations.materials--;
  }
}

export function updateResources(p) {
  gameState.resourceTimer++;
  
  const speedMultiplier = p.keyIsDown(16) ? 10 : 1; // Shift for speed up
  
  if (gameState.resourceTimer >= 60 / speedMultiplier) {
    gameState.resourceTimer = 0;
    
    // Generate resources
    const foodGain = gameState.workers.food * 0.5;
    const materialsGain = gameState.workers.materials * 0.3;
    
    if (foodGain > 0) {
      gameState.resources.food += foodGain;
      triggerResourceAnimation('food');
    }
    
    if (materialsGain > 0) {
      gameState.resources.materials += materialsGain;
      triggerResourceAnimation('materials');
    }
    
    // Consume food
    const foodConsumption = gameState.population * 0.1;
    gameState.resources.food = Math.max(0, gameState.resources.food - foodConsumption);
  }
}

function showActionFeedback(type, message) {
  gameState.actionFeedback = {
    type: type,
    timer: 60,
    message: message
  };
}

export function handleBaseInput(keyCode, p) {
  const menuOptions = ["Manage Workers", "Recruit Hero", "View Heroes", "Enter Dungeon"];
  const maxVisibleItems = 4;
  
  if (keyCode === 38) { // Up arrow
    gameState.menuSelection = (gameState.menuSelection - 1 + menuOptions.length) % menuOptions.length;
    
    // Update scroll offset for scrolling
    if (gameState.menuSelection < gameState.menuScrollOffset) {
      gameState.menuScrollOffset = gameState.menuSelection;
    }
  } else if (keyCode === 40) { // Down arrow
    gameState.menuSelection = (gameState.menuSelection + 1) % menuOptions.length;
    
    // Update scroll offset for scrolling
    if (gameState.menuSelection >= gameState.menuScrollOffset + maxVisibleItems) {
      gameState.menuScrollOffset = gameState.menuSelection - maxVisibleItems + 1;
    }
  } else if (keyCode === 32) { // Space
    switch (gameState.menuSelection) {
      case 0: // Manage Workers
        showWorkerMenu(p);
        break;
      case 1: // Recruit Hero
        recruitHero(p);
        break;
      case 2: // View Heroes
        gameState.screenMode = SCREEN_MODES.HEROES;
        gameState.selectedHeroIndex = 0;
        showActionFeedback("info", "Viewing Heroes");
        break;
      case 3: // Enter Dungeon
        if (gameState.party.length > 0) {
          enterDungeon(p);
        } else {
          showActionFeedback("error", "Need at least 1 hero in party!");
        }
        break;
    }
  }
}

function showWorkerMenu(p) {
  // Simple worker allocation - cycle through food/materials
  if (gameState.menuSelection === 0) {
    const idle = gameState.population - gameState.workers.food - gameState.workers.materials;
    if (idle > 0) {
      gameState.workers.food++;
      showActionFeedback("success", "Assigned worker to Food production");
    } else if (gameState.workers.food > 0) {
      gameState.workers.food--;
      gameState.workers.materials++;
      showActionFeedback("success", "Reassigned worker to Materials");
    } else if (gameState.workers.materials > 0) {
      gameState.workers.materials = 0;
      showActionFeedback("success", "Workers now idle");
    }
  }
}

function recruitHero(p) {
  const cost = { food: 20, materials: 10 };
  
  if (gameState.resources.food >= cost.food && gameState.resources.materials >= cost.materials) {
    gameState.resources.food -= cost.food;
    gameState.resources.materials -= cost.materials;
    
    const classIndex = gameState.heroes.length % HERO_CLASSES.length;
    const heroClass = HERO_CLASSES[classIndex].name;
    const newHero = new Hero(heroClass);
    
    gameState.heroes.push(newHero);
    gameState.score += 50;
    
    showActionFeedback("success", `Recruited ${heroClass}!`);
    
    // Visual feedback
    addParticles(450, 300, 15, [100, 200, 255]);
    
    if (p && p.logs) {
      p.logs.game_info.push({
        data: { event: "hero_recruited", class: heroClass },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else {
    showActionFeedback("error", "Not enough resources!");
  }
}

export function handleHeroesInput(keyCode, p) {
  if (keyCode === 27) { // ESC - back to base
    gameState.screenMode = SCREEN_MODES.BASE;
    return;
  }
  
  if (gameState.heroes.length === 0) return;
  
  if (keyCode === 38) { // Up arrow
    gameState.selectedHeroIndex = Math.max(0, gameState.selectedHeroIndex - 1);
  } else if (keyCode === 40) { // Down arrow
    gameState.selectedHeroIndex = Math.min(gameState.heroes.length - 1, gameState.selectedHeroIndex + 1);
  } else if (keyCode === 32) { // Space - add/remove from party
    const hero = gameState.heroes[gameState.selectedHeroIndex];
    const partyIndex = gameState.party.indexOf(hero);
    
    if (partyIndex >= 0) {
      gameState.party.splice(partyIndex, 1);
      showActionFeedback("info", `${hero.class} removed from party`);
    } else if (gameState.party.length < 4) {
      gameState.party.push(hero);
      showActionFeedback("success", `${hero.class} added to party!`);
    }
  }
}

function enterDungeon(p) {
  gameState.screenMode = SCREEN_MODES.DUNGEON;
  gameState.dungeonMap = generateDungeon(gameState.currentZone, p);
  gameState.playerX = 0;
  gameState.playerY = 0;
  gameState.exploredCells = [];
  gameState.dungeonProgress = 0;
  
  exploreCell(0, 0);
  gameState.dungeonMap[0][0].explored = true;
  
  showActionFeedback("info", `Entering Zone ${gameState.currentZone} Dungeon`);
  
  if (p && p.logs) {
    p.logs.game_info.push({
      data: { event: "dungeon_entered", zone: gameState.currentZone },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function handleDungeonInput(keyCode, p) {
  if (gameState.inCombat) {
    handleCombatInput(keyCode, p);
    return;
  }
  
  if (keyCode === 27) { // ESC - back to base
    gameState.screenMode = SCREEN_MODES.BASE;
    return;
  }
  
  let newX = gameState.playerX;
  let newY = gameState.playerY;
  
  if (keyCode === 37) newX--; // Left
  if (keyCode === 39) newX++; // Right
  if (keyCode === 38) newY--; // Up
  if (keyCode === 40) newY++; // Down
  
  if (canMoveTo(gameState.dungeonMap, newX, newY)) {
    gameState.playerX = newX;
    gameState.playerY = newY;
    
    const cell = gameState.dungeonMap[newY][newX];
    cell.explored = true;
    exploreCell(newX, newY);
    
    // Handle cell events
    handleCellEvent(cell, p);
  }
}

function handleCellEvent(cell, p) {
  const map = gameState.dungeonMap;
  const cellSize = 60;
  const startX = (900 - map[0].length * cellSize) / 2;
  const startY = 80;
  const cellX = startX + gameState.playerX * cellSize + cellSize / 2;
  const cellY = startY + gameState.playerY * cellSize + cellSize / 2;
  
  if (cell.type === "enemy" && !gameState.inCombat) {
    gameState.screenMode = SCREEN_MODES.COMBAT;
    startCombat(cell.monsterType, gameState.currentZone, p);
  } else if (cell.type === "treasure") {
    gameState.gold += cell.treasure.gold;
    gameState.resources.materials += cell.treasure.materials;
    gameState.score += cell.treasure.gold * 2;
    
    // Visual feedback
    addFloatingText(cellX, cellY, `+${cell.treasure.gold} Gold`, [255, 215, 0]);
    addFloatingText(cellX, cellY + 20, `+${cell.treasure.materials} Mat`, [180, 140, 100]);
    addParticles(cellX, cellY, 20, [255, 215, 0]);
    
    cell.type = "empty";
  } else if (cell.type === "trap") {
    let totalDamage = 0;
    gameState.party.forEach(hero => {
      const damage = hero.takeDamage(cell.damage);
      totalDamage += damage;
    });
    
    // Visual feedback
    addFloatingText(cellX, cellY, `TRAP! -${Math.floor(totalDamage / gameState.party.length)}`, [255, 100, 255]);
    addParticles(cellX, cellY, 15, [255, 100, 255]);
    
    cell.type = "empty";
  } else if (cell.type === "exit") {
    gameState.currentZone++;
    gameState.score += 500;
    gameState.screenMode = SCREEN_MODES.BASE;
    
    // Heal party
    gameState.party.forEach(hero => {
      hero.health = hero.maxHealth;
    });
    
    showActionFeedback("success", `Zone ${gameState.currentZone - 1} Complete!`);
    addParticles(450, 300, 30, [100, 255, 100]);
    
    if (p && p.logs) {
      p.logs.game_info.push({
        data: { event: "zone_completed", zone: gameState.currentZone - 1 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (cell.type === "arena") {
    gameState.arenaUnlocked = true;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    if (p && p.logs) {
      p.logs.game_info.push({
        data: { event: "arena_unlocked", win: true },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function handleCombatInput(keyCode, p) {
  if (!gameState.inCombat) return;
  
  if (keyCode === 32) { // Space - attack
    heroAttack(gameState.selectedPartyMember, p);
  } else if (keyCode === 90) { // Z - ability
    heroAbility(gameState.selectedPartyMember, p);
  } else if (keyCode === 37 || keyCode === 39) { // Arrow keys - switch hero
    const aliveHeroes = gameState.party.filter(h => h.health > 0);
    if (aliveHeroes.length > 0) {
      do {
        if (keyCode === 37) {
          gameState.selectedPartyMember = (gameState.selectedPartyMember - 1 + gameState.party.length) % gameState.party.length;
        } else {
          gameState.selectedPartyMember = (gameState.selectedPartyMember + 1) % gameState.party.length;
        }
      } while (gameState.party[gameState.selectedPartyMember].health <= 0);
    }
  }
}