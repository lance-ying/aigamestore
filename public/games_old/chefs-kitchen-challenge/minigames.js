import { gameState, MINIGAME_TYPES } from './globals.js';

export class ChopMinigame {
  constructor(p, ingredient, targetCuts, difficulty) {
    this.p = p;
    this.ingredient = ingredient;
    this.targetCuts = targetCuts;
    this.difficulty = difficulty;
    this.cutsRemaining = targetCuts;
    this.targetZones = [];
    this.ingredientPieces = [];
    this.lastCutTime = 0;
    this.badCuts = 0;
    this.maxBadCuts = 5 - difficulty;
    this.isComplete = false;
    this.isFailed = false;
    
    this.ingredientX = 300;
    this.ingredientY = 200;
    this.ingredientWidth = 120;
    this.ingredientHeight = 80;
    
    this.generateTargetZones();
  }
  
  generateTargetZones() {
    const spacing = this.ingredientWidth / (this.targetCuts + 1);
    for (let i = 0; i < this.targetCuts; i++) {
      this.targetZones.push({
        x: this.ingredientX - this.ingredientWidth / 2 + spacing * (i + 1),
        y: this.ingredientY,
        width: 10 + (5 - this.difficulty) * 2,
        active: true
      });
    }
  }
  
  update(mousePressed, mouseX, mouseY, pmouseX, pmouseY) {
    if (this.isComplete || this.isFailed) return;
    
    if (mousePressed && this.p.millis() - this.lastCutTime > 300) {
      const speed = this.p.dist(mouseX, mouseY, pmouseX, pmouseY);
      
      if (speed > 10) {
        let hitTarget = false;
        
        for (let zone of this.targetZones) {
          if (zone.active) {
            const dist = this.p.dist(mouseX, mouseY, zone.x, zone.y);
            
            if (dist < zone.width) {
              zone.active = false;
              this.cutsRemaining--;
              
              if (dist < zone.width * 0.3) {
                gameState.score += 20;
                this.createFeedback("Perfect!", zone.x, zone.y, [100, 255, 100]);
              } else {
                gameState.score += 5;
                this.createFeedback("+5", zone.x, zone.y, [255, 255, 100]);
              }
              
              this.createPiece(zone.x, zone.y);
              hitTarget = true;
              this.lastCutTime = this.p.millis();
              break;
            }
          }
        }
        
        if (!hitTarget && speed > 15) {
          this.badCuts++;
          gameState.score = Math.max(0, gameState.score - 10);
          this.createFeedback("-10", mouseX, mouseY, [255, 100, 100]);
          this.lastCutTime = this.p.millis();
          
          if (this.badCuts >= this.maxBadCuts) {
            this.isFailed = true;
          }
        }
      }
    }
    
    if (this.cutsRemaining <= 0) {
      this.isComplete = true;
    }
    
    for (let i = this.ingredientPieces.length - 1; i >= 0; i--) {
      const piece = this.ingredientPieces[i];
      piece.y += piece.vy;
      piece.vy += 0.5;
      piece.alpha -= 3;
      
      if (piece.alpha <= 0) {
        this.ingredientPieces.splice(i, 1);
      }
    }
  }
  
  createPiece(x, y) {
    this.ingredientPieces.push({
      x: x,
      y: y,
      vy: this.p.random(-3, -6),
      alpha: 255
    });
  }
  
  createFeedback(text, x, y, color) {
    if (!this.feedbackTexts) this.feedbackTexts = [];
    this.feedbackTexts.push({
      text: text,
      x: x,
      y: y,
      alpha: 255,
      color: color
    });
  }
  
