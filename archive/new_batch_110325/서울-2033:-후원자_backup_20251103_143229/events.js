// events.js - Event definitions and management

import { gameState } from './globals.js';

export class GameEvent {
  constructor(id, title, description, choices, tags = [], requirement = null) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.choices = choices; // Array of Choice objects
    this.tags = tags;
    this.requirement = requirement; // Function that returns true if event can appear
  }
}

export class Choice {
  constructor(text, effects, requirements = null, successMessage = "", failMessage = "") {
    this.text = text;
    this.effects = effects; // Function that modifies gameState
    this.requirements = requirements; // { str: 5, int: 3, cha: 4, money: 10 }
    this.successMessage = successMessage;
    this.failMessage = failMessage;
  }
  
  canChoose() {
    if (!this.requirements) return true;
    
    if (this.requirements.str && gameState.strength < this.requirements.str) return false;
    if (this.requirements.int && gameState.intelligence < this.requirements.int) return false;
    if (this.requirements.cha && gameState.charisma < this.requirements.cha) return false;
    if (this.requirements.money && gameState.money < this.requirements.money) return false;
    
    return true;
  }
}

// Event database
export const eventDatabase = [
  // Starting events
  new GameEvent(
    "wake_up",
    "Another Day",
    "You wake up in your makeshift shelter. The morning light filters through broken windows. You need to decide how to start your day.",
    [
      new Choice(
        "Search for food in the area",
        (gs) => {
          gs.health += 10;
          gs.stress += 5;
          gs.money -= 5;
          return "You found some canned food and ate well.";
        }
      ),
      new Choice(
        "Rest and recover",
        (gs) => {
          gs.health += 5;
          gs.stress -= 15;
          return "You feel refreshed after resting.";
        }
      ),
      new Choice(
        "Plan your route (requires INT 3)",
        (gs) => {
          gs.intelligence += 1;
          gs.stress -= 5;
          return "Careful planning helps you feel more confident.";
        },
        { int: 3 }
      )
    ],
    ["common", "morning"]
  ),
  
  new GameEvent(
    "stranger_encounter",
    "A Stranger Approaches",
    "A ragged figure approaches you cautiously. They look desperate but not immediately hostile.",
    [
      new Choice(
        "Offer them food (costs 20 money)",
        (gs) => {
          gs.money -= 20;
          gs.charisma += 2;
          gs.stress -= 10;
          return "They thank you profusely. Kindness still matters.";
        },
        { money: 20 }
      ),
      new Choice(
        "Talk to them",
        (gs) => {
          gs.stress += 5;
          const rand = Math.random();
          if (rand < 0.5) {
            gs.money += 15;
            return "They share useful information about a supply cache.";
          } else {
            return "The conversation was tense but uneventful.";
          }
        }
      ),
      new Choice(
        "Intimidate them away (requires STR 4)",
        (gs) => {
          gs.stress += 10;
          return "They quickly leave. You feel guilty.";
        },
        { str: 4 }
      ),
      new Choice(
        "Ignore and walk away",
        (gs) => {
          gs.stress += 3;
          return "You move on without incident.";
        }
      )
    ],
    ["common", "social"]
  ),
  
  new GameEvent(
    "supply_cache",
    "Hidden Supplies",
    "You discover an old supply cache hidden in a collapsed building. It might contain valuable resources, but accessing it looks risky.",
    [
      new Choice(
        "Carefully extract supplies (requires INT 5)",
        (gs) => {
          gs.money += 40;
          gs.health -= 5;
          gs.intelligence += 1;
          return "Your careful approach pays off. Good haul!";
        },
        { int: 5 }
      ),
      new Choice(
        "Force your way in (requires STR 6)",
        (gs) => {
          gs.money += 35;
          gs.health -= 15;
          gs.stress += 10;
          return "You break through but injure yourself in the process.";
        },
        { str: 6 }
      ),
      new Choice(
        "Take only what's easily accessible",
        (gs) => {
          gs.money += 20;
          gs.health -= 3;
          return "You grab what you can without risk.";
        }
      ),
      new Choice(
        "Mark location and leave",
        (gs) => {
          gs.intelligence += 1;
          return "Smart to come back with proper tools later.";
        }
      )
    ],
    ["uncommon", "resource"]
  ),
  
  new GameEvent(
    "merchant",
    "The Merchant",
    "A traveling merchant has set up a temporary stall. They have medicine, food, and information for sale.",
    [
      new Choice(
        "Buy medicine (30 money)",
        (gs) => {
          gs.money -= 30;
          gs.health += 25;
          return "The medicine works wonders.";
        },
        { money: 30 }
      ),
      new Choice(
        "Buy information (20 money)",
        (gs) => {
          gs.money -= 20;
          gs.intelligence += 2;
          gs.stress -= 5;
          return "You learn about safe routes and dangers.";
        },
        { money: 20 }
      ),
      new Choice(
        "Barter with items (requires CHA 6)",
        (gs) => {
          gs.money += 25;
          gs.health += 10;
          return "Your charm gets you a great deal!";
        },
        { cha: 6 }
      ),
      new Choice(
        "Just browse and leave",
        (gs) => {
          return "The merchant eyes you suspiciously.";
        }
      )
    ],
    ["common", "merchant"]
  ),
  
  new GameEvent(
    "radiation_zone",
    "Radiation Warning",
    "Your makeshift detector crackles. There's radiation ahead, but you see valuable salvage through the haze.",
    [
      new Choice(
        "Push through quickly (requires STR 5)",
        (gs) => {
          gs.health -= 20;
          gs.money += 50;
          gs.stress += 15;
          return "You grab the salvage but feel sick.";
        },
        { str: 5 }
      ),
      new Choice(
        "Find alternate route (requires INT 6)",
        (gs) => {
          gs.stress += 5;
          gs.intelligence += 1;
          return "Your knowledge helps you avoid danger.";
        },
        { int: 6 }
      ),
      new Choice(
        "Turn back immediately",
        (gs) => {
          gs.stress += 10;
          return "Better safe than sorry.";
        }
      )
    ],
    ["uncommon", "danger"]
  ),
  
  new GameEvent(
    "survivor_group",
    "Survivor Camp",
    "You encounter a small group of survivors. They seem organized and well-supplied.",
    [
      new Choice(
        "Ask to join them (requires CHA 7)",
        (gs) => {
          gs.health += 20;
          gs.stress -= 20;
          gs.charisma += 2;
          gs.money -= 10;
          return "They welcome you! A night of safety and community.";
        },
        { cha: 7 }
      ),
      new Choice(
        "Trade supplies",
        (gs) => {
          if (gs.money >= 15) {
            gs.money -= 15;
            gs.health += 15;
            return "Fair trade completed.";
          } else {
            gs.stress += 5;
            return "You don't have enough to trade.";
          }
        }
      ),
      new Choice(
        "Share information only",
        (gs) => {
          gs.intelligence += 1;
          gs.charisma += 1;
          return "You exchange useful knowledge.";
        }
      ),
      new Choice(
        "Observe and move on",
        (gs) => {
          gs.stress += 5;
          return "You learn their patrol patterns.";
        }
      )
    ],
    ["rare", "social"]
  ),
  
  new GameEvent(
    "medical_emergency",
    "Medical Crisis",
    "You feel a sharp pain. Something is wrong with your health.",
    [
      new Choice(
        "Use first aid (requires INT 5, costs 15 money)",
        (gs) => {
          gs.money -= 15;
          gs.health += 20;
          gs.intelligence += 1;
          return "Your medical knowledge saves you.";
        },
        { int: 5, money: 15 }
      ),
      new Choice(
        "Push through the pain (requires STR 7)",
        (gs) => {
          gs.stress += 20;
          gs.strength += 1;
          return "You grit your teeth and endure.";
        },
        { str: 7 }
      ),
      new Choice(
        "Rest and hope",
        (gs) => {
          gs.health -= 10;
          gs.stress += 15;
          return "The pain subsides slightly.";
        }
      )
    ],
    ["uncommon", "crisis"],
    () => gameState.health < 50
  ),
  
  new GameEvent(
    "library_ruins",
    "Ruined Library",
    "You find the remains of a library. Books are scattered everywhere, some still readable.",
    [
      new Choice(
        "Study technical manuals",
        (gs) => {
          gs.intelligence += 3;
          gs.stress -= 10;
          return "Knowledge is power. You feel sharper.";
        }
      ),
      new Choice(
        "Read for comfort",
        (gs) => {
          gs.stress -= 20;
          gs.charisma += 1;
          return "Stories remind you of humanity.";
        }
      ),
      new Choice(
        "Salvage paper for fire",
        (gs) => {
          gs.money += 10;
          gs.health += 5;
          return "Practical, if sad.";
        }
      )
    ],
    ["uncommon", "peaceful"]
  ),
  
  new GameEvent(
    "gang_territory",
    "Gang Territory",
    "You've wandered into gang territory. Several hostile individuals block your path.",
    [
      new Choice(
        "Fight your way through (requires STR 8)",
        (gs) => {
          gs.health -= 25;
          gs.money += 30;
          gs.strength += 2;
          gs.stress += 15;
          return "Brutal but effective. You won.";
        },
        { str: 8 }
      ),
      new Choice(
        "Negotiate passage (requires CHA 8)",
        (gs) => {
          gs.money -= 25;
          gs.charisma += 2;
          return "Your words convince them. Passage granted.";
        },
        { cha: 8, money: 25 }
      ),
      new Choice(
        "Sneak around (requires INT 7)",
        (gs) => {
          gs.stress += 10;
          gs.intelligence += 1;
          return "You carefully avoid detection.";
        },
        { int: 7 }
      ),
      new Choice(
        "Flee immediately",
        (gs) => {
          gs.stress += 20;
          gs.health -= 10;
          return "You escape but they give chase briefly.";
        }
      )
    ],
    ["rare", "danger"]
  ),
  
  new GameEvent(
    "old_friend",
    "Familiar Face",
    "You recognize someone from before the collapse. They look different now, hardened by survival.",
    [
      new Choice(
        "Approach and talk",
        (gs) => {
          gs.stress -= 15;
          gs.charisma += 2;
          gs.health += 10;
          return "Reconnecting brings hope and shared resources.";
        }
      ),
      new Choice(
        "Observe from distance",
        (gs) => {
          gs.stress += 5;
          return "They don't notice you. Perhaps it's better this way.";
        }
      ),
      new Choice(
        "Pretend not to recognize them",
        (gs) => {
          gs.stress += 10;
          gs.charisma -= 1;
          return "The past is too painful to revisit.";
        }
      )
    ],
    ["rare", "social"],
    () => gameState.day > 5
  ),
  
  new GameEvent(
    "rain_storm",
    "Heavy Rain",
    "Dark clouds gather and rain begins to pour. You need shelter quickly.",
    [
      new Choice(
        "Find proper shelter (costs time, -10 money)",
        (gs) => {
          gs.money -= 10;
          gs.health += 5;
          gs.stress -= 10;
          return "You wait out the storm comfortably.";
        },
        { money: 10 }
      ),
      new Choice(
        "Collect rainwater",
        (gs) => {
          gs.health += 15;
          gs.stress += 5;
          return "Fresh water is precious. Worth getting wet.";
        }
      ),
      new Choice(
        "Keep moving through rain",
        (gs) => {
          gs.health -= 10;
          gs.stress += 15;
          gs.strength += 1;
          return "You push through, soaked and cold.";
        }
      )
    ],
    ["common", "weather"]
  ),
  
  new GameEvent(
    "scavenger_competition",
    "Rival Scavenger",
    "Another scavenger has found the same location as you. They eye you warily.",
    [
      new Choice(
        "Share the area peacefully",
        (gs) => {
          gs.money += 15;
          gs.charisma += 2;
          gs.stress -= 5;
          return "Cooperation yields results for both.";
        }
      ),
      new Choice(
        "Claim it first (requires STR 6)",
        (gs) => {
          gs.money += 30;
          gs.health -= 10;
          gs.stress += 10;
          return "You assert dominance. They back off.";
        },
        { str: 6 }
      ),
      new Choice(
        "Trade territories (requires CHA 5)",
        (gs) => {
          gs.money += 20;
          gs.intelligence += 1;
          gs.charisma += 1;
          return "Smart negotiation benefits everyone.";
        },
        { cha: 5 }
      ),
      new Choice(
        "Leave and find elsewhere",
        (gs) => {
          gs.stress += 5;
          return "No need for conflict. Other opportunities exist.";
        }
      )
    ],
    ["common", "social"]
  ),
  
  new GameEvent(
    "safe_haven",
    "Moment of Peace",
    "You find a surprisingly intact, secure location. A rare moment of safety.",
    [
      new Choice(
        "Rest deeply",
        (gs) => {
          gs.health += 20;
          gs.stress -= 25;
          return "True rest. You feel human again.";
        }
      ),
      new Choice(
        "Maintain defenses",
        (gs) => {
          gs.stress += 5;
          gs.intelligence += 2;
          return "Paranoia keeps you alive, but exhausts you.";
        }
      ),
      new Choice(
        "Explore thoroughly",
        (gs) => {
          gs.money += 25;
          gs.health += 10;
          return "Your thoroughness uncovers hidden supplies.";
        }
      )
    ],
    ["rare", "peaceful"],
    () => gameState.stress > 60
  ),
  
  new GameEvent(
    "moral_choice",
    "Difficult Decision",
    "You witness someone in trouble. Helping them will cost you resources and time.",
    [
      new Choice(
        "Help them fully",
        (gs) => {
          gs.money -= 30;
          gs.health -= 10;
          gs.charisma += 3;
          gs.stress -= 15;
          return "You remember what it means to be human.";
        },
        { money: 30 }
      ),
      new Choice(
        "Offer minimal aid",
        (gs) => {
          gs.money -= 10;
          gs.charisma += 1;
          return "You do what you can.";
        },
        { money: 10 }
      ),
      new Choice(
        "Walk away",
        (gs) => {
          gs.stress += 20;
          gs.charisma -= 1;
          return "Survival above all. But it haunts you.";
        }
      )
    ],
    ["uncommon", "moral"]
  ),
  
  new GameEvent(
    "achievement_milestone",
    "Personal Growth",
    "You reflect on how far you've come. Your skills have improved significantly.",
    [
      new Choice(
        "Acknowledge your strength",
        (gs) => {
          gs.strength += 2;
          gs.stress -= 10;
          return "You've become stronger than you thought possible.";
        }
      ),
      new Choice(
        "Value your intelligence",
        (gs) => {
          gs.intelligence += 2;
          gs.stress -= 10;
          return "Knowledge has been your best tool.";
        }
      ),
      new Choice(
        "Appreciate connections made",
        (gs) => {
          gs.charisma += 2;
          gs.stress -= 10;
          return "Humanity survives through bonds.";
        }
      )
    ],
    ["rare", "milestone"],
    () => gameState.day > 10
  ),
  
  new GameEvent(
    "equipment_failure",
    "Equipment Breakdown",
    "Your essential gear is failing. Without it, survival becomes much harder.",
    [
      new Choice(
        "Repair with skill (requires INT 8, costs 20 money)",
        (gs) => {
          gs.money -= 20;
          gs.intelligence += 2;
          return "Your technical skill saves critical equipment.";
        },
        { int: 8, money: 20 }
      ),
      new Choice(
        "Improvise replacement (requires STR 5)",
        (gs) => {
          gs.stress += 10;
          gs.strength += 1;
          return "Crude but functional. It'll work.";
        },
        { str: 5 }
      ),
      new Choice(
        "Buy replacement (costs 40 money)",
        (gs) => {
          gs.money -= 40;
          return "Expensive but reliable.";
        },
        { money: 40 }
      ),
      new Choice(
        "Make do without",
        (gs) => {
          gs.stress += 20;
          gs.health -= 15;
          return "Life gets much harder without proper gear.";
        }
      )
    ],
    ["uncommon", "crisis"]
  )
];

export function getRandomEvent() {
  // Filter events based on requirements
  const availableEvents = eventDatabase.filter(event => {
    if (event.requirement && !event.requirement()) return false;
    return true;
  });
  
  // Weighted random selection based on rarity
  const weights = availableEvents.map(event => {
    if (event.tags.includes("rare")) return 1;
    if (event.tags.includes("uncommon")) return 3;
    return 6; // common
  });
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < availableEvents.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return availableEvents[i];
    }
  }
  
  return availableEvents[0];
}