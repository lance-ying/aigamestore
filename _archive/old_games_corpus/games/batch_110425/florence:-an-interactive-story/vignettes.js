// vignettes.js - Vignette definitions and management
import { VIGNETTE_TYPES } from './globals.js';

export class Vignette {
  constructor(type, chapter, narrative, duration = 300) {
    this.type = type;
    this.chapter = chapter;
    this.narrative = narrative;
    this.duration = duration;
    this.progress = 0;
    this.isComplete = false;
    this.data = {};
  }
  
  update(p) {
    // Override in specific vignette types
  }
  
  render(p) {
    // Override in specific vignette types
  }
  
  handleInput(p, keyCode) {
    // Override in specific vignette types
  }
  
  checkCompletion() {
    return this.isComplete;
  }
}

export class ConversationVignette extends Vignette {
  constructor(chapter, narrative, bubbleCount = 4) {
    super(VIGNETTE_TYPES.CONVERSATION, chapter, narrative);
    this.data.bubbles = [];
    this.data.selectedIndex = 0;
    this.data.bubblesPlaced = 0;
    this.data.totalBubbles = bubbleCount;
    this.data.targetSlots = [];
    
    // Initialize bubbles
    for (let i = 0; i < bubbleCount; i++) {
      this.data.bubbles.push({
        x: 100 + i * 120,
        y: 320,
        placed: false,
        text: this.generateBubbleText(i)
      });
    }
    
    // Initialize target slots
    for (let i = 0; i < bubbleCount; i++) {
      this.data.targetSlots.push({
        x: 100 + i * 120,
        y: 150,
        filled: false
      });
    }
  }
  
  generateBubbleText(index) {
    const texts = ["Hi!", "How are you?", "I'm good!", "Tell me more", "That's nice", "See you!"];
    return texts[index % texts.length];
  }
  
  update(p) {
    this.progress++;
  }
  
  render(p) {
    p.push();
    
    // Background
    p.fill(245, 235, 250);
    p.noStroke();
    p.rect(0, 0, 600, 400);
    
    // Chapter title
    p.fill(100, 80, 120);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(this.chapter, 300, 20);
    
    // Narrative
    p.textSize(12);
    p.fill(120, 100, 140);
    p.text(this.narrative, 300, 45);
    
    // Instructions
    p.textSize(11);
    p.fill(140, 120, 160);
    p.text("Arrow keys to select, SPACE to place bubble", 300, 70);
    
    // Render target slots
    for (let i = 0; i < this.data.targetSlots.length; i++) {
      const slot = this.data.targetSlots[i];
      if (slot.filled) {
        p.fill(180, 220, 180);
      } else {
        p.fill(220, 220, 220);
      }
      p.stroke(150, 150, 150);
      p.strokeWeight(2);
      p.ellipse(slot.x, slot.y, 80, 60);
    }
    
    // Render bubbles
    for (let i = 0; i < this.data.bubbles.length; i++) {
      const bubble = this.data.bubbles[i];
      if (!bubble.placed) {
        if (i === this.data.selectedIndex) {
          p.fill(150, 200, 255);
          p.stroke(100, 150, 255);
        } else {
          p.fill(255, 255, 255);
          p.stroke(180, 180, 180);
        }
        p.strokeWeight(3);
        p.ellipse(bubble.x, bubble.y, 80, 60);
        
        // Text in bubble
        p.noStroke();
        p.fill(60, 60, 80);
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(bubble.text, bubble.x, bubble.y);
      }
    }
    
    // Progress indicator
    p.fill(100, 80, 120);
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(`${this.data.bubblesPlaced}/${this.data.totalBubbles} placed`, 300, 390);
    
    p.pop();
  }
  
