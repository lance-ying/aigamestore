// cards.js - Card definitions and management

export class Card {
  constructor(name, cost, effect, vp = 0, description = "") {
    this.name = name;
    this.cost = cost;
    this.effect = effect;
    this.vp = vp;
    this.description = description;
    this.mcProduction = 0;
  }
}

export function createCardDeck() {
  return [
    new Card("Power Plant", 10, { type: "mcProduction", value: 1 }, 0, "+1 MC prod"),
    new Card("Heat Plant", 8, { type: "mcProduction", value: 2 }, 0, "+2 MC prod"),
    new Card("Ocean Factory", 15, { type: "ocean", value: 1 }, 1, "Place ocean"),
    new Card("Forest Builder", 12, { type: "forest", value: 1 }, 1, "Place forest"),
    new Card("Ice Asteroid", 20, { type: "ocean", value: 2 }, 2, "Place 2 oceans"),
    new Card("City District", 18, { type: "city", value: 1 }, 1, "Place city"),
    new Card("Temperature Rise", 16, { type: "temp", value: 2 }, 1, "+2°C temp"),
    new Card("Oxygen Generator", 14, { type: "oxygen", value: 2 }, 1, "+2% oxygen"),
    new Card("Mega Factory", 25, { type: "mcProduction", value: 3 }, 2, "+3 MC prod"),
    new Card("Terraforming Bot", 22, { type: "combo", value: 1 }, 2, "+1°C, +1% O2"),
    new Card("Arctic Melter", 18, { type: "ocean", value: 1, temp: 1 }, 2, "Ocean +1°C"),
    new Card("Green City", 30, { type: "city", value: 1, forest: 1 }, 3, "City + Forest"),
    new Card("Super Ocean", 24, { type: "ocean", value: 3 }, 3, "Place 3 oceans"),
    new Card("Climate Station", 20, { type: "temp", value: 3 }, 2, "+3°C temp"),
    new Card("Algae Farm", 16, { type: "oxygen", value: 3 }, 2, "+3% oxygen"),
    new Card("Investment Corp", 12, { type: "mcProduction", value: 4 }, 1, "+4 MC prod"),
    new Card("Thermal Drill", 19, { type: "temp", value: 4 }, 2, "+4°C temp"),
    new Card("Oxygen Plant", 21, { type: "oxygen", value: 4 }, 2, "+4% oxygen"),
    new Card("Polar Base", 28, { type: "ocean", value: 2, city: 1 }, 3, "2 oceans + city"),
    new Card("Economic Boom", 15, { type: "mcProduction", value: 5 }, 1, "+5 MC prod")
  ];
}

export function drawCards(deck, count) {
  const drawn = [];
  for (let i = 0; i < count && deck.length > 0; i++) {
    const index = Math.floor(Math.random() * deck.length);
    drawn.push(deck.splice(index, 1)[0]);
  }
  return drawn;
}