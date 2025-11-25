// npc.js - NPC entities

import { gameState, LANGUAGES } from './globals.js';

export class NPC {
  constructor(x, y, languageIndex, glyphIndex, p) {
    this.x = x;
    this.y = y;
    this.width = 25;
    this.height = 35;
    this.languageIndex = languageIndex;
    this.glyphIndex = glyphIndex;
    this.glyph = LANGUAGES[languageIndex].glyphs[glyphIndex];
    this.color = LANGUAGES[languageIndex].color;
    this.hasInteracted = false;
    this.animOffset = p.random(100);
    this.speechBubbleVisible = false;
    this.speechTimer = 0;
  }

  update(p) {
    // Check interaction with player
    if (!this.hasInteracted && gameState.player) {
      const dist = p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < 40) {
        gameState.interactionPrompt = `Press SPACE to talk with ${LANGUAGES[this.languageIndex].name}`;
      }
    }

    // Speech bubble timing
    if (this.speechBubbleVisible) {
      this.speechTimer++;
      if (this.speechTimer > 120) {
        this.speechBubbleVisible = false;
        this.speechTimer = 0;
      }
    }
  }

  interact(p) {
    if (this.hasInteracted) return false;

    // Add glyph to collected if not already there
    const alreadyCollected = gameState.collectedGlyphs.some(g => 
      g.symbol === this.glyph.symbol && g.languageIndex === this.languageIndex
    );

    if (!alreadyCollected) {
      gameState.collectedGlyphs.push({
        symbol: this.glyph.symbol,
        meaning: this.glyph.meaning,
        context: this.glyph.context,
        languageIndex: this.languageIndex
      });
      gameState.score += 10;
      this.hasInteracted = true;
      this.speechBubbleVisible = true;
      this.speechTimer = 0;
      return true;
    }
    return false;
  }

  draw(p) {
    p.push();

    // Shadow
    p.fill(0, 0, 0, 60);
    p.noStroke();
    p.ellipse(this.x, this.y + this.height / 2 + 3, this.width * 1.2, 8);

    // Body animation (slight bob)
    const bobOffset = p.sin((p.frameCount + this.animOffset) * 0.05) * 2;

    // Body
    p.fill(...this.color);
    p.stroke(this.color[0] - 30, this.color[1] - 30, this.color[2] - 30);
    p.strokeWeight(2);
    
    // Robe
    p.beginShape();
    p.vertex(this.x - this.width / 2, this.y - this.height / 2 + 10 + bobOffset);
    p.vertex(this.x - this.width / 2 - 2, this.y + this.height / 2 + bobOffset);
    p.vertex(this.x + this.width / 2 + 2, this.y + this.height / 2 + bobOffset);
    p.vertex(this.x + this.width / 2, this.y - this.height / 2 + 10 + bobOffset);
    p.endShape(p.CLOSE);

    // Head
    p.fill(this.color[0] + 30, this.color[1] + 30, this.color[2] + 30);
    p.ellipse(this.x, this.y - this.height / 2 + 5 + bobOffset, this.width * 0.7, this.height * 0.35);

    // Face detail
    p.fill(50, 40, 30);
    p.noStroke();
    p.ellipse(this.x - 4, this.y - this.height / 2 + 5 + bobOffset, 2, 3);
    p.ellipse(this.x + 4, this.y - this.height / 2 + 5 + bobOffset, 2, 3);

    // Cultural symbol on chest
    p.fill(255, 255, 255, 180);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.glyph.symbol, this.x, this.y + 5 + bobOffset);

    // Speech bubble when showing glyph
    if (this.speechBubbleVisible) {
      p.fill(255, 255, 240);
      p.stroke(100, 100, 100);
      p.strokeWeight(2);
      p.rect(this.x - 25, this.y - this.height - 30 + bobOffset, 50, 30, 5);
      
      // Triangle pointer
      p.noStroke();
      p.triangle(
        this.x - 5, this.y - this.height + bobOffset,
        this.x + 5, this.y - this.height + bobOffset,
        this.x, this.y - this.height + 5 + bobOffset
      );

      // Show glyph and context
      p.fill(0);
      p.textSize(16);
      p.text(this.glyph.symbol, this.x, this.y - this.height - 22 + bobOffset);
      p.textSize(8);
      p.text(this.glyph.context, this.x, this.y - this.height - 8 + bobOffset);
    }

    p.pop();
  }
}