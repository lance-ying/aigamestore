// notebook.js - Translation notebook UI

import { gameState, LANGUAGES } from './globals.js';

export class Notebook {
  constructor() {
    this.width = 500;
    this.height = 350;
    this.x = 50;
    this.y = 25;
  }

  handleClick(mx, my, p) {
    if (!gameState.notebookOpen) return;

    // Check glyph selection (left side)
    const glyphStartY = this.y + 80;
    gameState.collectedGlyphs.forEach((glyph, i) => {
      const glyphY = glyphStartY + i * 30;
      if (mx > this.x + 20 && mx < this.x + 200 && my > glyphY && my < glyphY + 25) {
        gameState.selectedGlyph = i;
      }
    });

    // Check meaning selection (right side)
    const meanings = this.getAllMeanings();
    const meaningStartY = this.y + 80;
    meanings.forEach((meaning, i) => {
      const meaningY = meaningStartY + i * 30;
      if (mx > this.x + 280 && mx < this.x + 460 && my > meaningY && my < meaningY + 25) {
        gameState.selectedMeaning = i;
      }
    });

    // Check confirm button
    if (gameState.selectedGlyph !== null && gameState.selectedMeaning !== null) {
      const btnX = this.x + this.width / 2 - 60;
      const btnY = this.y + this.height - 50;
      if (mx > btnX && mx < btnX + 120 && my > btnY && my < btnY + 35) {
        this.confirmTranslation();
      }
    }
  }

  confirmTranslation() {
    const glyph = gameState.collectedGlyphs[gameState.selectedGlyph];
    const meanings = this.getAllMeanings();
    const selectedMeaning = meanings[gameState.selectedMeaning];

    // Check if correct
    if (glyph.meaning === selectedMeaning) {
      // Correct translation!
      const alreadyTranslated = gameState.translatedGlyphs.some(g => g.symbol === glyph.symbol);
      if (!alreadyTranslated) {
        gameState.translatedGlyphs.push(glyph);
        gameState.score += 25;
        
        // Check if language complete
        this.checkLanguageComplete(glyph.languageIndex);
      }
    }

    // Reset selection
    gameState.selectedGlyph = null;
    gameState.selectedMeaning = null;
  }

  checkLanguageComplete(languageIndex) {
    const language = LANGUAGES[languageIndex];
    const translatedCount = gameState.translatedGlyphs.filter(g => 
      language.glyphs.some(lg => lg.symbol === g.symbol)
    ).length;

    if (translatedCount === language.glyphs.length) {
      gameState.peopleUnited++;
      gameState.score += 100;
      
      // Check win condition
      if (gameState.peopleUnited === gameState.totalPeoples) {
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }

  getAllMeanings() {
    const meanings = [];
    LANGUAGES.forEach(lang => {
      lang.glyphs.forEach(glyph => {
        if (!meanings.includes(glyph.meaning)) {
          meanings.push(glyph.meaning);
        }
      });
    });
    return meanings.sort();
  }

  draw(p) {
    if (!gameState.notebookOpen) return;

    p.push();

    // Semi-transparent background
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(0, 0, 600, 400);

    // Notebook background
    p.fill(250, 240, 220);
    p.stroke(100, 80, 60);
    p.strokeWeight(3);
    p.rect(this.x, this.y, this.width, this.height, 5);

    // Binding/spine
    p.fill(139, 90, 43);
    p.rect(this.x + this.width / 2 - 5, this.y, 10, this.height);

    // Title
    p.fill(80, 60, 40);
    p.noStroke();
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Translation Notebook", this.x + this.width / 2, this.y + 15);

    // Instructions
    p.textSize(11);
    p.text("Match glyphs to their meanings", this.x + this.width / 2, this.y + 45);

    // Left page - Collected Glyphs
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Glyphs:", this.x + 20, this.y + 65);

    const glyphStartY = this.y + 80;
    gameState.collectedGlyphs.forEach((glyph, i) => {
      const glyphY = glyphStartY + i * 30;
      const isTranslated = gameState.translatedGlyphs.some(g => g.symbol === glyph.symbol);
      const isSelected = gameState.selectedGlyph === i;

      // Background
      p.fill(...(isSelected ? [255, 255, 150] : isTranslated ? [150, 255, 150] : [240, 230, 210]));
      p.stroke(100, 100, 100);
      p.strokeWeight(1);
      p.rect(this.x + 20, glyphY, 180, 25, 3);

      // Glyph
      const lang = LANGUAGES[glyph.languageIndex];
      p.fill(...lang.color);
      p.noStroke();
      p.textSize(18);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(glyph.symbol, this.x + 30, glyphY + 12);

      // Context hint
      p.fill(100, 100, 100);
      p.textSize(10);
      p.text(`(${glyph.context})`, this.x + 60, glyphY + 12);

      // Show translation if complete
      if (isTranslated) {
        p.fill(50, 150, 50);
        p.textSize(11);
        p.text(glyph.meaning, this.x + 130, glyphY + 12);
      }
    });

    // Right page - Meanings
    p.fill(80, 60, 40);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Meanings:", this.x + 280, this.y + 65);

    const meanings = this.getAllMeanings();
    const meaningStartY = this.y + 80;
    meanings.forEach((meaning, i) => {
      const meaningY = meaningStartY + i * 30;
      const isSelected = gameState.selectedMeaning === i;

      // Background
      p.fill(...(isSelected ? [255, 255, 150] : [240, 230, 210]));
      p.stroke(100, 100, 100);
      p.strokeWeight(1);
      p.rect(this.x + 280, meaningY, 180, 25, 3);

      // Meaning text
      p.fill(80, 60, 40);
      p.noStroke();
      p.textSize(12);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(meaning, this.x + 290, meaningY + 12);
    });

    // Confirm button
    if (gameState.selectedGlyph !== null && gameState.selectedMeaning !== null) {
      p.fill(100, 150, 255);
      p.stroke(70, 120, 200);
      p.strokeWeight(2);
      const btnX = this.x + this.width / 2 - 60;
      const btnY = this.y + this.height - 50;
      p.rect(btnX, btnY, 120, 35, 5);
      
      p.fill(255);
      p.noStroke();
      p.textSize(14);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Confirm Match", btnX + 60, btnY + 17);
    }

    // Close instruction
    p.fill(100, 100, 100);
    p.textSize(11);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Press Z to close", this.x + this.width / 2, this.y + this.height - 10);

    // Progress indicator
    const totalGlyphs = LANGUAGES.reduce((sum, lang) => sum + lang.glyphs.length, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Translated: ${gameState.translatedGlyphs.length}/${totalGlyphs}`, this.x + this.width - 20, this.y + 45);

    p.pop();
  }
}