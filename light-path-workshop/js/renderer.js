// ============================================================
// 光路工坊 - Canvas 渲染器
// ============================================================

class Renderer {
    constructor(container) {
        this.bgCanvas = document.getElementById('layer-bg');
        this.elemCanvas = document.getElementById('layer-elements');
        this.dynCanvas = document.getElementById('layer-dynamic');

        this.bgCtx = this.bgCanvas.getContext('2d');
        this.elemCtx = this.elemCanvas.getContext('2d');
        this.dynCtx = this.dynCanvas.getContext('2d');

        this.resize();
    }

    resize() {
        const canvases = [this.bgCanvas, this.elemCanvas, this.dynCanvas];
        for (const c of canvases) {
            c.width = CANVAS_WIDTH;
            c.height = CANVAS_HEIGHT;
        }
    }

    // ---- 背景层 ----
    renderBackground(grid) {
        const ctx = this.bgCtx;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 背景
        ctx.fillStyle = VISUAL.BG;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 网格线
        ctx.strokeStyle = VISUAL.GRID_LINE;
        ctx.lineWidth = 0.5;
        for (let c = 0; c <= grid.cols; c++) {
            const x = GRID_OFFSET_X + c * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(x, GRID_OFFSET_Y);
            ctx.lineTo(x, GRID_OFFSET_Y + grid.rows * CELL_SIZE);
            ctx.stroke();
        }
        for (let r = 0; r <= grid.rows; r++) {
            const y = GRID_OFFSET_Y + r * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(GRID_OFFSET_X, y);
            ctx.lineTo(GRID_OFFSET_X + grid.cols * CELL_SIZE, y);
            ctx.stroke();
        }

        // 地形
        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                const terrain = grid.cells[r][c].terrain;
                const x = GRID_OFFSET_X + c * CELL_SIZE;
                const y = GRID_OFFSET_Y + r * CELL_SIZE;

                if (terrain === TERRAIN.PATH || terrain === TERRAIN.ENTRANCE || terrain === TERRAIN.EXIT) {
                    ctx.fillStyle = VISUAL.PATH_COLOR;
                    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                    ctx.strokeStyle = VISUAL.PATH_BORDER;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                }

                if (terrain === TERRAIN.ENTRANCE) {
                    ctx.fillStyle = VISUAL.ENTRANCE;
                    ctx.font = `bold ${CELL_SIZE * 0.4}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('IN', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
                }

                if (terrain === TERRAIN.EXIT) {
                    ctx.fillStyle = VISUAL.EXIT;
                    ctx.font = `bold ${CELL_SIZE * 0.4}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('OUT', x + CELL_SIZE / 2, y + CELL_SIZE / 2);
                }

                if (terrain === TERRAIN.BLOCKED) {
                    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
                    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }

    // ---- 元素层 ----
    renderElements(grid) {
        const ctx = this.elemCtx;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                const el = grid.cells[r][c].element;
                if (el) this.drawElement(ctx, el);
            }
        }
    }

    drawElement(ctx, el) {
        const cx = GRID_OFFSET_X + (el.col + 0.5) * CELL_SIZE;
        const cy = GRID_OFFSET_Y + (el.row + 0.5) * CELL_SIZE;
        const s = CELL_SIZE * 0.4;

        ctx.save();
        ctx.translate(cx, cy);

        switch (el.type) {
            case ELEMENT.LASER_SOURCE:
                this.drawLaserSource(ctx, el, s);
                break;
            case ELEMENT.MIRROR:
                this.drawMirror(ctx, el, s);
                break;
            case ELEMENT.PRISM:
                this.drawPrism(ctx, el, s);
                break;
            case ELEMENT.COLOR_FILTER:
                this.drawColorFilter(ctx, el, s);
                break;
            case ELEMENT.FOCUS_LENS:
                this.drawFocusLens(ctx, el, s);
                break;
            case ELEMENT.ENERGY_CRYSTAL:
                this.drawEnergyCrystal(ctx, el, s);
                break;
        }

        ctx.restore();
    }

    drawLaserSource(ctx, el, s) {
        // 方形外框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = colorToCSS(el.color);
        ctx.strokeRect(-s, -s, s * 2, s * 2);

        // 内部填充
        ctx.fillStyle = colorToCSS(el.color, 0.3);
        ctx.fillRect(-s, -s, s * 2, s * 2);

        // 方向箭头
        const dir = el.getEmitDir();
        ctx.beginPath();
        ctx.moveTo(dir.dc * s * 0.3, dir.dr * s * 0.3);
        ctx.lineTo(dir.dc * s * 1.2, dir.dr * s * 1.2);
        ctx.strokeStyle = colorToCSS(el.color);
        ctx.lineWidth = 3;
        ctx.stroke();

        // 箭头头部
        const tipX = dir.dc * s * 1.2;
        const tipY = dir.dr * s * 1.2;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - dir.dc * s * 0.4 + dir.dr * s * 0.3, tipY - dir.dr * s * 0.4 - dir.dc * s * 0.3);
        ctx.lineTo(tipX - dir.dc * s * 0.4 - dir.dr * s * 0.3, tipY - dir.dr * s * 0.4 + dir.dc * s * 0.3);
        ctx.closePath();
        ctx.fillStyle = colorToCSS(el.color);
        ctx.fill();
    }

    drawMirror(ctx, el, s) {
        ctx.strokeStyle = '#aaddff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4488cc';

        if (el.orientation === '/') {
            ctx.beginPath();
            ctx.moveTo(s, s);
            ctx.lineTo(-s, -s);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(-s, s);
            ctx.lineTo(s, -s);
            ctx.stroke();
        }

        // 反射面高亮
        ctx.strokeStyle = 'rgba(200, 230, 255, 0.4)';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 5;
        if (el.orientation === '/') {
            ctx.beginPath();
            ctx.moveTo(s, s);
            ctx.lineTo(-s, -s);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(-s, s);
            ctx.lineTo(s, -s);
            ctx.stroke();
        }
    }

    drawPrism(ctx, el, s) {
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.1);
        ctx.lineTo(s, s * 0.8);
        ctx.lineTo(-s, s * 0.8);
        ctx.closePath();

        // 彩虹边框
        const grad = ctx.createLinearGradient(-s, -s, s, s);
        grad.addColorStop(0, '#ff0000');
        grad.addColorStop(0.33, '#00ff00');
        grad.addColorStop(0.66, '#0000ff');
        grad.addColorStop(1, '#ff0000');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
    }

    drawColorFilter(ctx, el, s) {
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);

        ctx.fillStyle = colorToCSS(el.filterColor, 0.3);
        ctx.fill();

        ctx.strokeStyle = colorToCSS(el.filterColor, 0.8);
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = colorToCSS(el.filterColor);
        ctx.stroke();

        // 中心标记
        ctx.fillStyle = colorToCSS(el.filterColor, 0.6);
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFocusLens(ctx, el, s) {
        const dir = el.getOutputDir();

        // 双凸透镜形状
        ctx.beginPath();
        if (dir.dc !== 0) {
            // 水平方向
            ctx.ellipse(0, 0, s * 0.5, s, 0, 0, Math.PI * 2);
        } else {
            // 垂直方向
            ctx.ellipse(0, 0, s, s * 0.5, 0, 0, Math.PI * 2);
        }

        ctx.strokeStyle = '#ffcc44';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffaa00';
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 200, 50, 0.1)';
        ctx.fill();

        // 输出方向箭头
        const tipX = dir.dc * s * 1.0;
        const tipY = dir.dr * s * 1.0;
        ctx.beginPath();
        ctx.moveTo(tipX * 0.3, tipY * 0.3);
        ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = '#ffcc44';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawEnergyCrystal(ctx, el, s) {
        // 六边形
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = Math.cos(angle) * s;
            const y = Math.sin(angle) * s;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const charge = el.getChargePercent();
        const hue = 270 + charge * 60; // 紫色→白色
        ctx.strokeStyle = `hsl(${hue}, 80%, ${50 + charge * 30}%)`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10 + charge * 15;
        ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
        ctx.stroke();

        ctx.fillStyle = `hsla(${hue}, 80%, 50%, ${0.1 + charge * 0.3})`;
        ctx.fill();

        // 充能进度环
        if (charge > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, s * 1.2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
            ctx.strokeStyle = `hsl(${hue}, 90%, 70%)`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // ---- 动态层 ----
    clearDynamic() {
        this.dynCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    renderBeams(beamSegments) {
        const ctx = this.dynCtx;

        for (const seg of beamSegments) {
            const sx = GRID_OFFSET_X + (seg.startCol + 0.5) * CELL_SIZE;
            const sy = GRID_OFFSET_Y + (seg.startRow + 0.5) * CELL_SIZE;
            const ex = GRID_OFFSET_X + (seg.endCol + 0.5) * CELL_SIZE;
            const ey = GRID_OFFSET_Y + (seg.endRow + 0.5) * CELL_SIZE;
            const css = colorToCSS(seg.color);

            // 第 1 遍：外层辉光
            ctx.save();
            ctx.globalAlpha = 0.1 * seg.intensity;
            ctx.strokeStyle = css;
            ctx.lineWidth = 18 * seg.intensity;
            ctx.shadowBlur = 25;
            ctx.shadowColor = css;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.restore();

            // 第 2 遍：中间辉光
            ctx.save();
            ctx.globalAlpha = 0.4 * seg.intensity;
            ctx.strokeStyle = css;
            ctx.lineWidth = 5 * seg.intensity;
            ctx.shadowBlur = 12;
            ctx.shadowColor = css;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.restore();

            // 第 3 遍：内核亮线
            ctx.save();
            ctx.globalAlpha = 0.9 * Math.min(1, seg.intensity);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = css;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.restore();
        }
    }

    renderEnemies(enemies) {
        const ctx = this.dynCtx;

        for (const e of enemies) {
            if (!e.alive) continue;

            ctx.save();
            ctx.translate(e.x, e.y);
            const s = CELL_SIZE * e.radius;

            // 根据类型绘制不同形状
            switch (e.type) {
                case ENEMY_TYPE.BASIC:
                    this.drawBasicEnemy(ctx, e, s);
                    break;
                case ENEMY_TYPE.FAST:
                    this.drawFastEnemy(ctx, e, s);
                    break;
                case ENEMY_TYPE.ARMORED:
                    this.drawArmoredEnemy(ctx, e, s);
                    break;
                case ENEMY_TYPE.COLOR_SHIELDED:
                    this.drawColorShieldedEnemy(ctx, e, s);
                    break;
                case ENEMY_TYPE.SHADOW:
                    this.drawShadowEnemy(ctx, e, s);
                    break;
                default:
                    this.drawBasicEnemy(ctx, e, s);
            }

            // 受击闪烁
            if (e.hitFlash > 0) {
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, s, 0, Math.PI * 2);
                ctx.fill();
            }

            // 血条
            this.drawHPBar(ctx, e, s);

            ctx.restore();
        }
    }

    drawBasicEnemy(ctx, e, s) {
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 100, 120, 0.8)';
        ctx.fill();
        ctx.strokeStyle = '#8888aa';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    drawFastEnemy(ctx, e, s) {
        // 菱形
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.7, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.7, 0);
        ctx.closePath();
        ctx.fillStyle = 'rgba(150, 150, 170, 0.8)';
        ctx.fill();
        ctx.strokeStyle = '#aaaacc';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    drawArmoredEnemy(ctx, e, s) {
        // 六边形
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = Math.cos(angle) * s;
            const y = Math.sin(angle) * s;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(80, 50, 120, 0.8)';
        ctx.fill();
        ctx.strokeStyle = '#9966cc';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 内部盾形
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
        ctx.strokeStyle = '#bb88ee';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    drawColorShieldedEnemy(ctx, e, s) {
        // 内核
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 100, 120, 0.8)';
        ctx.fill();

        // 彩色光盾
        if (e.colorWeakness) {
            ctx.beginPath();
            ctx.arc(0, 0, s, 0, Math.PI * 2);
            ctx.strokeStyle = colorToCSS(e.colorWeakness, 0.7);
            ctx.lineWidth = 3;
            ctx.shadowBlur = 8;
            ctx.shadowColor = colorToCSS(e.colorWeakness);
            ctx.stroke();
        }
    }

    drawShadowEnemy(ctx, e, s) {
        // 暗影模糊效果
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#220022';

        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(10, 0, 10, 0.9)';
        ctx.fill();

        // 内核暗红
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150, 20, 20, 0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#880000';
        ctx.fill();
    }

    drawHPBar(ctx, e, s) {
        const barW = s * 2.2;
        const barH = 3;
        const barY = -s - 8;
        const ratio = e.hp / e.maxHp;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barW / 2, barY, barW, barH);

        let barColor = VISUAL.HP_HIGH;
        if (ratio < 0.3) barColor = VISUAL.HP_LOW;
        else if (ratio < 0.6) barColor = VISUAL.HP_MID;

        ctx.fillStyle = barColor;
        ctx.fillRect(-barW / 2, barY, barW * ratio, barH);
    }

    // ---- 放置预览 ----
    renderPlacementPreview(grid, col, row, element) {
        if (col < 0 || row < 0) return;
        const ctx = this.dynCtx;
        const x = GRID_OFFSET_X + col * CELL_SIZE;
        const y = GRID_OFFSET_Y + row * CELL_SIZE;
        const valid = grid.canPlace(col, row);

        ctx.fillStyle = valid ? VISUAL.HIGHLIGHT_VALID : VISUAL.HIGHLIGHT_INVALID;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        // 元素预览
        if (valid && element) {
            ctx.globalAlpha = 0.6;
            const preview = createElement(element.type, col, row, element.direction, element.color, element);
            if (element.type === ELEMENT.MIRROR) preview.orientation = element.orientation || '/';
            this.drawElement(ctx, preview);
            ctx.globalAlpha = 1;
        }
    }

    // ---- HUD ----
    renderHUD(gameState) {
        const key = `${gameState.lives}|${gameState.levelName}|${gameState.waveNum}|${gameState.totalWaves}`;
        if (this._lastHudKey === key) return;
        this._lastHudKey = key;

        const hud = document.getElementById('hud');
        hud.innerHTML = `
            <span class="hud-item">&#10084; 生命: ${gameState.lives}</span>
            <span class="hud-item">${gameState.levelName || ''}</span>
            <span class="hud-item">波次: ${gameState.waveNum}/${gameState.totalWaves}</span>
        `;
    }

    // ---- 全屏覆盖层（菜单/胜负等）----
    renderOverlay(text, subtext, color) {
        const ctx = this.dynCtx;
        ctx.save();
        ctx.fillStyle = 'rgba(5, 5, 15, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = color || '#aaccff';
        ctx.font = `bold 48px 'Segoe UI', sans-serif`;
        ctx.shadowBlur = 20;
        ctx.shadowColor = color || '#4488ff';
        ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

        if (subtext) {
            ctx.font = `18px 'Segoe UI', sans-serif`;
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(170, 200, 255, 0.7)';
            ctx.fillText(subtext, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        }
        ctx.restore();
    }

    renderLevelSelect(levelManager) {
        const ctx = this.dynCtx;
        ctx.save();
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = VISUAL.BG;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 标题
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#aaccff';
        ctx.font = `bold 36px 'Segoe UI', sans-serif`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#4488ff';
        ctx.fillText('光 路 工 坊', CANVAS_WIDTH / 2, 80);

        ctx.font = `16px 'Segoe UI', sans-serif`;
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(170, 200, 255, 0.5)';
        ctx.fillText('Light Path Workshop', CANVAS_WIDTH / 2, 120);

        // 关卡按钮
        const count = levelManager.getLevelCount();
        const btnW = 140;
        const btnH = 100;
        const gap = 20;
        const totalW = count * btnW + (count - 1) * gap;
        const startX = (CANVAS_WIDTH - totalW) / 2;
        const startY = 250;

        this._levelBtns = [];

        for (let i = 0; i < count; i++) {
            const level = levelManager.getLevel(i);
            const unlocked = levelManager.isUnlocked(i);
            const x = startX + i * (btnW + gap);
            const y = startY;

            this._levelBtns.push({ x, y, w: btnW, h: btnH, index: i, unlocked });

            // 按钮背景
            ctx.fillStyle = unlocked ? 'rgba(20, 40, 80, 0.8)' : 'rgba(20, 20, 30, 0.6)';
            ctx.strokeStyle = unlocked ? 'rgba(60, 140, 255, 0.6)' : 'rgba(40, 40, 60, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(x, y, btnW, btnH, 8);
            ctx.fill();
            ctx.stroke();

            // 关卡编号
            ctx.fillStyle = unlocked ? '#aaccff' : '#444466';
            ctx.font = `bold 28px 'Segoe UI', sans-serif`;
            ctx.fillText(`${i + 1}`, x + btnW / 2, y + 35);

            // 关卡名
            ctx.font = `13px 'Segoe UI', sans-serif`;
            ctx.fillText(level.name, x + btnW / 2, y + 65);

            if (!unlocked) {
                ctx.fillStyle = '#444466';
                ctx.font = `20px sans-serif`;
                ctx.fillText('🔒', x + btnW / 2, y + btnH / 2);
            }
        }

        // 说明
        ctx.fillStyle = 'rgba(170, 200, 255, 0.4)';
        ctx.font = `14px 'Segoe UI', sans-serif`;
        ctx.fillText('选择关卡开始游戏', CANVAS_WIDTH / 2, startY + btnH + 50);
        ctx.restore();
    }

    getLevelBtnAt(px, py) {
        if (!this._levelBtns) return -1;
        for (const btn of this._levelBtns) {
            if (btn.unlocked && px >= btn.x && px <= btn.x + btn.w && py >= btn.y && py <= btn.y + btn.h) {
                return btn.index;
            }
        }
        return -1;
    }
}