  handleInput(p, keyCode) {
    if (keyCode === 37) { // Left arrow
      this.data.selectedIndex = Math.max(0, this.data.selectedIndex - 1);
      // Skip placed bubbles
      while (this.data.selectedIndex >= 0 && this.data.bubbles[this.data.selectedIndex].placed) {
        this.data.selectedIndex--;
      }
      if (this.data.selectedIndex < 0) this.data.selectedIndex = 0;
    } else if (keyCode === 39) { // Right arrow
      this.data.selectedIndex = Math.min(this.data.totalBubbles - 1, this.data.selectedIndex + 1);
      // Skip placed bubbles
      while (this.data.selectedIndex < this.data.totalBubbles && this.data.bubbles[this.data.selectedIndex].placed) {
        this.data.selectedIndex++;
      }
      if (this.data.selectedIndex >= this.data.totalBubbles) this.data.selectedIndex = this.data.totalBubbles - 1;
    } else if (keyCode === 32) { // Space - place bubble
      if (!this.data.bubbles[this.data.selectedIndex].placed) {
        this.data.bubbles[this.data.selectedIndex].placed = true;
        this.data.targetSlots[this.data.bubblesPlaced].filled = true;
        this.data.bubblesPlaced++;
        
        if (this.data.bubblesPlaced >= this.data.totalBubbles) {
          this.isComplete = true;
        }
      }
    }
  }
}

export class PuzzleVignette extends Vignette {
  constructor(chapter, narrative, pieces = 3) {
    super(VIGNETTE_TYPES.PUZZLE, chapter, narrative);
    this.data.pieces = [];
    this.data.selectedPiece = 0;
    this.data.piecesPlaced = 0;
    this.data.totalPieces = pieces;
    
    // Initialize puzzle pieces
    const colors = [
      [255, 150, 150],
      [150, 255, 150],
      [150, 150, 255],
      [255, 255, 150],
      [255, 150, 255]
    ];
    
    for (let i = 0; i < pieces; i++) {
      this.data.pieces.push({
        id: i,
        x: 80 + i * 100,
        y: 300,
        targetX: 200 + i * 70,
        targetY: 150,
        rotation: (i * 45) % 360,
        targetRotation: 0,
        placed: false,
        color: colors[i % colors.length]
      });
    }
  }
  
  update(p) {
    this.progress++;
    
    // Rotate selected piece
    const piece = this.data.pieces[this.data.selectedPiece];
    if (!piece.placed) {
      piece.rotation = (piece.rotation + 1) % 360;
    }
  }
  
  render(p) {
    p.push();
    
    // Background
    p.fill(235, 245, 255);
    p.noStroke();
    p.rect(0, 0, 600, 400);
    
    // Chapter title
    p.fill(80, 100, 140);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(this.chapter, 300, 20);
    
    // Narrative
    p.textSize(12);
    p.fill(100, 120, 160);
    p.text(this.narrative, 300, 45);
    
    // Instructions
    p.textSize(11);
    p.fill(120, 140, 180);
    p.text("Arrow keys to select, SPACE to place, Z to rotate", 300, 70);
    
    // Target outline
    p.noFill();
    p.stroke(180, 180, 180);
    p.strokeWeight(2);
    p.rect(150, 120, this.data.totalPieces * 70 + 20, 80);
    
    // Render pieces
    for (let i = 0; i < this.data.pieces.length; i++) {
      const piece = this.data.pieces[i];
      
      p.push();
      p.translate(piece.placed ? piece.targetX : piece.x, piece.placed ? piece.targetY : piece.y);
      p.rotate(p.radians(piece.placed ? piece.targetRotation : piece.rotation));
      
      if (i === this.data.selectedPiece && !piece.placed) {
        p.stroke(255, 200, 0);
        p.strokeWeight(4);
      } else {
        p.stroke(100, 100, 100);
        p.strokeWeight(2);
      }
      
      p.fill(...piece.color);
      p.rect(-25, -25, 50, 50);
      
      p.pop();
    }
    
    // Progress
    p.fill(80, 100, 140);
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(`${this.data.piecesPlaced}/${this.data.totalPieces} pieces placed`, 300, 390);
    
    p.pop();
  }
  