  draw() {
    const p = this.p;
    
    p.push();
    p.fill(101, 67, 33);
    p.rect(200, 150, 200, 20);
    p.rect(200, 230, 200, 20);
    p.rect(190, 150, 20, 100);
    p.rect(380, 150, 20, 100);
    p.pop();
    
    p.push();
    let ingredientColor;
    switch (this.ingredient) {
      case "Lettuce": ingredientColor = [100, 200, 100]; break;
      case "Veggies": ingredientColor = [255, 150, 50]; break;
      case "Garnish": ingredientColor = [150, 255, 150]; break;
      case "Dry Ingredients": ingredientColor = [240, 240, 220]; break;
      case "Toppings": ingredientColor = [255, 100, 150]; break;
      case "Fish": ingredientColor = [255, 150, 150]; break;
      case "Salmon": ingredientColor = [255, 120, 120]; break;
      case "Asparagus": ingredientColor = [100, 180, 100]; break;
      case "Chocolate": ingredientColor = [80, 50, 30]; break;
      case "Slice Roll": ingredientColor = [255, 255, 200]; break;
      default: ingredientColor = [255, 200, 100];
    }
    
    p.fill(...ingredientColor);
    p.rect(this.ingredientX - this.ingredientWidth / 2, this.ingredientY - this.ingredientHeight / 2, 
           this.ingredientWidth, this.ingredientHeight, 10);
    p.pop();
    
    p.push();
    for (let zone of this.targetZones) {
      if (zone.active) {
        p.stroke(255, 255, 0, 150);
        p.strokeWeight(2);
        p.line(zone.x, zone.y - 50, zone.x, zone.y + 50);
        
        p.fill(255, 255, 0, 50);
        p.noStroke();
        p.ellipse(zone.x, zone.y, zone.width * 2, zone.width * 2);
      }
    }
    p.pop();
    
    for (let piece of this.ingredientPieces) {
      p.push();
      p.fill(...ingredientColor, piece.alpha);
      p.ellipse(piece.x, piece.y, 15, 15);
      p.pop();
    }
    
    if (this.feedbackTexts) {
      for (let i = this.feedbackTexts.length - 1; i >= 0; i--) {
        const fb = this.feedbackTexts[i];
        p.push();
        p.fill(...fb.color, fb.alpha);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        p.text(fb.text, fb.x, fb.y - 40);
        p.pop();
        
        fb.y -= 1;
        fb.alpha -= 5;
        
        if (fb.alpha <= 0) {
          this.feedbackTexts.splice(i, 1);
        }
      }
    }
    
    p.push();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(`Chop the ${this.ingredient}!`, 300, 80);
    p.textSize(18);
    p.text(`Cuts Remaining: ${this.cutsRemaining}`, 300, 320);
    p.text(`Bad Cuts: ${this.badCuts}/${this.maxBadCuts}`, 300, 345);
    p.pop();
  }
}

export class MixMinigame {
  constructor(p, ingredient, targetRotations, difficulty) {
    this.p = p;
    this.ingredient = ingredient;
    this.targetRotations = targetRotations;
    this.difficulty = difficulty;
    this.rotationsComplete = 0;
    this.currentAngle = 0;
    this.lastAngle = 0;
    this.totalRotation = 0;
    this.bowlX = 300;
    this.bowlY = 220;
    this.bowlRadius = 80;
    this.optimalRadius = 60;
    this.tolerance = 20 + (5 - difficulty) * 5;
    this.progress = 0;
    this.isComplete = false;
    this.isFailed = false;
    this.particles = [];
    this.lastUpdateTime = 0;
    this.consistentSpeed = 0;
  }
  
