export class Player {
  constructor(id, isHuman = false) {
    this.id = id;
    this.isHuman = isHuman;
    this.hand = [];
    this.hasCalledUno = false;
  }

  addCard(card) {
    this.hand.push(card);
  }

  removeCard(index) {
    return this.hand.splice(index, 1)[0];
  }

  hasPlayableCard(currentColor, topCard) {
    return this.hand.some(card => card.canPlayOn(topCard, currentColor));
  }

  getPlayableCards(currentColor, topCard) {
    return this.hand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => card.canPlayOn(topCard, currentColor));
  }
}