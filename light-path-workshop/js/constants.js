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
    PAUSED: 'PAUSED',
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
    EMPTY: 0,
    PATH: 1,
    BLOCKED: 2,
    ENTRANCE: 3,
    EXIT: 4
};

// 方向
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

// ---- 光束参数 ----
const MAX_BOUNCES = 50;
const MIN_INTENSITY = 0.05;
const BEAM_DPS = 40;

// ---- 能量系统 ----
const ENERGY_PASSIVE_RATE = 2.5;   // 每秒被动恢复
const SELL_REFUND_RATE = 0.5;      // 卖出返还比例(按总投入)

// ---- 元素成本 & 升级表 ----
// cost: 购买成本, upgrades: [Lv2成本, Lv3成本]
const ELEMENT_DATA = {
    LASER_SOURCE: {
        cost: 50,
        upgrades: [40, 60],
        name: '激光源',
        icon: '▶',
        desc: [
            '持续发射光束，是唯一的伤害来源',
            '强度提升至 1.5',
            '强度提升至 2.0，可切换颜色'
        ]
    },
    MIRROR: {
        cost: 15,
        upgrades: [15, 25],
        name: '反射镜',
        icon: '⟋',
        desc: [
            '将光束反射 90°，衰减 ×0.95',
            '无损反射，衰减 ×1.0',
            '增益反射，衰减 ×1.1'
        ]
    },
    PRISM: {
        cost: 30,
        upgrades: [25, 35],
        name: '棱镜',
        icon: '△',
        desc: [
            '将光束分裂为 3 条，强度各 ÷3',
            '衰减减少，强度各 ÷2.5',
            '分裂为 5 条，强度各 ÷4'
        ]
    },
    COLOR_FILTER: {
        cost: 20,
        upgrades: [20, 30],
        name: '染色滤镜',
        icon: '◉',
        desc: [
            '替换光束颜色为滤镜色(R/G/B)',
            '叠加模式：输入色 + 滤镜色混合',
            '叠加 + 穿透：原色光束继续直行'
        ]
    },
    FOCUS_LENS: {
        cost: 35,
        upgrades: [30, 45],
        name: '聚焦透镜',
        icon: '◎',
        desc: [
            '合并多条光束，强度上限 2.0',
            '上限 3.0，伤害 +20%',
            '上限 4.0，可穿透暗影敌人'
        ]
    },
    ENERGY_CRYSTAL: {
        cost: 40,
        upgrades: [30, 40],
        name: '蓄能晶体',
        icon: '⬡',
        desc: [
            '吸收光束充能，点击引爆或产能',
            '充能/爆伤/产能 +50%',
            '爆炸半径扩大，附加 2 秒减速'
        ]
    }
};

// 计算元素总投入(购买+已升级成本)
function getElementTotalCost(type, level) {
    const data = ELEMENT_DATA[type];
    let total = data.cost;
    for (let i = 0; i < level - 1 && i < data.upgrades.length; i++) {
        total += data.upgrades[i];
    }
    return total;
}

function getUpgradeCost(type, currentLevel) {
    const data = ELEMENT_DATA[type];
    if (currentLevel >= 3 || currentLevel - 1 >= data.upgrades.length) return -1;
    return data.upgrades[currentLevel - 1];
}

// ---- 蓄能晶体参数 ----
const CRYSTAL_MAX_CHARGE = 100;
const CRYSTAL_CHARGE_RATE = 30;
const CRYSTAL_BLAST_RADIUS = 2.5;
const CRYSTAL_BLAST_DAMAGE = 150;
const CRYSTAL_ENERGY_YIELD = 30;  // 产能模式每次满充产出的能量

// ---- 敌人类型 ----
const ENEMY_TYPE = {
    BASIC: 'BASIC',
    FAST: 'FAST',
    ARMORED: 'ARMORED',
    COLOR_SHIELDED: 'COLOR_SHIELDED',
    SHADOW: 'SHADOW'
};

// 敌人属性表(加入击杀奖励)
const ENEMY_STATS = {
    BASIC:          { hp: 100, speed: 1.0, armor: 0, radius: 0.3, reward: 10 },
    FAST:           { hp: 60,  speed: 2.0, armor: 0, radius: 0.25, reward: 8 },
    ARMORED:        { hp: 300, speed: 0.6, armor: 5, radius: 0.35, reward: 25 },
    COLOR_SHIELDED: { hp: 150, speed: 0.8, armor: 0, radius: 0.3, reward: 15 },
    SHADOW:         { hp: 200, speed: 0.7, armor: 0, radius: 0.35, reward: 20 }
};

// ---- 视觉颜色 ----
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

// ---- 工具函数 ----
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

function colorName(c) {
    if (c.r && !c.g && !c.b) return '红';
    if (!c.r && c.g && !c.b) return '绿';
    if (!c.r && !c.g && c.b) return '蓝';
    if (c.r && c.g && !c.b) return '黄';
    if (c.r && !c.g && c.b) return '品红';
    if (!c.r && c.g && c.b) return '青';
    if (c.r && c.g && c.b) return '白';
    return '无';
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
