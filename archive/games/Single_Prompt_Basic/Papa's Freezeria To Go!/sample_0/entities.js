import { CANVAS_WIDTH, CANVAS_HEIGHT, STATION_TYPES, FLAVORS, MIXINS, TOPPINGS, CUSTOMER_TYPES } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 80;
    this.color = [50, 100, 200];
    this.speed = 5;
    this.currentStation = 0;
  }

  draw(p) {
    p.push();
    p.fill(...this.color);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Draw face
    p.fill(255);
    p.ellipse(this.x + this.width/2 - 8, this.y + 25, 10, 10); // Left eye
    p.ellipse(this.x + this.width/2 + 8, this.y + 25, 10, 10); // Right eye
    p.fill(0);
    p.ellipse(this.x + this.width/2 - 8, this.y + 25, 4, 4); // Left pupil
    p.ellipse(this.x + this.width/2 + 8, this.y + 25, 4, 4); // Right pupil
    
    // Draw smile
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    p.arc(this.x + this.width/2, this.y + 35, 20, 10, 0, p.PI);
    p.noStroke();
    
    // Draw chef hat
    p.fill(255);
    p.rect(this.x + 5, this.y - 15, this.width - 10, 15, 3);
    p.ellipse(this.x + this.width/2, this.y - 20, this.width - 10, 20);
    
    p.pop();
  }

  moveToStation(stationIndex) {
    this.currentStation = stationIndex;
  }
}

