// game_logic.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Hero, Enemy } from './entities.js';

export function initGame(p) {
  // Reset game state
  gameState.entities = [];
  gameState.party = [];
  gameState.enemies = [];
  gameState.loot = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.mission = 1;
  gameState.enemiesDefeated = 0;
  gameState.enemiesThisMission = 0;
  gameState.camera = { x: 0, y: 0 };
  gameState.dashCooldown = 0;
  gameState.specialCharge = 0;
  gameState.framesSinceLastEnemy = 0;
  
  // Create party
  const classes = ['KNIGHT', 'MAGE', 'ARCHER', 'WARRIOR'];
  const positions = [
    { x: 0, y: 0 },
    { x: -40, y: 30 },
    { x: 40, y: 30 },
    { x: 0, y: 60 }
  ];
  
  for (let i = 0; i < 4; i++) {
    const hero = new Hero(p, classes[i], positions[i], i === 0);
    gameState.party.push(hero);
    gameState.entities.push(hero);
  }
  
  gameState.player = gameState.party[0];
  
  // Spawn initial enemies
  spawnEnemiesForMission(p);
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: "PLAYING", mission: gameState.mission },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function spawnEnemiesForMission(p) {
  const tier = Math.floor(gameState.mission / 2) + 1;
  const count = gameState.enemiesPerMission + (gameState.mission - 1) * 2;
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const distance = 200 + Math.random() * 200;
    const x = gameState.player.x + Math.cos(angle) * distance;
    const y = gameState.player.y + Math.sin(angle) * distance;
    
    const enemy = new Enemy(p, x, y, tier);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
}

