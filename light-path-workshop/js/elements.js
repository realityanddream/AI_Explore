// ============================================================
// 光路工坊 - 光学元素定义（含升级系统）
// ============================================================

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
        this.level = 1;
        this.preplaced = false;
    }

    canUpgrade() {
        return this.level < 3;
    }

    getUpgradeCost() {
        return getUpgradeCost(this.type, this.level);
    }

    getTotalInvested() {
        return getElementTotalCost(this.type, this.level);
    }

    getSellValue() {
        return Math.floor(this.getTotalInvested() * SELL_REFUND_RATE);
    }

    upgrade() {
        if (this.canUpgrade()) {
            this.level++;
            return true;
        }
        return false;
    }

    rotate() {}

    onBeamHit(dirIn, color, intensity) {
        return { outputs: [], absorbed: false };
    }
}

// ---- 激光源 ----
class LaserSource extends Element {
    constructor(col, row, direction, color) {
        super(ELEMENT.LASER_SOURCE, col, row);
        this.direction = direction || 'RIGHT';
        this.color = color ? { ...color } : { ...COLORS.RED };
    }

    getEmitDir() { return DIR[this.direction]; }

    getIntensity() {
        if (this.level === 1) return 1.0;
        if (this.level === 2) return 1.5;
        return 2.0;
    }

    rotate() {
        if (this.level >= 3) {
            // Lv3: 右键循环切换颜色
            if (this.color.r && !this.color.g && !this.color.b) {
                this.color = { ...COLORS.GREEN };
            } else if (!this.color.r && this.color.g && !this.color.b) {
                this.color = { ...COLORS.BLUE };
            } else {
                this.color = { ...COLORS.RED };
            }
        } else {
            // Lv1-2: 右键切换方向
            const dirs = DIR_NAMES;
            const idx = dirs.indexOf(this.direction);
            this.direction = dirs[(idx + 1) % 4];
        }
    }

    rotateDirection() {
        const dirs = DIR_NAMES;
        const idx = dirs.indexOf(this.direction);
        this.direction = dirs[(idx + 1) % 4];
    }

    onBeamHit() {
        return { outputs: [], absorbed: true };
    }
}

// ---- 反射镜 ----
class Mirror extends Element {
    constructor(col, row, orientation) {
        super(ELEMENT.MIRROR, col, row);
        this.orientation = orientation || '/';
    }

    getDecay() {
        if (this.level === 1) return 0.95;
        if (this.level === 2) return 1.0;
        return 1.1;
    }

    rotate() {
        this.orientation = this.orientation === '/' ? '\\' : '/';
    }

