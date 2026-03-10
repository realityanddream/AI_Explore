// ============================================================
// 光路工坊 - 游戏主控
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
        this.currentLevelIndex = -1;
        this.currentLevelData = null;
        this.availableElements = {};

        this.mouseCol = -1;
        this.mouseRow = -1;

        this.hasShadowEnemies = false;
        this.firstPlaced = false;

        this.bindEvents();
    }

    bindEvents() {
        const canvas = document.getElementById('layer-dynamic');

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            const px = (e.clientX - rect.left) * scaleX;
            const py = (e.clientY - rect.top) * scaleY;
            const g = this.grid.pixelToGrid(px, py);
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

            this.handleClick(px, py);
        });

        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            const px = (e.clientX - rect.left) * scaleX;
            const py = (e.clientY - rect.top) * scaleY;

            this.handleRightClick(px, py);
        });
    }

    handleClick(px, py) {
        if (this.state === STATE.LEVEL_SELECT) {
            const idx = this.renderer.getLevelBtnAt(px, py);
            if (idx >= 0) {
                this.loadLevel(idx);
            }
            return;
        }

        if (this.state !== STATE.PLANNING && this.state !== STATE.BETWEEN_WAVES) return;

        const g = this.grid.pixelToGrid(px, py);

        // 删除模式
        if (this.ui.selectedType === 'DELETE') {
            const removed = this.grid.removeElement(g.col, g.row);
            if (removed) {
                this.availableElements[removed.type] = (this.availableElements[removed.type] || 0) + 1;
                this.beamSystem.calculate(this.grid);
                this.renderer.renderElements(this.grid);
                this.refreshUI();
            }
            return;
        }

        // 放置元素
        if (this.ui.selectedType && this.ui.selectedType !== 'DELETE') {
            const type = this.ui.selectedType;
            const count = this.availableElements[type] || 0;
            if (count <= 0) return;

            if (!this.grid.canPlace(g.col, g.row)) return;

            const preview = this.ui.placingPreview;
            const el = createElement(type, g.col, g.row, preview.direction, preview.color, preview);
            if (type === ELEMENT.MIRROR && preview.orientation) {
                el.orientation = preview.orientation;
            }

            if (this.grid.placeElement(g.col, g.row, el)) {
                this.availableElements[type]--;
                this.beamSystem.calculate(this.grid);
                this.renderer.renderElements(this.grid);
                this.refreshUI();

                // 教程
                if (!this.firstPlaced && this.currentLevelData) {
                    this.firstPlaced = true;
                    this.ui.showTutorial(this.currentLevelData.tutorial || [], 'FIRST_PLACE');
                }
            }
        }
    }

    handleRightClick(px, py) {
        if (this.state !== STATE.PLANNING && this.state !== STATE.BETWEEN_WAVES) return;

        const g = this.grid.pixelToGrid(px, py);
        if (this.grid.rotateElementAt(g.col, g.row)) {
            this.beamSystem.calculate(this.grid);
            this.renderer.renderElements(this.grid);
        }
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        this.currentLevelData = this.levelManager.getLevel(index);
        if (!this.currentLevelData) return;

        this.grid.initFromLevel(this.currentLevelData);
        this.lives = this.currentLevelData.lives;
        this.enemies = [];
        this.firstPlaced = false;

        // 复制可用元素
        this.availableElements = { ...this.currentLevelData.availableElements };

        this.waveManager.loadWaves(this.currentLevelData.waves, this.grid.enemyPaths);

        this.beamSystem.calculate(this.grid);
        this.renderer.renderBackground(this.grid);
        this.renderer.renderElements(this.grid);

        this.state = STATE.PLANNING;
        this.ui.clearSelection();
        this.ui.tutorialShown.clear();
        this.refreshUI();

        // 教程
        this.ui.showTutorial(this.currentLevelData.tutorial || [], 'LEVEL_START');
    }

    startWave() {
        if (this.state !== STATE.PLANNING && this.state !== STATE.BETWEEN_WAVES) return;

        if (this.waveManager.hasNextWave()) {
            this.waveManager.startNextWave();
            this.state = STATE.WAVE_RUNNING;
            this.ui.clearSelection();
            this.refreshUI();
        }
    }

    update(dt) {
        if (this.state === STATE.WAVE_RUNNING) {
            // 更新波次
            this.waveManager.update(dt, this.enemies);

            // 更新敌人
            this.hasShadowEnemies = false;
            for (const e of this.enemies) {
                e.update(dt);
                if (e.alive && e.type === ENEMY_TYPE.SHADOW) {
                    this.hasShadowEnemies = true;
                }
                if (e.reachedEnd && e.alive) {
                    this.lives--;
                    e.alive = false;
                }
            }

            // 重算光束（有 Shadow 敌人时每帧重算）
            if (this.hasShadowEnemies || this.beamSystem.isDirty) {
                this.beamSystem.calculate(this.grid);
            }

            // 光束伤害
            this.beamSystem.applyDamage(this.grid, this.enemies, dt);

            // 蓄能晶体充能
            const crystals = this.grid.getElementsByType(ELEMENT.ENERGY_CRYSTAL);
            for (const crystal of crystals) {
                if (crystal.isCharging) {
                    const intensity = this.beamSystem.getBeamIntensityAt(crystal.col, crystal.row);
                    crystal.addEnergy(intensity * CRYSTAL_CHARGE_RATE * dt);

                    if (crystal.isFullyCharged()) {
                        // AOE 爆炸
                        const pos = this.grid.gridToPixel(crystal.col, crystal.row);
                        const blastPixelRadius = crystal.blastRadius * CELL_SIZE;

                        for (const e of this.enemies) {
                            if (!e.alive) continue;
                            const dx = e.x - pos.x;
                            const dy = e.y - pos.y;
                            if (Math.sqrt(dx * dx + dy * dy) <= blastPixelRadius) {
                                e.takeDamage(crystal.blastDamage);
                            }
                        }

                        this.particles.spawnAOE(pos.x, pos.y, crystal.blastRadius, { r: 0.8, g: 0.3, b: 1 });
                        crystal.blast();
                    }
                }
            }

            // 处理死亡
            for (const e of this.enemies) {
                if (!e.alive && e.hp <= 0 && !e._exploded) {
                    e._exploded = true;
                    const weakColor = e.colorWeakness || { r: 1, g: 0.5, b: 0 };
                    this.particles.spawnExplosion(e.x, e.y, weakColor);
                }
            }

            // 清理死亡和到达终点的敌人
            this.enemies = this.enemies.filter(e => e.alive);

            // 检查胜负
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

        // 更新粒子
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

        // 放置预览
        if ((this.state === STATE.PLANNING || this.state === STATE.BETWEEN_WAVES) &&
            this.ui.selectedType && this.ui.selectedType !== 'DELETE' &&
            this.mouseCol >= 0 && this.mouseRow >= 0) {
            this.renderer.renderPlacementPreview(
                this.grid, this.mouseCol, this.mouseRow,
                this.ui.placingPreview
            );
        }

        // 删除模式高亮
        if ((this.state === STATE.PLANNING || this.state === STATE.BETWEEN_WAVES) &&
            this.ui.selectedType === 'DELETE' &&
            this.mouseCol >= 0 && this.mouseRow >= 0) {
            const el = this.grid.getElementAt(this.mouseCol, this.mouseRow);
            if (el && !el.preplaced) {
                const x = GRID_OFFSET_X + this.mouseCol * CELL_SIZE;
                const y = GRID_OFFSET_Y + this.mouseRow * CELL_SIZE;
                this.renderer.dynCtx.fillStyle = 'rgba(255, 50, 50, 0.3)';
                this.renderer.dynCtx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            }
        }

        // HUD
        if (this.state !== STATE.LEVEL_SELECT) {
            this.renderer.renderHUD({
                lives: this.lives,
                levelName: this.currentLevelData ? this.currentLevelData.name : '',
                waveNum: this.waveManager.getWaveNumber(),
                totalWaves: this.waveManager.getTotalWaves()
            });
        }

        // 覆盖层
        if (this.state === STATE.WIN) {
            this.renderer.renderOverlay('胜 利 !', '关卡通过', '#44ff88');
        } else if (this.state === STATE.LOSE) {
            this.renderer.renderOverlay('失 败', '生命值耗尽', '#ff4444');
        }
    }

    refreshUI() {
        this.ui.renderPanel(this.state, this.availableElements);
    }

    retryLevel() {
        this.loadLevel(this.currentLevelIndex);
    }

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
