// ============================================================
// 光路工坊 - 游戏主控（能量系统 + 波次中可操作）
// ============================================================

class Game {
    constructor() {
        this.state = STATE.LEVEL_SELECT;
        this.grid = new Grid();
        this.beamSystem = new BeamSystem();
        this.waveManager = new WaveManager();
        this.renderer = new Renderer();
        this.levelManager = new LevelManager();
        this.particles = new ParticleSystem(500);
        this.ui = new UIManager(this);

        this.enemies = [];
        this.lives = 20;
        this.energy = 0;
        this.currentLevelIndex = -1;
        this.currentLevelData = null;

        this.mouseCol = -1;
        this.mouseRow = -1;
        this.mousePx = 0;
        this.mousePy = 0;

        this.hasShadowEnemies = false;
        this.firstPlaced = false;
        this.gameSpeed = 1;       // 1 = normal, 2 = fast
        this.floatingTexts = [];  // 能量飘字

        this.bindEvents();
    }

    // 是否允许放置/卖出/旋转操作
    canOperate() {
        return this.state === STATE.PLANNING ||
               this.state === STATE.BETWEEN_WAVES ||
               this.state === STATE.WAVE_RUNNING;
    }

    bindEvents() {
        const canvas = document.getElementById('layer-dynamic');

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            this.mousePx = (e.clientX - rect.left) * scaleX;
            this.mousePy = (e.clientY - rect.top) * scaleY;
            const g = this.grid.pixelToGrid(this.mousePx, this.mousePy);
            this.mouseCol = g.col;
            this.mouseRow = g.row;
        });

        canvas.addEventListener('mouseleave', () => {
            this.mouseCol = -1;
            this.mouseRow = -1;
        });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            const px = (e.clientX - rect.left) * scaleX;
            const py = (e.clientY - rect.top) * scaleY;
            this.handleClick(px, py, e.shiftKey);
        });

        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            const px = (e.clientX - rect.left) * scaleX;
            const py = (e.clientY - rect.top) * scaleY;
            this.handleRightClick(px, py, e.shiftKey);
        });

        // 快捷键
        document.addEventListener('keydown', (e) => {
            if (this.state === STATE.LEVEL_SELECT || this.state === STATE.WIN || this.state === STATE.LOSE) return;
            const key = e.key.toLowerCase();
            const avail = this.currentLevelData && this.currentLevelData.availableElements;
            const isAvail = (t) => !avail || avail.includes(t);

            if (key === '1' && isAvail(ELEMENT.LASER_SOURCE)) this.ui.selectElement(ELEMENT.LASER_SOURCE);
            else if (key === '2' && isAvail(ELEMENT.MIRROR)) this.ui.selectElement(ELEMENT.MIRROR);
            else if (key === '3' && isAvail(ELEMENT.PRISM)) this.ui.selectElement(ELEMENT.PRISM);
            else if (key === '4' && isAvail(ELEMENT.COLOR_FILTER)) this.ui.selectElement(ELEMENT.COLOR_FILTER);
            else if (key === '5' && isAvail(ELEMENT.FOCUS_LENS)) this.ui.selectElement(ELEMENT.FOCUS_LENS);
            else if (key === '6' && isAvail(ELEMENT.ENERGY_CRYSTAL)) this.ui.selectElement(ELEMENT.ENERGY_CRYSTAL);
            else if (key === 'q' || key === 'delete' || key === 'backspace') {
                this.ui.selectedType = this.ui.selectedType === 'DELETE' ? null : 'DELETE';
                this.refreshUI();
            }
            else if (key === ' ') {
                e.preventDefault();
                this.togglePause();
            }
            else if (key === 'f') this.toggleSpeed();
            else if (key === 'escape') {
                this.ui.clearSelection();
                this.refreshUI();
            }
        });
    }

    handleClick(px, py, shiftKey) {
        if (this.state === STATE.LEVEL_SELECT) {
            const idx = this.renderer.getLevelBtnAt(px, py);
            if (idx >= 0) this.loadLevel(idx);
            return;
        }

        if (this.state === STATE.PAUSED) return;
        if (!this.canOperate()) return;

        const g = this.grid.pixelToGrid(px, py);
        if (!this.grid.inBounds(g.col, g.row)) return;

        // 删除/卖出模式
        if (this.ui.selectedType === 'DELETE') {
            this.sellElement(g.col, g.row);
            return;
        }

        // 如果点击已有元素且没有选择放置 → 尝试升级，或触发晶体引爆
        const existing = this.grid.getElementAt(g.col, g.row);
        if (existing && !this.ui.selectedType) {
            // 蓄能晶体满充 → 引爆
            if (existing.type === ELEMENT.ENERGY_CRYSTAL && existing.isFullyCharged()) {
                this.triggerCrystalBlast(existing);
                return;
            }
            // 尝试升级
            if (existing.canUpgrade() && !existing.preplaced) {
                this.upgradeElement(existing);
            }
            return;
        }

        // 放置新元素
        if (this.ui.selectedType && this.ui.selectedType !== 'DELETE') {
            this.buyAndPlace(g.col, g.row);
        }
    }

    handleRightClick(px, py, shiftKey) {
        if (this.state === STATE.PAUSED) return;
        if (!this.canOperate()) return;

        const g = this.grid.pixelToGrid(px, py);
        const el = this.grid.getElementAt(g.col, g.row);
        if (!el) return;

        // Lv3 激光源: Shift+右键切换方向，普通右键切换颜色
        if (el.type === ELEMENT.LASER_SOURCE && el.level >= 3 && shiftKey) {
            el.rotateDirection();
        } else if (el.rotate) {
            el.rotate();
        }

        this.beamSystem.calculate(this.grid);
        this.renderer.renderElements(this.grid);
    }

    buyAndPlace(col, row) {
        const type = this.ui.selectedType;
        const data = ELEMENT_DATA[type];
        if (!data) return;

        // 检查关卡是否允许该元素
        const available = this.currentLevelData && this.currentLevelData.availableElements;
        if (available && !available.includes(type)) return;

        const cost = data.cost;
        if (this.energy < cost) {
            this.addFloatingText(this.mousePx, this.mousePy, '能量不足!', '#ff4444');
            return;
        }
        if (!this.grid.canPlace(col, row)) return;

        const preview = this.ui.placingPreview;
        const el = createElement(type, col, row, preview.direction, preview.color, preview);
        if (type === ELEMENT.MIRROR && preview.orientation) el.orientation = preview.orientation;

        if (this.grid.placeElement(col, row, el)) {
            this.energy -= cost;
            this.addFloatingText(this.mousePx, this.mousePy, `-${cost}`, '#ff8844');
            this.beamSystem.calculate(this.grid);
            this.renderer.renderElements(this.grid);
            this.refreshUI();

            if (!this.firstPlaced && this.currentLevelData) {
                this.firstPlaced = true;
                this.ui.showTutorial(this.currentLevelData.tutorial || [], 'FIRST_PLACE');
            }
        }
    }

    sellElement(col, row) {
        const el = this.grid.getElementAt(col, row);
        if (!el || el.preplaced) return;
        const value = el.getSellValue();
        this.grid.removeElement(col, row);
        this.energy += value;
        this.addFloatingText(
            GRID_OFFSET_X + (col + 0.5) * CELL_SIZE,
            GRID_OFFSET_Y + (row + 0.5) * CELL_SIZE,
            `+${value}`, '#44ff88'
        );
        this.beamSystem.calculate(this.grid);
        this.renderer.renderElements(this.grid);
        this.refreshUI();
    }

    upgradeElement(el) {
        if (!el.canUpgrade()) return false;
        const cost = el.getUpgradeCost();
        if (cost < 0 || this.energy < cost) {
            this.addFloatingText(this.mousePx, this.mousePy, '能量不足!', '#ff4444');
            return false;
        }
        this.energy -= cost;
        el.upgrade();
        this.addFloatingText(
            GRID_OFFSET_X + (el.col + 0.5) * CELL_SIZE,
            GRID_OFFSET_Y + (el.row + 0.5) * CELL_SIZE,
            `Lv${el.level}!`, '#ffcc44'
        );
        this.beamSystem.calculate(this.grid);
        this.renderer.renderElements(this.grid);
        this.refreshUI();
        return true;
    }

    // 蓄能晶体手动引爆
    triggerCrystalBlast(crystal) {
        if (!crystal.isFullyCharged()) return;
        const pos = this.grid.gridToPixel(crystal.col, crystal.row);

        if (crystal.mode === 'blast') {
            const blastPixelRadius = crystal.getBlastRadius() * CELL_SIZE;
            for (const e of this.enemies) {
                if (!e.alive) continue;
                const dx = e.x - pos.x;
                const dy = e.y - pos.y;
                if (Math.sqrt(dx * dx + dy * dy) <= blastPixelRadius) {
                    e.takeDamage(crystal.getBlastDamage());
                    if (crystal.appliesSlow()) e.applySlow(2.0);
                }
            }
            this.particles.spawnAOE(pos.x, pos.y, crystal.getBlastRadius(), { r: 0.8, g: 0.3, b: 1 });
        } else {
            // 产能模式
            const yield_ = crystal.getEnergyYield();
            this.energy += yield_;
            this.addFloatingText(pos.x, pos.y, `+${yield_}`, '#44ffaa');
        }
        crystal.blast();
    }

    addFloatingText(x, y, text, color) {
        this.floatingTexts.push({ x, y, text, color, life: 1.0 });
    }

    togglePause() {
        if (this.state === STATE.WAVE_RUNNING) {
            this.state = STATE.PAUSED;
            this.refreshUI();
        } else if (this.state === STATE.PAUSED) {
            this.state = STATE.WAVE_RUNNING;
            this.refreshUI();
        }
    }

    toggleSpeed() {
        this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
        this.refreshUI();
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        this.currentLevelData = this.levelManager.getLevel(index);
        if (!this.currentLevelData) return;

        this.grid.initFromLevel(this.currentLevelData);
        this.lives = this.currentLevelData.lives;
        this.energy = this.currentLevelData.startEnergy || 100;
        this.enemies = [];
        this.firstPlaced = false;
        this.floatingTexts = [];
        this.gameSpeed = 1;

        this.waveManager.loadWaves(this.currentLevelData.waves, this.grid.enemyPaths);

        this.beamSystem.calculate(this.grid);
        this.renderer.renderBackground(this.grid);
        this.renderer.renderElements(this.grid);

        this.state = STATE.PLANNING;
        this.ui.clearSelection();
        this.ui.tutorialShown.clear();
        this.refreshUI();

        this.ui.showTutorial(this.currentLevelData.tutorial || [], 'LEVEL_START');
    }

    startWave() {
        if (this.state !== STATE.PLANNING && this.state !== STATE.BETWEEN_WAVES) return;
        if (this.waveManager.hasNextWave()) {
            this.waveManager.startNextWave();
            this.state = STATE.WAVE_RUNNING;
            this.refreshUI();
        }
    }

    update(dt) {
        // 飘字更新（任何状态都更新）
        for (const ft of this.floatingTexts) {
            ft.life -= dt;
            ft.y -= 30 * dt;
        }
        this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

        if (this.state === STATE.PAUSED) {
            this.particles.update(dt);
            return;
        }

        if (this.state === STATE.WAVE_RUNNING) {
            const spd = this.gameSpeed;
            const adt = dt * spd;

            // 被动能量恢复
            this.energy += ENERGY_PASSIVE_RATE * adt;

            // 更新波次
            this.waveManager.update(adt, this.enemies);

            // 更新敌人
            this.hasShadowEnemies = false;
            for (const e of this.enemies) {
                e.update(adt);
                if (e.alive && e.type === ENEMY_TYPE.SHADOW) this.hasShadowEnemies = true;
                if (e.reachedEnd && e.alive) {
                    this.lives--;
                    e.alive = false;
                }
            }

            // 重算光束
            this.beamSystem.calculate(this.grid);

            // 光束伤害
            this.beamSystem.applyDamage(this.grid, this.enemies, adt);

            // 蓄能晶体充能（手动引爆模式）
            const crystals = this.grid.getElementsByType(ELEMENT.ENERGY_CRYSTAL);
            for (const crystal of crystals) {
                if (crystal.isCharging && !crystal.isFullyCharged()) {
                    const intensity = this.beamSystem.getBeamIntensityAt(crystal.col, crystal.row);
                    crystal.addEnergy(intensity * crystal.getChargeRate() * adt);
                }
            }

            // 处理死亡（含击杀奖励）
            for (const e of this.enemies) {
                if (!e.alive && e.hp <= 0 && !e._exploded) {
                    e._exploded = true;
                    this.energy += e.reward;
                    this.addFloatingText(e.x, e.y, `+${e.reward}`, '#44ff88');
                    const weakColor = e.colorWeakness || { r: 1, g: 0.5, b: 0 };
                    this.particles.spawnExplosion(e.x, e.y, weakColor);
                }
            }

            this.enemies = this.enemies.filter(e => e.alive);

            if (this.lives <= 0) {
                this.state = STATE.LOSE;
                this.refreshUI();
                return;
            }

            if (this.waveManager.isWaveComplete(this.enemies)) {
                if (this.waveManager.areAllWavesComplete(this.enemies)) {
                    this.state = STATE.WIN;
                    this.levelManager.completeLevel(this.currentLevelIndex);
                    this.refreshUI();
                } else {
                    this.state = STATE.BETWEEN_WAVES;
                    this.refreshUI();
                }
            }
        }

        this.particles.update(dt);
    }

    render() {
        this.renderer.clearDynamic();

        if (this.state === STATE.LEVEL_SELECT) {
            this.renderer.renderLevelSelect(this.levelManager);
            return;
        }

        // 光束
        this.renderer.renderBeams(this.beamSystem.beamSegments);

        // 敌人
        this.renderer.renderEnemies(this.enemies);

        // 粒子
        this.particles.render(this.renderer.dynCtx);

        // 放置预览（波次中也能放）
        if (this.canOperate() &&
            this.ui.selectedType && this.ui.selectedType !== 'DELETE' &&
            this.mouseCol >= 0 && this.mouseRow >= 0) {
            const canAfford = this.energy >= (ELEMENT_DATA[this.ui.selectedType] || {}).cost;
            this.renderer.renderPlacementPreview(
                this.grid, this.mouseCol, this.mouseRow,
                this.ui.placingPreview, canAfford
            );
        }

        // 删除模式高亮
        if (this.canOperate() &&
            this.ui.selectedType === 'DELETE' &&
            this.mouseCol >= 0 && this.mouseRow >= 0) {
            const el = this.grid.getElementAt(this.mouseCol, this.mouseRow);
            if (el && !el.preplaced) {
                const x = GRID_OFFSET_X + this.mouseCol * CELL_SIZE;
                const y = GRID_OFFSET_Y + this.mouseRow * CELL_SIZE;
                this.renderer.dynCtx.fillStyle = 'rgba(255, 50, 50, 0.3)';
                this.renderer.dynCtx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                // 显示卖出价格
                this.renderer.dynCtx.fillStyle = '#ff8888';
                this.renderer.dynCtx.font = '11px sans-serif';
                this.renderer.dynCtx.textAlign = 'center';
                this.renderer.dynCtx.fillText(`卖 +${el.getSellValue()}`, x + CELL_SIZE / 2, y + CELL_SIZE - 4);
            }
        }

        // 鼠标悬停元素 tooltip
        if (this.canOperate() && !this.ui.selectedType &&
            this.mouseCol >= 0 && this.mouseRow >= 0) {
            const el = this.grid.getElementAt(this.mouseCol, this.mouseRow);
            if (el) {
                this.renderer.renderElementTooltip(this.renderer.dynCtx, el, this.mousePx, this.mousePy, this.energy);
            }
        }

        // 飘字
        this.renderer.renderFloatingTexts(this.renderer.dynCtx, this.floatingTexts);

        // HUD
        if (this.state !== STATE.LEVEL_SELECT) {
            this.renderer.renderHUD({
                lives: this.lives,
                energy: Math.floor(this.energy),
                levelName: this.currentLevelData ? this.currentLevelData.name : '',
                waveNum: this.waveManager.getWaveNumber(),
                totalWaves: this.waveManager.getTotalWaves(),
                speed: this.gameSpeed,
                paused: this.state === STATE.PAUSED
            });
        }

        // 覆盖层
        if (this.state === STATE.WIN) {
            this.renderer.renderOverlay('胜 利 !', '关卡通过', '#44ff88');
        } else if (this.state === STATE.LOSE) {
            this.renderer.renderOverlay('失 败', '生命值耗尽', '#ff4444');
        } else if (this.state === STATE.PAUSED) {
            this.renderer.renderOverlay('暂 停', '按 Space 继续', '#aaccff');
        }
    }

    refreshUI() {
        this.ui.renderPanel(this.state, this.energy, this.gameSpeed);
    }

    retryLevel() { this.loadLevel(this.currentLevelIndex); }

    nextLevel() {
        if (this.currentLevelIndex < this.levelManager.getLevelCount() - 1) {
            this.loadLevel(this.currentLevelIndex + 1);
        } else {
            this.goToLevelSelect();
        }
    }

    goToLevelSelect() {
        this.state = STATE.LEVEL_SELECT;
        this.enemies = [];
        this.ui.clearSelection();
        this.refreshUI();
        this.renderer.renderLevelSelect(this.levelManager);
    }
}
