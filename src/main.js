import Phaser from 'phaser';
import '../style.css';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import StoryScene from './scenes/StoryScene.js';

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  backgroundColor: '#07111f',
  width: window.innerWidth,
  height: window.innerHeight,
  render: {
    antialias: false,
    pixelArt: false,
    roundPixels: true,
    powerPreference: 'low-power'
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 3
  },
  scene: [BootScene, MenuScene, StoryScene, GameScene]
});

window.addEventListener('beforeunload', () => game.destroy(true));
