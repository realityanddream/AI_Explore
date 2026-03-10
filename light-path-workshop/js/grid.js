// ============================================================
// 光路工坊 - 网格系统
// ============================================================

class Grid {
    constructor(cols, rows) {
        this.cols = cols || GRID_COLS;
        this.rows = rows || GRID_ROWS;
        this.cells = [];
        this.enemyPaths = []; // 支持多条路径
        this.entrance = null;
        this.exit = null;
        this.clear();
    }

    clear() {
        this.cells = [];
        for (let r = 0; r < this.rows; r++) {
            this.cells[r] = [];
            for (let c = 0; c < this.cols; c++) {
                this.cells[r][c] = {
                    terrain: TERRAIN.EMPTY,
                    element: null
                };
            }
        }
    }

    initFromLevel(levelData) {
        this.cols = levelData.gridSize.cols;
        this.rows = levelData.gridSize.rows;
        this.clear();

        // 设置地形
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const t = levelData.terrain[r][c];
                this.cells[r][c].terrain = t;
                if (t === TERRAIN.ENTRANCE) this.entrance = { col: c, row: r };
                if (t === TERRAIN.EXIT) this.exit = { col: c, row: r };
            }
        }

        // 设置敌人路径（支持多条）
        const rawPaths = levelData.enemyPaths || [levelData.enemyPath];
        this.enemyPaths = rawPaths.map(path =>
            path.map(p => ({
                col: p.col,
                row: p.row,
                x: GRID_OFFSET_X + (p.col + 0.5) * CELL_SIZE,
                y: GRID_OFFSET_Y + (p.row + 0.5) * CELL_SIZE
            }))
        );

        // 放置预置元素
        for (const ep of levelData.preplacedElements) {
            const el = createElement(ep.type, ep.col, ep.row, ep.direction, ep.color, ep);
            el.preplaced = true;
            this.cells[ep.row][ep.col].element = el;
        }
    }

    inBounds(col, row) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    pixelToGrid(px, py) {
        const col = Math.floor((px - GRID_OFFSET_X) / CELL_SIZE);
        const row = Math.floor((py - GRID_OFFSET_Y) / CELL_SIZE);
        return { col, row };
    }

    gridToPixel(col, row) {
        return {
            x: GRID_OFFSET_X + (col + 0.5) * CELL_SIZE,
            y: GRID_OFFSET_Y + (row + 0.5) * CELL_SIZE
        };
    }

    canPlace(col, row) {
        if (!this.inBounds(col, row)) return false;
        const cell = this.cells[row][col];
        if (cell.terrain !== TERRAIN.EMPTY) return false;
        if (cell.element) return false;
        return true;
    }

    placeElement(col, row, element) {
        if (!this.canPlace(col, row)) return false;
        element.col = col;
        element.row = row;
        this.cells[row][col].element = element;
        return true;
    }

    removeElement(col, row) {
        if (!this.inBounds(col, row)) return null;
        const cell = this.cells[row][col];
        if (!cell.element || cell.element.preplaced) return null;
        const el = cell.element;
        cell.element = null;
        return el;
    }

    getElementAt(col, row) {
        if (!this.inBounds(col, row)) return null;
        return this.cells[row][col].element;
    }

    rotateElementAt(col, row) {
        const el = this.getElementAt(col, row);
        if (el && el.rotate) {
            el.rotate();
            return true;
        }
        return false;
    }

    getAllElements() {
        const elements = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.cells[r][c].element) {
                    elements.push(this.cells[r][c].element);
                }
            }
        }
        return elements;
    }

    getElementsByType(type) {
        return this.getAllElements().filter(e => e.type === type);
    }
}
