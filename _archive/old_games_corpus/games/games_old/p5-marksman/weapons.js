// weapons.js - Weapon and shooting mechanics

import { gameState } from './globals.js';

export class Weapon {
  constructor(p) {
    this.p = p;
    this.reloadFrames = 120; // 2 seconds at 60fps
    this.fireRecoilFrames = 10;
    this.lastFireFrame = 0;
  }

  fire(targets, cameraX, cameraY, zoomLevel) {
    if (gameState.isReloading) return false;
    if (gameState.ammoInClip <= 0) return false;

    gameState.ammoInClip--;
    gameState.shotsFired++;
    this.lastFireFrame = this.p.frameCount;

    // Check for hits
    const crosshairX = 300;
    const crosshairY = 200;

    let hitTarget = null;
    let isHeadshot = false;

    for (let target of targets) {
      const result = target.checkHit(crosshairX, crosshairY, cameraX, cameraY, zoomLevel);
      if (result.hit) {
        hitTarget = target;
        isHeadshot = result.headshot;
        break;
      }
    }

    if (hitTarget) {
      if (hitTarget.type === "civilian") {
        return { hit: true, target: hitTarget, headshot: false, civilian: true };
      } else {
        gameState.shotsHit++;
        return { hit: true, target: hitTarget, headshot: isHeadshot, civilian: false };
      }
    }

    return { hit: false };
  }

  reload() {
    if (gameState.isReloading) return;
    if (gameState.ammoReserve <= 0) return;
    if (gameState.ammoInClip === 5) return; // Already full

    gameState.isReloading = true;
    gameState.reloadStartFrame = this.p.frameCount;
  }

  update() {
    if (gameState.isReloading) {
      if (this.p.frameCount - gameState.reloadStartFrame >= this.reloadFrames) {
        const ammoNeeded = 5 - gameState.ammoInClip;
        const ammoToLoad = Math.min(ammoNeeded, gameState.ammoReserve);
        gameState.ammoInClip += ammoToLoad;
        gameState.ammoReserve -= ammoToLoad;
        gameState.isReloading = false;
      }
    }
  }

  getRecoilOffset() {
    const framesSinceFire = this.p.frameCount - this.lastFireFrame;
    if (framesSinceFire < this.fireRecoilFrames) {
      const progress = framesSinceFire / this.fireRecoilFrames;
      return 5 * (1 - progress);
    }
    return 0;
  }
}