// player.js - Player entity (for logging purposes)

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.screen_x = x;
    this.screen_y = y;
    this.game_x = x;
    this.game_y = y;
  }
  
  update(x, y) {
    this.x = x;
    this.y = y;
    this.screen_x = x;
    this.screen_y = y;
    this.game_x = x;
    this.game_y = y;
  }
}