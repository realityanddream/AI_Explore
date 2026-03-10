// ============================================================
// 光路工坊 - UI 管理
// ============================================================

class UIManager {
    constructor(game) {
        this.game = game;
        this.panel = document.getElementById('ui-panel');
        this.selectedType = null;
        this.placingPreview = null; // { type, orientation, direction, color }
        this.tutorialShown = new Set();
    }

    renderPanel(state, availableElements, currentWave) {
        this.panel.innerHTML = '';

        if (state === STATE.LEVEL_SELECT || state === STATE.MENU) {
            return;
        }

        if (state === STATE.WIN || state === STATE.LOSE) {
            this.renderEndPanel(state);
            return;
        }

        // 元素按钮
        const elements = [
            { type: ELEMENT.MIRROR, icon: '⟋', name: '反射镜' },
            { type: ELEMENT.PRISM, icon: '△', name: '棱镜' },
            { type: ELEMENT.COLOR_FILTER, icon: '◉', name: '滤镜' },
            { type: ELEMENT.FOCUS_LENS, icon: '◎', name: '透镜' },
            { type: ELEMENT.ENERGY_CRYSTAL, icon: '⬡', name: '晶体' }
        ];

        for (const el of elements) {
            const count = availableElements[el.type] || 0;
            const btn = document.createElement('div');
            btn.className = 'element-btn';
            if (count <= 0) btn.classList.add('disabled');
            if (this.selectedType === el.type) btn.classList.add('selected');

            btn.innerHTML = `
                <span class="icon">${el.icon}</span>
                <span>${el.name}</span>
                <span class="count">×${count}</span>
            `;

            if (count > 0 && (state === STATE.PLANNING || state === STATE.BETWEEN_WAVES)) {
                btn.addEventListener('click', () => {
                    this.selectElement(el.type);
                });
            }

            this.panel.appendChild(btn);
        }

        // 右侧操作区
        const actionArea = document.createElement('div');
        actionArea.id = 'action-area';

        if (state === STATE.PLANNING || state === STATE.BETWEEN_WAVES) {
            // 删除模式按钮
            const delBtn = document.createElement('div');
            delBtn.className = 'action-btn' + (this.selectedType === 'DELETE' ? ' selected' : '');
            delBtn.textContent = '🗑 删除';
            delBtn.style.cssText = this.selectedType === 'DELETE' ? 'border-color: #ff4444; box-shadow: 0 0 8px rgba(255,68,68,0.3);' : '';
            delBtn.addEventListener('click', () => {
                this.selectedType = this.selectedType === 'DELETE' ? null : 'DELETE';
                this.game.refreshUI();
            });
            actionArea.appendChild(delBtn);

            const startBtn = document.createElement('div');
            startBtn.className = 'action-btn primary';
            startBtn.textContent = state === STATE.BETWEEN_WAVES ? '▶ 下一波' : '▶ 开始';
            startBtn.addEventListener('click', () => {
                this.game.startWave();
            });
            actionArea.appendChild(startBtn);
        }

        if (state === STATE.WAVE_RUNNING) {
            const info = document.createElement('span');
            info.className = 'hud-item';
            info.textContent = '波次进行中...';
            info.style.marginLeft = 'auto';
            actionArea.appendChild(info);
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
            nextBtn.textContent = '下一关 ▶';
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