  handleInput(p, keyCode) {
    if (keyCode === 37) { // Left
      this.data.selectedPiece = Math.max(0, this.data.selectedPiece - 1);
      while (this.data.selectedPiece >= 0 && this.data.pieces[this.data.selectedPiece].placed) {
        this.data.selectedPiece--;
      }
      if (this.data.selectedPiece < 0) this.data.selectedPiece = 0;
    } else if (keyCode === 39) { // Right
      this.data.selectedPiece = Math.min(this.data.totalPieces - 1, this.data.selectedPiece + 1);
      while (this.data.selectedPiece < this.data.totalPieces && this.data.pieces[this.data.selectedPiece].placed) {
        this.data.selectedPiece++;
      }
      if (this.data.selectedPiece >= this.data.totalPieces) this.data.selectedPiece = this.data.totalPieces - 1;
    } else if (keyCode === 90) { // Z - rotate
      const piece = this.data.pieces[this.data.selectedPiece];
      if (!piece.placed) {
        piece.rotation = (piece.rotation + 45) % 360;
      }
    } else if (keyCode === 32) { // Space - place
      const piece = this.data.pieces[this.data.selectedPiece];
      if (!piece.placed && Math.abs(piece.rotation - piece.targetRotation) < 30) {
        piece.placed = true;
        this.data.piecesPlaced++;
        
        if (this.data.piecesPlaced >= this.data.totalPieces) {
          this.isComplete = true;
        }
      }
    }
  }
}

export class CleaningVignette extends Vignette {
  constructor(chapter, narrative) {
    super(VIGNETTE_TYPES.CLEANING, chapter, narrative);
    this.data.dirtSpots = [];
    this.data.cleanedSpots = 0;
    this.data.totalSpots = 8;
    this.data.brushX = 300;
    this.data.brushY = 200;
    
    // Initialize dirt spots
    for (let i = 0; i < this.data.totalSpots; i++) {
      this.data.dirtSpots.push({
        x: 100 + (i % 4) * 120,
        y: 150 + Math.floor(i / 4) * 100,
        cleaned: false,
        radius: 25
      });
    }
  }
  
  update(p) {
    this.progress++;
    
    // Check for cleaning
    for (let spot of this.data.dirtSpots) {
      if (!spot.cleaned) {
        const dist = p.dist(this.data.brushX, this.data.brushY, spot.x, spot.y);
        if (dist < spot.radius + 15) {
          spot.cleaned = true;
          this.data.cleanedSpots++;
          
          if (this.data.cleanedSpots >= this.data.totalSpots) {
            this.isComplete = true;
          }
        }
      }
    }
  }
  
  render(p) {
    p.push();
    
    // Background
    p.fill(255, 250, 240);
    p.noStroke();
    p.rect(0, 0, 600, 400);
    
    // Chapter title
    p.fill(120, 90, 70);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(this.chapter, 300, 20);
    
    // Narrative
    p.textSize(12);
    p.fill(140, 110, 90);
    p.text(this.narrative, 300, 45);
    
    // Instructions
    p.textSize(11);
    p.fill(160, 130, 110);
    p.text("Arrow keys to move brush, clean all spots", 300, 70);
    
    // Render dirt spots
    for (let spot of this.data.dirtSpots) {
      if (!spot.cleaned) {
        p.fill(100, 80, 60, 180);
      } else {
        p.fill(240, 240, 240, 100);
      }
      p.noStroke();
      p.ellipse(spot.x, spot.y, spot.radius * 2);
    }
    
    // Render brush
    p.fill(255, 200, 100);
    p.stroke(200, 150, 50);
    p.strokeWeight(2);
    p.ellipse(this.data.brushX, this.data.brushY, 30, 30);
    
    // Progress
    p.fill(120, 90, 70);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(`${this.data.cleanedSpots}/${this.data.totalSpots} spots cleaned`, 300, 390);
    
    p.pop();
  }
  
