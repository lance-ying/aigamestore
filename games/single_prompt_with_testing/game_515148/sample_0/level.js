/**
 * Level Generation
 */
import { Platform, Pole, Batfly, FoodFruit, Lizard, Spear, Shelter } from './entities.js';
import { gameState, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';

export function loadLevel() {
    // Ground Floor
    gameState.platforms.push(new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 50));
    
    // Walls
    gameState.platforms.push(new Platform(-50, 0, 50, WORLD_HEIGHT)); // Left
    gameState.platforms.push(new Platform(WORLD_WIDTH, 0, 50, WORLD_HEIGHT)); // Right

    // --- Section 1: Starting Area ---
    gameState.platforms.push(new Platform(200, WORLD_HEIGHT - 150, 200, 20));
    gameState.platforms.push(new Platform(500, WORLD_HEIGHT - 250, 100, 20));
    gameState.poles.push(new Pole(650, WORLD_HEIGHT - 350, 300)); // Tall pole
    
    // --- Section 2: Industrial Climb ---
    gameState.platforms.push(new Platform(800, WORLD_HEIGHT - 200, 300, 20));
    gameState.platforms.push(new Platform(800, WORLD_HEIGHT - 400, 20, 200)); // Vertical wall
    gameState.poles.push(new Pole(1050, WORLD_HEIGHT - 400, 200));

    // --- Section 3: High Platforms ---
    gameState.platforms.push(new Platform(1200, WORLD_HEIGHT - 350, 400, 20));
    gameState.poles.push(new Pole(1400, WORLD_HEIGHT - 550, 200));
    gameState.platforms.push(new Platform(1300, WORLD_HEIGHT - 550, 200, 20));

    // --- Section 4: Shelter Zone ---
    gameState.platforms.push(new Platform(WORLD_WIDTH - 400, WORLD_HEIGHT - 150, 400, 150));
    
    // Entities
    
    // Food
    gameState.collectibles.push(new Batfly(300, WORLD_HEIGHT - 250));
    gameState.collectibles.push(new Batfly(350, WORLD_HEIGHT - 200));
    gameState.collectibles.push(new FoodFruit(550, WORLD_HEIGHT - 280));
    gameState.collectibles.push(new FoodFruit(1250, WORLD_HEIGHT - 380));
    gameState.collectibles.push(new FoodFruit(1350, WORLD_HEIGHT - 380));
    gameState.collectibles.push(new Batfly(1400, WORLD_HEIGHT - 600));
    gameState.collectibles.push(new Batfly(1450, WORLD_HEIGHT - 600));

    // Weapons
    gameState.items.push(new Spear(400, WORLD_HEIGHT - 60));
    gameState.items.push(new Spear(900, WORLD_HEIGHT - 210));
    
    // Enemies
    gameState.enemies.push(new Lizard(700, WORLD_HEIGHT - 80, "GREEN")); // Ground tank
    gameState.enemies.push(new Lizard(1300, WORLD_HEIGHT - 380, "PINK")); // Platform climber

    // Shelter
    gameState.shelter = new Shelter(WORLD_WIDTH - 200, WORLD_HEIGHT - 230);
    gameState.entities.push(gameState.shelter);
    
    // Consolidate specific lists into main entities list for rendering loop
    gameState.entities.push(...gameState.platforms);
    gameState.entities.push(...gameState.poles);
    gameState.entities.push(...gameState.collectibles);
    gameState.entities.push(...gameState.items);
    gameState.entities.push(...gameState.enemies);
}