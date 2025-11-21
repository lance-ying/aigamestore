// room.js - Room management

import { gameState } from './globals.js';
import { ROOM_DEFINITIONS, ITEM_DESCRIPTIONS } from './room_data.js';
import { addMessage } from './ui.js';

export class Room {
  constructor(roomData) {
    this.id = roomData.id;
    this.name = roomData.name;
    this.description = roomData.description;
    this.puzzles = roomData.puzzles;
    this.hotspots = roomData.hotspots.map(h => ({ ...h }));
    this.backgroundColor = this.generateRoomColor();
  }

  generateRoomColor() {
    const colors = [
      [40, 35, 50],
      [35, 40, 45],
      [45, 35, 40],
      [38, 42, 48],
      [42, 38, 35],
      [35, 45, 42],
      [48, 40, 38],
      [40, 38, 50],
      [50, 50, 50]
    ];
    return colors[this.id % colors.length];
  }

  draw(p) {
    // Draw room background
    p.push();
    p.fill(...this.backgroundColor);
    p.noStroke();
    p.rect(0, 0, 600, 400);

    // Draw decorative elements
    this.drawRoomDecoration(p);

    // Draw hotspots
    this.hotspots.forEach((hotspot, index) => {
      this.drawHotspot(p, hotspot, index === gameState.currentHotspot);
    });

    p.pop();
  }

  drawRoomDecoration(p) {
    p.push();
    // Draw stone texture
    p.strokeWeight(1);
    p.stroke(this.backgroundColor[0] + 10, this.backgroundColor[1] + 10, this.backgroundColor[2] + 10);
    for (let i = 0; i < 20; i++) {
      const x = (i * 30) % 600;
      const y = Math.floor(i / 20) * 20;
      p.line(x, y, x, y + 400);
    }

    // Draw room-specific decoration
    if (this.id === 0) {
      // Entrance hall - draw cobwebs
      p.stroke(200, 200, 200, 100);
      p.line(50, 50, 100, 80);
      p.line(550, 50, 500, 80);
    } else if (this.id === 1) {
      // Library - draw book spines
      for (let i = 0; i < 5; i++) {
        p.fill(100 + i * 20, 60, 40);
        p.rect(180 + i * 15, 180, 12, 40);
      }
    } else if (this.id === 2) {
      // Lab - draw bubbles
      p.noStroke();
      p.fill(100, 255, 100, 50);
      p.ellipse(320, 270, 10);
      p.ellipse(310, 260, 8);
    }
    p.pop();
  }

