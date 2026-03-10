// ============================================================
// 光路工坊 - 常量定义
// ============================================================

// roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        const [tl, tr, br, bl] = r;
        this.moveTo(x + tl, y);
        this.lineTo(x + w - tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + tr);
        this.lineTo(x + w, y + h - br);
        this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
        this.lineTo(x + bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - bl);
        this.lineTo(x, y + tl);
        this.quadraticCurveTo(x, y, x + tl, y);
        this.closePath();
        return this;
    };
}

const GRID_COLS = 16;
const GRID_ROWS = 12;
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 720;
const CELL_SIZE = Math.min(CANVAS_WIDTH / GRID_COLS, CANVAS_HEIGHT / GRID_ROWS);
const GRID_OFFSET_X = (CANVAS_WIDTH - GRID_COLS * CELL_SIZE) / 2;
const GRID_OFFSET_Y = (CANVAS_HEIGHT - GRID_ROWS * CELL_SIZE) / 2;

// 游戏状态
const STATE = {
    MENU: 'MENU',
    LEVEL_SELECT: 'LEVEL_SELECT',
    PLANNING: 'PLANNING',
    WAVE_RUNNING: 'WAVE_RUNNING',
    BETWEEN_WAVES: 'BETWEEN_WAVES',
    WIN: 'WIN',
    LOSE: 'LOSE'
};

// 元素类型
const ELEMENT = {
    LASER_SOURCE: 'LASER_SOURCE',
    MIRROR: 'MIRROR',
    PRISM: 'PRISM',
    COLOR_FILTER: 'COLOR_FILTER',
    FOCUS_LENS: 'FOCUS_LENS',
    ENERGY_CRYSTAL: 'ENERGY_CRYSTAL'
};

// 地形类型
const TERRAIN = {
    EMPTY: 0,      // 可放置
    PATH: 1,       // 敌人路径（不可放置）
    BLOCKED: 2,    // 障碍（不可放置）
    ENTRANCE: 3,   // 入口
    EXIT: 4        // 出口
};

// 方向 (col, row) 增量
const DIR = {
    UP:    { dc: 0,  dr: -1 },
    RIGHT: { dc: 1,  dr: 0  },
    DOWN:  { dc: 0,  dr: 1  },
    LEFT:  { dc: -1, dr: 0  }
};

const DIR_LIST = [DIR.UP, DIR.RIGHT, DIR.DOWN, DIR.LEFT];
const DIR_NAMES = ['UP', 'RIGHT', 'DOWN', 'LEFT'];

// 颜色
const COLORS = {
    RED:     { r: 1, g: 0, b: 0 },
    GREEN:   { r: 0, g: 1, b: 0 },
    BLUE:    { r: 0, g: 0, b: 1 },
    YELLOW:  { r: 1, g: 1, b: 0 },
    MAGENTA: { r: 1, g: 0, b: 1 },
    CYAN:    { r: 0, g: 1, b: 1 },
    WHITE:   { r: 1, g: 1, b: 1 }
};

// 光束参数
const MAX_BOUNCES = 50;
const MIN_INTENSITY = 0.05;
const REFLECT_DECAY = 0.95;
const BEAM_DPS = 40;           // 每秒基础伤害

// 蓄能晶体参数
const CRYSTAL_MAX_CHARGE = 100;
const CRYSTAL_CHARGE_RATE = 30; // 每秒（强度1.0时）
const CRYSTAL_BLAST_RADIUS = 2.5; // 格子半径
const CRYSTAL_BLAST_DAMAGE = 150;

// 敌人类型
const ENEMY_TYPE = {
    BASIC: 'BASIC',
    FAST: 'FAST',
    ARMORED: 'ARMORED',
    COLOR_SHIELDED: 'COLOR_SHIELDED',
    SHADOW: 'SHADOW'
};

// 敌人属性表
const ENEMY_STATS = {
    BASIC:          { hp: 100, speed: 1.0, armor: 0, radius: 0.3 },
    FAST:           { hp: 60,  speed: 2.0, armor: 0, radius: 0.25 },
    ARMORED:        { hp: 300, speed: 0.6, armor: 5, radius: 0.35 },
    COLOR_SHIELDED: { hp: 150, speed: 0.8, armor: 0, radius: 0.3 },
    SHADOW:         { hp: 200, speed: 0.7, armor: 0, radius: 0.35 }
};

// 视觉颜色
const VISUAL = {
    BG: '#0a0a1a',
    GRID_LINE: 'rgba(30, 60, 90, 0.3)',
    PATH_COLOR: 'rgba(40, 20, 60, 0.6)',
    PATH_BORDER: 'rgba(80, 40, 120, 0.4)',
    ENTRANCE: '#44ff44',
    EXIT: '#ff4444',
    HIGHLIGHT_VALID: 'rgba(0, 255, 100, 0.3)',
    HIGHLIGHT_INVALID: 'rgba(255, 0, 50, 0.3)',
    HP_HIGH: '#44ff44',
    HP_MID: '#ffff00',
    HP_LOW: '#ff4444',
    UI_BG: 'rgba(10, 10, 30, 0.9)',
    UI_BORDER: 'rgba(60, 120, 200, 0.6)',
    UI_TEXT: '#aaccff',
    UI_HIGHLIGHT: '#44aaff'
};

// 工具函数：颜色转 CSS 字符串
function colorToCSS(c, alpha) {
    alpha = alpha !== undefined ? alpha : 1;
    return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}

function colorToHex(c) {
    const r = Math.round(c.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(c.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(c.b * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

function mixColors(colors) {
    const result = { r: 0, g: 0, b: 0 };
    for (const c of colors) {
        result.r = Math.min(1, result.r + c.r);
        result.g = Math.min(1, result.g + c.g);
        result.b = Math.min(1, result.b + c.b);
    }
    return result;
}

function colorsEqual(a, b) {
    return a.r === b.r && a.g === b.g && a.b === b.b;
}

function colorContains(beam, weakness) {
    return (beam.r >= weakness.r) && (beam.g >= weakness.g) && (beam.b >= weakness.b);
}

function colorOverlaps(a, b) {
    return (a.r > 0 && b.r > 0) || (a.g > 0 && b.g > 0) || (a.b > 0 && b.b > 0);
}

function getColorDamageMultiplier(beamColor, weakness) {
    if (!weakness) return 1.0;
    if (colorContains(beamColor, weakness)) return 2.0;
    if (beamColor.r === 1 && beamColor.g === 1 && beamColor.b === 1) return 1.0;
    if (!colorOverlaps(beamColor, weakness)) return 0.5;
    return 1.0;
}
