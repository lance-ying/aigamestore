import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ROBOT_MASTERS } from './globals.js';
import { Enemy, RobotMaster } from './enemies.js';

export class Stage {
  constructor(type, bossData = null) {
    this.type = type;
    this.width = 1200;
    this.height = CANVAS_HEIGHT;
    this.bossData = bossData;
    this.boss = null;
    this.backgroundColor = [50, 100, 150];
    
    this.setupStage();
  }

  setupStage() {
    gameState.platformBlocks = [];
    gameState.hazards = [];
    gameState.enemySpawners = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.drops = [];

    if (this.type === 'boss') {
      this.setupBossStage();
    } else if (this.type === 'wily_fortress') {
      this.setupWilyStage();
    } else if (this.type === 'boss_gauntlet') {
      this.setupBossGauntlet();
    }
  }

  setupBossStage() {
    this.width = 600;
    this.backgroundColor = this.bossData.color.map(c => c * 0.3);

    // Floor
    gameState.platformBlocks.push({ x: 0, y: 350, width: 600, height: 50 });
    
    // Side platforms
    gameState.platformBlocks.push({ x: 50, y: 280, width: 100, height: 20 });
    gameState.platformBlocks.push({ x: 450, y: 280, width: 100, height: 20 });
    
    // Middle platform
    gameState.platformBlocks.push({ x: 220, y: 200, width: 160, height: 20 });

    // Spawn boss
    this.boss = new RobotMaster(400, 250, this.bossData);
    gameState.entities.push(this.boss);
    gameState.bossHealth = this.boss.health;
    gameState.maxBossHealth = this.boss.maxHealth;
    gameState.showBossHealthBar = true;
  }

  setupWilyStage() {
    this.width = 1800;
    this.backgroundColor = [30, 20, 40];

    // Complex platforming section
    let x = 50;
    for (let i = 0; i < 8; i++) {
      gameState.platformBlocks.push({ x: x, y: 300 - i * 20, width: 80, height: 20 });
      x += 120;
      
      // Spike hazards
      if (i % 2 === 0) {
        gameState.hazards.push({ x: x - 40, y: 300 - i * 20 + 20, width: 30, height: 10, type: 'spike' });
      }
    }

    // Pit section (requires Magnet Beam)
    gameState.platformBlocks.push({ x: 1000, y: 250, width: 100, height: 20 });
    gameState.platformBlocks.push({ x: 1300, y: 250, width: 200, height: 20 });

    // Yoku block section (disappearing platforms)
    for (let i = 0; i < 6; i++) {
      const block = { 
        x: 1550 + i * 50, 
        y: 280 - Math.floor(i / 2) * 60, 
        width: 40, 
        height: 15,
        isYoku: true,
        visible: true,
        index: i
      };
      gameState.platformBlocks.push(block);
      gameState.yokublockPattern.push(block);
    }

    // Spawn enemies
    for (let i = 0; i < 5; i++) {
      gameState.entities.push(new Enemy(200 + i * 200, 250, i % 2 === 0 ? 'walker' : 'flyer'));
    }
  }

  setupBossGauntlet() {
    this.width = 600;
    const bosses = ROBOT_MASTERS.filter(rm => gameState.robotMastersDefeated[rm.name]);
    
    if (gameState.bossGauntletIndex < bosses.length) {
      this.bossData = bosses[gameState.bossGauntletIndex];
      this.backgroundColor = this.bossData.color.map(c => c * 0.3);
      
      // Floor
      gameState.platformBlocks.push({ x: 0, y: 350, width: 600, height: 50 });
      gameState.platformBlocks.push({ x: 150, y: 250, width: 300, height: 20 });

      // Spawn boss
      this.boss = new RobotMaster(400, 200, this.bossData);
      gameState.entities.push(this.boss);
      gameState.bossHealth = this.boss.health;
      gameState.maxBossHealth = this.boss.maxHealth;
      gameState.showBossHealthBar = true;

      // Healing available before each boss
      gameState.healingAvailable = true;
    } else {
      // Final victory
      gameState.gamePhase = "GAME_OVER_WIN";
    }
  }

