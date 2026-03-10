// ============================================================
// 光路工坊 - UI 管理（能量制 + Tooltip + 快捷键）
// ============================================================

class UIManager {
    constructor(game) {
        this.game = game;
        this.panel = document.getElementById('ui-panel');
        this.selectedType = null;
        this.placingPreview = null;
        this.tutorialShown = new Set();
    }

    renderPanel(state, energy, gameSpeed) {
        this.panel.innerHTML = '';

        if (state === STATE.LEVEL_SELECT || state === STATE.MENU) return;

        if (state === STATE.WIN || state === STATE.LOSE) {
            this.renderEndPanel(state);
            return;
        }

        const canOp = (state === STATE.PLANNING || state === STATE.BETWEEN_WAVES || state === STATE.WAVE_RUNNING);

        // 元素购买按钮（按关卡可用列表过滤）
        const allElements = [
            { type: ELEMENT.LASER_SOURCE, key: '1' },
            { type: ELEMENT.MIRROR, key: '2' },
            { type: ELEMENT.PRISM, key: '3' },
            { type: ELEMENT.COLOR_FILTER, key: '4' },
            { type: ELEMENT.FOCUS_LENS, key: '5' },
            { type: ELEMENT.ENERGY_CRYSTAL, key: '6' }
        ];
        const available = this.game.currentLevelData && this.game.currentLevelData.availableElements;
        const elements = available ? allElements.filter(e => available.includes(e.type)) : allElements;

        for (const el of elements) {
            const data = ELEMENT_DATA[el.type];
            const canAfford = energy >= data.cost;
            const btn = document.createElement('div');
            btn.className = 'element-btn';
            if (!canAfford) btn.classList.add('disabled');
            if (this.selectedType === el.type) btn.classList.add('selected');

            const costColor = canAfford ? '#88aacc' : '#ff6666';
            btn.innerHTML = `
                <span class="icon">${data.icon}</span>
                <span>${data.name}</span>
                <span class="count" style="color:${costColor}">${data.cost}</span>
            `;

            // Tooltip on hover
            btn.addEventListener('mouseenter', (e) => {
                this.showPanelTooltip(btn, data, el.key);
            });
            btn.addEventListener('mouseleave', () => {
                this.hidePanelTooltip();
            });

            if (canOp) {
                btn.addEventListener('click', () => {
                    this.selectElement(el.type);
                });
            }

            this.panel.appendChild(btn);
        }

        // 右侧操作区
        const actionArea = document.createElement('div');
        actionArea.id = 'action-area';

        // 卖出按钮
        if (canOp) {
            const delBtn = document.createElement('div');
            delBtn.className = 'action-btn';
            if (this.selectedType === 'DELETE') {
                delBtn.style.cssText = 'border-color: #ff4444; box-shadow: 0 0 8px rgba(255,68,68,0.3);';
            }
            delBtn.textContent = '卖出[Q]';
            delBtn.addEventListener('click', () => {
                this.selectedType = this.selectedType === 'DELETE' ? null : 'DELETE';
                this.game.refreshUI();
            });
            actionArea.appendChild(delBtn);
        }

        // 暂停/快进
        if (state === STATE.WAVE_RUNNING || state === STATE.PAUSED) {
            const pauseBtn = document.createElement('div');
            pauseBtn.className = 'action-btn';
            pauseBtn.textContent = state === STATE.PAUSED ? '继续[Space]' : '暂停[Space]';
            pauseBtn.addEventListener('click', () => this.game.togglePause());
            actionArea.appendChild(pauseBtn);

            const speedBtn = document.createElement('div');
            speedBtn.className = 'action-btn';
            speedBtn.textContent = gameSpeed === 1 ? '快进[F]' : '正常[F]';
            speedBtn.addEventListener('click', () => this.game.toggleSpeed());
            actionArea.appendChild(speedBtn);
        }

        // 开始/下一波按钮
        if (state === STATE.PLANNING || state === STATE.BETWEEN_WAVES) {
            const startBtn = document.createElement('div');
            startBtn.className = 'action-btn primary';
            startBtn.textContent = state === STATE.BETWEEN_WAVES ? '下一波' : '开始';
            startBtn.addEventListener('click', () => this.game.startWave());
            actionArea.appendChild(startBtn);
        }

        this.panel.appendChild(actionArea);
    }