  handleInput(p, keyCode) {
    const speed = 5;
    if (keyCode === 37) { // Left
      this.data.brushX = Math.max(30, this.data.brushX - speed);
    } else if (keyCode === 39) { // Right
      this.data.brushX = Math.min(570, this.data.brushX + speed);
    } else if (keyCode === 38) { // Up
      this.data.brushY = Math.max(100, this.data.brushY - speed);
    } else if (keyCode === 40) { // Down
      this.data.brushY = Math.min(370, this.data.brushY + speed);
    }
  }
}

export class DatingVignette extends Vignette {
  constructor(chapter, narrative) {
    super(VIGNETTE_TYPES.DATING, chapter, narrative);
    this.data.hearts = [];
    this.data.collectedHearts = 0;
    this.data.totalHearts = 5;
    this.data.playerX = 100;
    this.data.playerY = 300;
    
    // Initialize hearts
    for (let i = 0; i < this.data.totalHearts; i++) {
      this.data.hearts.push({
        x: 120 + i * 100,
        y: 150 + (i % 2) * 50,
        collected: false,
        scale: 1.0,
        pulsePhase: i * 60
      });
    }
  }
  
  update(p) {
    this.progress++;
    
    // Animate hearts
    for (let heart of this.data.hearts) {
      if (!heart.collected) {
        heart.pulsePhase += 0.1;
        heart.scale = 1.0 + Math.sin(heart.pulsePhase) * 0.2;
      }
    }
    
    // Check collection
    for (let heart of this.data.hearts) {
      if (!heart.collected) {
        const dist = p.dist(this.data.playerX, this.data.playerY, heart.x, heart.y);
        if (dist < 30) {
          heart.collected = true;
          this.data.collectedHearts++;
          
          if (this.data.collectedHearts >= this.data.totalHearts) {
            this.isComplete = true;
          }
        }
      }
    }
  }
  
  render(p) {
    p.push();
    
    // Background - romantic gradient
    for (let y = 0; y < 400; y++) {
      const inter = y / 400;
      p.stroke(255 - inter * 50, 200 - inter * 100, 220 - inter * 50);
      p.line(0, y, 600, y);
    }
    
    // Chapter title
    p.fill(150, 50, 100);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(this.chapter, 300, 20);
    
    // Narrative
    p.textSize(12);
    p.fill(170, 70, 120);
    p.text(this.narrative, 300, 45);
    
    // Instructions
    p.textSize(11);
    p.fill(180, 90, 130);
    p.text("Arrow keys to move, collect all hearts", 300, 70);
    
    // Render hearts
    for (let heart of this.data.hearts) {
      if (!heart.collected) {
        p.push();
        p.translate(heart.x, heart.y);
        p.scale(heart.scale);
        this.drawHeart(p, 0, 0, 20);
        p.pop();
      }
    }
    
    // Render player
    p.fill(100, 150, 255);
    p.stroke(80, 130, 235);
    p.strokeWeight(2);
    p.ellipse(this.data.playerX, this.data.playerY, 30, 30);
    p.fill(255);
    p.noStroke();
    p.ellipse(this.data.playerX - 5, this.data.playerY - 3, 6, 6);
    p.ellipse(this.data.playerX + 5, this.data.playerY - 3, 6, 6);
    
    // Progress
    p.fill(150, 50, 100);
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(`${this.data.collectedHearts}/${this.data.totalHearts} hearts`, 300, 390);
    
    p.pop();
  }
  
  drawHeart(p, x, y, size) {
    p.fill(255, 100, 150);
    p.stroke(220, 80, 130);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(x, y + size * 0.3);
    p.bezierVertex(x, y, x - size * 0.5, y - size * 0.5, x - size * 0.5, y);
    p.bezierVertex(x - size * 0.5, y + size * 0.3, x, y + size * 0.6, x, y + size);
    p.bezierVertex(x, y + size * 0.6, x + size * 0.5, y + size * 0.3, x + size * 0.5, y);
    p.bezierVertex(x + size * 0.5, y - size * 0.5, x, y, x, y + size * 0.3);
    p.endShape();
  }
  