  update(p) {
    // Update Yoku blocks
    if (gameState.yokublockPattern.length > 0) {
      gameState.yokublockTimer++;
      if (gameState.yokublockTimer % 60 === 0) {
        const cyclePosition = Math.floor(gameState.yokublockTimer / 60) % 3;
        for (let block of gameState.yokublockPattern) {
          block.visible = (block.index % 3) === cyclePosition;
        }
      }
    }

    // Check stage completion
    if (this.boss && this.boss.health <= 0 && !gameState.stageComplete) {
      gameState.stageComplete = true;
      gameState.transitionTimer = 120;
      
      if (this.type === 'boss') {
        // Unlock weapon
        gameState.robotMastersDefeated[this.bossData.name] = true;
        const weaponKey = this.bossData.weapon;
        if (!gameState.unlockedWeapons.includes(weaponKey)) {
          gameState.unlockedWeapons.push(weaponKey);
          gameState.weaponEnergy[weaponKey] = 28;
        }
        
        // Refill weapon energy
        for (let key of gameState.unlockedWeapons) {
          if (key !== 'BUSTER') {
            gameState.weaponEnergy[key] = 28;
          }
        }
        
        gameState.score += 1000;
      } else if (this.type === 'boss_gauntlet') {
        gameState.bossGauntletIndex++;
        gameState.score += 500;
      }
    }

    if (gameState.stageComplete) {
      gameState.transitionTimer--;
      if (gameState.transitionTimer <= 0) {
        this.completeStage(p);
      }
    }
  }

  completeStage(p) {
    gameState.stageComplete = false;
    gameState.showBossHealthBar = false;
    gameState.currentStage = null;
    gameState.entities = gameState.entities.filter(e => e === gameState.player);
    
    if (this.type === 'boss') {
      gameState.stageSelectMode = true;
      
      // Check if all bosses defeated
      const allDefeated = ROBOT_MASTERS.every(rm => gameState.robotMastersDefeated[rm.name]);
      if (allDefeated) {
        // Unlock Magnet Beam for Wily stages
        if (!gameState.unlockedWeapons.includes('MAGNET_BEAM')) {
          gameState.unlockedWeapons.push('MAGNET_BEAM');
          gameState.weaponEnergy['MAGNET_BEAM'] = 28;
        }
      }
    } else if (this.type === 'wily_fortress') {
      gameState.wilyStagePhase++;
      if (gameState.wilyStagePhase >= 2) {
        // Start boss gauntlet
        gameState.bossGauntletIndex = 0;
        gameState.currentStage = new Stage('boss_gauntlet');
        gameState.player.x = 100;
        gameState.player.y = 100;
        gameState.playerHealth = gameState.maxPlayerHealth;
      } else {
        gameState.stageSelectMode = true;
      }
    } else if (this.type === 'boss_gauntlet') {
      if (gameState.bossGauntletIndex < ROBOT_MASTERS.filter(rm => gameState.robotMastersDefeated[rm.name]).length) {
        // Limited healing between gauntlet bosses
        if (gameState.healingAvailable) {
          gameState.playerHealth = Math.min(gameState.playerHealth + 10, gameState.maxPlayerHealth);
          gameState.healingAvailable = false;
        }
        gameState.currentStage = new Stage('boss_gauntlet');
        gameState.player.x = 100;
        gameState.player.y = 100;
      } else {
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_WIN", reason: "all_bosses_defeated" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }

  draw(p) {
    // Background
    p.background(...this.backgroundColor);
    
    // Background details
    for (let i = 0; i < 20; i++) {
      const lighter = this.backgroundColor.map(c => Math.min(255, c + 20));
      p.fill(...lighter, 100);
      p.rect(i * 100 - (gameState.camera.x * 0.5) % 100, 0, 80, CANVAS_HEIGHT);
    }

    // Platforms
    for (let plat of gameState.platformBlocks) {
      if (plat.isYoku && !plat.visible) continue;
      
      const screenX = plat.x - gameState.camera.x;
      const screenY = plat.y - gameState.camera.y;
      
      p.fill(80, 80, 100);
      p.rect(screenX, screenY, plat.width, plat.height);
      
      // Platform detail
      p.fill(100, 100, 120);
      for (let i = 0; i < plat.width; i += 20) {
        p.rect(screenX + i + 2, screenY + 2, 8, plat.height - 4);
      }

      if (plat.isYoku) {
        p.fill(150, 100, 200, 150);
        p.rect(screenX, screenY, plat.width, plat.height);
      }
    }

    // Hazards
    for (let hazard of gameState.hazards) {
      const screenX = hazard.x - gameState.camera.x;
      const screenY = hazard.y - gameState.camera.y;
      
      if (hazard.type === 'spike') {
        p.fill(200, 50, 50);
        for (let i = 0; i < hazard.width; i += 10) {
          p.triangle(
            screenX + i, screenY + hazard.height,
            screenX + i + 5, screenY,
            screenX + i + 10, screenY + hazard.height
          );
        }
      }
    }
  }
}