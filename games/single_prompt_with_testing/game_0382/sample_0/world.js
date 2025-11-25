// world.js - World generation and management
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Platform, Enemy, PowerGem, Boss } from './entities.js';

export function generateWorld(p, worldNumber) {
  // Clear existing entities
  gameState.platforms = [];
  gameState.enemies = [];
  gameState.powerGems = [];
  gameState.boss = null;
  
  // Clear entity arrays
  const player = gameState.player;
  gameState.entities = [player];
  gameState.projectiles = [];
  
  if (worldNumber === 1) {
    generateWorld1(p);
  } else if (worldNumber === 2) {
    generateWorld2(p);
  } else if (worldNumber === 3) {
    generateWorld3(p);
  }
}

function generateWorld1(p) {
  // World 1: Grassy beginning world
  const platformType = "grass";
  
  // Ground platforms
  gameState.platforms.push(new Platform(p, 0, 350, 300, 50, platformType));
  gameState.platforms.push(new Platform(p, 350, 350, 200, 50, platformType));
  gameState.platforms.push(new Platform(p, 600, 350, 300, 50, platformType));
  gameState.platforms.push(new Platform(p, 950, 350, 250, 50, platformType));
  
  // Mid platforms
  gameState.platforms.push(new Platform(p, 200, 280, 120, 20, platformType));
  gameState.platforms.push(new Platform(p, 450, 250, 100, 20, platformType));
  gameState.platforms.push(new Platform(p, 700, 280, 120, 20, platformType));
  gameState.platforms.push(new Platform(p, 900, 220, 100, 20, platformType));
  
  // High platforms
  gameState.platforms.push(new Platform(p, 100, 180, 80, 20, platformType));
  gameState.platforms.push(new Platform(p, 600, 160, 100, 20, platformType));
  
  // Enemies
  gameState.enemies.push(new Enemy(p, 400, 300, "basic"));
  gameState.enemies.push(new Enemy(p, 700, 230, "basic"));
  gameState.enemies.push(new Enemy(p, 300, 150, "flying"));
  
  // Power gems
  gameState.powerGems.push(new PowerGem(p, 250, 250));
  gameState.powerGems.push(new PowerGem(p, 480, 220));
  gameState.powerGems.push(new PowerGem(p, 750, 250));
  gameState.powerGems.push(new PowerGem(p, 130, 150));
  
  // Add to entities
  gameState.entities.push(...gameState.platforms);
  gameState.entities.push(...gameState.enemies);
  gameState.entities.push(...gameState.powerGems);
}

function generateWorld2(p) {
  // World 2: Industrial/Metal world
  const platformType = "normal";
  
  // Ground platforms
  gameState.platforms.push(new Platform(p, 0, 350, 250, 50, platformType));
  gameState.platforms.push(new Platform(p, 300, 350, 200, 50, platformType));
  gameState.platforms.push(new Platform(p, 550, 350, 250, 50, platformType));
  gameState.platforms.push(new Platform(p, 850, 350, 350, 50, platformType));
  
  // Mid platforms (more complex layout)
  gameState.platforms.push(new Platform(p, 150, 280, 100, 20, platformType));
  gameState.platforms.push(new Platform(p, 350, 240, 80, 20, platformType));
  gameState.platforms.push(new Platform(p, 500, 280, 100, 20, platformType));
  gameState.platforms.push(new Platform(p, 680, 240, 90, 20, platformType));
  gameState.platforms.push(new Platform(p, 850, 270, 100, 20, platformType));
  gameState.platforms.push(new Platform(p, 1000, 220, 100, 20, platformType));
  
  // High platforms
  gameState.platforms.push(new Platform(p, 80, 180, 80, 20, platformType));
  gameState.platforms.push(new Platform(p, 400, 160, 90, 20, platformType));
  gameState.platforms.push(new Platform(p, 750, 150, 100, 20, platformType));
  
  // More enemies
  gameState.enemies.push(new Enemy(p, 350, 300, "basic"));
  gameState.enemies.push(new Enemy(p, 600, 300, "basic"));
  gameState.enemies.push(new Enemy(p, 900, 300, "basic"));
  gameState.enemies.push(new Enemy(p, 250, 150, "flying"));
  gameState.enemies.push(new Enemy(p, 550, 200, "flying"));
  gameState.enemies.push(new Enemy(p, 800, 180, "flying"));
  
  // Power gems
  gameState.powerGems.push(new PowerGem(p, 180, 250));
  gameState.powerGems.push(new PowerGem(p, 380, 210));
  gameState.powerGems.push(new PowerGem(p, 530, 250));
  gameState.powerGems.push(new PowerGem(p, 710, 210));
  gameState.powerGems.push(new PowerGem(p, 110, 150));
  gameState.powerGems.push(new PowerGem(p, 780, 120));
  
  // Add to entities
  gameState.entities.push(...gameState.platforms);
  gameState.entities.push(...gameState.enemies);
  gameState.entities.push(...gameState.powerGems);
}

function generateWorld3(p) {
  // World 3: Cosmic final world with boss
  const platformType = "cosmic";
  
  // Arena-like layout for boss fight
  gameState.platforms.push(new Platform(p, 0, 350, 400, 50, platformType));
  gameState.platforms.push(new Platform(p, 450, 350, 750, 50, platformType));
  
  // Side platforms for maneuvering
  gameState.platforms.push(new Platform(p, 50, 270, 100, 20, platformType));
  gameState.platforms.push(new Platform(p, 200, 200, 100, 20, platformType));
  gameState.platforms.push(new Platform(p, 500, 270, 100, 20, platformType));
  gameState.platforms.push(new Platform(p, 700, 220, 100, 20, platformType));
  gameState.platforms.push(new Platform(p, 900, 270, 100, 20, platformType));
  gameState.platforms.push(new Platform(p, 1050, 200, 100, 20, platformType));
  
  // High platform
  gameState.platforms.push(new Platform(p, 350, 150, 100, 20, platformType));
  
  // A few enemies
  gameState.enemies.push(new Enemy(p, 300, 300, "basic"));
  gameState.enemies.push(new Enemy(p, 800, 300, "basic"));
  gameState.enemies.push(new Enemy(p, 150, 180, "flying"));
  gameState.enemies.push(new Enemy(p, 600, 190, "flying"));
  
  // Power gems
  gameState.powerGems.push(new PowerGem(p, 80, 240));
  gameState.powerGems.push(new PowerGem(p, 230, 170));
  gameState.powerGems.push(new PowerGem(p, 530, 240));
  gameState.powerGems.push(new PowerGem(p, 380, 120));
  
  // Boss - Glorkon
  gameState.boss = new Boss(p, 1000, 100);
  gameState.entities.push(gameState.boss);
  
  // Add to entities
  gameState.entities.push(...gameState.platforms);
  gameState.entities.push(...gameState.enemies);
  gameState.entities.push(...gameState.powerGems);
}