import Phaser from 'phaser';
import PuzzleManager, { SHAPES } from '../systems/PuzzleManager.js';
import SaveManager from '../systems/SaveManager.js';
import { missions } from '../data/missions.js';

const COLORS = {
  bg: 0x07111f, panel: 0x102638, grid: 0x17344a, cyan: 0x56e6ef,
  purple: 0xb792ff, amber: 0xffbd62, text: 0xe7f7ff, muted: 0x91aebd,
  filled: 0x28b8ca, danger: 0xff777f
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.missionIndex = data.missionIndex ?? 0;
    this.mission = missions[this.missionIndex] ?? missions[0];
    this.energy = 0;
    this.selectedPiece = -1;
    this.dragging = false;
    this.paused = false;
    this.gameOver = false;
    this.missionComplete = false;
  }

  create() {
    const saved = SaveManager.getSession(this.mission.id);
    if (saved && Number.isFinite(saved.energy) && saved.energy < this.mission.targetEnergy) {
      this.manager = new PuzzleManager(saved.puzzle);
      this.energy = saved.energy;
    } else {
      this.manager = new PuzzleManager();
    }
    this.gameOver = !this.manager.hasAnyMove();
    this.elements = this.add.container(0, 0);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.draw();
    this.scale.on('resize', this.draw, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.draw, this);
      this.input.off('pointermove', this.onPointerMove, this);
      this.input.off('pointerup', this.onPointerUp, this);
    });
  }

  draw() {
    if (this.elements) this.elements.destroy(true);
    this.elements = this.add.container(0, 0);
    const { width, height } = this.scale;
    const compact = width < 650;
    const tiny = height < 420;
    this.drawBackground(width, height);

    const top = tiny ? 9 : compact ? 22 : 26;
    this.addText(22, top, 'ECHOES / GRID', 17, '#56e6ef', 'bold', 'Space Mono, monospace');
    this.addText(22, top + (tiny ? 18 : 23), this.mission.district, 9, '#91aebd', 'normal', 'Space Mono, monospace');
    const actionWidth = compact ? 62 : 76;
    this.addButton(width - actionWidth - 18, top + 13, actionWidth, 'PAUSE', () => this.togglePause(), true);
    this.addButton(width - actionWidth * 2 - 26, top + 13, actionWidth, 'RESTART', () => this.restart(), false);

    this.layout = this.calculateLayout(width, height, compact, tiny);
    this.drawStats(compact, tiny);
    this.drawBoard();
    this.drawTray(tiny);
    if (!tiny) this.drawFooter(compact, height);
    if (this.paused) this.drawOverlay('SYSTEM PAUSED', 'Take a breath. Your district is safe.', 'RESUME', () => this.togglePause());
    if (this.gameOver) this.drawOverlay('NO ROUTE FOUND', 'No remaining block fits. Restart to try this district again.', 'RESTART PUZZLE', () => this.restart());
    if (this.missionComplete) this.drawOverlay('DISTRICT RESTORED', 'The relay is alive. A memory is coming back...', 'CONTINUE STORY', () => {
      SaveManager.clearSession(this.mission.id);
      this.scene.start('StoryScene', { mode: 'complete', missionIndex: this.missionIndex });
    });
  }

  calculateLayout(width, height, compact, tiny) {
    const boardSize = this.manager.board.length;
    const topSpace = tiny ? 96 : compact ? 132 : 116;
    const footerSpace = tiny ? 112 : compact ? 145 : 204;
    const maxTile = compact ? 44 : 32;
    const tile = Math.max(tiny ? 10 : 16, Math.floor(Math.min(
      (width - 32) / boardSize,
      (height - topSpace - footerSpace) / boardSize,
      maxTile
    )));
    const boardY = tiny
      ? topSpace
      : Math.max(topSpace, Math.round(topSpace + (height - topSpace - footerSpace - tile * boardSize) / 2));
    return { tile, boardX: Math.round((width - tile * boardSize) / 2), boardY };
  }

  drawBackground(width, height) {
    const graphic = this.add.graphics();
    graphic.fillGradientStyle(0x0b1d2d, COLORS.bg, 0x0b1d2d, COLORS.bg, 1);
    graphic.fillRect(0, 0, width, height);
    graphic.lineStyle(1, COLORS.cyan, 0.035);
    for (let y = 24; y < height; y += 44) { graphic.beginPath(); graphic.moveTo(0, y); graphic.lineTo(width, y); graphic.strokePath(); }
    this.elements.add(graphic);
  }

  drawStats(compact, tiny) {
    const { width } = this.scale;
    const y = tiny ? 45 : compact ? 72 : 75;
    const score = this.addText(22, y, `SIGNAL  ${this.manager.score.toLocaleString()}`, compact ? 12 : 14, '#e7f7ff', 'bold', 'Space Mono, monospace');
    const best = this.addText(width - 22, y, `BEST  ${Math.max(SaveManager.getBestScore(), this.manager.score).toLocaleString()}`, compact ? 10 : 12, '#91aebd', 'normal', 'Space Mono, monospace');
    best.setOrigin(1, 0);
    const energyY = tiny ? 64 : compact ? 93 : 101;
    const barW = width - 44;
    this.addText(22, energyY, 'DISTRICT ENERGY', 9, '#ffbd62', 'normal', 'Space Mono, monospace');
    this.addText(width - 22, energyY, `${this.energy}%`, 10, '#ffbd62', 'bold', 'Space Mono, monospace').setOrigin(1, 0);
    const bar = this.add.graphics();
    bar.fillStyle(0x142c3c, 1); bar.fillRoundedRect(22, energyY + 17, barW, 7, 3);
    bar.fillStyle(COLORS.amber, 1); bar.fillRoundedRect(22, energyY + 17, Math.max(3, barW * this.energy / this.mission.targetEnergy), 7, 3);
    this.elements.add(bar);
    this.statLabels = [score, best];
  }

  drawBoard() {
    const { tile, boardX, boardY } = this.layout;
    const boardSize = this.manager.board.length;
    const bg = this.add.graphics();
    bg.fillStyle(0x0b1c2b, 0.98); bg.fillRoundedRect(boardX - 4, boardY - 4, tile * boardSize + 8, tile * boardSize + 8, 7);
    bg.lineStyle(1, COLORS.cyan, 0.23); bg.strokeRoundedRect(boardX - 4, boardY - 4, tile * boardSize + 8, tile * boardSize + 8, 7);
    this.elements.add(bg);
    this.cells = [];
    const cellGraphics = this.add.graphics();
    for (let row = 0; row < boardSize; row += 1) {
      this.cells[row] = [];
      for (let col = 0; col < boardSize; col += 1) {
        const x = boardX + col * tile;
        const y = boardY + row * tile;
        cellGraphics.fillStyle(this.manager.board[row][col] ? COLORS.filled : COLORS.grid, this.manager.board[row][col] ? 0.95 : 0.48);
        cellGraphics.fillRoundedRect(x + 1, y + 1, tile - 2, tile - 2, 3);
        if (this.manager.board[row][col]) {
          cellGraphics.lineStyle(1, COLORS.cyan, 0.75); cellGraphics.strokeRoundedRect(x + 2, y + 2, tile - 4, tile - 4, 3);
        }
        this.cells[row][col] = { x, y };
      }
    }
    this.elements.add(cellGraphics);
    this.boardZone = this.add.zone(boardX + tile * (boardSize / 2), boardY + tile * (boardSize / 2), tile * boardSize, tile * boardSize).setInteractive();
    this.boardZone.on('pointerdown', pointer => {
      if (this.selectedPiece >= 0 && !this.paused && !this.gameOver && !this.missionComplete) this.tryPlacementAt(pointer.x, pointer.y);
    });
    this.elements.add(this.boardZone);
    this.previewGraphic = this.add.graphics();
    this.elements.add(this.previewGraphic);
  }

  drawTray(tiny) {
    const { width } = this.scale;
    const compact = width < 650;
    const trayY = this.layout.boardY + this.layout.tile * this.manager.board.length + (tiny ? 4 : compact ? 22 : 39);
    const groupWidth = Math.min(width - 28, 516);
    const instruction = this.selectedPiece >= 0
      ? `CHARGE ${this.selectedPiece + 1} SELECTED  /  TAP A CELL`
      : 'TAP A PIECE, THEN TAP A CELL';
    this.addText(width / 2, trayY - (tiny ? 13 : 15), instruction, compact ? 9 : 9, this.selectedPiece >= 0 ? '#56e6ef' : '#91aebd', 'bold', 'Space Mono, monospace').setOrigin(0.5, 0);
    this.pieceHits = [];
    const cellSize = tiny ? 12 : compact ? Math.min(23, Math.floor((groupWidth / 3 - 16) / 5)) : 20;
    for (let i = 0; i < 3; i += 1) {
      const slotW = groupWidth / 3;
      const centerX = width / 2 - groupWidth / 2 + slotW * (i + 0.5);
      const centerY = trayY + (tiny ? 28 : compact ? 52 : 50);
      const available = this.manager.pieces[i] >= 0;
      const selected = this.selectedPiece === i;
      const panel = this.add.graphics();
      panel.fillStyle(selected ? 0x153d4d : COLORS.panel, selected ? 0.95 : 0.72);
      const panelHeight = tiny ? 58 : compact ? 88 : 82;
      const panelTop = tiny ? 25 : compact ? 40 : 30;
      panel.fillRoundedRect(centerX - slotW / 2 + 3, centerY - panelTop, slotW - 6, panelHeight, 6);
      panel.lineStyle(1, selected ? COLORS.cyan : COLORS.grid, selected ? 0.85 : 0.8);
      panel.strokeRoundedRect(centerX - slotW / 2 + 3, centerY - panelTop, slotW - 6, panelHeight, 6);
      this.elements.add(panel);
      if (available) {
        const shape = SHAPES[this.manager.pieces[i]];
        const shapeW = (Math.max(...shape.cells.map(([x]) => x)) + 1) * cellSize;
        const shapeH = (Math.max(...shape.cells.map(([, y]) => y)) + 1) * cellSize;
        const originX = centerX - shapeW / 2;
        const originY = centerY - shapeH / 2 + 2;
        const pieceGraphic = this.add.graphics();
        shape.cells.forEach(([dx, dy]) => {
          pieceGraphic.fillStyle(selected ? COLORS.amber : COLORS.purple, 0.95);
          pieceGraphic.fillRoundedRect(originX + dx * cellSize + 1, originY + dy * cellSize + 1, cellSize - 3, cellSize - 3, 3);
        });
        this.elements.add(pieceGraphic);
        const hit = this.add.zone(centerX, centerY + 5, slotW - 8, tiny ? 56 : compact ? 92 : 80).setInteractive({ useHandCursor: true });
        hit.on('pointerup', () => {
          if (this.paused || this.gameOver || this.missionComplete) return;
          this.selectedPiece = this.selectedPiece === i ? -1 : i;
          this.draw();
        });
        this.pieceHits[i] = hit;
        this.elements.add(hit);
      }
    }
  }

  drawFooter(compact, height) {
    const hint = this.addText(this.scale.width / 2, height - 15, compact ? 'LINES RESTORE THE DISTRICT  ·  ◆ CLEAR MORE FOR A COMBO' : 'COMPLETE ROWS OR COLUMNS TO RESTORE POWER  ·  CLEAR MULTIPLE LINES FOR COMBO SIGNAL', compact ? 7 : 9, '#5f7c8d', 'normal', 'Space Mono, monospace').setOrigin(0.5, 1);
    this.elements.add(hint);
  }

  addText(x, y, text, size, color, style = 'normal', font = 'Rajdhani, sans-serif') {
    const object = this.add.text(x, y, text, { fontFamily: font, fontSize: `${size}px`, color, fontStyle: style });
    this.elements.add(object);
    return object;
  }

  addButton(x, y, width, label, callback, primary) {
    const container = this.add.container(x, y);
    const color = primary ? COLORS.cyan : COLORS.amber;
    const graphic = this.add.graphics();
    graphic.fillStyle(color, 0.12); graphic.fillRoundedRect(-width / 2, -15, width, 30, 4);
    graphic.lineStyle(1, color, 0.72); graphic.strokeRoundedRect(-width / 2, -15, width, 30, 4);
    const text = this.add.text(0, 0, label, { fontFamily: 'Space Mono, monospace', fontSize: '8px', color: '#d9edf4' }).setOrigin(0.5);
    const zone = this.add.zone(0, 0, width, 34).setInteractive({ useHandCursor: true });
    zone.on('pointerup', callback);
    container.add([graphic, text, zone]);
    this.elements.add(container);
    return container;
  }

  onPointerMove(pointer) {
    if (this.selectedPiece < 0 || this.paused || this.gameOver || this.missionComplete || !this.previewGraphic) return;
    const { boardX, boardY, tile } = this.layout;
    const boardSize = this.manager.board.length;
    const col = Math.floor((pointer.x - boardX) / tile);
    const row = Math.floor((pointer.y - boardY) / tile);
    if (col < 0 || row < 0 || col >= boardSize || row >= boardSize) {
      this.previewGraphic.clear();
      return;
    }
    this.previewGraphic.clear();
    const shape = SHAPES[this.manager.pieces[this.selectedPiece]];
    if (!shape) return;
    const valid = this.manager.canPlace(this.manager.pieces[this.selectedPiece], col, row);
    this.previewGraphic.fillStyle(valid ? COLORS.cyan : COLORS.danger, valid ? 0.35 : 0.4);
    shape.cells.forEach(([dx, dy]) => {
      const x = boardX + (col + dx) * tile;
      const y = boardY + (row + dy) * tile;
      if (x >= boardX && y >= boardY && x < boardX + tile * boardSize && y < boardY + tile * boardSize) {
        this.previewGraphic.fillRoundedRect(x + 2, y + 2, tile - 4, tile - 4, 3);
      }
    });
  }

  onPointerUp(pointer) {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.isInsideBoard(pointer.x, pointer.y)) this.tryPlacementAt(pointer.x, pointer.y);
  }

  isInsideBoard(x, y) {
    const { boardX, boardY, tile } = this.layout;
    const boardSize = this.manager.board.length;
    return x >= boardX && y >= boardY && x < boardX + tile * boardSize && y < boardY + tile * boardSize;
  }

  tryPlacementAt(x, y) {
    if (this.paused || this.gameOver || this.missionComplete || this.selectedPiece < 0 || !this.isInsideBoard(x, y)) return;
    const { boardX, boardY, tile } = this.layout;
    const boardSize = this.manager.board.length;
    const col = Math.floor((x - boardX) / tile);
    const row = Math.floor((y - boardY) / tile);
    if (col < 0 || row < 0 || col >= boardSize || row >= boardSize) return;
    const result = this.manager.place(this.selectedPiece, col, row);
    if (!result) {
      this.cameras.main.shake(80, 0.002);
      return;
    }
    if (result.clears) this.energy = Math.min(this.mission.targetEnergy, this.energy + result.clears * this.mission.energyPerLine);
    this.selectedPiece = -1;
    this.missionComplete = this.energy >= this.mission.targetEnergy;
    this.gameOver = !this.missionComplete && !this.manager.hasAnyMove();
    SaveManager.saveSession(this.mission.id, { puzzle: this.manager.exportState(), energy: this.energy }, this.manager.score);
    this.draw();
  }

  togglePause() {
    if (this.gameOver || this.missionComplete) return;
    this.paused = !this.paused;
    this.draw();
  }

  restart() {
    SaveManager.clearSession(this.mission.id);
    this.manager = new PuzzleManager();
    this.energy = 0;
    this.selectedPiece = -1;
    this.paused = false;
    this.gameOver = false;
    this.missionComplete = false;
    this.draw();
  }

  drawOverlay(titleText, bodyText, buttonText, callback) {
    const { width, height } = this.scale;
    const graphic = this.add.graphics();
    graphic.fillStyle(COLORS.bg, 0.84); graphic.fillRect(0, 0, width, height);
    graphic.fillStyle(COLORS.panel, 1); graphic.fillRoundedRect(width / 2 - Math.min(width - 40, 390) / 2, height / 2 - 105, Math.min(width - 40, 390), 210, 10);
    graphic.lineStyle(1, this.gameOver ? COLORS.danger : COLORS.cyan, 0.85);
    graphic.strokeRoundedRect(width / 2 - Math.min(width - 40, 390) / 2, height / 2 - 105, Math.min(width - 40, 390), 210, 10);
    this.elements.add(graphic);
    const title = this.addText(width / 2, height / 2 - 52, titleText, 22, this.gameOver ? '#ff777f' : '#56e6ef', 'bold').setOrigin(0.5);
    const body = this.addText(width / 2, height / 2 - 8, bodyText, 14, '#bfd5df').setOrigin(0.5);
    body.setWordWrapWidth(Math.min(width - 68, 340), true);
    const button = this.addButton(width / 2, height / 2 + 53, Math.min(width - 70, 230), buttonText, callback, true);
    this.elements.bringToTop(title); this.elements.bringToTop(body); this.elements.bringToTop(button);
  }
}
