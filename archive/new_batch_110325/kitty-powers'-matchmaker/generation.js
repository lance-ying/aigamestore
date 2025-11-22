// generation.js - Generate clients, dates, venues, and mini-games
import { Client, DateProfile, Venue, MiniGame } from './entities.js';
import { TRAITS, MINIGAME_DIALOGUE, MINIGAME_GIFT, MINIGAME_COMPLIMENT } from './globals.js';

const CLIENT_NAMES = [
  "Alex", "Jordan", "Casey", "Morgan", "Riley",
  "Taylor", "Sam", "Quinn", "Avery", "Parker"
];

const DATE_NAMES = [
  "Chris", "Jamie", "Drew", "Blake", "Cameron",
  "Reese", "Skylar", "Dakota", "Peyton", "Sage"
];

export function generateClients(count, difficulty, p) {
  const clients = [];
  for (let i = 0; i < count; i++) {
    const name = CLIENT_NAMES[Math.floor(p.random(CLIENT_NAMES.length))];
    const traitCount = 2 + Math.floor(p.random(2)); // 2-3 traits
    const traits = [];
    const preferences = [];
    
    while (traits.length < traitCount) {
      const trait = TRAITS[Math.floor(p.random(TRAITS.length))];
      if (!traits.includes(trait)) {
        traits.push(trait);
      }
    }
    
    const prefCount = 2 + Math.floor(p.random(2)); // 2-3 preferences
    while (preferences.length < prefCount) {
      const pref = TRAITS[Math.floor(p.random(TRAITS.length))];
      if (!preferences.includes(pref)) {
        preferences.push(pref);
      }
    }
    
    clients.push(new Client(name, traits, preferences, difficulty));
  }
  return clients;
}

export function generateDates(count, difficulty, p) {
  const dates = [];
  for (let i = 0; i < count; i++) {
    const name = DATE_NAMES[Math.floor(p.random(DATE_NAMES.length))];
    const traitCount = 2 + Math.floor(p.random(2)); // 2-3 traits
    const traits = [];
    
    while (traits.length < traitCount) {
      const trait = TRAITS[Math.floor(p.random(TRAITS.length))];
      if (!traits.includes(trait)) {
        traits.push(trait);
      }
    }
    
    dates.push(new DateProfile(name, traits, difficulty));
  }
  return dates;
}

export function generateVenues() {
  return [
    new Venue("The Cozy Cafe", 0, "Casual", [MINIGAME_DIALOGUE, MINIGAME_COMPLIMENT]),
    new Venue("The Greasy Spoon", 100, "Relaxed", [MINIGAME_DIALOGUE, MINIGAME_GIFT]),
    new Venue("The Fancy Restaurant", 250, "Elegant", [MINIGAME_DIALOGUE, MINIGAME_COMPLIMENT, MINIGAME_GIFT]),
    new Venue("The Rooftop Bar", 400, "Romantic", [MINIGAME_DIALOGUE, MINIGAME_COMPLIMENT])
  ];
}

const DIALOGUE_OPTIONS = [
  {
    question: "What do you like to do on weekends?",
    options: ["Adventure sports", "Read books", "Watch movies", "Go to museums"],
    traits: ["Adventurous", "Intellectual", "Romantic", "Creative"]
  },
  {
    question: "What's your idea of a perfect date?",
    options: ["Hiking trip", "Candlelit dinner", "Comedy show", "Art gallery"],
    traits: ["Athletic", "Romantic", "Humorous", "Creative"]
  },
  {
    question: "How do you handle challenges?",
    options: ["Face them head-on", "Think it through", "Laugh it off", "Get creative"],
    traits: ["Adventurous", "Intellectual", "Humorous", "Creative"]
  },
  {
    question: "What's most important to you?",
    options: ["Excitement", "Connection", "Knowledge", "Fun"],
    traits: ["Adventurous", "Romantic", "Intellectual", "Humorous"]
  }
];

const GIFT_OPTIONS = [
  {
    prompt: "Choose a gift:",
    options: ["Book", "Flowers", "Concert tickets", "Gourmet chocolates"],
    traits: ["Intellectual", "Romantic", "Adventurous", "Creative"]
  },
  {
    prompt: "Pick a surprise:",
    options: ["Adventure gear", "Jewelry", "Comedy show tickets", "Art supplies"],
    traits: ["Athletic", "Romantic", "Humorous", "Creative"]
  }
];

const COMPLIMENT_OPTIONS = [
  {
    prompt: "Give a compliment:",
    options: ["You're brave!", "You're beautiful!", "You're brilliant!", "You're hilarious!"],
    traits: ["Adventurous", "Romantic", "Intellectual", "Humorous"]
  },
  {
    prompt: "Express admiration:",
    options: ["Your energy is amazing!", "Your smile lights up the room!", "Your mind is fascinating!", "Your creativity inspires me!"],
    traits: ["Athletic", "Romantic", "Intellectual", "Creative"]
  }
];

export function generateMiniGame(type, clientPreferences, p) {
  const duration = 600 + Math.floor(p.random(300)); // 10-15 seconds at 60fps
  
  if (type === MINIGAME_DIALOGUE) {
    const dialogueSet = DIALOGUE_OPTIONS[Math.floor(p.random(DIALOGUE_OPTIONS.length))];
    const correctIndex = findBestMatch(clientPreferences, dialogueSet.traits);
    return new MiniGame(type, duration, {
      question: dialogueSet.question,
      choices: dialogueSet.options
    }, correctIndex);
  } else if (type === MINIGAME_GIFT) {
    const giftSet = GIFT_OPTIONS[Math.floor(p.random(GIFT_OPTIONS.length))];
    const correctIndex = findBestMatch(clientPreferences, giftSet.traits);
    return new MiniGame(type, duration, {
      prompt: giftSet.prompt,
      choices: giftSet.options
    }, correctIndex);
  } else if (type === MINIGAME_COMPLIMENT) {
    const complimentSet = COMPLIMENT_OPTIONS[Math.floor(p.random(COMPLIMENT_OPTIONS.length))];
    const correctIndex = findBestMatch(clientPreferences, complimentSet.traits);
    return new MiniGame(type, duration, {
      prompt: complimentSet.prompt,
      choices: complimentSet.options
    }, correctIndex);
  }
  
  return null;
}

function findBestMatch(preferences, traits) {
  let bestIndex = 0;
  let maxMatches = 0;
  
  for (let i = 0; i < traits.length; i++) {
    if (preferences.includes(traits[i])) {
      maxMatches++;
      bestIndex = i;
    }
  }
  
  return bestIndex;
}