// glyphObject.js - Collectible glyph objects in the world

import { gameState, LANGUAGES } from './globals.js';

export class GlyphObject {
  constructor(x, y, languageIndex, glyphIndex, p) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.languageIndex = languageIndex;
    this.glyphIndex = glyphIndex;
    this.glyph = LANGUAGES[languageIndex].glyphs[glyphIndex];
    this.color = LANGUAGES[languageIndex].color;
    this.collected = false;
    this.floatOffset = p.random(100);
    this.rotationSpeed = p.random(0.02, 0.04);
    this.rotation = 0;
  }

  update(p) {
    if (this.collected) return;

    // Floating animation
    this.rotation += this.rotationSpeed;

    // Check collision with player
    if (gameState.player) {
      const dist = p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < 30) {
        gameState.interactionPrompt = "Press SPACE to collect glyph";
      }
    }
  }

  interact() {
    if (this.collected) return false;

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
      gameState.score += 5;
      this.collected = true;
      return true;
    }
    return false;
  }

  draw(p) {
    if (this.collected) return;

    p.push();

    const floatY = this.y + p.sin((p.frameCount + this.floatOffset) * 0.05) * 5;

    // Glow effect
    p.noStroke();
    for (let i = 3; i > 0; i--) {
      p.fill(...this.color, 30 / i);
      p.ellipse(this.x, floatY, this.width + i * 10, this.height + i * 10);
    }

    // Tablet/stone background
    p.fill(200, 190, 180);
    p.stroke(150, 140, 130);
    p.strokeWeight(2);
    p.push();
    p.translate(this.x, floatY);
    p.rotate(this.rotation);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 3);
    p.pop();

    // Glyph symbol
    p.fill(...this.color);
    p.noStroke();
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.push();
    p.translate(this.x, floatY);
    p.rotate(this.rotation);
    p.text(this.glyph.symbol, 0, 0);
    p.pop();

    // Sparkle effect
    const sparkleCount = 3;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (p.frameCount * 0.05 + i * p.TWO_PI / sparkleCount);
      const sparkleX = this.x + p.cos(angle) * 25;
      const sparkleY = floatY + p.sin(angle) * 25;
      p.fill(255, 255, 200, 150);
      p.ellipse(sparkleX, sparkleY, 3, 3);
    }

    p.pop();
  }
}