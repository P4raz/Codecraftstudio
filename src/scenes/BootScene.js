import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.sound.pauseOnBlur = false;
    this.load.image('city-back', '/assets/CityLayers/back.png');
    this.load.image('city-middle', '/assets/CityLayers/middle.png');
    this.load.image('city-foreground', '/assets/CityLayers/foreground.png');
    this.load.image('city-foreground-empty', '/assets/CityLayers/foreground-empty.png');
    this.load.audio('city-music', '/assets/Music/cyberpunk-street.ogg');
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      const music = this.sound.add('city-music', { loop: true, volume: 0.32 });
      music.play({ loop: true, volume: 0.32 });
      this.scene.start('MenuScene');
    });
    this.load.start();
  }
}
