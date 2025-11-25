// game_logic.js - Core game logic

import { gameState, GAME_PHASES, PLAY_MODES, FOOD_TYPES, SKILLS } from './globals.js';
import { DragonGirl, Enemy } from './entities.js';

export function initGame(p) {
  gameState.player = new DragonGirl(150, 250);
  gameState.entities = [gameState.player];
  gameState.score = 0;
  gameState.day = 1;
  gameState.gold = 100;
  gameState.playMode = PLAY_MODES.TRAINING;
  gameState.selectedMenuItem = 0;
  gameState.currentEnemy = null;
  gameState.battleTurn = "player";
  gameState.selectedSkill = 0;
  gameState.message = "";
  gameState.messageTimer = 0;
  gameState.defeatedEnemies = 0;
  gameState.bossDefeated = false;
  gameState.eventHistory = [];
  
  updateMenuItems();
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: "PLAYING", day: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  logPlayerInfo(p);
}

export function updateMenuItems() {
  if (gameState.playMode === PLAY_MODES.TRAINING) {
    gameState.menuItems = [
      { type: "action", label: "Feed Dragon", action: "feed" },
      { type: "action", label: "Go on Adventure", action: "adventure" },
      { type: "action", label: "Rest (Next Day)", action: "rest" },
      { type: "info", label: `Day: ${gameState.day}/${gameState.maxDays}` },
      { type: "info", label: `Gold: ${gameState.gold}` }
    ];
  } else if (gameState.playMode === "feed_menu") {
    gameState.menuItems = [
      { type: "food", label: "Meat", food: FOOD_TYPES.MEAT },
      { type: "food", label: "Fish", food: FOOD_TYPES.FISH },
      { type: "food", label: "Bread", food: FOOD_TYPES.BREAD },
      { type: "food", label: "Fruit", food: FOOD_TYPES.FRUIT },
      { type: "food", label: "Gem", food: FOOD_TYPES.GEM },
      { type: "food", label: "Rock", food: FOOD_TYPES.ROCK },
      { type: "food", label: "Iron", food: FOOD_TYPES.IRON },
      { type: "food", label: "Potion", food: FOOD_TYPES.POTION },
      { type: "food", label: "Dragon Fruit", food: FOOD_TYPES.DRAGON_FRUIT },
      { type: "action", label: "Back", action: "back" }
    ];
  }
}

export function handleMenuSelection(p) {
  const item = gameState.menuItems[gameState.selectedMenuItem];
  
  if (item.type === "action") {
    if (item.action === "feed") {
      gameState.playMode = "feed_menu";
      gameState.selectedMenuItem = 0;
      updateMenuItems();
    } else if (item.action === "adventure") {
      startBattle(p);
    } else if (item.action === "rest") {
      advanceDay(p);
    } else if (item.action === "back") {
      gameState.playMode = PLAY_MODES.TRAINING;
      gameState.selectedMenuItem = 0;
      updateMenuItems();
    }
  } else if (item.type === "food") {
    if (gameState.gold >= item.food.cost) {
      gameState.gold -= item.food.cost;
      gameState.player.feed(item.food);
      gameState.score += 10;
      setMessage(`Fed ${item.food.name}! Stats increased!`);
      gameState.playMode = PLAY_MODES.TRAINING;
      gameState.selectedMenuItem = 0;
      updateMenuItems();
      logPlayerInfo(p);
    } else {
      setMessage("Not enough gold!");
    }
  }
}

