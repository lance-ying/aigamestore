// input.js - Input handling

export class InputState {
  constructor() {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.jump = false;
    this.jumpHeld = false;
    this.dash = false;
    this.dashHeld = false;
  }

  reset() {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.jump = false;
    this.jumpHeld = false;
    this.dash = false;
    this.dashHeld = false;
  }
}

export function updateInputFromKeyboard(p, inputs) {
  inputs.left = p.keyIsDown(37);
  inputs.right = p.keyIsDown(39);
  inputs.up = p.keyIsDown(38);
  inputs.down = p.keyIsDown(40);
  inputs.jump = p.keyIsDown(32);
  inputs.dash = p.keyIsDown(90);
}

export function updateInputFromAction(action, inputs) {
  inputs.reset();
  
  if (action.left) inputs.left = true;
  if (action.right) inputs.right = true;
  if (action.up) inputs.up = true;
  if (action.down) inputs.down = true;
  if (action.jump) inputs.jump = true;
  if (action.dash) inputs.dash = true;
}