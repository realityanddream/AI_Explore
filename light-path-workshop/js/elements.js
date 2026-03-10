// ============================================================
// 光路工坊 - 光学元素定义
// ============================================================

// 元素工厂函数
function createElement(type, col, row, direction, color, extra) {
    switch (type) {
        case ELEMENT.LASER_SOURCE:
            return new LaserSource(col, row, direction, color);
        case ELEMENT.MIRROR:
            return new Mirror(col, row, (extra && extra.orientation) || '/');
        case ELEMENT.PRISM:
            return new Prism(col, row);
        case ELEMENT.COLOR_FILTER:
            return new ColorFilter(col, row, color || COLORS.RED);
        case ELEMENT.FOCUS_LENS:
            return new FocusLens(col, row, direction || 'RIGHT');
        case ELEMENT.ENERGY_CRYSTAL:
            return new EnergyCrystal(col, row);
        default:
            return null;
    }
}

// ---- 基类 ----
class Element {
    constructor(type, col, row) {
        this.type = type;
        this.col = col;
        this.row = row;
        this.preplaced = false;
    }

    rotate() {}

    onBeamHit(dirIn, color, intensity) {
        // 返回 { outputs: [{ dc, dr, color, intensity }], absorbed: false }
        return { outputs: [], absorbed: false };
    }
}

// ---- 激光源 ----
class LaserSource extends Element {
    constructor(col, row, direction, color) {
        super(ELEMENT.LASER_SOURCE, col, row);
        this.direction = direction || 'RIGHT';
        this.color = color || COLORS.RED;
    }

    getEmitDir() {
        return DIR[this.direction];
    }

    rotate() {
        const dirs = DIR_NAMES;
        const idx = dirs.indexOf(this.direction);
        this.direction = dirs[(idx + 1) % 4];
    }

    onBeamHit() {
        // 激光源不会被其他光束穿透，会阻挡
        return { outputs: [], absorbed: true };
    }
}

// ---- 反射镜 ----
class Mirror extends Element {
    constructor(col, row, orientation) {
        super(ELEMENT.MIRROR, col, row);
        this.orientation = orientation || '/'; // '/' 或 '\'
    }

    rotate() {
        this.orientation = this.orientation === '/' ? '\\' : '/';
    }

    onBeamHit(dirIn, color, intensity) {
        const dc = dirIn.dc;
        const dr = dirIn.dr;
        let outDc, outDr;

        if (this.orientation === '/') {
            // / 型：(1,0)→(0,-1), (-1,0)→(0,1), (0,1)→(-1,0), (0,-1)→(1,0)
            outDc = -dr;
            outDr = -dc;
        } else {
            // \ 型：(1,0)→(0,1), (-1,0)→(0,-1), (0,1)→(1,0), (0,-1)→(-1,0)
            outDc = dr;
            outDr = dc;
        }

        return {
            outputs: [{
                dc: outDc,
                dr: outDr,
                color: { ...color },
                intensity: intensity * REFLECT_DECAY
            }],
            absorbed: false
        };
    }
}

// ---- 棱镜 ----
class Prism extends Element {
    constructor(col, row) {
        super(ELEMENT.PRISM, col, row);
    }

    rotate() {} // 棱镜不需要旋转

    onBeamHit(dirIn, color, intensity) {
        const dc = dirIn.dc;
        const dr = dirIn.dr;
        const splitIntensity = intensity / 3;

        return {
            outputs: [
                // 直射
                { dc, dr, color: { ...color }, intensity: splitIntensity },
                // 左转 90°
                { dc: -dr, dr: dc, color: { ...color }, intensity: splitIntensity },
                // 右转 90°
                { dc: dr, dr: -dc, color: { ...color }, intensity: splitIntensity }
            ],
            absorbed: false
        };
    }
}

// ---- 染色滤镜 ----
class ColorFilter extends Element {
    constructor(col, row, filterColor) {
        super(ELEMENT.COLOR_FILTER, col, row);
        this.filterColor = filterColor || COLORS.RED;
    }

    rotate() {
        // 循环切换 R → G → B
        if (this.filterColor.r === 1 && this.filterColor.g === 0 && this.filterColor.b === 0) {
            this.filterColor = { ...COLORS.GREEN };
        } else if (this.filterColor.r === 0 && this.filterColor.g === 1 && this.filterColor.b === 0) {
            this.filterColor = { ...COLORS.BLUE };
        } else {
            this.filterColor = { ...COLORS.RED };
        }
    }

    onBeamHit(dirIn, color, intensity) {
        // 滤镜将输入颜色替换为滤镜颜色（保留强度）
        return {
            outputs: [{
                dc: dirIn.dc,
                dr: dirIn.dr,
                color: { ...this.filterColor },
                intensity: intensity
            }],
            absorbed: false
        };
    }
}

// ---- 聚焦透镜 ----
class FocusLens extends Element {
    constructor(col, row, direction) {
        super(ELEMENT.FOCUS_LENS, col, row);
        this.direction = direction || 'RIGHT';
        this.inputBuffer = [];
    }

    getOutputDir() {
        return DIR[this.direction];
    }

    rotate() {
        const dirs = DIR_NAMES;
        const idx = dirs.indexOf(this.direction);
        this.direction = dirs[(idx + 1) % 4];
    }

    clearBuffer() {
        this.inputBuffer = [];
    }

    onBeamHit(dirIn, color, intensity) {
        // 存入缓冲区，不立即输出
        this.inputBuffer.push({ color: { ...color }, intensity });
        return { outputs: [], absorbed: true };
    }

    getOutput() {
        if (this.inputBuffer.length === 0) return null;
        const colors = this.inputBuffer.map(b => b.color);
        const totalIntensity = Math.min(2.0, this.inputBuffer.reduce((s, b) => s + b.intensity, 0));
        const mixed = mixColors(colors);
        const dir = this.getOutputDir();
        return {
            dc: dir.dc,
            dr: dir.dr,
            color: mixed,
            intensity: totalIntensity
        };
    }
}

// ---- 蓄能晶体 ----
class EnergyCrystal extends Element {
    constructor(col, row) {
        super(ELEMENT.ENERGY_CRYSTAL, col, row);
        this.chargeLevel = 0;
        this.maxCharge = CRYSTAL_MAX_CHARGE;
        this.blastRadius = CRYSTAL_BLAST_RADIUS;
        this.blastDamage = CRYSTAL_BLAST_DAMAGE;
        this.isCharging = false;
        this.justBlasted = false;
    }

    rotate() {} // 不需要旋转

    onBeamHit(dirIn, color, intensity) {
        this.isCharging = true;
        // 不产生输出，光束被吸收
        return { outputs: [], absorbed: true, charging: true, intensity };
    }

    addEnergy(amount) {
        this.chargeLevel = Math.min(this.maxCharge, this.chargeLevel + amount);
    }

    isFullyCharged() {
        return this.chargeLevel >= this.maxCharge;
    }

    blast() {
        this.chargeLevel = 0;
        this.justBlasted = true;
    }

    getChargePercent() {
        return this.chargeLevel / this.maxCharge;
    }
}
