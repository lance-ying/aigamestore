// world.js - World generation and management
import { gameState, WORLD_WIDTH, WORLD_HEIGHT, ZONES } from './globals.js';
import { Destructible } from './destructible.js';
import { Enemy } from './enemy.js';
import { Outpost, CraftingStation, EscapePoint } from './outpost.js';

export function generateWorld(p) {
  // Clear existing entities
  gameState.destructibles = [];
  gameState.enemies = [];
  gameState.outposts = [];
  gameState.craftingStations = [];

  // Generate destructible objects
  const objectTypes = ["tree", "rock", "crate", "barrel", "bush"];
  const objectCounts = {
    tree: 30,
    rock: 25,
    crate: 20,
    barrel: 15,
    bush: 25
  };

  for (const [type, count] of Object.entries(objectCounts)) {
    for (let i = 0; i < count; i++) {
      const x = p.random(50, WORLD_WIDTH - 50);
      const y = p.random(50, WORLD_HEIGHT - 50);
      gameState.destructibles.push(new Destructible(x, y, type));
    }
  }

  // Generate enemies in zones
  for (const zone of ZONES) {
    for (let i = 0; i < zone.enemyCount; i++) {
      const x = zone.x + p.random(50, zone.width - 50);
      const y = zone.y + p.random(50, zone.height - 50);
      const enemy = new Enemy(x, y, zone.type);
      enemy.zoneId = zone.id;
      gameState.enemies.push(enemy);
    }
  }

  // Create outposts at zone centers
  for (const zone of ZONES) {
    const outpost = new Outpost(
      zone.x + zone.width / 2,
      zone.y + zone.height / 2
    );
    gameState.outposts.push(outpost);
  }

  // Create crafting stations
  gameState.craftingStations.push(new CraftingStation(150, 150));
  gameState.craftingStations.push(new CraftingStation(900, 300));
  gameState.craftingStations.push(new CraftingStation(500, 800));

  // Create escape point
  gameState.escapePoint = new EscapePoint(WORLD_WIDTH - 150, WORLD_HEIGHT - 150);

  // Add all to entities list
  gameState.entities = [
    ...gameState.destructibles,
    ...gameState.enemies,
    ...gameState.outposts,
    ...gameState.craftingStations,
    gameState.escapePoint
  ];
}

export function updateWorld(p) {
  // Check zone clearing
  for (const zone of ZONES) {
    if (gameState.clearedZones.includes(zone.id)) continue;

    const zoneEnemies = gameState.enemies.filter(e => e.zoneId === zone.id && e.active);
    if (zoneEnemies.length === 0) {
      gameState.clearedZones.push(zone.id);
      // Activate corresponding outpost
      const outpost = gameState.outposts[zone.id];
      if (outpost) {
        outpost.activate();
      }
    }
  }

  // Update enemies
  for (const enemy of gameState.enemies) {
    if (enemy.active) {
      enemy.update(p, gameState.player);
    }
  }
}

export function renderWorld(p, camera) {
  // Render ground
  p.background(80, 100, 70);

  // Render zones
  for (const zone of ZONES) {
    const screenX = zone.x - camera.x;
    const screenY = zone.y - camera.y;
    
    if (gameState.clearedZones.includes(zone.id)) {
      p.fill(90, 120, 80, 100);
    } else {
      p.fill(100, 70, 70, 100);
    }
    p.noStroke();
    p.rect(screenX, screenY, zone.width, zone.height, 10);
  }

  // Render destructibles
  for (const obj of gameState.destructibles) {
    obj.render(p, camera);
  }

  // Render crafting stations
  for (const station of gameState.craftingStations) {
    station.render(p, camera);
  }

  // Render outposts
  for (const outpost of gameState.outposts) {
    outpost.render(p, camera);
  }

  // Render escape point
  gameState.escapePoint.render(p, camera);

  // Render enemies
  for (const enemy of gameState.enemies) {
    enemy.render(p, camera);
  }

  // Render player
  if (gameState.player) {
    gameState.player.render(p, camera);
  }
}