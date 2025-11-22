// items.js - Item and interactable objects
export class Item {
  constructor(p, x, y, type, id) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.type = type;
    this.id = id;
    this.collected = false;
    this.bobOffset = 0;
    this.bobSpeed = 0.05;
  }

  update() {
    this.bobOffset = Math.sin(this.p.frameCount * this.bobSpeed) * 3;
  }

  draw() {
    if (this.collected) return;
    
    const p = this.p;
    const drawY = this.y + this.bobOffset;
    
    p.push();
    p.translate(this.x + this.width/2, drawY + this.height/2);
    
    // Glow effect
    p.noStroke();
    p.fill(255, 255, 200, 50);
    p.circle(0, 0, this.width + 10);
    
    p.stroke(0);
    p.strokeWeight(2);
    
    switch(this.type) {
      case "key":
        p.fill(255, 215, 0);
        p.rect(-10, -5, 8, 10, 2);
        p.rect(0, -5, 12, 4, 1);
        p.rect(6, -2, 2, 2);
        p.rect(6, 1, 2, 2);
        break;
      case "lever_part":
        p.fill(150, 150, 150);
        p.rect(-8, -12, 16, 24, 2);
        p.fill(200, 100, 100);
        p.circle(0, 0, 8);
        break;
      case "wire_cutters":
        p.fill(180, 180, 180);
        p.ellipse(-3, -5, 8, 12);
        p.ellipse(3, -5, 8, 12);
        p.fill(200, 50, 50);
        p.rect(-3, 0, 6, 12, 2);
        break;
      case "insulated_gloves":
        p.fill(255, 200, 0);
        p.rect(-10, -8, 8, 12, 3);
        p.rect(2, -8, 8, 12, 3);
        break;
      case "vault_code":
        p.fill(255, 255, 240);
        p.rect(-10, -12, 20, 24, 2);
        p.fill(0);
        p.textSize(6);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("CODE", 0, -5);
        p.text("1234", 0, 3);
        break;
      case "exit_key":
        p.fill(100, 200, 255);
        p.rect(-10, -5, 8, 10, 2);
        p.rect(0, -5, 12, 4, 1);
        p.rect(6, -3, 2, 2);
        p.rect(6, 0, 2, 2);
        p.rect(6, 3, 2, 2);
        break;
      case "alarm_device":
        p.fill(100, 100, 100);
        p.rect(-8, -10, 16, 20, 2);
        p.fill(255, 0, 0);
        p.circle(0, -3, 6);
        p.fill(200, 200, 200);
        p.rect(-4, 3, 8, 4, 1);
        break;
      default:
        p.fill(150, 150, 200);
        p.rect(-12, -12, 24, 24, 3);
    }
    
    p.pop();
    
    // Label
    if (!this.collected) {
      p.push();
      p.fill(255, 255, 255, 200);
      p.textSize(10);
      p.textAlign(p.CENTER, p.TOP);
      p.text(this.type.replace(/_/g, ' ').toUpperCase(), this.x + this.width/2, this.y - 15);
      p.pop();
    }
  }
}

export class InteractableObject {
  constructor(p, x, y, width, height, type, requiredItem = null) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.requiredItem = requiredItem;
    this.activated = false;
    this.locked = true;
  }

  draw() {
    const p = this.p;
    p.push();
    p.stroke(0);
    p.strokeWeight(2);
    
    switch(this.type) {
      case "door":
        if (this.locked) {
          p.fill(80, 40, 40);
        } else {
          p.fill(40, 80, 40);
        }
        p.rect(this.x, this.y, this.width, this.height, 5);
        p.fill(150, 150, 150);
        p.circle(this.x + 10, this.y + this.height/2, 8);
        
        // Lock indicator
        if (this.locked) {
          p.fill(200, 50, 50);
          p.textSize(12);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("🔒", this.x + this.width/2, this.y + this.height/2);
        }
        break;
      case "lever":
        p.fill(100, 100, 100);
        p.rect(this.x, this.y, this.width, this.height, 3);
        p.fill(this.activated ? 100 : 200, this.activated ? 200 : 100, 50);
        const leverAngle = this.activated ? 0.5 : -0.5;
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.rotate(leverAngle);
        p.rect(-4, -20, 8, 25, 2);
        p.pop();
        break;
      case "vault":
        p.fill(60, 60, 80);
        p.rect(this.x, this.y, this.width, this.height, 5);
        p.fill(40, 40, 60);
        p.circle(this.x + this.width/2, this.y + this.height/2, 30);
        if (!this.activated) {
          p.fill(200, 50, 50);
          p.textSize(10);
          p.textAlign(p.CENTER, p.CENTER);
          p.text("LOCKED", this.x + this.width/2, this.y + 10);
        }
        break;
    }
    
    p.pop();
  }

  interact(inventory) {
    if (this.type === "door" && this.locked) {
      if (this.requiredItem && inventory.some(item => item.id === this.requiredItem)) {
        this.locked = false;
        return { success: true, message: "Door unlocked!" };
      }
      return { success: false, message: "Door is locked. Need a key." };
    }
    
    if (this.type === "lever") {
      if (this.requiredItem && !inventory.some(item => item.id === this.requiredItem)) {
        return { success: false, message: "Lever is missing a part." };
      }
      this.activated = !this.activated;
      return { success: true, message: this.activated ? "Lever activated!" : "Lever deactivated." };
    }
    
    if (this.type === "vault") {
      if (this.requiredItem && inventory.some(item => item.id === this.requiredItem)) {
        this.activated = true;
        return { success: true, message: "Vault opened!" };
      }
      return { success: false, message: "Need vault code." };
    }
    
    return { success: false, message: "Cannot interact." };
  }
}