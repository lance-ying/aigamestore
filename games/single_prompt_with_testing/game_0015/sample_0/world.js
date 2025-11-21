// world.js - World generation and environment

import { gameState } from './globals.js';
import { Wall, Interactable, AmbientEntity } from './entities.js';

export function initializeWorld(p) {
  gameState.walls = [];
  gameState.interactables = [];
  gameState.entities = [];

  // Create maze-like structure
  // Outer walls
  gameState.walls.push(new Wall(-300, -300, 300, -295)); // North
  gameState.walls.push(new Wall(-300, 295, 300, 300));   // South
  gameState.walls.push(new Wall(-300, -300, -295, 300)); // West
  gameState.walls.push(new Wall(295, -300, 300, 300));   // East

  // Interior walls creating rooms
  gameState.walls.push(new Wall(-150, -150, -145, 150));
  gameState.walls.push(new Wall(145, -150, 150, 150));
  gameState.walls.push(new Wall(-150, -150, 150, -145));
  gameState.walls.push(new Wall(-150, 145, 150, 150));

  // Doorway gaps (created by not placing walls)
  // Add smaller walls to create doorways
  gameState.walls.push(new Wall(-150, -50, -145, -150));
  gameState.walls.push(new Wall(-150, 50, -145, 150));
  gameState.walls.push(new Wall(145, -50, 150, -150));
  gameState.walls.push(new Wall(145, 50, 150, 150));

  // Add clues in different rooms
  const cluePositions = [
    { x: -200, y: 20, z: -200, name: "Memory Fragment 1" },
    { x: 200, y: 20, z: -200, name: "Memory Fragment 2" },
    { x: -200, y: 20, z: 200, name: "Memory Fragment 3" },
    { x: 200, y: 20, z: 200, name: "Memory Fragment 4" },
    { x: 0, y: 20, z: -230, name: "The Truth" }
  ];

  let clueId = 0;
  for (let pos of cluePositions) {
    gameState.interactables.push(
      new Interactable(pos.x, pos.y, pos.z, 'clue', pos.name, `clue_${clueId++}`)
    );
    gameState.clues.push(gameState.interactables[gameState.interactables.length - 1]);
  }

  // Add puzzles
  gameState.interactables.push(
    new Interactable(-100, 20, 0, 'puzzle', "Door Lock", "puzzle_1")
  );
  gameState.interactables.push(
    new Interactable(100, 20, 0, 'puzzle', "Mysterious Symbol", "puzzle_2")
  );

  // Add exit
  gameState.interactables.push(
    new Interactable(0, 30, 250, 'exit', "Escape Point", "exit_1")
  );

  // Add ambient entities for atmosphere
  for (let i = 0; i < 20; i++) {
    const x = (Math.random() - 0.5) * 500;
    const y = Math.random() * 40 + 10;
    const z = (Math.random() - 0.5) * 500;
    const type = Math.random() > 0.5 ? 'shadow' : 'particle';
    gameState.entities.push(new AmbientEntity(x, y, z, type));
  }
}

export function updateWorld(p) {
  // Update all interactables
  for (let obj of gameState.interactables) {
    obj.update(p);
  }

  // Update ambient entities
  for (let entity of gameState.entities) {
    entity.update(p);
  }

  // Update atmosphere intensity based on clues collected
  gameState.atmosphereIntensity = gameState.cluesCollected / gameState.totalClues;

  // Update time
  gameState.timeElapsed++;

  // Random jump scare trigger
  if (!gameState.hasSeenJumpScare && gameState.cluesCollected >= 2 && Math.random() < 0.0005) {
    gameState.hasSeenJumpScare = true;
    gameState.messageQueue.push({
      text: "You feel a presence...",
      duration: 120,
      color: [255, 50, 50]
    });
  }

  // Update message queue
  for (let i = gameState.messageQueue.length - 1; i >= 0; i--) {
    gameState.messageQueue[i].duration--;
    if (gameState.messageQueue[i].duration <= 0) {
      gameState.messageQueue.splice(i, 1);
    }
  }
}