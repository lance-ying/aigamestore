import { STARTING_CASH, PASS_GO_REWARD, gameState } from './globals.js';
import { getSpaceScreenPosition } from './board.js';

export class Player {
  constructor(id, name, isAI = false) {
    this.id = id;
    this.name = name;
    this.isAI = isAI;
    this.cash = STARTING_CASH;
    this.position = 0;
    this.properties = [];
    this.inJail = false;
    this.jailTurns = 0;
    this.isBankrupt = false;
    this.color = this.getPlayerColor(id);
    this.turnComplete = false;
  }
  
  getPlayerColor(id) {
    const colors = [
      [255, 50, 50],    // Red
      [50, 100, 255],   // Blue
      [50, 200, 50],    // Green
      [255, 200, 50]    // Yellow
    ];
    return colors[id % colors.length];
  }
  
  moveTo(newPosition) {
    const oldPosition = this.position;
    this.position = newPosition % 40;
    
    // Check if passed GO
    if (newPosition >= 40 && oldPosition < 40) {
      this.cash += PASS_GO_REWARD;
      this.addMessage(`Passed GO! Collected $${PASS_GO_REWARD}`);
    }
  }
  
  moveSpaces(spaces) {
    this.moveTo(this.position + spaces);
  }
  
  payRent(amount, toPlayer) {
    if (this.cash >= amount) {
      this.cash -= amount;
      toPlayer.cash += amount;
      return true;
    } else {
      // Bankrupt
      this.declareBankruptcy(toPlayer);
      return false;
    }
  }
  
  pay(amount) {
    if (this.cash >= amount) {
      this.cash -= amount;
      return true;
    } else {
      this.declareBankruptcy(null);
      return false;
    }
  }
  
  collect(amount) {
    this.cash += amount;
  }
  
  buyProperty(property) {
    if (this.cash >= property.price) {
      this.cash -= property.price;
      this.properties.push(property);
      property.owner = this;
      return true;
    }
    return false;
  }
  
  buildHouse(property) {
    if (this.cash >= 50 && property.houses < 5) {
      this.cash -= 50;
      property.houses++;
      return true;
    }
    return false;
  }
  
  hasMonopoly(group) {
    const groupSpaces = gameState.board.filter(s => s.group === group);
    const ownedSpaces = groupSpaces.filter(s => s.owner === this);
    return groupSpaces.length === ownedSpaces.length;
  }
  
  declareBankruptcy(toPlayer) {
    this.isBankrupt = true;
    
    // Transfer properties
    this.properties.forEach(prop => {
      prop.owner = toPlayer;
      prop.houses = 0;
      if (toPlayer) {
        toPlayer.properties.push(prop);
      }
    });
    this.properties = [];
    
    if (toPlayer) {
      toPlayer.cash += this.cash;
    }
    this.cash = 0;
    
    this.addMessage(`${this.name} is bankrupt!`);
  }
  
  addMessage(message) {
    gameState.messageQueue.push({
      text: message,
      timestamp: Date.now()
    });
  }
  
  getScreenPosition() {
    const basePos = getSpaceScreenPosition(this.position);
    // Offset for multiple players on same space
    const offset = this.id * 8;
    return {
      x: basePos.x + offset,
      y: basePos.y + offset
    };
  }
}

export function createPlayers(numPlayers, numAI) {
  const players = [];
  
  // Human player
  players.push(new Player(0, "You", false));
  
  // AI players
  for (let i = 1; i < numPlayers; i++) {
    players.push(new Player(i, `AI ${i}`, true));
  }
  
  return players;
}