  handleInput(p, keyCode) {
    const speed = 4;
    if (keyCode === 37) { // Left
      this.data.playerX = Math.max(30, this.data.playerX - speed);
    } else if (keyCode === 39) { // Right
      this.data.playerX = Math.min(570, this.data.playerX + speed);
    } else if (keyCode === 38) { // Up
      this.data.playerY = Math.max(100, this.data.playerY - speed);
    } else if (keyCode === 40) { // Down
      this.data.playerY = Math.min(370, this.data.playerY + speed);
    }
  }
}

export class ReflectionVignette extends Vignette {
  constructor(chapter, narrative) {
    super(VIGNETTE_TYPES.REFLECTION, chapter, narrative);
    this.data.breathPhase = 0;
    this.data.breathCount = 0;
    this.data.targetBreaths = 3;
    this.data.isInhaling = true;
    this.data.breathSize = 50;
    this.data.maxBreathSize = 100;
    this.data.minBreathSize = 50;
  }
  
  update(p) {
    this.progress++;
    
    // Automatic breathing animation
    this.data.breathPhase += 0.02;
    this.data.breathSize = this.data.minBreathSize + 
      (this.data.maxBreathSize - this.data.minBreathSize) * 
      (Math.sin(this.data.breathPhase) * 0.5 + 0.5);
    
    // Check for breath completion
    if (this.data.breathPhase > Math.PI * 2) {
      this.data.breathPhase = 0;
      this.data.breathCount++;
      
      if (this.data.breathCount >= this.data.targetBreaths) {
        this.isComplete = true;
      }
    }
  }
  
  render(p) {
    p.push();
    
    // Calm background
    const bgColor = 200 + Math.sin(this.data.breathPhase) * 20;
    p.fill(bgColor, bgColor - 20, bgColor + 20);
    p.noStroke();
    p.rect(0, 0, 600, 400);
    
    // Chapter title
    p.fill(80, 70, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(this.chapter, 300, 20);
    
    // Narrative
    p.textSize(12);
    p.fill(100, 90, 120);
    p.text(this.narrative, 300, 45);
    
    // Instructions
    p.textSize(11);
    p.fill(120, 110, 140);
    p.text("Watch the breath cycle complete", 300, 70);
    
    // Breathing circle
    p.fill(150, 180, 255, 180);
    p.stroke(100, 130, 205);
    p.strokeWeight(3);
    p.ellipse(300, 200, this.data.breathSize * 2);
    
    // Inner glow
    p.fill(200, 220, 255, 100);
    p.noStroke();
    p.ellipse(300, 200, this.data.breathSize * 1.5);
    
    // Breath text
    p.fill(80, 70, 100);
    p.textSize(14);
    const breathText = Math.sin(this.data.breathPhase) > 0 ? "Breathe In" : "Breathe Out";
    p.text(breathText, 300, 200);
    
    // Progress
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(`${this.data.breathCount}/${this.data.targetBreaths} breaths`, 300, 390);
    
    p.pop();
  }
  
  handleInput(p, keyCode) {
    // No input needed for reflection
  }
}

export function createVignetteSequence() {
  return [
    new ConversationVignette("Meeting", "A chance encounter begins...", 3),
    new PuzzleVignette("Getting to Know", "Piecing together shared interests", 3),
    new DatingVignette("First Date", "Collecting moments of joy", 5),
    new CleaningVignette("Moving In", "Making a space together", 6),
    new ConversationVignette("Deep Talk", "Opening up to each other", 4),
    new ReflectionVignette("Happiness", "Finding peace in togetherness", 3),
    new PuzzleVignette("Challenges", "Working through difficulties", 4),
    new CleaningVignette("Changes", "Clearing out the old", 8),
    new ReflectionVignette("Growth", "Understanding yourself", 3),
    new ConversationVignette("Epilogue", "New beginnings", 3)
  ];
}