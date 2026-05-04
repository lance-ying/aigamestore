import { COLORS, SETTINGS, FLAVORS, TOPPINGS } from './globals.js';

export class Customer {
  constructor(p, id, dayPhase) {
    this.id = id;
    this.patience = SETTINGS.BASE_PATIENCE - (dayPhase * 100); // Decreases patience as day progresses
    this.maxPatience = this.patience;
    this.order = this.generateOrder(p, dayPhase);
    this.satisfied = false;
    this.left = false;
    this.tip = 0;
    this.satisfaction = 0;
    this.color = [
      p.random(150, 220),
      p.random(150, 220),
      p.random(150, 220)
    ];
    this.hairColor = [
      p.random(50, 200),
      p.random(50, 200),
      p.random(50, 200)
    ];
    this.hairStyle = p.floor(p.random(3));
  }

  generateOrder(p, dayPhase) {
    // More complex orders as the day progresses
    const toppingCount = p.min(1 + dayPhase, 3);
    
    const order = {
      flavor: FLAVORS[p.floor(p.random(FLAVORS.length))],
      amount: p.random(SETTINGS.POUR_OPTIMAL_MIN, SETTINGS.POUR_OPTIMAL_MAX),
      blendTime: p.random(SETTINGS.BLEND_OPTIMAL_MIN, SETTINGS.BLEND_OPTIMAL_MAX),
      toppings: []
    };

    // Add random toppings
    const availableToppings = [...TOPPINGS];
    for (let i = 0; i < toppingCount; i++) {
      if (availableToppings.length === 0) break;
      
      const toppingIndex = p.floor(p.random(availableToppings.length));
      const topping = availableToppings.splice(toppingIndex, 1)[0];
      
      // Assign a position from the optimal positions
      const position = SETTINGS.TOPPING_POSITIONS[i];
      
      order.toppings.push({
        ...topping,
        position: { ...position },
        placed: false
      });
    }

    return order;
  }

  update() {
    if (!this.satisfied && !this.left) {
      this.patience -= SETTINGS.PATIENCE_DECREASE_RATE;
      if (this.patience <= 0) {
        this.left = true;
      }
    }
  }

  calculateSatisfaction(sundae) {
    if (!sundae) return 0;
    
    let satisfaction = 100;
    
    // Check flavor
    if (sundae.flavor.name !== this.order.flavor.name) {
      satisfaction -= 30;
    }
    
    // Check amount
    const amountDiff = Math.abs(sundae.amount - this.order.amount);
    if (amountDiff > 10) {
      satisfaction -= Math.min(30, amountDiff / 2);
    }
    
    // Check blend time
    const blendDiff = Math.abs(sundae.blendTime - this.order.blendTime);
    if (blendDiff > 10) {
      satisfaction -= Math.min(30, blendDiff / 3);
    }
    
    // Check toppings
    const requiredToppings = this.order.toppings.length;
    let correctToppings = 0;
    
    for (const requiredTopping of this.order.toppings) {
      const matchingTopping = sundae.toppings.find(t => 
        t.name === requiredTopping.name && 
        Math.abs(t.position.x - requiredTopping.position.x) < 30 &&
        Math.abs(t.position.y - requiredTopping.position.y) < 30
      );
      
      if (matchingTopping) {
        correctToppings++;
      }
    }
    
    // Penalize for missing or extra toppings
    if (requiredToppings > 0) {
      const toppingAccuracy = correctToppings / requiredToppings;
      satisfaction *= toppingAccuracy;
    }
    
    // Extra toppings penalty
    const extraToppings = Math.max(0, sundae.toppings.length - requiredToppings);
    satisfaction -= extraToppings * 10;
    
    // Calculate tip based on satisfaction and remaining patience
    const patienceRatio = this.patience / this.maxPatience;
    const tipMultiplier = (satisfaction / 100) * patienceRatio;
    
    this.satisfaction = Math.max(0, Math.min(100, satisfaction));
    this.tip = Math.max(SETTINGS.MIN_TIP, Math.floor(tipMultiplier * SETTINGS.MAX_TIP));
    this.satisfied = true;
    
    return this.satisfaction;
  }

  draw(p, x, y) {
    // Draw customer
    p.push();
    p.translate(x, y);
    
    // Body
    p.fill(this.color);
    p.ellipse(0, 10, 40, 50);
    
    // Head
    p.fill(COLORS.CUSTOMER_BASE);
    p.ellipse(0, -15, 30, 30);
    
    // Hair
    p.fill(this.hairColor);
    if (this.hairStyle === 0) {
      // Short hair
      p.ellipse(0, -25, 25, 10);
    } else if (this.hairStyle === 1) {
      // Medium hair
      p.ellipse(0, -25, 30, 15);
      p.rect(-15, -25, 30, 10);
    } else {
      // Long hair
      p.ellipse(0, -25, 35, 15);
      p.rect(-17, -25, 34, 20);
    }
    
    // Eyes
    p.fill(0);
    p.ellipse(-7, -15, 4, 4);
    p.ellipse(7, -15, 4, 4);
    
    // Mouth
    if (this.satisfied) {
      // Happy mouth
      p.noFill();
      p.stroke(0);
      p.arc(0, -5, 12, 8, 0, p.PI);
      p.noStroke();
    } else if (this.left) {
      // Angry mouth
      p.noFill();
      p.stroke(0);
      p.arc(0, -5, 12, 8, p.PI, p.TWO_PI);
      p.noStroke();
    } else {
      // Neutral mouth
      p.fill(0);
      p.rect(-6, -5, 12, 2);
    }
    
    // Patience meter
    const patienceRatio = this.patience / this.maxPatience;
    p.noStroke();
    
    // Background meter
    p.fill(100);
    p.rect(-15, 30, 30, 5);
    
    // Patience level
    if (patienceRatio > 0.6) {
      p.fill(COLORS.PATIENCE_GOOD);
    } else if (patienceRatio > 0.3) {
      p.fill(COLORS.PATIENCE_MEDIUM);
    } else {
      p.fill(COLORS.PATIENCE_LOW);
    }
    
    p.rect(-15, 30, 30 * patienceRatio, 5);
    
    // Show tip if satisfied
    if (this.satisfied) {
      p.fill(0);
      p.textSize(12);
      p.textAlign(p.CENTER);
      p.text(`$${this.tip}`, 0, 45);
    }
    
    p.pop();
  }

  drawOrder(p, x, y) {
    p.push();
    p.translate(x, y);
    
    // Order bubble
    p.fill(255);
    p.stroke(0);
    p.ellipse(30, -40, 60, 50);
    p.triangle(10, -20, 20, -25, 5, -5);
    p.noStroke();
    
    // Draw flavor
    p.fill(this.order.flavor.color);
    p.ellipse(30, -45, 20, 20);
    
    // Draw toppings
    let yOffset = -45;
    for (let i = 0; i < this.order.toppings.length; i++) {
      const topping = this.order.toppings[i];
      p.fill(topping.color);
      p.ellipse(30, yOffset - 15 + (i * 10), 8, 8);
    }
    
    p.pop();
  }
}