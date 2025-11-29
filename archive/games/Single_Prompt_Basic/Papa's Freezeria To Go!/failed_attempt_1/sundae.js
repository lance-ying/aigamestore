import { COLORS } from './globals.js';

export class Sundae {
  constructor(flavor) {
    this.flavor = flavor;
    this.amount = 0;
    this.blendTime = 0;
    this.blended = false;
    this.toppings = [];
  }

  draw(p, x, y) {
    p.push();
    p.translate(x, y);
    
    // Draw cup
    p.fill(COLORS.CUP);
    p.rect(-30, 0, 60, 60);
    p.arc(0, 0, 60, 20, p.PI, p.TWO_PI);
    
    // Draw ice cream if there's any
    if (this.amount > 0) {
      p.fill(this.flavor.color);
      
      // Ice cream in cup
      const heightRatio = this.amount / 100;
      const iceHeight = 50 * heightRatio;
      
      // Base of ice cream in cup
      p.ellipse(0, 0, 50, 15);
      
      // Ice cream body
      if (this.blended) {
        // Smooth, blended ice cream
        p.ellipse(0, -iceHeight/2, 50, iceHeight);
        p.ellipse(0, -iceHeight, 50, 20);
      } else {
        // Unblended, chunky ice cream
        for (let i = 0; i < 5; i++) {
          const yPos = -i * (iceHeight/5) - 5;
          if (yPos > -iceHeight) {
            p.ellipse(p.random(-10, 10), yPos, p.random(10, 20), p.random(10, 20));
          }
        }
      }
    }
    
    // Draw toppings
    for (const topping of this.toppings) {
      p.fill(topping.color);
      
      if (topping.name === "Whipped Cream") {
        p.ellipse(topping.position.x - x, topping.position.y - y - 10, 15, 10);
      } else if (topping.name === "Cherry") {
        p.ellipse(topping.position.x - x, topping.position.y - y - 10, 10, 10);
        p.fill(0, 100, 0);
        p.rect(topping.position.x - x, topping.position.y - y - 15, 2, 5);
      } else if (topping.name === "Sprinkles") {
        for (let i = 0; i < 8; i++) {
          p.fill(p.random(100, 255), p.random(100, 255), p.random(100, 255));
          p.rect(topping.position.x - x + p.random(-10, 10), 
                 topping.position.y - y - 10 + p.random(-5, 5), 
                 3, 1);
        }
      } else if (topping.name === "Chocolate Chips") {
        for (let i = 0; i < 5; i++) {
          p.fill(COLORS.CHOCOLATE_CHIPS);
          p.ellipse(topping.position.x - x + p.random(-8, 8), 
                    topping.position.y - y - 10 + p.random(-5, 5), 
                    4, 4);
        }
      } else if (topping.name === "Cookie") {
        p.fill(COLORS.COOKIE);
        p.ellipse(topping.position.x - x, topping.position.y - y - 10, 12, 12);
        p.fill(COLORS.CHOCOLATE_CHIPS);
        for (let i = 0; i < 3; i++) {
          p.ellipse(topping.position.x - x + p.random(-3, 3), 
                    topping.position.y - y - 10 + p.random(-3, 3), 
                    2, 2);
        }
      }
    }
    
    p.pop();
  }
}