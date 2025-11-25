// level.js
import { gameState, CANVAS_WIDTH } from './globals.js';
import { Platform, DestructibleBlock, Pizza, ExitDoor } from './platform.js';

export function createLevel() {
  gameState.platforms = [];
  gameState.pizzas = [];
  gameState.destructibleBlocks = [];
  
  // Ground platform
  gameState.platforms.push(new Platform(0, 370, CANVAS_WIDTH, 30, 'normal'));
  
  // Level layout - vertical tower climb
  // Layer 1
  gameState.platforms.push(new Platform(50, 310, 120, 15, 'normal'));
  gameState.platforms.push(new Platform(430, 310, 120, 15, 'normal'));
  gameState.pizzas.push(new Pizza(490, 290));
  
  // Layer 2
  gameState.platforms.push(new Platform(250, 250, 100, 15, 'normal'));
  gameState.pizzas.push(new Pizza(300, 230));
  gameState.destructibleBlocks.push(new DestructibleBlock(380, 235, 25));
  gameState.destructibleBlocks.push(new DestructibleBlock(405, 235, 25));
  
  // Layer 3
  gameState.platforms.push(new Platform(80, 190, 100, 15, 'normal'));
  gameState.platforms.push(new Platform(450, 190, 100, 15, 'normal'));
  gameState.pizzas.push(new Pizza(130, 170));
  gameState.pizzas.push(new Pizza(500, 170));
  
  // Layer 4
  gameState.platforms.push(new Platform(250, 130, 100, 15, 'normal'));
  gameState.destructibleBlocks.push(new DestructibleBlock(200, 115, 25));
  gameState.destructibleBlocks.push(new DestructibleBlock(225, 115, 25));
  gameState.pizzas.push(new Pizza(300, 110));
  
  // Layer 5 - Higher platforms
  gameState.platforms.push(new Platform(100, 70, 90, 15, 'normal'));
  gameState.platforms.push(new Platform(410, 70, 90, 15, 'normal'));
  gameState.pizzas.push(new Pizza(145, 50));
  gameState.pizzas.push(new Pizza(455, 50));
  
  // Layer 6 - Challenge section
  gameState.platforms.push(new Platform(250, 10, 80, 15, 'normal'));
  gameState.destructibleBlocks.push(new DestructibleBlock(320, -5, 25));
  gameState.pizzas.push(new Pizza(290, -10));
  
  // Layer 7 - Top section
  gameState.platforms.push(new Platform(100, -50, 100, 15, 'normal'));
  gameState.platforms.push(new Platform(400, -50, 100, 15, 'normal'));
  gameState.pizzas.push(new Pizza(150, -70));
  gameState.pizzas.push(new Pizza(450, -70));
  
  // Layer 8 - Near exit
  gameState.platforms.push(new Platform(250, -110, 120, 15, 'normal'));
  gameState.destructibleBlocks.push(new DestructibleBlock(200, -125, 25));
  gameState.pizzas.push(new Pizza(310, -130));
  
  // Exit platform at the top
  gameState.platforms.push(new Platform(265, -170, 90, 20, 'normal'));
  gameState.exit = new ExitDoor(285, -230);
}