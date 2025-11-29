// enemies.js - Enemy classes and definitions
export class Enemy {
  constructor(name, hp, dialogue, spareCondition) {
    this.name = name;
    this.hp = hp;
    this.maxHP = hp;
    this.dialogue = dialogue;
    this.spareCondition = spareCondition;
    this.canSpare = false;
    this.actCount = 0;
    this.turnCount = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
  }

  checkSpareCondition() {
    return this.canSpare;
  }

  getCheckText() {
    return `${this.name} - ${this.hp}/${this.maxHP} HP\n${this.spareCondition}`;
  }
}

export class Froggit extends Enemy {
  constructor() {
    super(
      "Froggit",
      20,
      ["Ribbit, ribbit.", "Life is difficult for this enemy.", "Froggit doesn't understand your compliment.", "Froggit seems flattered!"],
      "Compliment this frog to spare."
    );
    this.attackPattern = "SIMPLE_FLIES";
  }

  performAct(actIndex) {
    this.actCount++;
    this.turnCount++;
    
    if (actIndex === 0) { // Compliment
      if (this.actCount >= 2) {
        this.canSpare = true;
        return "Froggit is blushing! You can SPARE now.";
      }
      return this.dialogue[Math.min(this.actCount + 1, this.dialogue.length - 1)];
    } else if (actIndex === 1) { // Threaten
      return "Froggit didn't understand.";
    }
    return this.dialogue[0];
  }

  getAttackPattern() {
    return this.attackPattern;
  }
}

export class Whimsun extends Enemy {
  constructor() {
    super(
      "Whimsun",
      15,
      ["...", "This monster is too sensitive to fight.", "Whimsun laughed a little.", "Whimsun is smiling!"],
      "Tell a joke to spare."
    );
    this.attackPattern = "BUTTERFLIES";
  }

  performAct(actIndex) {
    this.actCount++;
    this.turnCount++;
    
    if (actIndex === 0) { // Joke
      if (this.actCount >= 1) {
        this.canSpare = true;
        return "Whimsun is giggling! You can SPARE now.";
      }
      return this.dialogue[2];
    } else if (actIndex === 1) { // Console
      return "Whimsun stops crying.";
    }
    return this.dialogue[0];
  }

  getAttackPattern() {
    return this.attackPattern;
  }
}

export class Tsunderplane extends Enemy {
  constructor() {
    super(
      "Tsunderplane",
      30,
      ["Hmph!", "I-it's not like I wanted to fight you!", "Tsunderplane noticed your muscles.", "Tsunderplane is impressed!"],
      "Show your strength to spare."
    );
    this.attackPattern = "PLANES";
  }

  performAct(actIndex) {
    this.actCount++;
    this.turnCount++;
    
    if (actIndex === 0) { // Flex
      if (this.actCount >= 2) {
        this.canSpare = true;
        return "Tsunderplane is blushing! You can SPARE now.";
      }
      return this.dialogue[2];
    } else if (actIndex === 1) { // Approach
      return "Tsunderplane turns away. 'B-baka!'";
    }
    return this.dialogue[0];
  }

  getAttackPattern() {
    return this.attackPattern;
  }
}

export function createEnemyByIndex(index) {
  switch (index) {
    case 0: return new Froggit();
    case 1: return new Whimsun();
    case 2: return new Tsunderplane();
    default: return null;
  }
}

export const ENEMY_ACTS = {
  Froggit: ["Compliment", "Threaten"],
  Whimsun: ["Joke", "Console"],
  Tsunderplane: ["Flex", "Approach"]
};