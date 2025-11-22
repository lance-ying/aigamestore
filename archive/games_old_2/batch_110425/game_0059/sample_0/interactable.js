// interactable.js - Interactive objects in the game
export class Interactable {
  constructor(roomId, x, y, type, data) {
    this.roomId = roomId;
    this.x = x;
    this.y = y;
    this.type = type; // "keycard", "journal", "computer", "door_escape"
    this.data = data;
    this.interacted = false;
    this.radius = 30; // interaction radius
  }
  
  canInteract(playerX, playerY) {
    const dist = Math.sqrt((this.x - playerX) ** 2 + (this.y - playerY) ** 2);
    return dist < this.radius;
  }
  
  interact(gameState) {
    if (this.interacted && this.type !== "door_escape") return null;
    
    this.interacted = true;
    
    switch (this.type) {
      case "keycard":
        if (this.data.color === "red") {
          gameState.hasRedKeycard = true;
          gameState.inventory.push("Red Keycard");
          gameState.score += 100;
          return "Found RED KEYCARD! Use with Z at red doors.";
        } else if (this.data.color === "blue") {
          gameState.hasBlueKeycard = true;
          gameState.inventory.push("Blue Keycard");
          gameState.score += 100;
          return "Found BLUE KEYCARD! Use with Z at blue doors.";
        } else if (this.data.color === "green") {
          gameState.hasGreenKeycard = true;
          gameState.inventory.push("Green Keycard");
          gameState.score += 100;
          return "Found GREEN KEYCARD! Use with Z at green doors.";
        }
        break;
        
      case "journal":
        if (!gameState.journalEntries.includes(this.data.id)) {
          gameState.journalEntries.push(this.data.id);
          gameState.score += 50;
        }
        return this.data.text;
        
      case "computer":
        return this.data.text;
        
      case "door_escape":
        // Check if player has all keycards
        if (gameState.hasRedKeycard && gameState.hasBlueKeycard && gameState.hasGreenKeycard) {
          gameState.endingsFound.push("ESCAPE");
          gameState.score += 500;
          gameState.gamePhase = "GAME_OVER_WIN";
          return "ESCAPE SUCCESSFUL!";
        } else {
          return "Need all keycards to escape...";
        }
        
      default:
        return "Nothing happens.";
    }
  }
  
  render(p, currentRoom, offsetX, offsetY) {
    if (this.roomId !== currentRoom || this.interacted && this.type === "keycard") return;
    
    p.push();
    const screenX = this.x + offsetX;
    const screenY = this.y + offsetY;
    
    if (this.type === "keycard") {
      p.fill(this.data.color === "red" ? 255 : 0, 
             this.data.color === "green" ? 255 : 0, 
             this.data.color === "blue" ? 255 : 0);
      p.stroke(255);
      p.strokeWeight(2);
      p.rect(screenX - 8, screenY - 12, 16, 24, 2);
    } else if (this.type === "journal") {
      p.fill(200, 180, 140);
      p.stroke(100, 80, 60);
      p.strokeWeight(2);
      p.rect(screenX - 10, screenY - 8, 20, 16);
      p.line(screenX, screenY - 8, screenX, screenY + 8);
    } else if (this.type === "computer") {
      p.fill(60, 60, 80);
      p.stroke(100, 150, 200);
      p.strokeWeight(2);
      p.rect(screenX - 12, screenY - 10, 24, 20);
      p.fill(100, 150, 200);
      p.noStroke();
      p.rect(screenX - 8, screenY - 6, 16, 10);
    } else if (this.type === "door_escape") {
      p.fill(50, 255, 50);
      p.stroke(255);
      p.strokeWeight(3);
      p.rect(screenX - 15, screenY - 20, 30, 40);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("EXIT", screenX, screenY);
    }
    
    p.pop();
  }
}

export function createInteractables() {
  const interactables = [];
  
  // Room 0: Starting room - journal
  interactables.push(new Interactable(0, 150, 125, "journal", {
    id: "journal1",
    text: "Day 1: They said this place was abandoned. Why do I hear footsteps at night?"
  }));
  
  // Room 3: Research lab - RED keycard and journal
  interactables.push(new Interactable(3, 175, 130, "keycard", { color: "red" }));
  interactables.push(new Interactable(3, 280, 200, "journal", {
    id: "journal2",
    text: "Day 5: The experiments went wrong. We tried to contain it, but it's too late now."
  }));
  
  // Room 2: Security office - BLUE keycard, computer, journal
  interactables.push(new Interactable(2, 140, 110, "keycard", { color: "blue" }));
  interactables.push(new Interactable(2, 70, 80, "computer", {
    text: "SECURITY LOG: All personnel evacuated. Facility on lockdown. Do not enter."
  }));
  interactables.push(new Interactable(2, 220, 150, "journal", {
    id: "journal3",
    text: "Day 10: I'm the only one left. The escape route is through the control room."
  }));
  
  // Room 4: Control room - GREEN keycard and journal
  interactables.push(new Interactable(4, 160, 120, "keycard", { color: "green" }));
  interactables.push(new Interactable(4, 250, 180, "journal", {
    id: "journal4",
    text: "Final Entry: If you're reading this, collect all keycards and get out. Now."
  }));
  
  // Room 5: Exit room - escape door
  interactables.push(new Interactable(5, 140, 100, "door_escape", {}));
  
  return interactables;
}