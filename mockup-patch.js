/* ============================================================
   MOCKUP-PATCH.JS v2 — real character typing on Listing Lab
   ============================================================ */

(function () {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof projectData === 'undefined') {
                console.warn('[mockup-patch] projectData not found');
                return;
            }

            // ---------- Listing Lab (04) — with real typing ----------
            if (projectData["04"]) {
                projectData["04"].mockup = `
                    <div class="mockup-chrome">
                        <span class="mockup-dot mockup-red"></span>
                        <span class="mockup-dot mockup-yellow"></span>
                        <span class="mockup-dot mockup-green"></span>
                        <span class="mockup-title">listing-lab · ollama</span>
                    </div>
                    <div class="mockup-body mockup-split">
                        <div class="split-left">
                            <div class="split-title"><span>input</span><span>✦</span></div>
                            <div class="split-input">
                                <label>product</label>
                                <div class="split-input-value typing">
                                    <span class="typed-text">Vintage denim jacket</span><span class="type-cursor"></span>
                                </div>
                            </div>
                            <div class="split-input">
                                <label>condition</label>
                                <div class="split-input-value">Good · size M</div>
                            </div>
                            <div class="split-input">
                                <label>category</label>
                                <div class="split-input-value">Fashion → outerwear</div>
                            </div>
                            <button class="split-gen-btn">✦ generate</button>
                        </div>
                        <div class="split-right">
                            <div class="split-title"><span>generated</span><span class="split-spark">✦</span></div>
                            <div class="split-output output-title">
                                <span class="typing-text">Vintage 90s Denim Jacket · Men's Medium</span><span class="type-cursor"></span>
                            </div>
                            <div class="split-output output-desc">Classic washed denim with original hardware. Soft broken-in feel.</div>
                            <div class="split-tags">
                                <span class="split-tag">vintage</span>
                                <span class="split-tag">denim</span>
                                <span class="split-tag">90s</span>
                                <span class="split-tag">menswear</span>
                            </div>
                            <div class="split-price">
                                <span>suggested price</span>
                                <span class="split-price-value">₪185</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            // ---------- AIMaze (05) — unchanged from your version ----------
            if (projectData["05"]) {
                projectData["05"].mockup = `
                    <div class="mockup-chrome">
                        <span class="mockup-dot mockup-red"></span>
                        <span class="mockup-dot mockup-yellow"></span>
                        <span class="mockup-dot mockup-green"></span>
                        <span class="mockup-title">unity · aimaze.unity</span>
                    </div>
                    <div class="mockup-body mockup-maze">
                        <div class="maze-top"><span>ML-Agents · training</span><span class="maze-play">▶ running</span></div>
                        <div class="maze-layout">
                            <div class="maze-hierarchy">
                                <div class="maze-hierarchy-item active">▸ Scene</div>
                                <div class="maze-hierarchy-item">  Maze</div>
                                <div class="maze-hierarchy-item">  Agent</div>
                                <div class="maze-hierarchy-item">  Goal</div>
                                <div class="maze-hierarchy-item">  Traps</div>
                            </div>
                            <div class="maze-scene">
                                <div class="maze-wrapper">
                                    <div class="maze-grid">
                                        <div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div>
                                        <div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div>
                                        <div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div>
                                        <div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div>
                                        <div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div>
                                        <div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell wall"></div><div class="maze-cell"></div>
                                        <div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell wall"></div><div class="maze-cell"></div><div class="maze-cell"></div><div class="maze-cell goal"></div>
                                    </div>
                                    <div class="maze-agent"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            console.log('✅ mockup-patch v2 — Listing Lab typing fixed');
        }, 50);
    });
})();