export class Station {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 200;
    this.color = this.getStationColor();
    this.options = this.getStationOptions();
    this.name = this.getStationName();
    this.active = false;
  }

  getStationColor() {
    switch(this.type) {
      case STATION_TYPES.ORDER: return [100, 149, 237];
      case STATION_TYPES.BUILD: return [255, 160, 122];
      case STATION_TYPES.BLEND: return [144, 238, 144];
      case STATION_TYPES.TOP: return [218, 165, 32];
      case STATION_TYPES.SERVE: return [221, 160, 221];
      default: return [200, 200, 200];
    }
  }

  getStationName() {
    switch(this.type) {
      case STATION_TYPES.ORDER: return "Order Station";
      case STATION_TYPES.BUILD: return "Build Station";
      case STATION_TYPES.BLEND: return "Blend Station";
      case STATION_TYPES.TOP: return "Top Station";
      case STATION_TYPES.SERVE: return "Serve Station";
      default: return "Unknown Station";
    }
  }

  getStationOptions() {
    switch(this.type) {
      case STATION_TYPES.ORDER: 
        return ["Take Order"];
      case STATION_TYPES.BUILD:
        return FLAVORS.map(f => f.name).concat(MIXINS.map(m => m.name));
      case STATION_TYPES.BLEND:
        return ["Light Blend", "Medium Blend", "Heavy Blend"];
      case STATION_TYPES.TOP:
        return TOPPINGS.map(t => t.name);
      case STATION_TYPES.SERVE:
        return ["Serve Customer"];
      default:
        return [];
    }
  }

  draw(p, selected) {
    p.push();
    p.fill(...(selected ? [this.color[0] + 30, this.color[1] + 30, this.color[2] + 30] : this.color));
    p.rect(this.x, this.y, this.width, this.height, 10);
    
    // Draw station name
    p.fill(0);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.name, this.x + this.width/2, this.y + 20);
    
    // Draw station icon
    p.fill(255);
    p.rect(this.x + this.width/2 - 25, this.y + 70, 50, 50, 5);
    
    // Draw different icons based on station type
    p.fill(0);
    switch(this.type) {
      case STATION_TYPES.ORDER:
        this.drawOrderIcon(p);
        break;
      case STATION_TYPES.BUILD:
        this.drawBuildIcon(p);
        break;
      case STATION_TYPES.BLEND:
        this.drawBlendIcon(p);
        break;
      case STATION_TYPES.TOP:
        this.drawTopIcon(p);
        break;
      case STATION_TYPES.SERVE:
        this.drawServeIcon(p);
        break;
    }
    
    p.pop();
  }
  
  drawOrderIcon(p) {
    p.fill(100, 70, 40);
    p.rect(this.x + this.width/2 - 15, this.y + 75, 30, 40, 2); // Notepad
    p.stroke(0);
    p.strokeWeight(1);
    for (let i = 0; i < 5; i++) {
      p.line(this.x + this.width/2 - 10, this.y + 80 + i*7, 
             this.x + this.width/2 + 10, this.y + 80 + i*7);
    }
    p.noStroke();
  }
  
  drawBuildIcon(p) {
    p.fill(200, 200, 220);
    p.rect(this.x + this.width/2 - 15, this.y + 85, 30, 30, 5); // Cup
    p.fill(255, 250, 240);
    p.ellipse(this.x + this.width/2, this.y + 85, 25, 10); // Ice cream
  }
  
  drawBlendIcon(p) {
    p.fill(200);
    p.rect(this.x + this.width/2 - 15, this.y + 75, 30, 20, 2); // Blender base
    p.fill(220);
    p.rect(this.x + this.width/2 - 10, this.y + 65, 20, 10); // Blender top
    p.fill(150);
    p.rect(this.x + this.width/2 - 2, this.y + 60, 4, 15); // Blender rod
  }
  
  drawTopIcon(p) {
    p.fill(200, 200, 220);
    p.rect(this.x + this.width/2 - 15, this.y + 85, 30, 30, 5); // Cup
    p.fill(255);
    p.arc(this.x + this.width/2, this.y + 85, 25, 15, p.PI, 0); // Whipped cream
    p.fill(220, 20, 60);
    p.ellipse(this.x + this.width/2, this.y + 75, 8, 8); // Cherry
  }
  
  drawServeIcon(p) {
    p.fill(200, 200, 220);
    p.rect(this.x + this.width/2 - 15, this.y + 85, 30, 30, 5); // Cup
    p.fill(220, 200, 150);
    p.rect(this.x + this.width/2 - 20, this.y + 80, 40, 5, 2); // Tray
  }

  drawMenu(p, selectedOption) {
    if (this.options.length === 0) return;
    
    p.push();
    
    // Smart menu positioning
    const menuWidth = 140;
    const itemHeight = 20;
    const menuHeight = itemHeight * this.options.length + 10;
    let menuX = this.x - 10;
    let menuY;
    
    // Check if menu fits below station, otherwise place above
    if (this.y + this.height + 20 + menuHeight > CANVAS_HEIGHT - 20) {
      // Place above station
      menuY = this.y - menuHeight - 10;
      // If still doesn't fit above, place at top
      if (menuY < 70) { // Leave room for order display
        menuY = 70;
      }
    } else {
      // Place below station
      menuY = this.y + this.height + 10;
    }
    
    // Make sure menu doesn't go off screen horizontally
    if (menuX < 10) {
      menuX = 10;
    } else if (menuX + menuWidth > CANVAS_WIDTH - 10) {
      menuX = CANVAS_WIDTH - menuWidth - 10;
    }
    
    // Draw simple menu background
    p.fill(255, 255, 255, 240);
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(menuX, menuY, menuWidth, menuHeight, 3);
    p.noStroke();
    
    // Draw options
    for (let i = 0; i < this.options.length; i++) {
      if (i === selectedOption) {
        p.fill(100, 149, 237);
        p.rect(menuX + 2, menuY + 5 + i * itemHeight, menuWidth - 4, itemHeight - 2, 2);
        p.fill(255);
      } else {
        p.fill(0);
      }
      
      p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(this.options[i], menuX + 8, menuY + 15 + i * itemHeight);
    }
    p.pop();
  }
}

export class Customer {
  constructor(p) {
    this.type = CUSTOMER_TYPES[Math.floor(p.random(0, CUSTOMER_TYPES.length))];
    this.name = this.type.name + " Customer";
    this.x = -50;
    this.y = 30;
    this.targetX = 20;
    this.width = 30;
    this.height = 60;
    this.color = [
      p.random(100, 255),
      p.random(100, 255),
      p.random(100, 255)
    ];
    this.patience = 100 * this.type.patienceModifier;
    this.maxPatience = 100 * this.type.patienceModifier;
    this.order = this.generateOrder(p);
    this.tipModifier = this.type.tipModifier;
    this.served = false;
    this.satisfaction = 100;
  }

  generateOrder(p) {
    const flavor = FLAVORS[Math.floor(p.random(0, FLAVORS.length))];
    const mixin = MIXINS[Math.floor(p.random(0, MIXINS.length))];
    const blendLevel = Math.floor(p.random(0, 3)); // 0: Light, 1: Medium, 2: Heavy
    
    // Select 1-3 random toppings
    const numToppings = Math.floor(p.random(1, 4));
    const toppings = [];
    const toppingIndices = [];
    
    while (toppings.length < numToppings) {
      const idx = Math.floor(p.random(0, TOPPINGS.length));
      if (!toppingIndices.includes(idx)) {
        toppingIndices.push(idx);
        toppings.push(TOPPINGS[idx]);
      }
    }
    
    return {
      flavor,
      mixin,
      blendLevel,
      toppings
    };
  }

