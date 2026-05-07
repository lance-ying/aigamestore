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

// EASY ENEMIES (1-3)

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

export class Moldsmal extends Enemy {
  constructor() {
    super(
      "Moldsmal",
      18,
      ["...", "It doesn't seem to have a brain.", "Moldsmal jiggled in response.", "Moldsmal seems content!"],
      "Imitate this gelatinous monster."
    );
    this.attackPattern = "SIMPLE_BOUNCES";
  }

  performAct(actIndex) {
    this.actCount++;
    this.turnCount++;
    
    if (actIndex === 0) { // Imitate
      if (this.actCount >= 1) {
        this.canSpare = true;
        return "Moldsmal is happy! You can SPARE now.";
      }
      return this.dialogue[2];
    } else if (actIndex === 1) { // Flirt
      return "Moldsmal wobbles excitedly.";
    }
    return this.dialogue[0];
  }

  getAttackPattern() {
    return this.attackPattern;
  }
}

// MEDIUM ENEMIES (4-6)

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

export class Loox extends Enemy {
  constructor() {
    super(
      "Loox",
      35,
      ["Don't pick on me!", "Loox is staring at you.", "Loox looks away shyly.", "Loox feels understood!"],
      "Don't pick on them."
    );
    this.attackPattern = "EYES";
  }

  performAct(actIndex) {
    this.actCount++;
    this.turnCount++;
    
    if (actIndex === 0) { // Don't Pick On
      if (this.actCount >= 2) {
        this.canSpare = true;
        return "Loox appreciates your kindness! You can SPARE now.";
      }
      return this.dialogue[2];
    } else if (actIndex === 1) { // Pick On
      return "Loox starts tearing up...";
    }
    return this.dialogue[0];
  }

  getAttackPattern() {
    return this.attackPattern;
  }
}

export class Migosp extends Enemy {
  constructor() {
    super(
      "Migosp",
      32,
      ["It seems desperate for friends.", "Migosp is looking for others.", "Migosp buzzes happily!", "Migosp found a friend!"],
      "Be their friend."
    );
    this.attackPattern = "SWARM";
  }

  performAct(actIndex) {
    this.actCount++;
    this.turnCount++;
    
    if (actIndex === 0) { // Befriend
      if (this.actCount >= 2) {
        this.canSpare = true;
        return "Migosp is overjoyed! You can SPARE now.";
      }
      return this.dialogue[2];
    } else if (actIndex === 1) { // Ignore
      return "Migosp looks sad...";
    }
    return this.dialogue[0];
  }

  getAttackPattern() {
    return this.attackPattern;
  }
}

// HARD ENEMIES (7-9)

export class KnightKnight extends Enemy {
  constructor() {
    super(
      "Knight Knight",
      45,
      ["ZZZ...", "A heavy sleeper blocks your way.", "Knight Knight is stirring...", "Knight Knight is awake and grateful!"],
      "Sing a lullaby to spare."
    );
    this.attackPattern = "SWORD_SWIPES";
  }

  performAct(actIndex) {
    this.actCount++;
    this.turnCount++;
    
    if (actIndex === 0) { // Sing
      if (this.actCount >= 3) {
        this.canSpare = true;
        return "Knight Knight sleeps peacefully! You can SPARE now.";
      }
      return this.dialogue[2];
    } else if (actIndex === 1) { // Shout
      return "Knight Knight stirs uncomfortably...";
    }
    return this.dialogue[0];
  }

  getAttackPattern() {
    return this.attackPattern;
  }
}

export class Madjick extends Enemy {
  constructor() {
    super(
      "Madjick",
      50,
      ["The magical orbs are hypnotic...", "Madjick is channeling power.", "Madjick's focus wavers.", "Madjick respects your power!"],
      "Show magical prowess."
    );
    this.attackPattern = "MAGIC_ORBS";
  }

  performAct(actIndex) {
    this.actCount++;
    this.turnCount++;
    
    if (actIndex === 0) { // Magic Trick
      if (this.actCount >= 3) {
        this.canSpare = true;
        return "Madjick is impressed by your magic! You can SPARE now.";
      }
      return this.dialogue[2];
    } else if (actIndex === 1) { // Dispel
      return "The magic intensifies!";
    }
    return this.dialogue[0];
  }

  getAttackPattern() {
    return this.attackPattern;
  }
}

export class FinalFroggit extends Enemy {
  constructor() {
    super(
      "Final Froggit",
      55,
      ["The final guardian appears.", "Final Froggit knows your journey.", "Final Froggit nods in understanding.", "Final Froggit lets you pass!"],
      "Show your determination."
    );
    this.attackPattern = "ADVANCED_FLIES";
  }

  performAct(actIndex) {
    this.actCount++;
    this.turnCount++;
    
    if (actIndex === 0) { // Show Mercy
      if (this.actCount >= 3) {
        this.canSpare = true;
        return "Final Froggit sees your true heart! You can SPARE now.";
      }
      return this.dialogue[2];
    } else if (actIndex === 1) { // Challenge
      return "Final Froggit remains steadfast.";
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
    case 2: return new Moldsmal();
    case 3: return new Tsunderplane();
    case 4: return new Loox();
    case 5: return new Migosp();
    case 6: return new KnightKnight();
    case 7: return new Madjick();
    case 8: return new FinalFroggit();
    default: return null;
  }
}

export const ENEMY_ACTS = {
  Froggit: ["Compliment", "Threaten"],
  Whimsun: ["Joke", "Console"],
  Moldsmal: ["Imitate", "Flirt"],
  Tsunderplane: ["Flex", "Approach"],
  Loox: ["Don't Pick On", "Pick On"],
  Migosp: ["Befriend", "Ignore"],
  "Knight Knight": ["Sing", "Shout"],
  Madjick: ["Magic Trick", "Dispel"],
  "Final Froggit": ["Show Mercy", "Challenge"]
};