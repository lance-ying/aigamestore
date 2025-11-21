// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;

  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PARTY_SELECT;
      return;
    } else if (gameState.gamePhase === GAME_PHASES.PARTY_SELECT && gameState.partySize > 0) {
      startGame();
      return;
    }
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      return;
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      return;
    }
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame();
      return;
    }
  }

  // Phase-specific inputs
  if (gameState.gamePhase === GAME_PHASES.PARTY_SELECT) {
    handlePartySelectInput(keyCode);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handlePlayingInput(keyCode);
  } else if (gameState.gamePhase === GAME_PHASES.COMBAT) {
    handleCombatInput(keyCode);
  } else if (gameState.gamePhase === GAME_PHASES.INVENTORY) {
    handleInventoryInput(keyCode);
  }
}

function handlePartySelectInput(keyCode) {
  const classNames = Object.keys(require('./globals.js').HERO_CLASSES);
  
  if (keyCode === 37) { // LEFT
    gameState.selectedHeroClass = (gameState.selectedHeroClass - 1 + classNames.length) % classNames.length;
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedHeroClass = (gameState.selectedHeroClass + 1) % classNames.length;
  } else if (keyCode === 38) { // UP
    gameState.selectedPartySlot = Math.max(0, gameState.selectedPartySlot - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedPartySlot = Math.min(gameState.maxPartySize - 1, gameState.selectedPartySlot + 1);
  } else if (keyCode === 32) { // SPACE
    addHeroToParty();
  }
}

function handlePlayingInput(keyCode) {
  if (!gameState.player) return;
  
  const now = Date.now();
  if (now - gameState.lastMoveTime < 150) return; // Movement cooldown
  
  let newX = gameState.player.x;
  let newY = gameState.player.y;
  
  if (keyCode === 37) { // LEFT
    newX--;
  } else if (keyCode === 39) { // RIGHT
    newX++;
  } else if (keyCode === 38) { // UP
    newY--;
  } else if (keyCode === 40) { // DOWN
    newY++;
  }
  
  if (newX !== gameState.player.x || newY !== gameState.player.y) {
    tryMove(newX, newY);
    gameState.lastMoveTime = now;
  }
}

function handleCombatInput(keyCode) {
  if (!gameState.combat || gameState.combat.actionInProgress) return;
  
  const combat = gameState.combat;
  
  if (!combat.isHeroTurn()) return;
  
  if (combat.menuState === "main") {
    if (keyCode === 32) { // SPACE - basic attack
      combat.menuState = "target";
      combat.selectedTargetIndex = 0;
    } else if (keyCode === 16) { // SHIFT - skills
      combat.menuState = "skills";
      combat.selectedSkillIndex = 0;
    }
  } else if (combat.menuState === "skills") {
    const hero = combat.getCurrentActor();
    if (keyCode === 38) { // UP
      combat.selectedSkillIndex = Math.max(0, combat.selectedSkillIndex - 1);
    } else if (keyCode === 40) { // DOWN
      combat.selectedSkillIndex = Math.min(hero.skills.length - 1, combat.selectedSkillIndex + 1);
    } else if (keyCode === 32) { // SPACE - select skill
      const skill = hero.skills[combat.selectedSkillIndex];
      if (skill.target === "single" || skill.target === "ally") {
        combat.menuState = "target";
        combat.selectedTargetIndex = 0;
      } else {
        // AoE or self-target skills
        combat.executeHeroAction({
          type: "skill",
          skill: skill,
          target: hero
        });
        combat.menuState = "main";
      }
    } else if (keyCode === 90) { // Z - back
      combat.menuState = "main";
    }
  } else if (combat.menuState === "target") {
    const targets = combat.enemies.filter(e => e.alive);
    if (keyCode === 38) { // UP
      combat.selectedTargetIndex = Math.max(0, combat.selectedTargetIndex - 1);
    } else if (keyCode === 40) { // DOWN
      combat.selectedTargetIndex = Math.min(targets.length - 1, combat.selectedTargetIndex + 1);
    } else if (keyCode === 32) { // SPACE - confirm target
      const target = targets[combat.selectedTargetIndex];
      const hero = combat.getCurrentActor();
      
      if (combat.selectedAction) {
        combat.executeHeroAction({
          type: "skill",
          skill: combat.selectedAction,
          target: target
        });
        combat.selectedAction = null;
      } else {
        combat.executeHeroAction({
          type: "attack",
          target: target
        });
      }
      combat.menuState = "main";
    } else if (keyCode === 90) { // Z - back
      combat.menuState = combat.selectedAction ? "skills" : "main";
      combat.selectedAction = null;
    }
  }
}

function handleInventoryInput(keyCode) {
  // Simplified inventory - just exit
  if (keyCode === 90 || keyCode === 27) { // Z or ESC
    gameState.gamePhase = GAME_PHASES.PLAYING;
  }
}

function addHeroToParty() {
  if (gameState.partySize >= gameState.maxPartySize) return;
  
  const { Hero } = require('./entities.js');
  const { HERO_CLASSES } = require('./globals.js');
  const classNames = Object.keys(HERO_CLASSES);
  const className = classNames[gameState.selectedHeroClass];
  
  const hero = new Hero(className, 0, 0);
  gameState.party.push(hero);
  gameState.partySize++;
}

function startGame() {
  const { Dungeon } = require('./dungeon.js');
  const p = window.gameInstance;
  
  gameState.dungeon = new Dungeon(gameState.dungeonLevel, p);
  gameState.player = gameState.party[0];
  gameState.player.x = gameState.dungeon.startX;
  gameState.player.y = gameState.dungeon.startY;
  
  for (const hero of gameState.party) {
    hero.x = gameState.player.x;
    hero.y = gameState.player.y;
  }
  
  gameState.dungeon.revealArea(gameState.player.x, gameState.player.y, 3);
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, dungeonLevel: gameState.dungeonLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function tryMove(newX, newY) {
  const dungeon = gameState.dungeon;
  
  if (!dungeon.isWalkable(newX, newY)) return;
  
  // Check for enemy
  const enemy = dungeon.getEnemyAt(newX, newY);
  if (enemy) {
    startCombat([enemy]);
    return;
  }
  
  // Move player
  gameState.player.x = newX;
  gameState.player.y = newY;
  
  for (const hero of gameState.party) {
    hero.x = newX;
    hero.y = newY;
  }
  
  dungeon.revealArea(newX, newY, 3);
  
  // Check for stairs
  const tile = dungeon.getTile(newX, newY);
  if (tile && tile.type === "stairs") {
    nextLevel();
  } else if (tile && tile.type === "chest" && !tile.opened) {
    openChest(tile);
  }
  
  // Log player position
  const p = window.gameInstance;
  p.logs.player_info.push({
    screen_x: newX * require('./globals.js').TILE_SIZE,
    screen_y: newY * require('./globals.js').TILE_SIZE,
    game_x: newX,
    game_y: newY,
    framecount: p.frameCount
  });
}

function startCombat(enemies) {
  const { Combat } = require('./combat.js');
  const p = window.gameInstance;
  
  gameState.combat = new Combat(enemies, p);
  gameState.gamePhase = GAME_PHASES.COMBAT;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, enemyCount: enemies.length },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function nextLevel() {
  const { Dungeon } = require('./dungeon.js');
  const p = window.gameInstance;
  
  gameState.dungeonLevel++;
  
  if (gameState.dungeonLevel > 5) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  gameState.dungeon = new Dungeon(gameState.dungeonLevel, p);
  gameState.player.x = gameState.dungeon.startX;
  gameState.player.y = gameState.dungeon.startY;
  
  for (const hero of gameState.party) {
    hero.x = gameState.player.x;
    hero.y = gameState.player.y;
  }
  
  gameState.dungeon.revealArea(gameState.player.x, gameState.player.y, 3);
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, dungeonLevel: gameState.dungeonLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function openChest(tile) {
  const { Item } = require('./entities.js');
  
  tile.opened = true;
  const numItems = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numItems; i++) {
    gameState.inventory.push(new Item(gameState.dungeonLevel));
  }
  gameState.score += 20;
}

function resetGame() {
  const p = window.gameInstance;
  
  gameState.party = [];
  gameState.player = null;
  gameState.dungeon = null;
  gameState.dungeonLevel = 1;
  gameState.score = 0;
  gameState.combat = null;
  gameState.inventory = [];
  gameState.partySize = 0;
  gameState.selectedPartySlot = 0;
  gameState.selectedHeroClass = 0;
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export { startGame, tryMove, startCombat, nextLevel, openChest, resetGame, addHeroToParty };