  draw(p) {
    // Move towards target position
    if (this.x < this.targetX) {
      this.x += 2;
    }
    
    p.push();
    
    // Draw body
    p.fill(...this.color);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Draw face
    p.fill(255);
    p.ellipse(this.x + this.width/2 - 8, this.y + 25, 10, 10); // Left eye
    p.ellipse(this.x + this.width/2 + 8, this.y + 25, 10, 10); // Right eye
    p.fill(0);
    p.ellipse(this.x + this.width/2 - 8, this.y + 25, 4, 4); // Left pupil
    p.ellipse(this.x + this.width/2 + 8, this.y + 25, 4, 4); // Right pupil
    
    // Draw mouth based on patience
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    
    if (this.patience > this.maxPatience * 0.7) {
      // Happy face
      p.arc(this.x + this.width/2, this.y + 35, 20, 10, 0, p.PI);
    } else if (this.patience > this.maxPatience * 0.3) {
      // Neutral face
      p.line(this.x + this.width/2 - 10, this.y + 35, this.x + this.width/2 + 10, this.y + 35);
    } else {
      // Sad face
      p.arc(this.x + this.width/2, this.y + 40, 20, 10, p.PI, 0);
    }
    
    p.noStroke();
    
    // Draw hair or hat
    p.fill(50);
    p.arc(this.x + this.width/2, this.y + 5, this.width, 20, p.PI, 0);
    
    // Draw patience meter
    const patiencePercentage = this.patience / this.maxPatience;
    p.fill(255);
    p.rect(this.x - 10, this.y - 20, this.width + 20, 10, 5);
    
    p.fill(
      255 * (1 - patiencePercentage),
      255 * patiencePercentage,
      0
    );
    p.rect(this.x - 8, this.y - 18, (this.width + 16) * patiencePercentage, 6, 3);
    
    p.pop();
  }

  drawOrder(p, x, y) {
    p.push();
    
    // Clearer order display with text labels
    p.fill(255, 255, 255, 220);
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(x, y, 160, 70, 5);
    p.noStroke();
    
    p.fill(0);
    p.textSize(10);
    p.textAlign(p.CENTER, p.TOP);
    p.text("CUSTOMER ORDER", x + 80, y + 5);
    
    // Show flavor with text
    p.fill(...this.order.flavor.color);
    p.ellipse(x + 15, y + 25, 12, 12);
    p.fill(0);
    p.textSize(8);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(this.order.flavor.name, x + 25, y + 25);
    
    // Show mixin with text
    p.fill(...this.order.mixin.color);
    p.rect(x + 15, y + 35, 10, 10, 2);
    p.fill(0);
    p.text(this.order.mixin.name, x + 30, y + 40);
    
    // Show blend level with text
    p.fill(0);
    p.text("Blend: " + ["Light", "Medium", "Heavy"][this.order.blendLevel], x + 15, y + 52);
    
    // Show toppings with text
    p.textSize(7);
    p.text("Toppings:", x + 15, y + 62);
    let toppingText = this.order.toppings.map(t => t.name.substring(0, 4)).join(", ");
    if (toppingText.length > 25) {
      toppingText = toppingText.substring(0, 22) + "...";
    }
    p.text(toppingText, x + 55, y + 62);
    
    p.pop();
  }

  updatePatience(delta) {
    this.patience = Math.max(0, this.patience - delta);
    return this.patience;
  }

  calculateSatisfaction(sundae) {
    let accuracy = 100;
    
    // Check flavor
    if (sundae.flavor?.name !== this.order.flavor.name) {
      accuracy -= 20;
    }
    
    // Check mix-in
    if (sundae.mixins?.name !== this.order.mixin.name) {
      accuracy -= 20;
    }
    
    // Check blend level
    const blendDifference = Math.abs(sundae.blendLevel - this.order.blendLevel);
    accuracy -= blendDifference * 10;
    
    // Check toppings
    const orderToppingNames = this.order.toppings.map(t => t.name);
    const sundaeToppingNames = sundae.toppings.map(t => t.name);
    
    // Missing toppings
    for (const topping of orderToppingNames) {
      if (!sundaeToppingNames.includes(topping)) {
        accuracy -= 15;
      }
    }
    
    // Extra toppings
    for (const topping of sundaeToppingNames) {
      if (!orderToppingNames.includes(topping)) {
        accuracy -= 10;
      }
    }
    
    // Factor in patience
    const patienceFactor = this.patience / this.maxPatience;
    accuracy = Math.max(0, accuracy * patienceFactor);
    
    this.satisfaction = Math.max(0, Math.min(100, accuracy));
    return this.satisfaction;
  }