    renderEndPanel(state) {
        const actionArea = document.createElement('div');
        actionArea.id = 'action-area';
        actionArea.style.margin = '0 auto';

        if (state === STATE.WIN) {
            const nextBtn = document.createElement('div');
            nextBtn.className = 'action-btn primary';
            nextBtn.textContent = '下一关';
            nextBtn.addEventListener('click', () => this.game.nextLevel());
            actionArea.appendChild(nextBtn);
        }

        const retryBtn = document.createElement('div');
        retryBtn.className = 'action-btn';
        retryBtn.textContent = '重新挑战';
        retryBtn.addEventListener('click', () => this.game.retryLevel());
        actionArea.appendChild(retryBtn);

        const menuBtn = document.createElement('div');
        menuBtn.className = 'action-btn';
        menuBtn.textContent = '返回选关';
        menuBtn.addEventListener('click', () => this.game.goToLevelSelect());
        actionArea.appendChild(menuBtn);

        this.panel.appendChild(actionArea);
    }

    showPanelTooltip(btn, data, key) {
        this.hidePanelTooltip();
        if (!btn || typeof btn.getBoundingClientRect !== 'function') return;

        const tip = document.createElement('div');
        tip.id = 'panel-tooltip';

        let upgradeInfo = '';
        if (data.desc.length > 1) {
            upgradeInfo = `<div style="margin-top:6px;border-top:1px solid rgba(60,120,200,0.3);padding-top:4px;font-size:11px;color:#8899bb">`;
            if (data.desc[1]) upgradeInfo += `Lv2: ${data.desc[1]} ($${data.upgrades[0]})<br>`;
            if (data.desc[2]) upgradeInfo += `Lv3: ${data.desc[2]} ($${data.upgrades[1]})`;
            upgradeInfo += '</div>';
        }

        tip.innerHTML = `
            <div style="font-weight:bold;margin-bottom:4px">${data.name} <span style="color:#88aacc;font-weight:normal">[$${data.cost}] [${key}]</span></div>
            <div style="font-size:12px;color:#aabbdd">${data.desc[0]}</div>
            ${upgradeInfo}
        `;

        const rect = btn.getBoundingClientRect();
        tip.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            bottom: ${window.innerHeight - rect.top + 8}px;
            background: rgba(8, 12, 30, 0.96);
            color: #aaccff;
            padding: 10px 14px;
            border: 1px solid rgba(60, 140, 255, 0.5);
            border-radius: 6px;
            font-size: 13px;
            z-index: 200;
            max-width: 260px;
            box-shadow: 0 0 15px rgba(20, 60, 140, 0.4);
            pointer-events: none;
        `;
        document.body.appendChild(tip);
    }

    hidePanelTooltip() {
        const old = document.getElementById('panel-tooltip');
        if (old) old.remove();
    }

    // 在网格中展示已放置元素的信息（用于升级/卖出交互）
    showElementInfo(el, px, py) {
        // 通过 game 的 renderer 来显示，这里只做标记
        // 实际 tooltip 在 renderer.renderElementTooltip 中绘制
    }

    selectElement(type) {
        if (this.selectedType === type) {
            this.selectedType = null;
            this.placingPreview = null;
        } else {
            this.selectedType = type;
            this.placingPreview = this.createPreviewForType(type);
        }
        this.game.refreshUI();
    }

    createPreviewForType(type) {
        switch (type) {
            case ELEMENT.LASER_SOURCE:
                return { type, direction: 'RIGHT', color: { ...COLORS.RED } };
            case ELEMENT.MIRROR:
                return { type, orientation: '/' };
            case ELEMENT.PRISM:
                return { type };
            case ELEMENT.COLOR_FILTER:
                return { type, color: { ...COLORS.RED } };
            case ELEMENT.FOCUS_LENS:
                return { type, direction: 'RIGHT' };
            case ELEMENT.ENERGY_CRYSTAL:
                return { type };
            default:
                return { type };
        }
    }

    clearSelection() {
        this.selectedType = null;
        this.placingPreview = null;
        this.hidePanelTooltip();
    }

    showTutorial(messages, trigger) {
        for (const msg of messages) {
            if (msg.trigger === trigger && !this.tutorialShown.has(msg.message)) {
                this.tutorialShown.add(msg.message);
                this.showToast(msg.message);
            }
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
            background: rgba(10, 20, 50, 0.95); color: #aaccff; padding: 12px 24px;
            border: 1px solid rgba(60, 140, 255, 0.5); border-radius: 8px;
            font-size: 14px; z-index: 100; transition: opacity 0.5s;
            box-shadow: 0 0 20px rgba(40, 80, 180, 0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }
}
