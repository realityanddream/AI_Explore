// ============================================================
// 光路工坊 - 光线追踪系统
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

        // 清空所有 FocusLens 的缓冲区
        const focusLenses = grid.getElementsByType(ELEMENT.FOCUS_LENS);
        for (const lens of focusLenses) {
            lens.clearBuffer();
        }

        // 重置所有 EnergyCrystal 的充能标记
        const crystals = grid.getElementsByType(ELEMENT.ENERGY_CRYSTAL);
        for (const c of crystals) {
            c.isCharging = false;
        }

        // 第一遍：从所有 LaserSource 出发
        const sources = grid.getElementsByType(ELEMENT.LASER_SOURCE);
        for (const src of sources) {
            const dir = src.getEmitDir();
            this.traceBeam(
                grid,
                src.col, src.row,
                dir.dc, dir.dr,
                { ...src.color },
                1.0,
                0
            );
        }

        // 第二遍：处理所有 FocusLens 的合并输出
        for (const lens of focusLenses) {
            const output = lens.getOutput();
            if (output) {
                this.traceBeam(
                    grid,
                    lens.col, lens.row,
                    output.dc, output.dr,
                    output.color,
                    output.intensity,
                    0
                );
            }
        }

        this.isDirty = false;
        return this.beamSegments;
    }

    traceBeam(grid, startCol, startRow, dc, dr, color, intensity, depth) {
        if (depth > MAX_BOUNCES || intensity < MIN_INTENSITY) return;

        let curCol = startCol + dc;
        let curRow = startRow + dr;

        while (grid.inBounds(curCol, curRow)) {
            const element = grid.getElementAt(curCol, curRow);

            if (element) {
                // 记录光束段（从起点到命中元素）
                this.beamSegments.push({
                    startCol, startRow,
                    endCol: curCol, endRow: curRow,
                    dc, dr,
                    color: { ...color },
                    intensity
                });

                // 处理元素交互
                const result = element.onBeamHit({ dc, dr }, color, intensity);

                // 递归追踪输出光束
                for (const out of result.outputs) {
                    this.traceBeam(
                        grid,
                        curCol, curRow,
                        out.dc, out.dr,
                        out.color,
                        out.intensity,
                        depth + 1
                    );
                }
                return;
            }

            curCol += dc;
            curRow += dr;
        }

        // 光束到达边界
        this.beamSegments.push({
            startCol, startRow,
            endCol: curCol - dc, endRow: curRow - dr,
            dc, dr,
            color: { ...color },
            intensity
        });
    }

    applyDamage(grid, enemies, dt) {
        // 对所有存活的 Shadow 敌人，计算它们所在格子
        const shadowPositions = new Set();
        for (const e of enemies) {
            if (!e.alive) continue;
            if (e.type === ENEMY_TYPE.SHADOW) {
                const g = grid.pixelToGrid(e.x, e.y);
                shadowPositions.add(`${g.col},${g.row}`);
            }
        }

        for (const seg of this.beamSegments) {
            // 遍历光束经过的每个格子
            const cells = this.getSegmentCells(seg);

            let truncated = false;
            for (const cell of cells) {
                if (truncated) break;

                for (const enemy of enemies) {
                    if (!enemy.alive) continue;
                    const eg = grid.pixelToGrid(enemy.x, enemy.y);
                    if (eg.col === cell.col && eg.row === cell.row) {
                        // 色盾敌人：不匹配颜色时完全免疫
                        if (enemy.type === ENEMY_TYPE.COLOR_SHIELDED &&
                            enemy.colorWeakness &&
                            !colorContains(seg.color, enemy.colorWeakness)) {
                            continue;
                        }
                        const baseDamage = seg.intensity * BEAM_DPS * dt;
                        const multiplier = getColorDamageMultiplier(seg.color, enemy.colorWeakness);
                        enemy.takeDamage(baseDamage * multiplier);

                        // Shadow 敌人阻断光路
                        if (enemy.type === ENEMY_TYPE.SHADOW) {
                            truncated = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    // 获取光束段经过的所有格子（不含起点）
    getSegmentCells(seg) {
        const cells = [];
        let c = seg.startCol + seg.dc;
        let r = seg.startRow + seg.dr;
        const endC = seg.endCol;
        const endR = seg.endRow;

        // 安全检查
        let maxSteps = GRID_COLS + GRID_ROWS;
        while (maxSteps-- > 0) {
            cells.push({ col: c, row: r });
            if (c === endC && r === endR) break;
            c += seg.dc;
            r += seg.dr;
        }
        return cells;
    }

    // 检查某个格子是否有光束经过（用于充能）
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
