import Phaser from 'phaser';

const SIZE = 8;

export const SHAPES = [
  { name: 'single', cells: [[0, 0]] },
  { name: 'double', cells: [[0, 0], [1, 0]] },
  { name: 'square', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  { name: 'line3', cells: [[0, 0], [1, 0], [2, 0]] },
  { name: 'line4', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { name: 'line5', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
  { name: 'corner', cells: [[0, 0], [1, 0], [2, 0], [0, 1]] },
  { name: 'L', cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { name: 'T', cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  { name: 'zigzag', cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { name: 'zag', cells: [[0, 1], [1, 1], [1, 0], [2, 0]] },
  { name: 'miniL', cells: [[0, 0], [0, 1], [1, 1]] },
  { name: 'miniJ', cells: [[1, 0], [1, 1], [0, 1]] },
  { name: 'threeBlock', cells: [[0, 0], [0, 1], [1, 0]] },
  { name: 'bar2x3', cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]] },
  { name: 'plus', cells: [[0, 1], [1, 0], [1, 1], [2, 1], [1, 2]] }
];

export default class PuzzleManager {
  constructor(state = null) {
    this.board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    this.score = 0;
    this.combo = 0;
    this.pieces = [];
    if (state && this.isValidState(state)) {
      this.board = state.board.map(row => [...row]);
      this.score = state.score;
      this.combo = state.combo;
      this.pieces = state.pieces.map(piece => piece);
    } else {
      this.refill();
    }
  }

  isValidState(state) {
    return Array.isArray(state.board) && state.board.length === SIZE
      && state.board.every(row => Array.isArray(row) && row.length === SIZE && row.every(cell => cell === 0 || cell === 1))
      && Array.isArray(state.pieces) && state.pieces.length === 3
      && state.pieces.every(index => Number.isInteger(index) && index >= -1 && index < SHAPES.length)
      && Number.isFinite(state.score) && Number.isInteger(state.combo);
  }

  refill() {
    const bag = [...Array(SHAPES.length).keys()];
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Phaser.Math.Between(0, i);
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.pieces = Array.from({ length: 3 }, (_, index) => bag[index % bag.length]);
  }

  canPlace(shapeIndex, col, row) {
    const shape = SHAPES[shapeIndex];
    if (!shape) return false;
    return shape.cells.every(([dx, dy]) => {
      const x = col + dx;
      const y = row + dy;
      return x >= 0 && x < SIZE && y >= 0 && y < SIZE && this.board[y][x] === 0;
    });
  }

  hasAnyMove() {
    return this.pieces.some(shapeIndex => shapeIndex >= 0 && this.canFitSomewhere(shapeIndex));
  }

  canFitSomewhere(shapeIndex) {
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (this.canPlace(shapeIndex, col, row)) return true;
      }
    }
    return false;
  }

  place(pieceSlot, col, row) {
    if (!Number.isInteger(pieceSlot) || pieceSlot < 0 || pieceSlot >= this.pieces.length) return null;
    const shapeIndex = this.pieces[pieceSlot];
    const shape = SHAPES[shapeIndex];
    if (!this.canPlace(shapeIndex, col, row)) return null;

    shape.cells.forEach(([dx, dy]) => { this.board[row + dy][col + dx] = 1; });
    this.score += shape.cells.length * 10;

    const rows = this.board.map((line, index) => line.every(Boolean) ? index : -1).filter(index => index >= 0);
    const columns = Array.from({ length: SIZE }, (_, colIndex) =>
      this.board.every(line => line[colIndex] === 1) ? colIndex : -1
    ).filter(index => index >= 0);
    const clears = rows.length + columns.length;
    if (clears > 0) {
      const cleared = new Set();
      rows.forEach(y => { for (let x = 0; x < SIZE; x += 1) cleared.add(`${x},${y}`); });
      columns.forEach(x => { for (let y = 0; y < SIZE; y += 1) cleared.add(`${x},${y}`); });
      cleared.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        this.board[y][x] = 0;
      });
      this.combo += 1;
      this.score += clears * 100 + clears * this.combo * 25;
    } else {
      this.combo = 0;
    }

    this.pieces[pieceSlot] = -1;
    if (this.pieces.every(piece => piece === -1)) this.refill();
    return { clears, lines: clears, shapeIndex, gameOver: !this.hasAnyMove() };
  }

  exportState() {
    return {
      board: this.board.map(row => [...row]),
      score: this.score,
      combo: this.combo,
      pieces: [...this.pieces]
    };
  }
}
