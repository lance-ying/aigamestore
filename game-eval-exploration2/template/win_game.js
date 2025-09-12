#!/usr/bin/env node

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

class WinGamePlayer {
    constructor() {
        this.browser = null;
        this.baseResultsDir = null;
    }

    async initBrowser() {
        if (!this.browser) {
            console.log('🚀 Launching browser (one-time setup)...');
            this.browser = await chromium.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            console.log('✅ Browser launched and ready');
        }
    }

    async initGame(gameUrl) {
        console.log('📝 Setting up game...');
        
        // Create results directory
        this.baseResultsDir = path.join(path.dirname(gameUrl), 'results', 'win-policy');
        await fs.mkdir(this.baseResultsDir, { recursive: true });
        console.log(`📁 Created results directory: ${this.baseResultsDir}`);
        
        // Create browser context
        const context = await this.browser.newContext({
            recordVideo: {
                dir: this.baseResultsDir,
                size: { width: 600, height: 400 }
            },
            viewport: { width: 600, height: 400 }
        });
        
        const page = await context.newPage();
        const errors = [];
        console.log('🎥 Video recording started');
        
        // Capture console messages and errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                const error = { type: 'console', message: msg.text(), location: msg.location() };
                errors.push(error);
                console.log(`Console error: ${msg.text()}`);
            }
        });
        
        page.on('pageerror', error => {
            const err = { type: 'javascript', message: error.message, stack: error.stack };
            errors.push(err);
            console.log(`Page error: ${error.message}`);
        });
        
        page.on('requestfailed', request => {
            const error = { type: 'network', url: request.url(), failure: request.failure()?.errorText };
            errors.push(error);
            console.log(`Request failed: ${request.url()}`);
        });
        
        console.log(`🎮 Loading game: ${gameUrl}`);
        await page.goto(`file://${gameUrl}`, { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
        });
        console.log('⏱️  Waiting for game to initialize...');
        await page.waitForTimeout(2000);
        await page.waitForFunction(() => window.gameAPI !== undefined, { timeout: 10000 });
        console.log('✅ Game API detected');
        
        return { page, context, errors };
    }

    async playToWin(gameUrl) {
        console.log('🎯 Starting intelligent gameplay to win...');
        
        // Initialize browser
        await this.initBrowser();
        
        try {
            // Initialize game
            const { page, context, errors } = await this.initGame(gameUrl);
            
            // Run the game policy
            const result = await this.runGame(page, errors);
            
            // Print raw game logs
            console.log('\n📝 Raw game logs:');
            result.gameLogs.forEach(log => console.log(log));
            
            // Save results
            await this.saveResult(result);
            
            // Clean up
            await this.cleanup(page, context);
            
            if (result.gameOutcome === 'win') {
                console.log('🏁 Victory achieved!');
                return true;
            } else {
                console.log(`❌ Game ended with outcome: ${result.gameOutcome}`);
                return false;
            }
        } finally {
            // Clean up browser at the end
            await this.closeBrowser();
        }
    }



    async runGame(page, errors) {
        // TODO: Implement game playing logic here
        // This method should interact with the game API and return a result object
        return {
            timestamp: new Date().toISOString(),
            playTime: 0,
            actions: 0,
            actionsPerSecond: 0,
            gameOutcome: 'pending', // 'win', 'lose', 'pending', 'error'
            initialState: null,
            finalState: null,
            finalScore: 0,
            gameLogs: [],
            logCount: 0,
            errors: errors,
            status: 'TODO'
        };
    }

    async saveResult(result) {
        // Save the complete result including logs
        const resultPath = path.join(this.baseResultsDir, 'result.json');
        await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
        console.log(`💾 Result saved: ${resultPath}`);
        
        // Save logs as a separate file for easier analysis
        const logsPath = path.join(this.baseResultsDir, 'logs.txt');
        const logsContent = result.gameLogs.join('\n');
        await fs.writeFile(logsPath, logsContent);
        console.log(`📝 Game logs saved: ${logsPath} (${result.gameLogs.length} entries)`);
        
        // Save a summary for quick overview
        const summaryPath = path.join(this.baseResultsDir, 'summary.txt');
        const summary = [
            `Game Result: ${result.status}`,
            `Outcome: ${result.gameOutcome}`,
            `Score: ${result.finalScore}`,
            `Time: ${(result.playTime/1000).toFixed(1)}s`,
            `Actions: ${result.actions} (${result.actionsPerSecond}/s)`,
            `Logs: ${result.logCount} entries`,
            `Errors: ${result.errors.length}`,
            result.bestHeight ? `Best Height: ${result.bestHeight.toFixed(0)}` : '',
            `Timestamp: ${result.timestamp}`
        ].filter(Boolean).join('\n');
        
        await fs.writeFile(summaryPath, summary);
        console.log(`📊 Summary saved: ${summaryPath}`);
    }

    async cleanup(page, context) {
        console.log(`🧹 Cleaning up...`);
        let videoPath = null;
        
        if (page) {
            videoPath = await page.video()?.path();
            await page.close();
        }
        
        if (context) {
            await context.close();
        }
        
        // Rename video to video.webm in the results directory
        if (videoPath) {
            const targetPath = path.join(this.baseResultsDir, 'video.webm');
            await fs.rename(videoPath, targetPath);
            console.log(`🎬 Video saved: ${targetPath}`);
        }
    }

    async closeBrowser() {
        if (this.browser) {
            console.log('🔒 Closing browser...');
            await this.browser.close();
            this.browser = null;
            console.log('✅ Browser closed');
        }
    }


}

async function main() {
    const gameFile = process.argv[2] || path.join(__dirname, 'index.html');
    
    const player = new WinGamePlayer();
    
    console.log(`🎮 Game: ${gameFile}`);
    console.log('🎯 Running game to win...');
    
    const success = await player.playToWin(gameFile);
    
    if (success) {
        console.log('\n🎉 SUCCESS: Game won!');
        process.exit(0);
    } else {
        console.log('\n💔 FAILURE: Could not win the game');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { WinGamePlayer };