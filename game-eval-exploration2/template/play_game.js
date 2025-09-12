#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

class GamePlayer {
    constructor() {
        this.browser = null;
        this.page = null;
        this.errors = [];
        this.result = null;
    }

    async init(gameUrl) {
        console.log('🚀 Launching browser...');
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const resultsDir = path.join(path.dirname(gameUrl), 'results', 'random-policy');
        await fs.mkdir(resultsDir, { recursive: true });
        console.log(`📁 Created results directory: ${resultsDir}`);
        
        const context = await this.browser.newContext({
            recordVideo: {
                dir: resultsDir,
                size: { width: 600, height: 400 }
            },
            viewport: { width: 600, height: 400 }
        });
        
        this.page = await context.newPage();
        console.log('🎥 Video recording started');
        
        // Capture console messages and errors
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                const error = { type: 'console', message: msg.text(), location: msg.location() };
                this.errors.push(error);
                console.log(`Console error: ${msg.text()}`);
            }
        });
        
        this.page.on('pageerror', error => {
            const err = { type: 'javascript', message: error.message, stack: error.stack };
            this.errors.push(err);
            console.log(`Page error: ${error.message}`);
        });
        
        this.page.on('requestfailed', request => {
            const error = { type: 'network', url: request.url(), failure: request.failure()?.errorText };
            this.errors.push(error);
            console.log(`Request failed: ${request.url()}`);
        });
        
        console.log(`🎮 Loading game: ${gameUrl}`);
        await this.page.goto(`file://${gameUrl}`, { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
        });
        console.log('⏱️  Waiting for game to initialize...');
        await this.page.waitForTimeout(2000);
        await this.page.waitForFunction(() => window.gameAPI !== undefined, { timeout: 10000 });
        console.log('✅ Game API detected');
    }

    async playRandomly(duration = 30000) {
        console.log(`🎲 Starting random gameplay for ${duration}ms...`);
        const startTime = Date.now();
        let actions = 0;
        
        // Get initial game state
        const initialState = await this.page.evaluate(() => window.gameAPI.getGameState());
        console.log(`🎯 Initial state: Score=${initialState.score}, Lives=${initialState.lives || 'N/A'}`);
        
        let stoppedReason = 'timeout';
        while (Date.now() - startTime < duration) {
            // Check if game is over and stop
            const isGameOver = await this.page.evaluate(() => window.gameAPI.isGameOver());
            if (isGameOver) {
                console.log('🎮 Game ended, stopping actions');
                stoppedReason = 'game_over';
                break;
            }
            
            await this.page.evaluate(() => window.gameAPI.playRandomAction());
            actions++;
            await this.page.waitForTimeout(100 + Math.random() * 200);
        }
        
        if (stoppedReason === 'timeout') {
            console.log('⏰ Stopped due to timeout');
        }
        
        // Get final game state and logs
        const finalState = await this.page.evaluate(() => window.gameAPI.getGameState());
        const gameLogs = await this.page.evaluate(() => window.gameAPI.getLogs());
        const playTime = Date.now() - startTime;
        
        // Determine game outcome
        let gameOutcome = 'unknown';
        if (finalState.gameState === 'win') {
            gameOutcome = 'win';
        } else if (finalState.gameState === 'lose') {
            gameOutcome = 'lose';
        } else if (stoppedReason === 'timeout') {
            gameOutcome = 'timeout';
        }

        this.result = {
            timestamp: new Date().toISOString(),
            playTime,
            actions,
            actionsPerSecond: Math.round((actions / playTime) * 1000),
            stoppedReason, // 'game_over' or 'timeout'
            gameOutcome, // 'win', 'lose', 'timeout', or 'unknown'
            initialState,
            finalState,
            finalScore: finalState.score,
            gameLogs, // Complete game logs
            logCount: gameLogs.length,
            errors: this.errors,
            status: this.errors.length > 0 ? 'FAILED' : 'PASSED'
        };
        
        console.log(`🏁 Gameplay complete: ${actions} actions in ${playTime}ms`);
        console.log(`🎯 Final state: Score=${finalState.score}, Lives=${finalState.lives || 'N/A'}`);
        console.log(`📝 Game logs captured: ${gameLogs.length} entries`);
        
        // Print raw logs to console
        console.log('\n=== RAW GAME LOGS ===');
        gameLogs.forEach(log => console.log(log));
        console.log('=== END GAME LOGS ===\n');
    }

    async saveResult(gameUrl) {
        if (this.result) {
            const resultsDir = path.join(path.dirname(gameUrl), 'results', 'random-policy');
            
            // Save the complete result including logs
            const resultPath = path.join(resultsDir, 'play-result.json');
            await fs.writeFile(resultPath, JSON.stringify(this.result, null, 2));
            console.log(`💾 Result saved: ${resultPath}`);
            
            // Save logs as a separate file for easier analysis
            const logsPath = path.join(resultsDir, 'logs.txt');
            const logsContent = this.result.gameLogs.join('\n');
            await fs.writeFile(logsPath, logsContent);
            console.log(`📝 Game logs saved: ${logsPath} (${this.result.gameLogs.length} entries)`);
        }
    }

    async cleanup(gameUrl) {
        console.log('🧹 Cleaning up...');
        let videoPath = null;
        if (this.page) {
            videoPath = await this.page.video()?.path();
            await this.page.close();
            console.log('📄 Page closed');
        }
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Browser closed');
        }
        
        // Rename video to video.webm
        if (videoPath && gameUrl) {
            const resultsDir = path.join(path.dirname(gameUrl), 'results', 'random-policy');
            const targetPath = path.join(resultsDir, 'video.webm');
            await fs.rename(videoPath, targetPath);
            console.log(`🎬 Video saved: ${targetPath}`);
        }
    }
}

async function main() {
    const gameFile = process.argv[2] || path.join(__dirname, 'index.html');
    const duration = parseInt(process.argv[3]) || 30000;
    
    const player = new GamePlayer();
    await player.init(gameFile);
    await player.playRandomly(duration);
    await player.saveResult(gameFile);
    await player.cleanup(gameFile);
}

if (require.main === module) {
    main();
}

module.exports = { GamePlayer };