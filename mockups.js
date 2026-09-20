/* ============================================================
   MOCKUPS.JS — dark UI previews for each project
   ============================================================ */

(function () {
    'use strict';

    const MOCKUPS = {

        // ============================================
        // 01 — AAUP Academic Planner
        // Academic dashboard: prerequisite tree + course grid
        // ============================================
        "01": `
            <div class="mock-chrome">
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-title">aaup-planner · /plan/fall-2026</span>
                <span class="mock-chrome-spacer"></span>
                <span class="mock-chrome-status">synced</span>
            </div>
            <div class="mock-body mock-aaup">
                <div class="mock-aaup-side">
                    <div class="mock-aaup-side-title">Prerequisite chain</div>
                    <div class="mock-aaup-node done">CS101 · Intro CS</div>
                    <div class="mock-aaup-node done">CS201 · Data Structures</div>
                    <div class="mock-aaup-node active">CS301 · Algorithms</div>
                    <div class="mock-aaup-node locked">CS401 · Compilers</div>
                    <div class="mock-aaup-node locked">CS499 · Thesis</div>
                </div>
                <div class="mock-aaup-main">
                    <div class="mock-aaup-header">
                        <span class="mock-aaup-title">Fall 2026 · Semester Plan</span>
                        <span class="mock-aaup-count">4 COURSES · 13 CR</span>
                    </div>
                    <div class="mock-aaup-courses">
                        <div class="mock-aaup-course">
                            <div class="mock-aaup-course-code">CS201</div>
                            <div class="mock-aaup-course-name">Data Structures</div>
                            <div class="mock-aaup-bar"><div class="mock-aaup-bar-fill" style="width: 72%"></div></div>
                        </div>
                        <div class="mock-aaup-course">
                            <div class="mock-aaup-course-code">AI310</div>
                            <div class="mock-aaup-course-name">Intro to Artificial Intelligence</div>
                            <div class="mock-aaup-bar"><div class="mock-aaup-bar-fill" style="width: 41%; animation-delay: 0.1s"></div></div>
                        </div>
                        <div class="mock-aaup-course">
                            <div class="mock-aaup-course-code">MATH220</div>
                            <div class="mock-aaup-course-name">Linear Algebra</div>
                            <div class="mock-aaup-bar"><div class="mock-aaup-bar-fill" style="width: 88%; animation-delay: 0.2s"></div></div>
                        </div>
                        <div class="mock-aaup-course">
                            <div class="mock-aaup-course-code">ENG150</div>
                            <div class="mock-aaup-course-name">Technical Writing</div>
                            <div class="mock-aaup-bar"><div class="mock-aaup-bar-fill" style="width: 14%; animation-delay: 0.3s"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        `,

        // ============================================
        // 02 — Construction & Trades
        // Mobile app: worker tabs, attendance, wage total
        // ============================================
        "02": `
            <div class="mock-chrome">
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-title">trades · site-04-tlv</span>
                <span class="mock-chrome-spacer"></span>
                <span class="mock-chrome-status">offline · syncing</span>
            </div>
            <div class="mock-body mock-phone-wrap">
                <div class="mock-phone">
                    <div class="mock-phone-top">
                        <span>SITE #04 · TLV</span>
                        <span class="mock-phone-live">LIVE</span>
                    </div>
                    <div class="mock-phone-tabs">
                        <div class="mock-phone-tab active">Workers</div>
                        <div class="mock-phone-tab">Hours</div>
                        <div class="mock-phone-tab">Payroll</div>
                    </div>
                    <div class="mock-phone-rows">
                        <div class="mock-phone-row">
                            <div class="mock-phone-avatar">A</div>
                            <span>Ahmed Mansour</span>
                            <span class="mock-phone-status here">IN</span>
                        </div>
                        <div class="mock-phone-row">
                            <div class="mock-phone-avatar">Y</div>
                            <span>Yousef Haddad</span>
                            <span class="mock-phone-status here">IN</span>
                        </div>
                        <div class="mock-phone-row">
                            <div class="mock-phone-avatar">M</div>
                            <span>Mahmoud Said</span>
                            <span class="mock-phone-status late">LATE</span>
                        </div>
                        <div class="mock-phone-row">
                            <div class="mock-phone-avatar">K</div>
                            <span>Khaled Nasser</span>
                            <span class="mock-phone-status off">OFF</span>
                        </div>
                    </div>
                    <div class="mock-phone-total">
                        <span>TODAY'S WAGES</span>
                        <span class="mock-phone-total-val">₪1,240</span>
                    </div>
                </div>
            </div>
        `,

        // ============================================
        // 03 — RL-Scientist
        // ML dashboard: metrics + chart + proposal log
        // ============================================
        "03": `
            <div class="mock-chrome">
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-title">rl-scientist · run #47</span>
                <span class="mock-chrome-spacer"></span>
                <span class="mock-chrome-status">training</span>
            </div>
            <div class="mock-body mock-rls">
                <div class="mock-rls-card">
                    <div class="mock-rls-card-title">Agent Metrics</div>
                    <div class="mock-rls-stat"><span>reward / mean</span><span>0.847</span></div>
                    <div class="mock-rls-stat"><span>loss</span><span>0.023</span></div>
                    <div class="mock-rls-stat"><span>steps</span><span>12.4k</span></div>
                    <div class="mock-rls-stat"><span>episodes</span><span>340</span></div>
                    <div class="mock-rls-card-title" style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #191c22;">LLM Proposals</div>
                    <div class="mock-rls-log">
                        <div class="mock-rls-log-entry"><span class="mock-rls-log-time">01:12</span><span>increase entropy coefficient → 0.015</span></div>
                        <div class="mock-rls-log-entry"><span class="mock-rls-log-time">01:24</span><span>learning rate → 3e-4</span></div>
                        <div class="mock-rls-log-entry"><span class="mock-rls-log-time">01:37</span><span>add LSTM layer between actor &amp; critic</span></div>
                    </div>
                </div>
                <div class="mock-rls-card">
                    <div class="mock-rls-card-title">Reward Curve · Last 100 epochs</div>
                    <svg class="mock-rls-chart" viewBox="0 0 260 90" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="rlsgrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="rgba(77, 139, 245, 0.35)"/>
                                <stop offset="100%" stop-color="rgba(77, 139, 245, 0)"/>
                            </linearGradient>
                        </defs>
                        <path d="M0,82 C20,78 35,72 55,66 C75,60 90,62 110,52 C130,42 145,38 165,28 C185,18 205,22 230,12 L260,8 L260,90 L0,90 Z" fill="url(#rlsgrad)"/>
                        <path d="M0,82 C20,78 35,72 55,66 C75,60 90,62 110,52 C130,42 145,38 165,28 C185,18 205,22 230,12 L260,8" fill="none" stroke="#4d8bf5" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M0,86 C25,84 45,80 65,76 C85,72 105,70 125,64 C145,58 165,54 185,46 C205,38 225,36 260,28" fill="none" stroke="#3fca7d" stroke-width="1" stroke-dasharray="3 3" opacity="0.7"/>
                    </svg>
                    <div class="mock-rls-stat" style="margin-top: 14px;"><span>best reward</span><span>0.847</span></div>
                    <div class="mock-rls-stat"><span>mean reward</span><span>0.712</span></div>
                    <div class="mock-rls-stat"><span>improvement</span><span>+0.328</span></div>
                </div>
            </div>
        `,

        // ============================================
        // 04 — Listing Lab
        // Split panel: input form + generated output
        // ============================================
        "04": `
            <div class="mock-chrome">
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-title">listing-lab · local</span>
                <span class="mock-chrome-spacer"></span>
                <span class="mock-chrome-status">ollama · qwen2.5</span>
            </div>
            <div class="mock-body mock-split">
                <div class="mock-split-col">
                    <div class="mock-split-head"><span>Input</span><span style="color: #3fca7d;">●</span></div>
                    <div class="mock-input">
                        <label class="mock-input-label">Product</label>
                        <div class="mock-input-val typing">
                            <span class="mock-typed">Vintage denim jacket</span><span class="mock-caret"></span>
                        </div>
                    </div>
                    <div class="mock-input">
                        <label class="mock-input-label">Condition</label>
                        <div class="mock-input-val">Good · Size M</div>
                    </div>
                    <div class="mock-input">
                        <label class="mock-input-label">Category</label>
                        <div class="mock-input-val">Fashion → Outerwear → Jackets</div>
                    </div>
                    <div class="mock-generate">▶ Generate Listing</div>
                </div>
                <div class="mock-split-col">
                    <div class="mock-split-head"><span>Generated</span><span style="color: #4d8bf5;">✦</span></div>
                    <div class="mock-output" style="animation-delay: 0.4s;">
                        <div class="mock-output-title">Vintage 90s Denim Jacket · Men's Medium</div>
                        <div class="mock-output-desc">Classic washed denim with original hardware. Soft broken-in feel — perfect layering piece for fall.</div>
                        <div class="mock-tags">
                            <span class="mock-tag">vintage</span>
                            <span class="mock-tag">denim</span>
                            <span class="mock-tag">90s</span>
                            <span class="mock-tag">menswear</span>
                        </div>
                    </div>
                    <div class="mock-price">
                        <span>SUGGESTED PRICE</span>
                        <span class="mock-price-val">₪185</span>
                    </div>
                </div>
            </div>
        `,

        // ============================================
        // 05 — AIMaze
        // Grid maze with animated agent + training stats
        // ============================================
        "05": `
            <div class="mock-chrome">
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-dot"></span>
                <span class="mock-chrome-title">aimaze · episode 1284</span>
                <span class="mock-chrome-spacer"></span>
                <span class="mock-chrome-status">training</span>
            </div>
            <div class="mock-body mock-maze-wrap">
                <div class="mock-maze-top">
                    <span>ML-AGENTS · POLICY : PPO</span>
                    <span class="mock-maze-live">RUNNING</span>
                </div>
                <div class="mock-maze">
                    <div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div>
                    <div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell"></div>
                    <div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div>
                    <div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div>
                    <div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div>
                    <div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div>
                    <div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div>
                    <div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div><div class="mock-cell wall"></div><div class="mock-cell"></div>
                    <div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell"></div><div class="mock-cell goal"></div>
                    <div class="mock-agent"></div>
                </div>
                <div class="mock-maze-stats">
                    <div class="mock-maze-stat">
                        <span class="mock-maze-stat-label">Steps</span>
                        <span class="mock-maze-stat-value">124</span>
                    </div>
                    <div class="mock-maze-stat">
                        <span class="mock-maze-stat-label">Reward</span>
                        <span class="mock-maze-stat-value">+8.42</span>
                    </div>
                    <div class="mock-maze-stat">
                        <span class="mock-maze-stat-label">Success</span>
                        <span class="mock-maze-stat-value">94%</span>
                    </div>
                </div>
            </div>
        `
    };

    // ============================================
    // Public API
    // ============================================
    window.createMockup = function (id) {
        const html = MOCKUPS[id];
        if (!html) {
            return `<div class="mock"><div class="mock-body" style="display:flex;align-items:center;justify-content:center;color:#4a525c;font-family:var(--font-mono);font-size:12px;">preview unavailable</div></div>`;
        }
        const el = document.createElement('div');
        el.className = 'mock';
        el.innerHTML = html;
        return el;
    };

    console.log('mockups — loaded · ids:', Object.keys(MOCKUPS).join(', '));
})();