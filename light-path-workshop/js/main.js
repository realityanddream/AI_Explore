// ============================================================
// 光路工坊 - 入口
// ============================================================

(function () {
    const game = new Game();
    let lastTime = 0;

    function gameLoop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        game.update(dt);
        game.render();

        requestAnimationFrame(gameLoop);
    }

    // 启动
    game.goToLevelSelect();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
})();
