// ============================================================
// 光路工坊 - 光线追踪系统（含升级适配）
// ============================================================

class BeamSystem {
    constructor() {
        this.beamSegments = [];
        this.isDirty = true;
    }

    markDirty() {
        this.isDirty = true;
    }

    calculate(grid) {
        this.beamSegments = [];

        const focusLenses = grid.getElementsByType(ELEMENT.FOCUS_LENS);
        for (const lens of focusLenses) lens.clearBuffer();

        const crystals = grid.getElementsByType(ELEMENT.ENERGY_CRYSTAL);
        for (const c of crystals) c.isCharging = false;

        // 第一遍：从所有 LaserSource 出发（使用各自的强度）
        const sources = grid.getElementsByType(ELEMENT.LASER_SOURCE);
        for (const src of sources) {
            const dir = src.getEmitDir();
            this.traceBeam(grid, src.col, src.row, dir.dc, dir.dr,
                { ...src.color }, src.getIntensity(), 0, false);
        }

        // 第二遍：处理 FocusLens 合并输出
        for (const lens of focusLenses) {
            const output = lens.getOutput();
            if (output) {
                this.traceBeam(grid, lens.col, lens.row, output.dc, output.dr,
                    output.color, output.intensity, 0, output.penetrateShadow || false);
            }
        }

        this.isDirty = false;
        return this.beamSegments;
    }

    traceBeam(grid, startCol, startRow, dc, dr, color, intensity, depth, penetrateShadow) {
        if (depth > MAX_BOUNCES || intensity < MIN_INTENSITY) return;

        let curCol = startCol + dc;
        let curRow = startRow + dr;

        while (grid.inBounds(curCol, curRow)) {
            const element = grid.getElementAt(curCol, curRow);

            if (element) {
                this.beamSegments.push({
                    startCol, startRow,
                    endCol: curCol, endRow: curRow,
                    dc, dr,
                    color: { ...color },
                    intensity,
                    penetrateShadow: penetrateShadow || false
                });

                const result = element.onBeamHit({ dc, dr }, color, intensity);

                for (const out of result.outputs) {
                    // Lv3 滤镜穿透光束：跳过当前元素格，从下一格开始
                    const traceStart = out.passthrough ? { c: curCol + out.dc, r: curRow + out.dr } : null;
                    if (out.passthrough && grid.inBounds(curCol + out.dc, curRow + out.dr)) {
                        // 穿透光束从元素下一格开始追踪
                        this.traceBeamFrom(grid, curCol, curRow, out.dc, out.dr,
                            out.color, out.intensity, depth + 1, penetrateShadow);
                    } else if (!out.passthrough) {
                        this.traceBeam(grid, curCol, curRow, out.dc, out.dr,
                            out.color, out.intensity, depth + 1, penetrateShadow);
                    }
                }
                return;
            }

            curCol += dc;
            curRow += dr;
        }

        // 到达边界
        this.beamSegments.push({
            startCol, startRow,
            endCol: curCol - dc, endRow: curRow - dr,
            dc, dr,
            color: { ...color },
            intensity,
            penetrateShadow: penetrateShadow || false
        });
    }

    // 穿透模式追踪：不检查起始格的元素
    traceBeamFrom(grid, startCol, startRow, dc, dr, color, intensity, depth, penetrateShadow) {
        if (depth > MAX_BOUNCES || intensity < MIN_INTENSITY) return;
        // 直接从 startCol, startRow 开始，正常追踪（起始点已经被跳过了）
        this.traceBeam(grid, startCol, startRow, dc, dr, color, intensity, depth, penetrateShadow);
    }

    applyDamage(grid, enemies, dt) {
        for (const seg of this.beamSegments) {
            const cells = this.getSegmentCells(seg);
            let truncated = false;

            for (const cell of cells) {
                if (truncated) break;

                for (const enemy of enemies) {
                    if (!enemy.alive) continue;
                    const eg = grid.pixelToGrid(enemy.x, enemy.y);
                    if (eg.col === cell.col && eg.row === cell.row) {
                        // 色盾敌人免疫不匹配颜色
                        if (enemy.type === ENEMY_TYPE.COLOR_SHIELDED &&
                            enemy.colorWeakness &&
                            !colorContains(seg.color, enemy.colorWeakness)) {
                            continue;
                        }
                        const baseDamage = seg.intensity * BEAM_DPS * dt;
                        const multiplier = getColorDamageMultiplier(seg.color, enemy.colorWeakness);
                        enemy.takeDamage(baseDamage * multiplier);

                        // Shadow 敌人阻断光路（除非光束有穿透属性）
                        if (enemy.type === ENEMY_TYPE.SHADOW && !seg.penetrateShadow) {
                            truncated = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    getSegmentCells(seg) {
        const cells = [];
        let c = seg.startCol + seg.dc;
        let r = seg.startRow + seg.dr;
        let maxSteps = GRID_COLS + GRID_ROWS;
        while (maxSteps-- > 0) {
            cells.push({ col: c, row: r });
            if (c === seg.endCol && r === seg.endRow) break;
            c += seg.dc;
            r += seg.dr;
        }
        return cells;
    }

    getBeamIntensityAt(col, row) {
        let total = 0;
        for (const seg of this.beamSegments) {
            const cells = this.getSegmentCells(seg);
            for (const cell of cells) {
                if (cell.col === col && cell.row === row) {
                    total += seg.intensity;
                }
            }
        }
        return total;
    }
}
