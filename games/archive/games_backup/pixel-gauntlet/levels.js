import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Enemy } from './enemies.js';
import { Item } from './items.js';

export class Platform {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  render() {
    this.p.push();
    this.p.fill(60, 40, 20);
    this.p.rect(this.x, this.y, this.width, this.height);
    this.p.fill(80, 60, 40);
    this.p.rect(this.x, this.y, this.width, 5);
    this.p.pop();
  }
}

export function initLevel(p, levelNumber) {
  gameState.platforms = [];
  gameState.enemies = [];
  gameState.items = [];
  gameState.entities = [];
  gameState.particles = [];
  gameState.levelObjectivesMet = false;
  gameState.bossDefeated = false;

  // Ground platform
  const ground = new Platform(p, 0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
  gameState.platforms.push(ground);

  if (levelNumber === 1) {
    // Level 1: The Rookie's Challenge
    gameState.platforms.push(new Platform(p, 100, 300, 100, 20));
    gameState.platforms.push(new Platform(p, 400, 300, 100, 20));
    gameState.platforms.push(new Platform(p, 250, 250, 100, 20));

    for (let i = 0; i < 4; i++) {
      const enemy = new Enemy(p, 100 + i * 120, 340, 'slime');
      gameState.enemies.push(enemy);
      gameState.entities.push(enemy);
    }
  } else if (levelNumber === 2) {
    // Level 2: Forest Encounter
    gameState.platforms.push(new Platform(p, 50, 320, 80, 20));
    gameState.platforms.push(new Platform(p, 200, 280, 80, 20));
    gameState.platforms.push(new Platform(p, 350, 240, 80, 20));
    gameState.platforms.push(new Platform(p, 470, 300, 80, 20));

    for (let i = 0; i < 4; i++) {
      const enemy = new Enemy(p, 80 + i * 130, 340, 'slime');
      gameState.enemies.push(enemy);
      gameState.entities.push(enemy);
    }

    const bat1 = new Enemy(p, 150, 180, 'bat');
    const bat2 = new Enemy(p, 400, 150, 'bat');
    gameState.enemies.push(bat1, bat2);
    gameState.entities.push(bat1, bat2);

    const healthPotion = new Item(p, 350, 200, 'health');
    gameState.items.push(healthPotion);
  } else if (levelNumber === 3) {
    // Level 3: Cavern Depths
    gameState.platforms.push(new Platform(p, 30, 320, 100, 20));
    gameState.platforms.push(new Platform(p, 180, 280, 100, 20));
    gameState.platforms.push(new Platform(p, 330, 240, 100, 20));
    gameState.platforms.push(new Platform(p, 480, 200, 100, 20));
    gameState.platforms.push(new Platform(p, 200, 160, 200, 20));

    for (let i = 0; i < 5; i++) {
      const enemy = new Enemy(p, 50 + i * 110, 340, 'slime');
      enemy.hp = 15;
      enemy.maxHP = 15;
      gameState.enemies.push(enemy);
      gameState.entities.push(enemy);
    }

    for (let i = 0; i < 3; i++) {
      const bat = new Enemy(p, 100 + i * 180, 120 + i * 30, 'bat');
      bat.hp = 20;
      bat.maxHP = 20;
      bat.damage = 2;
      bat.speed = 2;
      gameState.enemies.push(bat);
      gameState.entities.push(bat);
    }

    gameState.items.push(new Item(p, 300, 200, 'health'));
    gameState.items.push(new Item(p, 480, 160, 'health'));
    gameState.items.push(new Item(p, 200, 120, 'attackBoost'));
  } else if (levelNumber === 4) {
    // Level 4: Castle Siege
    gameState.platforms.push(new Platform(p, 100, 300, 150, 20));
    gameState.platforms.push(new Platform(p, 350, 260, 150, 20));
    gameState.platforms.push(new Platform(p, 200, 180, 200, 20));

    for (let i = 0; i < 6; i++) {
      const enemy = new Enemy(p, 50 + i * 90, 340, 'slime');
      enemy.hp = 20;
      enemy.maxHP = 20;
      gameState.enemies.push(enemy);
      gameState.entities.push(enemy);
    }

    for (let i = 0; i < 4; i++) {
      const bat = new Enemy(p, 120 + i * 120, 100 + (i % 2) * 40, 'bat');
      bat.hp = 25;
      bat.maxHP = 25;
      bat.speed = 2.5;
      gameState.enemies.push(bat);
      gameState.entities.push(bat);
    }

    const knight = new Enemy(p, 300, 220, 'knight');
    gameState.enemies.push(knight);
    gameState.entities.push(knight);

    gameState.items.push(new Item(p, 125, 260, 'health'));
    gameState.items.push(new Item(p, 425, 220, 'health'));
  } else if (levelNumber === 5) {
    // Level 5: The Overlord's Sanctuary
    gameState.platforms.push(new Platform(p, 150, 280, 120, 20));
    gameState.platforms.push(new Platform(p, 330, 280, 120, 20));
    gameState.platforms.push(new Platform(p, 240, 200, 120, 20));

    const boss = new Enemy(p, 270, 280, 'boss');
    gameState.enemies.push(boss);
    gameState.entities.push(boss);

    gameState.items.push(new Item(p, 50, 340, 'health'));
    gameState.items.push(new Item(p, 550, 340, 'attackBoost'));
  }
}

export function checkLevelObjectives() {
  // Check if all enemies are defeated
  const aliveEnemies = gameState.enemies.filter(e => !e.isDead);
  if (aliveEnemies.length === 0) {
    gameState.levelObjectivesMet = true;
    gameState.score += 100; // Level completion bonus
  }
}