export function startBattle(p) {
  gameState.playMode = PLAY_MODES.BATTLE;
  
  // Check if it's time for the final boss
  if (gameState.day >= 350 && !gameState.bossDefeated) {
    gameState.currentEnemy = new Enemy(450, 250, "boss", gameState.day);
    setMessage("The World Catastrophe appears!");
  } else {
    // Random enemy based on day
    const enemyTypes = gameState.day < 100 ? ["slime"] :
                       gameState.day < 200 ? ["slime", "goblin"] :
                       ["slime", "goblin", "dragon"];
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    gameState.currentEnemy = new Enemy(450, 250, randomType, gameState.day);
  }
  
  gameState.entities.push(gameState.currentEnemy);
  gameState.battleTurn = "player";
  gameState.selectedSkill = 0;
  
  p.logs.game_info.push({
    data: { event: "battle_start", enemy: gameState.currentEnemy.name },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handleBattleAction(p) {
  if (gameState.battleTurn !== "player") return;
  
  const skill = gameState.player.skills[gameState.selectedSkill];
  if (!skill) return;
  
  if (skill.type === "attack") {
    const damage = skill.damage + gameState.player.attack;
    const actualDamage = gameState.currentEnemy.takeDamage(damage);
    setMessage(`${skill.name} deals ${actualDamage} damage!`);
    gameState.score += actualDamage;
  } else if (skill.type === "heal") {
    const healed = gameState.player.heal(skill.heal);
    setMessage(`Healed ${healed} HP!`);
  } else if (skill.type === "defense") {
    gameState.player.defense += skill.defense;
    setMessage(`Defense increased by ${skill.defense}!`);
  }
  
  // Check if enemy defeated
  if (gameState.currentEnemy.hp <= 0) {
    endBattle(p, true);
    return;
  }
  
  // Enemy turn
  gameState.battleTurn = "enemy";
  setTimeout(() => {
    enemyTurn(p);
  }, 500);
}

function enemyTurn(p) {
  const damage = gameState.currentEnemy.attack_enemy();
  const actualDamage = gameState.player.takeDamage(damage);
  setMessage(`${gameState.currentEnemy.name} attacks for ${actualDamage} damage!`);
  
  // Check if player defeated
  if (gameState.player.hp <= 0) {
    endBattle(p, false);
    return;
  }
  
  gameState.battleTurn = "player";
}

function endBattle(p, victory) {
  if (victory) {
    gameState.player.gainExperience(gameState.currentEnemy.expReward);
    gameState.gold += gameState.currentEnemy.goldReward;
    gameState.score += gameState.currentEnemy.expReward;
    gameState.defeatedEnemies++;
    
    if (gameState.currentEnemy.type === "boss") {
      gameState.bossDefeated = true;
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    setMessage(`Victory! Gained ${gameState.currentEnemy.expReward} EXP and ${gameState.currentEnemy.goldReward} gold!`);
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Remove enemy from entities
  gameState.entities = gameState.entities.filter(e => e !== gameState.currentEnemy);
  gameState.currentEnemy = null;
  gameState.playMode = PLAY_MODES.TRAINING;
  gameState.selectedMenuItem = 0;
  updateMenuItems();
  
  p.logs.game_info.push({
    data: { event: "battle_end", victory: victory },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function advanceDay(p) {
  gameState.day++;
  gameState.player.hp = Math.min(gameState.player.hp + 10, gameState.player.maxHP);
  gameState.gold += 20;
  
  if (gameState.day > gameState.maxDays) {
    // Time ran out
    if (gameState.bossDefeated) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      setMessage("Time ran out! The catastrophe has arrived!");
    }
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, reason: "time_limit" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    setMessage(`Day ${gameState.day} begins!`);
    updateMenuItems();
  }
  
  logPlayerInfo(p);
}

function setMessage(msg) {
  gameState.message = msg;
  gameState.messageTimer = 120; // 2 seconds at 60 FPS
}

export function updateGame(p) {
  // Update message timer
  if (gameState.messageTimer > 0) {
    gameState.messageTimer--;
    if (gameState.messageTimer === 0) {
      gameState.message = "";
    }
  }
  
  // Update entities
  for (const entity of gameState.entities) {
    entity.update();
  }
}

function logPlayerInfo(p) {
  if (!gameState.player) return;
  
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.player.y,
    framecount: p.frameCount
  });
}