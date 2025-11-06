// building.js - Building and floor management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, createFloor } from './globals.js';

const FLOOR_COST_BASE = 200;

export function canAddFloor() {
  if (gameState.floors.length >= gameState.maxFloors) return false;
  const cost = getFloorCost();
  return gameState.money >= cost;
}

export function getFloorCost() {
  return FLOOR_COST_BASE + (gameState.floors.length * 100);
}

export function addFloor() {
  if (!canAddFloor()) return false;
  
  const cost = getFloorCost();
  gameState.money -= cost;
  
  const newFloor = createFloor(gameState.floors.length);
  gameState.floors.push(newFloor);
  
  return true;
}

export function renderBuilding(p) {
  p.push();
  
  // Building base/ground
  p.fill(100, 80, 60);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Render floors
  for (let floor of gameState.floors) {
    const isSelected = (floor.index === gameState.currentFloorIndex);
    
    // Floor platform
    p.fill(isSelected ? [150, 130, 110] : [120, 100, 80]);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(0, floor.y, CANVAS_WIDTH, gameState.floorHeight);
    
    // Floor number
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(`Floor ${floor.index + 1}`, 10, floor.y + 5);
    
    // Floor capacity indicator
    p.textSize(10);
    p.text(`${floor.shops.length}/${floor.capacity}`, 10, floor.y + 20);
  }
  
  p.pop();
}

export function updateRating() {
  // Calculate rating based on satisfaction, shops, and revenue
  const satisfactionFactor = gameState.satisfactionScore / 100;
  const shopFactor = Math.min(1, gameState.shops.length / 20);
  const revenueFactor = Math.min(1, gameState.revenue / 5000);
  
  const totalScore = (satisfactionFactor * 0.5 + shopFactor * 0.3 + revenueFactor * 0.2);
  gameState.rating = Math.floor(totalScore * 5);
  
  // Win condition: 5-star rating
  if (gameState.rating >= 5) {
    return true;
  }
  
  return false;
}