export function updateGame(p) {
  // Update party
  for (const hero of gameState.party) {
    hero.update();
  }
  
  // Update enemies
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    enemy.update();
    if (enemy.hp <= 0) {
      gameState.enemies.splice(i, 1);
      const idx = gameState.entities.indexOf(enemy);
      if (idx !== -1) gameState.entities.splice(idx, 1);
    }
  }
  
  // Update projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    proj.update(p);
    if (proj.life <= 0) {
      gameState.projectiles.splice(i, 1);
    }
  }
  
  // Update loot
  for (let i = gameState.loot.length - 1; i >= 0; i--) {
    const loot = gameState.loot[i];
    loot.update(p);
    if (loot.collected) {
      gameState.loot.splice(i, 1);
    }
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    if (particle.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Update camera to follow player
  gameState.camera.x = gameState.player.x;
  gameState.camera.y = gameState.player.y;
  
  // Update cooldowns
  if (gameState.dashCooldown > 0) gameState.dashCooldown--;
  
  // Check mission completion
  if (gameState.enemiesThisMission >= gameState.enemiesPerMission + (gameState.mission - 1) * 2) {
    if (gameState.enemies.length === 0) {
      completeMission(p);
    }
  }
  
  // Check lose condition
  const aliveHeroes = gameState.party.filter(h => h.hp > 0).length;
  if (aliveHeroes === 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Spawn more enemies if needed
  gameState.framesSinceLastEnemy++;
  if (gameState.enemies.length < 3 && gameState.framesSinceLastEnemy > 180 && 
      gameState.enemiesThisMission < gameState.enemiesPerMission + (gameState.mission - 1) * 2) {
    spawnAdditionalEnemy(p);
    gameState.framesSinceLastEnemy = 0;
  }
}

function spawnAdditionalEnemy(p) {
  const tier = Math.floor(gameState.mission / 2) + 1;
  const angle = Math.random() * Math.PI * 2;
  const distance = 250;
  const x = gameState.player.x + Math.cos(angle) * distance;
  const y = gameState.player.y + Math.sin(angle) * distance;
  
  const enemy = new Enemy(p, x, y, tier);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
}

function completeMission(p) {
  gameState.mission++;
  gameState.enemiesThisMission = 0;
  gameState.score += 100 * gameState.mission;
  
  // Heal party
  for (const hero of gameState.party) {
    hero.hp = Math.min(hero.hp + hero.maxHp * 0.3, hero.maxHp);
  }
  
  if (gameState.mission > gameState.totalMissions) {
    // Win!
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Next mission
    spawnEnemiesForMission(p);
    
    // Mission complete particles
    for (let i = 0; i < 30; i++) {
      gameState.particles.push({
        x: gameState.player.x + (Math.random() - 0.5) * 100,
        y: gameState.player.y + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 60,
        color: [255, 200, 50],
        size: 8
      });
    }
    
    p.logs.game_info.push({
      data: { event: "mission_complete", mission: gameState.mission - 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function handlePlayerMovement(p) {
  if (!gameState.player || gameState.player.hp <= 0) return;
  
  let moveX = 0;
  let moveY = 0;
  const moveSpeed = 3;
  
  if (gameState.keys[37] || gameState.keys.ArrowLeft) moveX -= moveSpeed;
  if (gameState.keys[39] || gameState.keys.ArrowRight) moveX += moveSpeed;
  if (gameState.keys[38] || gameState.keys.ArrowUp) moveY -= moveSpeed;
  if (gameState.keys[40] || gameState.keys.ArrowDown) moveY += moveSpeed;
  
  // Normalize diagonal movement
  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.707;
    moveY *= 0.707;
  }
  
  gameState.player.targetX = gameState.player.x + moveX;
  gameState.player.targetY = gameState.player.y + moveY;
  
  // Keep player in bounds
  gameState.player.targetX = p.constrain(
    gameState.player.targetX,
    gameState.worldBounds.minX,
    gameState.worldBounds.maxX
  );
  gameState.player.targetY = p.constrain(
    gameState.player.targetY,
    gameState.worldBounds.minY,
    gameState.worldBounds.maxY
  );
  
  // Formation follow
  for (let i = 1; i < gameState.party.length; i++) {
    const hero = gameState.party[i];
    const prevHero = gameState.party[i - 1];
    const targetDist = 35;
    
    const dx = prevHero.x - hero.x;
    const dy = prevHero.y - hero.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > targetDist) {
      hero.targetX = prevHero.x - (dx / dist) * targetDist;
      hero.targetY = prevHero.y - (dy / dist) * targetDist;
    }
  }
  
  // Dash
  if (gameState.keys[32] && gameState.dashCooldown <= 0) {
    const dashDist = 80;
    const angle = gameState.player.angle;
    gameState.player.targetX += Math.cos(angle) * dashDist;
    gameState.player.targetY += Math.sin(angle) * dashDist;
    gameState.dashCooldown = 120;
    
    // Dash effect
    for (let i = 0; i < 10; i++) {
      gameState.particles.push({
        x: gameState.player.x,
        y: gameState.player.y,
        life: 20,
        color: [150, 200, 255],
        size: 8
      });
    }
  }
  
  // Special ability
  if (gameState.keys[90] && gameState.specialCharge >= gameState.maxSpecialCharge) {
    useSpecialAbility(p);
    gameState.specialCharge = 0;
  }
  
  // Hero skills (1-4 keys)
  if (gameState.keys[49] && gameState.party[0]) gameState.party[0].useSkill();
  if (gameState.keys[50] && gameState.party[1]) gameState.party[1].useSkill();
  if (gameState.keys[51] && gameState.party[2]) gameState.party[2].useSkill();
  if (gameState.keys[52] && gameState.party[3]) gameState.party[3].useSkill();
}

function useSpecialAbility(p) {
  // Party-wide heal and damage boost
  for (const hero of gameState.party) {
    if (hero.hp > 0) {
      hero.hp = Math.min(hero.hp + hero.maxHp * 0.2, hero.maxHp);
    }
  }
  
  // Damage all enemies
  for (const enemy of gameState.enemies) {
    enemy.takeDamage(50);
  }
  
  // Big effect
  for (let i = 0; i < 50; i++) {
    gameState.particles.push({
      x: gameState.player.x + (Math.random() - 0.5) * 200,
      y: gameState.player.y + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 60,
      color: [255, 255, 100],
      size: 12
    });
  }
}

export function logPlayerInfo(p) {
  if (gameState.player && p.frameCount % 10 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x - gameState.camera.x + CANVAS_WIDTH / 2,
      screen_y: gameState.player.y - gameState.camera.y + CANVAS_HEIGHT / 2,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}