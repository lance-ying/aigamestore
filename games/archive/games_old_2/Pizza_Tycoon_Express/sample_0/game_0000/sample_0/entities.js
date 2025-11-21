// entities.js - Game entity classes
import { gameState, PIZZA_DOUGH, PIZZA_SAUCED, PIZZA_CHEESED, PIZZA_TOPPED, PIZZA_BAKED, PIZZA_SLICED } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.color = [100, 150, 255];
  }

  update() {
    // Player updates handled by game logic
  }

  render(p) {
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(this.x, this.y, this.size);
    // Chef hat
    p.fill(255);
    p.triangle(
      this.x - 8, this.y - 10,
      this.x, this.y - 18,
      this.x + 8, this.y - 10
    );
    p.pop();
  }
}

export class Customer {
  constructor(id, x, y, isDriveThru, order, patience) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.isDriveThru = isDriveThru;
    this.order = order;
    this.patienceMax = patience;
    this.patience = patience;
    this.color = isDriveThru ? [150, 150, 150] : [255, 100, 100];
    this.size = isDriveThru ? 30 : 20;
  }

  update() {
    this.patience -= 1;
    if (this.patience <= 0) {
      return true; // Customer left
    }
    return false;
  }

  render(p) {
    p.push();
    
    // Draw customer/car
    if (this.isDriveThru) {
      p.fill(...this.color);
      p.rect(this.x - 15, this.y - 10, 30, 20, 3);
      p.fill(100, 150, 200);
      p.rect(this.x - 10, this.y - 5, 8, 8);
      p.rect(this.x + 2, this.y - 5, 8, 8);
    } else {
      p.fill(...this.color);
      p.ellipse(this.x, this.y, this.size);
    }
    
    // Order bubble
    p.fill(255, 255, 200, 230);
    p.stroke(0);
    p.strokeWeight(1);
    p.ellipse(this.x, this.y - 30, 35, 35);
    
    // Order text
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    let orderText = this.order.toppings.length > 0 ? this.order.toppings.join(",").substring(0, 8) : "Cheese";
    p.text(orderText, this.x, this.y - 30);
    
    // Patience bar
    const barWidth = 30;
    const barHeight = 4;
    const patienceRatio = this.patience / this.patienceMax;
    p.fill(200);
    p.noStroke();
    p.rect(this.x - barWidth/2, this.y - 45, barWidth, barHeight);
    p.fill(...(patienceRatio > 0.5 ? [0, 200, 0] : patienceRatio > 0.25 ? [255, 200, 0] : [255, 0, 0]));
    p.rect(this.x - barWidth/2, this.y - 45, barWidth * patienceRatio, barHeight);
    
    p.pop();
  }
}

export class Pizza {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.state = PIZZA_DOUGH;
    this.toppings = [];
    this.size = 25;
    this.inOven = false;
    this.ovenSlot = -1;
    this.bakeProgress = 0;
  }

  hasTopping(topping) {
    return this.toppings.includes(topping);
  }

  addTopping(topping) {
    if (!this.toppings.includes(topping)) {
      this.toppings.push(topping);
    }
  }

  matchesOrder(order) {
    if (this.state !== PIZZA_SLICED) return false;
    if (order.toppings.length !== this.toppings.length) return false;
    for (let topping of order.toppings) {
      if (!this.toppings.includes(topping)) return false;
    }
    return true;
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Base dough
    const baseColor = this.state === PIZZA_BAKED || this.state === PIZZA_SLICED 
      ? [220, 180, 100] 
      : [240, 220, 180];
    p.fill(...baseColor);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.size);
    
    // Sauce
    if (this.state !== PIZZA_DOUGH) {
      p.fill(200, 50, 50);
      p.noStroke();
      p.ellipse(0, 0, this.size - 4);
    }
    
    // Cheese
    if (this.state !== PIZZA_DOUGH && this.state !== PIZZA_SAUCED) {
      p.fill(255, 250, 200, 200);
      p.noStroke();
      p.ellipse(0, 0, this.size - 6);
    }
    
    // Toppings
    if (this.toppings.length > 0 && this.state !== PIZZA_DOUGH && this.state !== PIZZA_SAUCED && this.state !== PIZZA_CHEESED) {
      const positions = [
        {x: 0, y: -5}, {x: 5, y: 0}, {x: 0, y: 5}, {x: -5, y: 0},
        {x: 3, y: -3}, {x: 3, y: 3}, {x: -3, y: 3}, {x: -3, y: -3}
      ];
      
      this.toppings.forEach((topping, idx) => {
        const pos = positions[idx % positions.length];
        if (topping === "pepperoni") {
          p.fill(180, 30, 30);
          p.ellipse(pos.x, pos.y, 4);
        } else if (topping === "mushroom") {
          p.fill(180, 180, 180);
          p.arc(pos.x, pos.y, 5, 5, p.PI, 0);
        } else if (topping === "olive") {
          p.fill(40, 40, 40);
          p.ellipse(pos.x, pos.y, 3);
        } else if (topping === "onion") {
          p.fill(255, 230, 200);
          p.ellipse(pos.x, pos.y, 4);
        } else if (topping === "pepper") {
          p.fill(100, 200, 100);
          p.rect(pos.x - 1.5, pos.y - 2, 3, 4);
        }
      });
    }
    
    // Slice marks
    if (this.state === PIZZA_SLICED) {
      p.stroke(0);
      p.strokeWeight(1);
      p.line(-this.size/2, 0, this.size/2, 0);
      p.line(0, -this.size/2, 0, this.size/2);
    }
    
    p.pop();
  }
}

export class Workstation {
  constructor(name, x, y, width, height, color) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.isActive = false;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  render(p) {
    p.push();
    const fillColor = this.isActive 
      ? [this.color[0] + 40, this.color[1] + 40, this.color[2] + 40]
      : this.color;
    p.fill(...fillColor);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.name, this.x + this.width/2, this.y + this.height/2);
    p.pop();
  }
}

export class Employee {
  constructor(id, type, x, y) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.size = 15;
    this.color = [200, 100, 200];
    this.assignedTask = null;
    this.taskProgress = 0;
  }

  render(p) {
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(this.x, this.y, this.size);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text("E", this.x, this.y);
    p.pop();
  }
}