    onBeamHit(dirIn, color, intensity) {
        const dc = dirIn.dc, dr = dirIn.dr;
        let outDc, outDr;
        if (this.orientation === '/') {
            outDc = -dr; outDr = -dc;
        } else {
            outDc = dr; outDr = dc;
        }
        return {
            outputs: [{
                dc: outDc, dr: outDr,
                color: { ...color },
                intensity: intensity * this.getDecay()
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

    rotate() {}

    onBeamHit(dirIn, color, intensity) {
        const dc = dirIn.dc, dr = dirIn.dr;

        if (this.level <= 2) {
            const divisor = this.level === 1 ? 3 : 2.5;
            const si = intensity / divisor;
            return {
                outputs: [
                    { dc, dr, color: { ...color }, intensity: si },
                    { dc: -dr, dr: dc, color: { ...color }, intensity: si },
                    { dc: dr, dr: -dc, color: { ...color }, intensity: si }
                ],
                absorbed: false
            };
        }
        // Lv3: 5方向
        const si = intensity / 4;
        return {
            outputs: [
                { dc, dr, color: { ...color }, intensity: si },
                { dc: -dr, dr: dc, color: { ...color }, intensity: si },
                { dc: dr, dr: -dc, color: { ...color }, intensity: si },
                { dc: -dc, dr: -dr, color: { ...color }, intensity: si },
                { dc: -dr, dr: -dc, color: { ...color }, intensity: si }
            ],
            absorbed: false
        };
    }
}

// ---- 染色滤镜 ----
class ColorFilter extends Element {
    constructor(col, row, filterColor) {
        super(ELEMENT.COLOR_FILTER, col, row);
        this.filterColor = filterColor ? { ...filterColor } : { ...COLORS.RED };
    }

    rotate() {
        if (this.filterColor.r === 1 && this.filterColor.g === 0 && this.filterColor.b === 0) {
            this.filterColor = { ...COLORS.GREEN };
        } else if (this.filterColor.r === 0 && this.filterColor.g === 1 && this.filterColor.b === 0) {
            this.filterColor = { ...COLORS.BLUE };
        } else {
            this.filterColor = { ...COLORS.RED };
        }
    }

    onBeamHit(dirIn, color, intensity) {
        if (this.level === 1) {
            return {
                outputs: [{
                    dc: dirIn.dc, dr: dirIn.dr,
                    color: { ...this.filterColor },
                    intensity
                }],
                absorbed: false
            };
        }
        // Lv2+: 叠加模式
        const mixed = mixColors([color, this.filterColor]);
        const outputs = [{
            dc: dirIn.dc, dr: dirIn.dr,
            color: mixed,
            intensity
        }];
        if (this.level >= 3) {
            // Lv3: 穿透 — 原色继续直行
            outputs.push({
                dc: dirIn.dc, dr: dirIn.dr,
                color: { ...color },
                intensity: intensity * 0.7,
                passthrough: true
            });
        }
        return { outputs, absorbed: false };
    }
}

// ---- 聚焦透镜 ----
class FocusLens extends Element {
    constructor(col, row, direction) {
        super(ELEMENT.FOCUS_LENS, col, row);
        this.direction = direction || 'RIGHT';
        this.inputBuffer = [];
    }

    getOutputDir() { return DIR[this.direction]; }

    getMaxIntensity() {
        if (this.level === 1) return 2.0;
        if (this.level === 2) return 3.0;
        return 4.0;
    }

    getDamageBonus() {
        return this.level >= 2 ? 1.2 : 1.0;
    }

    canPenetrateShadow() {
        return this.level >= 3;
    }

    rotate() {
        const dirs = DIR_NAMES;
        const idx = dirs.indexOf(this.direction);
        this.direction = dirs[(idx + 1) % 4];
    }

    clearBuffer() { this.inputBuffer = []; }

    onBeamHit(dirIn, color, intensity) {
        this.inputBuffer.push({ color: { ...color }, intensity });
        return { outputs: [], absorbed: true };
    }

    getOutput() {
        if (this.inputBuffer.length === 0) return null;
        const colors = this.inputBuffer.map(b => b.color);
        const totalIntensity = Math.min(
            this.getMaxIntensity(),
            this.inputBuffer.reduce((s, b) => s + b.intensity, 0)
        );
        const mixed = mixColors(colors);
        const dir = this.getOutputDir();
        return {
            dc: dir.dc, dr: dir.dr,
            color: mixed,
            intensity: totalIntensity * this.getDamageBonus(),
            penetrateShadow: this.canPenetrateShadow()
        };
    }
}

// ---- 蓄能晶体 ----
class EnergyCrystal extends Element {
    constructor(col, row) {
        super(ELEMENT.ENERGY_CRYSTAL, col, row);
        this.chargeLevel = 0;
        this.isCharging = false;
        this.justBlasted = false;
        this.mode = 'blast'; // 'blast' 或 'energy'
    }

    getMaxCharge() { return CRYSTAL_MAX_CHARGE; }

    getChargeRate() {
        return this.level >= 2 ? CRYSTAL_CHARGE_RATE * 1.5 : CRYSTAL_CHARGE_RATE;
    }

    getBlastRadius() {
        return this.level >= 3 ? 4.0 : CRYSTAL_BLAST_RADIUS;
    }

    getBlastDamage() {
        return this.level >= 2 ? CRYSTAL_BLAST_DAMAGE * 1.5 : CRYSTAL_BLAST_DAMAGE;
    }

    getEnergyYield() {
        return this.level >= 2 ? Math.floor(CRYSTAL_ENERGY_YIELD * 1.5) : CRYSTAL_ENERGY_YIELD;
    }

    appliesSlow() { return this.level >= 3; }

    rotate() {
        this.mode = this.mode === 'blast' ? 'energy' : 'blast';
    }

    onBeamHit(dirIn, color, intensity) {
        this.isCharging = true;
        return { outputs: [], absorbed: true, charging: true, intensity };
    }

    addEnergy(amount) {
        this.chargeLevel = Math.min(this.getMaxCharge(), this.chargeLevel + amount);
    }

    isFullyCharged() {
        return this.chargeLevel >= this.getMaxCharge();
    }

    blast() {
        this.chargeLevel = 0;
        this.justBlasted = true;
    }

    getChargePercent() {
        return this.chargeLevel / this.getMaxCharge();
    }
}
