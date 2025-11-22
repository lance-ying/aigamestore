// levelGenerator.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, ITEM_TYPES, gameState } from './globals.js';
import { Item } from './item.js';

export function generateLevel(p, levelNum) {
  gameState.items = [];
  
  // Determine item counts based on level
  let goldSmallCount = 3 + levelNum;
  let goldMediumCount = 2 + p.floor(levelNum / 2);
  let goldLargeCount = 1 + p.floor(levelNum / 3);
  let diamondCount = levelNum >= 2 ? 1 + p.floor(levelNum / 4) : 0;
  let rockCount = 2 + p.floor(levelNum / 2);
  let mysteryCount = p.floor(levelNum / 3);

  const minY = 120;
  const maxY = CANVAS_HEIGHT - 30;
  const minX = 50;
  const maxX = CANVAS_WIDTH - 50;

  function addItems(type, count) {
    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let x, y, validPosition;
      
      do {
        x = p.random(minX, maxX);
        y = p.random(minY, maxY);
        validPosition = true;
        
        // Check distance from other items
        for (let item of gameState.items) {
          let minDist = (item.size + ITEM_TYPES[type].size) + 10;
          if (p.dist(x, y, item.x, item.y) < minDist) {
            validPosition = false;
            break;
          }
        }
        
        attempts++;
      } while (!validPosition && attempts < 50);
      
      if (validPosition) {
        gameState.items.push(new Item(p, x, y, type));
      }
    }
  }

  // Add items
  addItems("GOLD_SMALL", goldSmallCount);
  addItems("GOLD_MEDIUM", goldMediumCount);
  addItems("GOLD_LARGE", goldLargeCount);
  addItems("DIAMOND", diamondCount);
  addItems("ROCK", rockCount);
  addItems("MYSTERY", mysteryCount);
}