  drawHotspot(p, hotspot, isSelected) {
    p.push();

    // Draw hotspot visual based on type
    if (hotspot.type === 'door') {
      // Draw door
      const locked = hotspot.locked;
      p.fill(locked ? [80, 60, 40] : [100, 80, 50]);
      p.stroke(locked ? [150, 100, 50] : [200, 150, 100]);
      p.strokeWeight(3);
      p.rect(hotspot.x - 30, hotspot.y - 40, 60, 80, 5);

      // Door handle
      p.fill(150, 150, 100);
      p.ellipse(hotspot.x + 15, hotspot.y, 8);

      // Lock indicator
      if (locked) {
        p.fill(200, 100, 100);
        p.ellipse(hotspot.x, hotspot.y - 10, 15);
      }
    } else if (hotspot.type === 'item') {
      // Draw item
      const collected = gameState.collectedItems.has(hotspot.item);
      if (!collected) {
        p.fill(255, 215, 0);
        p.stroke(200, 170, 0);
        p.strokeWeight(2);
        p.ellipse(hotspot.x, hotspot.y, 20);
        p.fill(255, 235, 100);
        p.noStroke();
        p.ellipse(hotspot.x - 3, hotspot.y - 3, 8);
      }
    } else if (hotspot.type === 'examine') {
      // Draw examinable object
      p.fill(150, 150, 180);
      p.stroke(180, 180, 200);
      p.strokeWeight(2);
      p.rect(hotspot.x - 20, hotspot.y - 20, 40, 40, 5);
      p.fill(200, 200, 220);
      p.noStroke();
      p.ellipse(hotspot.x, hotspot.y, 15);
    } else if (hotspot.type === 'puzzle' || hotspot.type === 'combine') {
      // Draw puzzle/combine spot
      p.fill(180, 100, 200);
      p.stroke(200, 150, 220);
      p.strokeWeight(2);
      p.ellipse(hotspot.x, hotspot.y, 35);
      p.fill(220, 180, 240);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text('?', hotspot.x, hotspot.y);
    }

    // Draw selection indicator
    if (isSelected) {
      p.noFill();
      p.stroke(255, 255, 100);
      p.strokeWeight(3);
      p.ellipse(hotspot.x, hotspot.y, 50);

      // Draw arrow pointing to hotspot
      p.fill(255, 255, 100);
      p.noStroke();
      p.triangle(
        hotspot.x, hotspot.y - 35,
        hotspot.x - 5, hotspot.y - 45,
        hotspot.x + 5, hotspot.y - 45
      );

      // Draw hotspot name
      p.fill(255, 255, 255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(hotspot.name, hotspot.x, hotspot.y - 60);
    }

    p.pop();
  }

  interactWithHotspot(hotspotIndex) {
    if (hotspotIndex < 0 || hotspotIndex >= this.hotspots.length) return;

    const hotspot = this.hotspots[hotspotIndex];

    if (hotspot.type === 'door') {
      if (hotspot.locked) {
        // Check if player has required item
        if (gameState.selectedItem === hotspot.requires) {
          hotspot.locked = false;
          gameState.inventory = gameState.inventory.filter(item => item !== hotspot.requires);
          gameState.selectedItem = null;
          addMessage(`Used ${hotspot.requires} to unlock ${hotspot.name}!`);
          gameState.puzzlesSolved++;
          gameState.score += 100;
          gameState.solvedPuzzles.add(`room${this.id}_door${hotspotIndex}`);
        } else {
          addMessage(`${hotspot.name} is locked. Need: ${hotspot.requires}`);
        }
      } else {
        // Enter next room
        if (hotspot.leadsTo !== undefined) {
          gameState.currentRoom = hotspot.leadsTo;
          gameState.currentHotspot = 0;
          if (!gameState.unlockedRooms.includes(hotspot.leadsTo)) {
            gameState.unlockedRooms.push(hotspot.leadsTo);
            gameState.score += 50;
          }
          addMessage(`Entered ${ROOM_DEFINITIONS[hotspot.leadsTo].name}`);

          // Check win condition
          if (hotspot.leadsTo === 8) {
            gameState.gamePhase = "GAME_OVER_WIN";
          }
        }
      }
    } else if (hotspot.type === 'item') {
      const collected = gameState.collectedItems.has(hotspot.item);
      if (!collected) {
        gameState.inventory.push(hotspot.item);
        gameState.collectedItems.add(hotspot.item);
        gameState.score += 25;
        addMessage(`Collected: ${ITEM_DESCRIPTIONS[hotspot.item] || hotspot.item}`);
      } else {
        addMessage("Already collected this item");
      }
    } else if (hotspot.type === 'examine') {
      gameState.examiningObject = hotspot.clue;
      addMessage(`Examining: ${hotspot.clue}`);
    } else if (hotspot.type === 'combine') {
      // Check if player has all required items
      const hasAllItems = hotspot.requires.every(item => gameState.inventory.includes(item));
      if (hasAllItems) {
        // Remove required items
        hotspot.requires.forEach(item => {
          gameState.inventory = gameState.inventory.filter(i => i !== item);
        });
        // Add result item
        gameState.inventory.push(hotspot.gives);
        gameState.puzzlesSolved++;
        gameState.score += 150;
        addMessage(`Combined items to create: ${hotspot.gives}!`);
        gameState.solvedPuzzles.add(`room${this.id}_combine${hotspotIndex}`);
      } else {
        addMessage(`Need items: ${hotspot.requires.join(', ')}`);
      }
    } else if (hotspot.type === 'puzzle') {
      // Simplified puzzle - just checking if player examined enough things
      if (gameState.examiningObject || gameState.inventory.length >= 2) {
        gameState.puzzlesSolved++;
        gameState.score += 200;
        addMessage(`Solved puzzle ${hotspot.puzzleId}!`);
        // Give a reward
        const rewards = ['book_code', 'armor_complete', 'fountain_key', 'symbol_power', 'throne_blessing'];
        const reward = rewards[hotspot.puzzleId % rewards.length];
        if (!gameState.inventory.includes(reward)) {
          gameState.inventory.push(reward);
        }
        gameState.solvedPuzzles.add(`room${this.id}_puzzle${hotspot.puzzleId}`);
      } else {
        addMessage("Need more information to solve this puzzle");
      }
    }
  }
}

export function loadRooms() {
  gameState.rooms = ROOM_DEFINITIONS.map(roomData => new Room(roomData));
}

export function getCurrentRoom() {
  return gameState.rooms[gameState.currentRoom];
}