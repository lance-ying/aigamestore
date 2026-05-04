export class DialogueNode {
  constructor(speaker, text, options = [], onComplete = null, attributeCheck = null) {
    this.speaker = speaker;
    this.text = text;
    this.options = options; // Array of {text, nextNode, attributeRequired, onSelect}
    this.onComplete = onComplete;
    this.attributeCheck = attributeCheck;
  }
}

export class DialogueManager {
  constructor() {
    this.currentNode = null;
    this.currentIndex = 0;
    this.selectedOption = 0;
  }
  
  startDialogue(node) {
    this.currentNode = node;
    this.currentIndex = 0;
    this.selectedOption = 0;
  }
  
  advance() {
    if (this.currentNode && this.currentNode.options.length > 0) {
      return false; // Waiting for option selection
    }
    
    if (this.currentNode && this.currentNode.onComplete) {
      this.currentNode.onComplete();
    }
    
    return true; // Dialogue complete
  }
  
  selectOption(index, gameState) {
    if (!this.currentNode || index >= this.currentNode.options.length) return null;
    
    const option = this.currentNode.options[index];
    
    // Check attribute requirements
    if (option.attributeRequired) {
      const { attribute, level } = option.attributeRequired;
      const playerLevel = gameState[`${attribute}Level`];
      if (playerLevel < level) {
        return null; // Cannot select this option
      } else {
        gameState.score += 25; // Bonus for meeting attribute check
      }
    }
    
    if (option.onSelect) {
      option.onSelect(gameState);
    }
    
    return option.nextNode;
  }
  
  render(p, gameState) {
    if (!this.currentNode) return;
    
    // Dialogue box
    p.push();
    p.fill(20, 20, 40, 230);
    p.stroke(180, 150, 100);
    p.strokeWeight(3);
    p.rect(50, 280, 500, 100, 5);
    
    // Speaker name
    p.fill(220, 180, 100);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(this.currentNode.speaker, 65, 290);
    
    // Dialogue text
    p.fill(255);
    p.textSize(12);
    p.text(this.currentNode.text, 65, 310, 470);
    
    // Options
    if (this.currentNode.options.length > 0) {
      for (let i = 0; i < this.currentNode.options.length; i++) {
        const option = this.currentNode.options[i];
        const yPos = 340 + i * 18;
        
        // Check if option is available
        let available = true;
        let displayText = option.text;
        
        if (option.attributeRequired) {
          const { attribute, level } = option.attributeRequired;
          const playerLevel = gameState[`${attribute}Level`];
          if (playerLevel < level) {
            available = false;
            displayText += ` [Requires ${attribute} ${level}]`;
          }
        }
        
        // Highlight selected
        if (i === this.selectedOption) {
          p.fill(100, 80, 50);
          p.noStroke();
          p.rect(60, yPos - 2, 480, 16, 3);
        }
        
        p.fill(available ? 220 : 100);
        p.textSize(11);
        p.text(`> ${displayText}`, 65, yPos);
      }
    } else {
      p.fill(150);
      p.textSize(10);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text("SPACE to continue", 540, 370);
    }
    
    p.pop();
  }
}