  calculateTip() {
    const baseTip = Math.floor(this.satisfaction / 10);
    return Math.max(0, Math.floor(baseTip * this.tipModifier));
  }
}

export class Sundae {
  constructor() {
    this.cup = true;
    this.flavor = null;
    this.mixins = null;
    this.blendLevel = 0;
    this.toppings = [];
  }

  draw(p, x, y, size = 1) {
    const width = 60 * size;
    const height = 80 * size;
    
    p.push();
    
    // Draw cup
    p.fill(220, 220, 240);
    p.rect(x, y, width, height, 5);
    
    // Draw ice cream if flavor exists
    if (this.flavor) {
      p.fill(...this.flavor.color);
      
      // Draw differently based on blend level
      if (this.blendLevel === 0) {
        // Light blend - more defined shape
        p.ellipse(x + width/2, y + height * 0.3, width * 0.8, height * 0.4);
      } else if (this.blendLevel === 1) {
        // Medium blend - slightly smoother
        p.ellipse(x + width/2, y + height * 0.35, width * 0.75, height * 0.35);
      } else {
        // Heavy blend - very smooth
        p.ellipse(x + width/2, y + height * 0.4, width * 0.7, height * 0.3);
      }
      
      // Draw mix-ins if they exist
      if (this.mixins) {
        p.fill(...this.mixins.color);
        
        // Draw mix-ins differently based on blend level
        if (this.blendLevel === 0) {
          // Visible chunks
          for (let i = 0; i < 5; i++) {
            p.rect(
              x + width * 0.3 + (i % 3) * 10,
              y + height * 0.25 + Math.floor(i / 3) * 10,
              5, 5, 1
            );
          }
        } else if (this.blendLevel === 1) {
          // Smaller pieces
          for (let i = 0; i < 8; i++) {
            p.rect(
              x + width * 0.25 + (i % 4) * 10,
              y + height * 0.3 + Math.floor(i / 4) * 8,
              3, 3, 1
            );
          }
        } else {
          // Well blended - just tint the ice cream slightly
          p.fill(
            (this.flavor.color[0] * 0.8 + this.mixins.color[0] * 0.2),
            (this.flavor.color[1] * 0.8 + this.mixins.color[1] * 0.2),
            (this.flavor.color[2] * 0.8 + this.mixins.color[2] * 0.2)
          );
          p.ellipse(x + width/2, y + height * 0.4, width * 0.7, height * 0.3);
        }
      }
      
      // Draw toppings
      let topY = y + height * 0.25;
      
      for (let i = 0; i < this.toppings.length; i++) {
        const topping = this.toppings[i];
        
        if (topping.name === "Whipped Cream") {
          p.fill(255);
          p.arc(x + width/2, topY, width * 0.8, height * 0.3, p.PI, 0);
          topY -= height * 0.15;
        } else if (topping.name === "Cherry") {
          p.fill(220, 20, 60);
          p.ellipse(x + width/2, topY - 5, width * 0.15, width * 0.15);
        } else if (topping.name === "Caramel" || topping.name === "Chocolate Syrup") {
          p.fill(...topping.color);
          // Draw drizzle
          for (let j = 0; j < 3; j++) {
            p.beginShape();
            p.vertex(x + width * 0.3 + j * 10, topY);
            p.vertex(x + width * 0.35 + j * 10, topY + 10);
            p.vertex(x + width * 0.25 + j * 10, topY + 20);
            p.vertex(x + width * 0.3 + j * 10, topY + 30);
            p.endShape();
          }
        }
      }
    }
    
    p.pop();
  }

  addTopping(topping) {
    // Check if topping already exists
    if (!this.toppings.some(t => t.name === topping.name)) {
      this.toppings.push(topping);
      return true;
    }
    return false;
  }

  reset() {
    this.cup = true;
    this.flavor = null;
    this.mixins = null;
    this.blendLevel = 0;
    this.toppings = [];
  }
}