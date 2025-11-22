// game_logic.js - Game update logic
import { gameState, GAME_PHASES } from './globals.js';

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const player = gameState.player;
  const room = gameState.rooms[gameState.currentRoom];
  
  // Handle movement based on control mode
  let dx = 0;
  let dy = 0;
  let turning = 0;
  
  if (gameState.controlMode === "HUMAN") {
    if (p.keyIsDown(38)) dy = -1; // UP - move forward
    if (p.keyIsDown(40)) dy = 1;  // DOWN - move backward
    if (p.keyIsDown(37)) turning = -1; // LEFT - turn left
    if (p.keyIsDown(39)) turning = 1;  // RIGHT - turn right
    
    player.isSprinting = p.keyIsDown(16); // SHIFT
  } else {
    // Automated testing control
    const action = window.get_automated_testing_action(gameState);
    if (action) {
      if (action.forward) dy = -1;
      if (action.backward) dy = 1;
      if (action.turnLeft) turning = -1;
      if (action.turnRight) turning = 1;
      if (action.interact) {
        handleInteractionFromTest(p);
      }
      if (action.useKeycard) {
        handleKeycardUseFromTest(p);
      }
      player.isSprinting = action.sprint || false;
    }
  }
  
  // Apply movement
  if (dx !== 0 || dy !== 0) {
    player.move(dx, dy, room.walls);
  }
  
  if (turning !== 0) {
    player.turn(turning);
  }
  
  player.update(p);
  
  // Check for room transitions
  checkRoomTransitions(p);
  
  // Update nearest interactable
  updateNearestInteractable();
  
  // Update message timer
  if (gameState.showingMessage) {
    gameState.messageTimer--;
    if (gameState.messageTimer <= 0) {
      gameState.showingMessage = false;
    }
  }
  
  // Log player info every 30 frames
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: CANVAS_WIDTH / 2,
      screen_y: CANVAS_HEIGHT / 2,
      game_x: player.x,
      game_y: player.y,
      framecount: p.frameCount
    });
  }
}

function checkRoomTransitions(p) {
  const player = gameState.player;
  const room = gameState.rooms[gameState.currentRoom];
  
  for (let conn of room.connections) {
    // Check if player is at door
    const distToDoor = Math.sqrt(
      (conn.x - player.x) ** 2 + (conn.y - player.y) ** 2
    );
    
    if (distToDoor < 25) {
      // Check if door is unlocked
      let canPass = !conn.locked;
      if (conn.locked) {
        if (conn.keycardType === "red" && gameState.redDoorUnlocked) canPass = true;
        if (conn.keycardType === "blue" && gameState.blueDoorUnlocked) canPass = true;
        if (conn.keycardType === "green" && gameState.greenDoorUnlocked) canPass = true;
      }
      
      if (canPass) {
        // Transition to new room
        gameState.currentRoom = conn.toRoom;
        const newRoom = gameState.rooms[conn.toRoom];
        
        // Position player at corresponding door in new room
        const newConn = newRoom.connections.find(c => c.toRoom === room.id);
        if (newConn) {
          if (newConn.y === 0) {
            player.y = 20;
            player.x = newConn.x;
          } else if (newConn.y >= newRoom.height - 10) {
            player.y = newRoom.height - 20;
            player.x = newConn.x;
          } else if (newConn.x === 0) {
            player.x = 20;
            player.y = newConn.y;
          } else {
            player.x = newRoom.width - 20;
            player.y = newConn.y;
          }
        }
      }
    }
  }
}

function updateNearestInteractable() {
  const player = gameState.player;
  gameState.nearestInteractable = null;
  
  for (let interactable of gameState.interactables) {
    if (interactable.roomId === gameState.currentRoom) {
      if (interactable.canInteract(player.x, player.y)) {
        gameState.nearestInteractable = interactable;
        break;
      }
    }
  }
}

function handleInteractionFromTest(p) {
  if (gameState.nearestInteractable) {
    const message = gameState.nearestInteractable.interact(gameState);
    if (message) {
      gameState.showingMessage = true;
      gameState.messageText = message;
      gameState.messageTimer = 180;
    }
  }
}

function handleKeycardUseFromTest(p) {
  const room = gameState.rooms[gameState.currentRoom];
  const player = gameState.player;
  
  for (let conn of room.connections) {
    const distToDoor = Math.sqrt(
      (conn.x - player.x) ** 2 + (conn.y - player.y) ** 2
    );
    
    if (distToDoor < 40 && conn.locked) {
      if (conn.keycardType === "red" && gameState.hasRedKeycard && !gameState.redDoorUnlocked) {
        gameState.redDoorUnlocked = true;
        gameState.score += 50;
      } else if (conn.keycardType === "blue" && gameState.hasBlueKeycard && !gameState.blueDoorUnlocked) {
        gameState.blueDoorUnlocked = true;
        gameState.score += 50;
      } else if (conn.keycardType === "green" && gameState.hasGreenKeycard && !gameState.greenDoorUnlocked) {
        gameState.greenDoorUnlocked = true;
        gameState.score += 50;
      }
    }
  }
}