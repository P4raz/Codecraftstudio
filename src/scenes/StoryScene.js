import Phaser from 'phaser';
import SaveManager from '../systems/SaveManager.js';
import { missions, storyIntro } from '../data/missions.js';

export default class StoryScene extends Phaser.Scene {
  constructor() {
    super('StoryScene');
  }

  init(data) {
    this.mode = data.mode ?? 'intro';
    this.missionIndex = data.missionIndex ?? 0;
  }

  create() {
    this.elements = this.add.container(0, 0);
    this.draw();
    this.scale.on('resize', this.draw, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.draw, this));
  }

  draw() {
    if (this.elements) this.elements.destroy(true);
    this.elements = this.add.container(0, 0);
    const { width, height } = this.scale;
    const centerX = width / 2;
    const small = width < 620;
    const back = this.add.tileSprite(0, 0, width, height, 'city-back').setOrigin(0, 0).setAlpha(0.9);
    const middle = this.add.tileSprite(0, height * 0.18, width, height * 0.74, 'city-middle').setOrigin(0, 0).setAlpha(0.8);
    const foreground = this.add.tileSprite(0, height * 0.46, width, height * 0.56, 'city-foreground').setOrigin(0, 0).setAlpha(0.88);
    this.elements.add([back, middle, foreground]);

    const mission = missions[this.missionIndex];
    const completed = this.mode === 'complete';
    const heading = completed ? 'A MEMORY RETURNS' : '2147  /  AFTER THE GRIDFALL';
    const title = this.add.text(centerX, height * 0.2, heading, {
      fontFamily: 'Space Mono, monospace', fontSize: small ? '11px' : '14px', color: '#56e6ef', letterSpacing: 2
    }).setOrigin(0.5);
    const name = this.add.text(centerX, height * 0.29, completed ? mission.title : 'THE CITY FORGOT ITS NAME', {
      fontFamily: 'Rajdhani, sans-serif', fontSize: small ? '31px' : '48px', fontStyle: 'bold',
      color: '#e7f7ff', align: 'center', wordWrap: { width: width - 40 }
    }).setOrigin(0.5);
    const content = completed ? [mission.completion] : storyIntro.map(line => `${line.speaker}  /  ${line.text}`);
    const body = this.add.text(centerX, height * 0.49, content.join('\n\n'), {
      fontFamily: 'Rajdhani, sans-serif', fontSize: small ? '18px' : '22px',
      color: '#bfd5df', align: 'center', lineSpacing: 8, wordWrap: { width: Math.min(width - 48, 620) }
    }).setOrigin(0.5);
    const missionLine = this.add.text(centerX, height * 0.7, `${mission.district}  /  ${mission.description}`, {
      fontFamily: 'Space Mono, monospace', fontSize: small ? '9px' : '11px', color: '#ffbd62',
      align: 'center', wordWrap: { width: Math.min(width - 48, 620) }
    }).setOrigin(0.5);
    const buttonText = completed
      ? (this.missionIndex + 1 < missions.length ? 'CONTINUE TO NEXT DISTRICT' : 'RETURN TO THE GRID')
      : 'BEGIN RESTORATION';
    const button = this.makeButton(centerX, height * 0.83, small ? 250 : 290, buttonText, () => {
      if (completed) {
        SaveManager.completeMission(this.missionIndex, mission.id);
        this.scene.start('MenuScene');
      } else {
        this.scene.start('GameScene', { missionIndex: this.missionIndex });
      }
    });
    this.elements.add([title, name, body, missionLine, button]);
  }

  makeButton(x, y, width, label, callback) {
    const group = this.add.container(x, y);
    const graphic = this.add.graphics();
    graphic.fillStyle(0x56e6ef, 0.14); graphic.fillRoundedRect(-width / 2, -24, width, 48, 6);
    graphic.lineStyle(1, 0x56e6ef, 0.85); graphic.strokeRoundedRect(-width / 2, -24, width, 48, 6);
    const text = this.add.text(0, 0, label, { fontFamily: 'Space Mono, monospace', fontSize: '10px', color: '#e7f7ff', letterSpacing: 1 }).setOrigin(0.5);
    const zone = this.add.zone(0, 0, width, 52).setInteractive({ useHandCursor: true });
    zone.on('pointerup', callback);
    group.add([graphic, text, zone]);
    return group;
  }
}