  update(mousePressed, mouseX, mouseY) {
    if (this.isComplete || this.isFailed) return;
    
    if (mousePressed) {
      const dx = mouseX - this.bowlX;
      const dy = mouseY - this.bowlY;
      const dist = this.p.sqrt(dx * dx + dy * dy);
      
      if (dist > 20 && dist < this.bowlRadius + 30) {
        this.currentAngle = this.p.atan2(dy, dx);
        
        let angleDiff = this.currentAngle - this.lastAngle;
        
        if (angleDiff > this.p.PI) angleDiff -= this.p.TWO_PI;
        if (angleDiff < -this.p.PI) angleDiff += this.p.TWO_PI;
        
        if (this.p.abs(angleDiff) < 0.5) {
          this.totalRotation += angleDiff;
          
          if (dist >= this.optimalRadius - this.tolerance && 
              dist <= this.optimalRadius + this.tolerance) {
            this.progress += this.p.abs(angleDiff) * 1.5;
            
            if (this.p.frameCount % 3 === 0) {
              this.createParticle(mouseX, mouseY);
            }
          } else {
            this.progress += this.p.abs(angleDiff) * 0.5;
          }
        }
        
        this.lastAngle = this.currentAngle;
        
        if (this.totalRotation >= this.p.TWO_PI * this.targetRotations) {
          this.rotationsComplete = this.p.floor(this.totalRotation / this.p.TWO_PI);
          
          if (this.rotationsComplete >= this.targetRotations) {
            this.isComplete = true;
            gameState.score += 50;
          }
        }
      }
    } else {
      this.lastAngle = 0;
    }
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= 5;
      
      if (particle.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  createParticle(x, y) {
    this.particles.push({
      x: x,
      y: y,
      vx: this.p.random(-2, 2),
      vy: this.p.random(-2, 2),
      alpha: 255
    });
  }
  
  draw() {
    const p = this.p;
    
    p.push();
    p.fill(200, 200, 220);
    p.stroke(100, 100, 120);
    p.strokeWeight(4);
    p.ellipse(this.bowlX, this.bowlY, this.bowlRadius * 2.5, this.bowlRadius * 2);
    p.pop();
    
    p.push();
    let mixColor;
    switch (this.ingredient) {
      case "Dressing": mixColor = [255, 220, 100]; break;
      case "Eggs": mixColor = [255, 240, 150]; break;
      case "Scramble": mixColor = [255, 230, 120]; break;
      case "Broth": mixColor = [200, 180, 150]; break;
      case "Batter": mixColor = [240, 230, 200]; break;
      case "Stack": mixColor = [220, 200, 160]; break;
      case "Rice": mixColor = [255, 255, 255]; break;
      case "Assembly": mixColor = [255, 200, 180]; break;
      case "Sauce": mixColor = [255, 220, 100]; break;
      default: mixColor = [220, 200, 180];
    }
    
    const mixAmount = this.p.constrain(this.progress / (this.p.TWO_PI * this.targetRotations), 0, 1);
    p.fill(...mixColor, 150 + mixAmount * 100);
    p.noStroke();
    p.ellipse(this.bowlX, this.bowlY, this.bowlRadius * 2, this.bowlRadius * 1.6);
    p.pop();
    
    p.push();
    p.noFill();
    p.stroke(100, 255, 100, 100);
    p.strokeWeight(2);
    p.ellipse(this.bowlX, this.bowlY, this.optimalRadius * 2, this.optimalRadius * 2);
    p.pop();
    
    for (let particle of this.particles) {
      p.push();
      p.fill(255, 255, 255, particle.alpha);
      p.noStroke();
      p.ellipse(particle.x, particle.y, 5, 5);
      p.pop();
    }
    
    if (p.mouseIsPressed) {
      const dx = p.mouseX - this.bowlX;
      const dy = p.mouseY - this.bowlY;
      const dist = p.sqrt(dx * dx + dy * dy);
      
      if (dist > 20 && dist < this.bowlRadius + 30) {
        p.push();
        p.fill(200, 200, 200);
        p.noStroke();
        p.ellipse(p.mouseX, p.mouseY, 30, 8);
        p.pop();
      }
    }
    
    p.push();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(`Mix the ${this.ingredient}!`, 300, 80);
    p.textSize(18);
    
    const progressPercent = this.p.constrain(this.rotationsComplete / this.targetRotations * 100, 0, 100);
    p.text(`Progress: ${this.rotationsComplete}/${this.targetRotations} rotations`, 300, 340);
    
    p.fill(100, 100, 120);
    p.rect(200, 360, 200, 20);
    p.fill(100, 255, 100);
    p.rect(200, 360, 200 * (progressPercent / 100), 20);
    p.pop();
  }
}

export class CookMinigame {
  constructor(p, ingredient, flipCount, difficulty) {
    this.p = p;
    this.ingredient = ingredient;
    this.flipCount = flipCount;
    this.difficulty = difficulty;
    this.flipsRemaining = flipCount;
    this.currentCookStage = 0;
    this.cookProgress = 0;
    this.cookSpeed = 0.3 + difficulty * 0.1;
    this.perfectWindow = 30 - difficulty * 3;
    this.goodWindow = 50 - difficulty * 5;
    this.isComplete = false;
    this.isFailed = false;
    this.feedback = null;
    this.itemFlipped = false;
    this.itemRotation = 0;
    this.panX = 300;
    this.panY = 220;
    this.consecutiveMisses = 0;
    this.maxMisses = 3;
  }
  
  update(spacePressed) {
    if (this.isComplete || this.isFailed) return;
    
    this.cookProgress += this.cookSpeed;
    
    if (this.itemFlipped) {
      this.itemRotation += 15;
      if (this.itemRotation >= 180) {
        this.itemRotation = 0;
        this.itemFlipped = false;
        this.cookProgress = 0;
      }
    }
    
    if (spacePressed && !this.itemFlipped) {
      const perfectMin = 100 - this.perfectWindow / 2;
      const perfectMax = 100 + this.perfectWindow / 2;
      const goodMin = 100 - this.goodWindow / 2;
      const goodMax = 100 + this.goodWindow / 2;
      
      if (this.cookProgress >= perfectMin && this.cookProgress <= perfectMax) {
        gameState.score += 30;
        this.createFeedback("Perfect!", [100, 255, 100]);
        this.itemFlipped = true;
        this.flipsRemaining--;
        this.consecutiveMisses = 0;
      } else if (this.cookProgress >= goodMin && this.cookProgress <= goodMax) {
        gameState.score += 10;
        this.createFeedback("Good!", [255, 255, 100]);
        this.itemFlipped = true;
        this.flipsRemaining--;
        this.consecutiveMisses = 0;
      } else if (this.cookProgress < goodMin) {
        gameState.score = Math.max(0, gameState.score - 10);
        this.createFeedback("Too Early!", [255, 150, 100]);
        this.consecutiveMisses++;
      } else {
        gameState.score = Math.max(0, gameState.score - 10);
        this.createFeedback("Too Late!", [255, 100, 100]);
        this.consecutiveMisses++;
      }
      
      if (this.cookProgress > 150) {
        this.isFailed = true;
        this.createFeedback("BURNED!", [255, 0, 0]);
      }
      
      if (this.consecutiveMisses >= this.maxMisses) {
        this.isFailed = true;
      }
    }
    
    if (this.flipsRemaining <= 0 && !this.itemFlipped) {
      this.isComplete = true;
    }
    
    if (this.feedback) {
      this.feedback.alpha -= 5;
      if (this.feedback.alpha <= 0) {
        this.feedback = null;
      }
    }
  }
  
  createFeedback(text, color) {
    this.feedback = {
      text: text,
      alpha: 255,
      color: color
    };
  }
  
  draw() {
    const p = this.p;
    
    p.push();
    p.fill(60, 60, 70);
    p.ellipse(this.panX, this.panY, 180, 160);
    p.fill(80, 80, 90);
    p.rect(this.panX - 100, this.panY + 60, 30, 60, 5);
    p.pop();
    
    p.push();
    p.translate(this.panX, this.panY);
    p.rotate(p.radians(this.itemRotation));
    
    let itemColor;
    const burnAmount = this.p.constrain((this.cookProgress - 100) / 50, 0, 1);
    
    switch (this.ingredient) {
      case "Eggs":
        itemColor = [255 - burnAmount * 155, 240 - burnAmount * 140, 150 - burnAmount * 100];
        p.fill(...itemColor);
        p.ellipse(0, 0, 80, 70);
        break;
      case "Pancakes":
        itemColor = [220 - burnAmount * 120, 180 - burnAmount * 100, 100 - burnAmount * 60];
        p.fill(...itemColor);
        p.ellipse(0, 0, 90, 80);
        break;
      case "Noodles":
        itemColor = [255 - burnAmount * 155, 240 - burnAmount * 140, 200 - burnAmount * 100];
        p.fill(...itemColor);
        for (let i = 0; i < 5; i++) {
          p.ellipse(p.random(-30, 30), p.random(-20, 20), 40, 8);
        }
        break;
      case "Salmon":
        itemColor = [255 - burnAmount * 155, 140 - burnAmount * 60, 120 - burnAmount * 60];
        p.fill(...itemColor);
        p.rect(-40, -30, 80, 60, 5);
        break;
      case "Asparagus":
        itemColor = [100 - burnAmount * 60, 180 - burnAmount * 100, 100 - burnAmount * 60];
        p.fill(...itemColor);
        for (let i = 0; i < 3; i++) {
          p.rect(-30 + i * 25, -35, 8, 70, 3);
        }
        break;
      case "Cake":
        itemColor = [180 - burnAmount * 100, 150 - burnAmount * 80, 120 - burnAmount * 70];
        p.fill(...itemColor);
        p.ellipse(0, 0, 70, 60);
        break;
      default:
        itemColor = [200 - burnAmount * 100, 150 - burnAmount * 80, 100 - burnAmount * 60];
        p.fill(...itemColor);
        p.ellipse(0, 0, 80, 70);
    }
    p.pop();
    
    if (this.cookProgress > 50 && this.cookProgress < 120) {
      for (let i = 0; i < 3; i++) {
        p.push();
        const steamY = this.panY - 40 - (p.frameCount * 2 + i * 20) % 100;
        p.fill(200, 200, 220, 150 - (p.frameCount + i * 20) % 100);
        p.noStroke();
        p.ellipse(this.panX + p.random(-20, 20), steamY, 15, 20);
        p.pop();
      }
    }
    
    p.push();
    const indicatorY = 340;
    const indicatorWidth = 300;
    const indicatorX = 150;
    
    p.fill(100, 100, 120);
    p.rect(indicatorX, indicatorY, indicatorWidth, 20);
    
    const progressPos = this.p.constrain(this.cookProgress / 150 * indicatorWidth, 0, indicatorWidth);
    p.fill(255, 100, 100);
    p.rect(indicatorX, indicatorY, progressPos, 20);
    
    const perfectCenter = indicatorX + (100 / 150) * indicatorWidth;
    p.fill(100, 255, 100, 100);
    p.rect(perfectCenter - this.perfectWindow / 150 * indicatorWidth / 2, indicatorY, 
           this.perfectWindow / 150 * indicatorWidth, 20);
    
    const goodStart = perfectCenter - this.goodWindow / 150 * indicatorWidth / 2;
    const goodEnd = perfectCenter + this.goodWindow / 150 * indicatorWidth / 2;
    p.fill(255, 255, 100, 80);
    p.rect(goodStart, indicatorY, this.perfectWindow / 150 * indicatorWidth / 2 - 2, 20);
    p.rect(perfectCenter + this.perfectWindow / 150 * indicatorWidth / 2 + 2, indicatorY, 
           this.goodWindow / 150 * indicatorWidth / 2 - 2, 20);
    
    p.stroke(255);
    p.strokeWeight(3);
    p.line(perfectCenter, indicatorY - 5, perfectCenter, indicatorY + 25);
    p.pop();
    
    if (this.feedback) {
      p.push();
      p.fill(...this.feedback.color, this.feedback.alpha);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);
      p.text(this.feedback.text, 300, 120);
      p.pop();
    }
    
    p.push();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(`Cook the ${this.ingredient}!`, 300, 80);
    p.textSize(18);
    p.text(`Flips Remaining: ${this.flipsRemaining}`, 300, 370);
    p.text("Press SPACE at the perfect moment!", 300, 310);
    p.pop();
  }
}