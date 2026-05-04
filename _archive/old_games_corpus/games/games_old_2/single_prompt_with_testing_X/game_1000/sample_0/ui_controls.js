import { gameState } from './globals.js';

export function createUIControls() {
  const controlsContainer = document.createElement('div');
  controlsContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.9);
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
    z-index: 1000;
  `;

  const title = document.createElement('div');
  title.textContent = 'Control Mode';
  title.style.cssText = `
    font-weight: bold;
    margin-bottom: 10px;
    font-size: 14px;
    color: #333;
  `;
  controlsContainer.appendChild(title);

  const modes = [
    { id: 'HUMAN', label: 'Human' },
    { id: 'TEST_1', label: 'Test 1: Win Strategy' },
    { id: 'TEST_2', label: 'Test 2: Movement' },
    { id: 'TEST_3', label: 'Test 3: Jump/Slide' },
    { id: 'TEST_4', label: 'Test 4: Coin Collection' },
    { id: 'TEST_5', label: 'Test 5: Progression' }
  ];

  modes.forEach(mode => {
    const button = document.createElement('button');
    button.id = mode.id === 'HUMAN' ? 'humanModeBtn' : `test_${mode.id.split('_')[1]}_ModeBtn`;
    button.textContent = mode.label;
    button.style.cssText = `
      display: block;
      width: 100%;
      padding: 8px;
      margin: 5px 0;
      border: 2px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    `;

    button.addEventListener('click', () => {
      gameState.controlMode = mode.id;
      updateButtonStates();
    });

    button.addEventListener('mouseenter', () => {
      if (gameState.controlMode !== mode.id) {
        button.style.background = '#f0f0f0';
      }
    });

    button.addEventListener('mouseleave', () => {
      if (gameState.controlMode !== mode.id) {
        button.style.background = 'white';
      }
    });

    controlsContainer.appendChild(button);
  });

  document.body.appendChild(controlsContainer);

  function updateButtonStates() {
    modes.forEach(mode => {
      const button = document.getElementById(
        mode.id === 'HUMAN' ? 'humanModeBtn' : `test_${mode.id.split('_')[1]}_ModeBtn`
      );
      if (button) {
        if (gameState.controlMode === mode.id) {
          button.style.background = '#4CAF50';
          button.style.color = 'white';
          button.style.borderColor = '#4CAF50';
          button.style.fontWeight = 'bold';
        } else {
          button.style.background = 'white';
          button.style.color = 'black';
          button.style.borderColor = '#ddd';
          button.style.fontWeight = 'normal';
        }
      }
    });
  }

  updateButtonStates();
}