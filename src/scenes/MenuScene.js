import Phaser from 'phaser';
import SaveManager from '../systems/SaveManager.js';
import { missions } from '../data/missions.js';

const COLORS = { cyan: 0x56e6ef, amber: 0xffbd62, purple: 0xb792ff, ink: 0x07111f };

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
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
    this.addBackdrop(this.elements, width, height);
    const small = width < 650;
    const tiny = height < 420;
    const centerX = width / 2;
    const titleY = height * (tiny ? 0.17 : small ? 0.2 : 0.25);
    const titleTop = titleY - (tiny ? 36 : small ? 52 : 82);
    const kicker = this.add.text(centerX, Math.max(13, titleTop - 18), 'A GRIDFALL STORY  /  2147', {
      fontFamily: 'Space Mono, monospace', fontSize: small ? '10px' : '12px', color: '#56e6ef', letterSpacing: 3
    }).setOrigin(0.5);
    const title = this.add.text(centerX, titleY, 'ECHOES\nOF THE GRID', {
      fontFamily: 'Rajdhani, sans-serif', fontSize: tiny ? '34px' : small ? '48px' : '76px', fontStyle: 'bold',
      color: '#e7f7ff', align: 'center', lineSpacing: -8, stroke: '#07111f', strokeThickness: 6
    }).setOrigin(0.5);
    const subtitle = this.add.text(centerX, titleY + (tiny ? 72 : small ? 86 : 124), 'RESTORE THE POWER. RECOVER THE MEMORIES.', {
      fontFamily: 'Space Mono, monospace', fontSize: small ? '9px' : '12px', color: '#9ab9c9',
      letterSpacing: small ? 1 : 2, align: 'center'
    }).setOrigin(0.5);
    this.elements.add(tiny ? [title, subtitle] : [kicker, title, subtitle]);
    this.drawPulses(this.elements, centerX, titleY + (tiny ? 99 : small ? 130 : 174));

    const unlocked = Math.min(SaveManager.getUnlockedMission(), missions.length - 1);
    const mission = missions[unlocked];
    const panelW = Math.min(width - 36, small ? 370 : 520);
    const panelY = tiny ? height - 55 : Math.min(height - 122, titleY + (small ? 255 : 310));
    this.panel(this.elements, centerX, panelY, panelW, tiny ? 104 : small ? 134 : 142);
    const district = this.add.text(centerX, panelY - (tiny ? 34 : 43), `AVAILABLE MISSION  /  ${mission.district}`, {
      fontFamily: 'Space Mono, monospace', fontSize: small ? '8px' : '10px', color: '#ffbd62', letterSpacing: 1
    }).setOrigin(0.5);
    const missionTitle = this.add.text(centerX, panelY - (tiny ? 13 : 18), mission.title, {
      fontFamily: 'Rajdhani, sans-serif', fontSize: small ? '22px' : '27px', fontStyle: 'bold', color: '#e7f7ff'
    }).setOrigin(0.5);
    const help = this.add.text(centerX, panelY + 10, 'Place energy blocks. Complete lines to restore the relay.', {
      fontFamily: 'Rajdhani, sans-serif', fontSize: small ? '13px' : '16px', color: '#9ab9c9'
    }).setOrigin(0.5);
    const buttonY = panelY + (tiny ? 24 : small ? 48 : 54);
    const button = this.makeButton(centerX, buttonY, small ? 218 : 240, 'ENTER THE DISTRICT', COLORS.cyan, () => {
      if (unlocked === 0 && !SaveManager.getSession(mission.id)) {
        this.scene.start('StoryScene', { mode: 'intro', missionIndex: 0 });
      } else {
        this.scene.start('GameScene', { missionIndex: unlocked });
      }
    });
    this.elements.add(tiny ? [district, missionTitle, button] : [district, missionTitle, help, button]);

    const score = this.add.text(centerX, height - 26, `BEST SIGNAL  ${SaveManager.getBestScore().toLocaleString()}   ·   ${unlocked > 0 ? 'NEXT DISTRICT UNLOCKED' : 'KAI + ECHO / OLD MARKET'}`, {
      fontFamily: 'Space Mono, monospace', fontSize: small ? '8px' : '10px', color: '#6d8b9d', letterSpacing: 1
    }).setOrigin(0.5);
    if (!tiny) this.elements.add(score);
  }

  addBackdrop(container, width, height) {
    const back = this.add.tileSprite(0, 0, width, height, 'city-back').setOrigin(0, 0).setAlpha(0.95);
    const middle = this.add.tileSprite(0, height * 0.24, width, height * 0.76, 'city-middle').setOrigin(0, 0).setAlpha(0.82);
    const foreground = this.add.tileSprite(0, height * 0.48, width, height * 0.56, 'city-foreground').setOrigin(0, 0).setAlpha(0.9);
    container.add([back, middle, foreground]);
    const glow = this.add.circle(width / 2, height * 0.18, Math.min(width, height) * 0.31, COLORS.cyan, 0.045);
    container.add(glow);
  }

  drawPulses(container, x, y) {
    const line = this.add.graphics();
    line.lineStyle(2, COLORS.cyan, 0.8);
    line.beginPath(); line.moveTo(x - 84, y); line.lineTo(x - 28, y); line.lineTo(x - 12, y - 9);
    line.lineTo(x + 5, y + 10); line.lineTo(x + 22, y); line.lineTo(x + 84, y); line.strokePath();
    container.add(line);
  }

  panel(container, x, y, width, height) {
    const graphic = this.add.graphics();
    graphic.fillStyle(0x102638, 0.94);
    graphic.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    graphic.lineStyle(1, COLORS.cyan, 0.38);
    graphic.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    graphic.lineStyle(3, COLORS.amber, 0.9);
    graphic.beginPath(); graphic.moveTo(x - width / 2 + 18, y - height / 2); graphic.lineTo(x - width / 2 + 64, y - height / 2); graphic.strokePath();
    container.add(graphic);
  }

  makeButton(x, y, width, label, color, callback) {
    const button = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.14); bg.fillRoundedRect(-width / 2, -21, width, 42, 6);
    bg.lineStyle(1, color, 0.9); bg.strokeRoundedRect(-width / 2, -21, width, 42, 6);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Space Mono, monospace', fontSize: '11px', fontStyle: 'bold', color: '#e7f7ff', letterSpacing: 1
    }).setOrigin(0.5);
    const hit = this.add.zone(0, 0, width, 48).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => bg.setAlpha(1.8));
    hit.on('pointerout', () => bg.setAlpha(1));
    hit.on('pointerup', callback);
    button.add([bg, text, hit]);
    return button;
  }
}
