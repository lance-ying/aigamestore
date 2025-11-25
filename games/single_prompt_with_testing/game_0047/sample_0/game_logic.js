// game_logic.js - Game logic and state management

import {
  gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, TOTAL_CLUES,
  DECK_MIN_X, DECK_MAX_X, DECK_MIN_Z, DECK_MAX_Z
} from './globals.js';
import { Player, Clue, Spirit, ExitPortal } from './entities.js';

export function initGame(p) {
  // Reset game state
  gameState.entities = [];
  gameState.clues = [];
  gameState.spirits = [];
  gameState.score = 0;
  gameState.cluesFound = 0;
  gameState.framesSinceStart = 0;
  gameState.gameOverMessage = "";
  gameState.lastPlayerX = 0;
  gameState.lastPlayerZ = 0;
  gameState.stuckFrames = 0;
  
  // Create player at spawn point
  gameState.player = new Player(0, DECK_MIN_Z + 3);
  gameState.entities.push(gameState.player);
  
  // Create clues scattered around the deck
  const clueDescriptions = [
    "A torn captain's log",
    "Bloodstained rope",
    "Strange symbols carved in wood",
    "An empty pistol",
    "A crew member's journal",
    "Mysterious cargo crate",
    "Navigation charts",
    "A broken compass"
  ];
  
  const cluePositions = [
    { x: -6, z: -8 },
    { x: 5, z: -10 },
    { x: -7, z: 2 },
    { x: 8, z: 5 },
    { x: -4, z: 10 },
    { x: 6, z: -2 },
    { x: -8, z: -12 },
    { x: 3, z: 12 }
  ];
  
  for (let i = 0; i < TOTAL_CLUES; i++) {
    const clue = new Clue(
      cluePositions[i].x,
      cluePositions[i].z,
      i,
      clueDescriptions[i]
    );
    gameState.clues.push(clue);
    gameState.entities.push(clue);
  }
  
  // Create spirits with patrol routes
  const spirit1 = new Spirit(-5, -5, [
    { x: -5, z: -5 },
    { x: -5, z: 5 },
    { x: -8, z: 5 },
    { x: -8, z: -5 }
  ]);
  gameState.spirits.push(spirit1);
  gameState.entities.push(spirit1);
  
  const spirit2 = new Spirit(5, 0, [
    { x: 5, z: 0 },
    { x: 5, z: -10 },
    { x: 8, z: -10 },
    { x: 8, z: 0 }
  ]);
  gameState.spirits.push(spirit2);
  gameState.entities.push(spirit2);
  
  const spirit3 = new Spirit(0, 10, [
    { x: 0, z: 10 },
    { x: -6, z: 10 },
    { x: -6, z: 13 },
    { x: 0, z: 13 }
  ]);
  gameState.spirits.push(spirit3);
  gameState.entities.push(spirit3);
  
  // Create exit portal (inactive until all clues found)
  gameState.exitPortal = new ExitPortal(0, DECK_MAX_Z - 2);
  gameState.entities.push(gameState.exitPortal);
}

export function updateGame(p, dt) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  gameState.framesSinceStart++;
  
  const player = gameState.player;
  
  // Update clues
  gameState.clues.forEach(clue => {
    clue.update(dt);
  });
  
  // Update spirits
  gameState.spirits.forEach(spirit => {
    spirit.update(dt, player.x, player.z, gameState.gamePhase);
    
    // Check if spirit caught player
    if (spirit.hasReachedPlayer(player.x, player.z)) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      gameState.gameOverMessage = "You were caught by a hostile spirit.";
      logGameInfo(p, { event: "game_over_lose", reason: "caught_by_spirit" });
    }
  });
  
  // Update exit portal
  if (gameState.exitPortal) {
    gameState.exitPortal.update(dt);
    
    // Activate portal when all clues found
    if (gameState.cluesFound >= TOTAL_CLUES && !gameState.exitPortal.active) {
      gameState.exitPortal.activate();
      logGameInfo(p, { event: "exit_portal_activated" });
    }
  }
  
  // Check for stuck player (for testing)
  const moveThreshold = 0.01;
  const dx = player.x - gameState.lastPlayerX;
  const dz = player.z - gameState.lastPlayerZ;
  const distMoved = Math.sqrt(dx * dx + dz * dz);
  
  if (distMoved < moveThreshold) {
    gameState.stuckFrames++;
  } else {
    gameState.stuckFrames = 0;
  }
  
  gameState.lastPlayerX = player.x;
  gameState.lastPlayerZ = player.z;
}

export function handleInteraction(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Check clues
  for (const clue of gameState.clues) {
    if (!clue.discovered && player.canInteractWith(clue)) {
      clue.discovered = true;
      gameState.cluesFound++;
      gameState.score += 100;
      logGameInfo(p, { 
        event: "clue_discovered", 
        clue_id: clue.id, 
        description: clue.description 
      });
      return;
    }
  }
  
  // Check exit portal
  if (gameState.exitPortal && gameState.exitPortal.active) {
    if (player.canInteractWith(gameState.exitPortal)) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      gameState.score += 500;
      logGameInfo(p, { event: "game_over_win", reason: "escaped_through_portal" });
    }
  }
}

export function logGameInfo(p, data) {
  p.logs.game_info.push({
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function logPlayerInfo(p) {
  const player = gameState.player;
  if (!player) return;
  
  p.logs.player_info.push({
    screen_x: player.x,
    screen_y: player.z,
    game_x: player.x,
    game_y: player.z,
    framecount: p.frameCount
  });
}

export function logInput(p, inputType, data) {
  p.logs.inputs.push({
    input_type: inputType,
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}