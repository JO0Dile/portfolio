/* ============================================================
   LAB-MODAL.JS — code playground for the 4 lab boxes
   ============================================================ */

(function () {
    'use strict';

    // Which lab box → which demo
    const LABS = {
        'lab-pink':  'languages',
        'lab-lav':   'development',
        'lab-mint':  'aidata',
        'lab-peach': 'other'
    };

    // Code content per lab (with syntax highlight classes)
    const CODE = {
        languages: {
            file: 'hello.py',
            lines: [
                '<span class="tk-cmt"># ── python ──</span>',
                '<span class="tk-kw">def</span> <span class="tk-fn">hello</span>(name):',
                '    <span class="tk-fn">print</span>(<span class="tk-str">f"hi, {name}!"</span>)',
                '',
                '<span class="tk-cmt">// ── c++ ──</span>',
                '<span class="tk-kw">#include</span> <span class="tk-str">&lt;iostream&gt;</span>',
                '<span class="tk-kw">int</span> main() {',
                '    std::cout <span class="tk-kw">&lt;&lt;</span> <span class="tk-str">"hi!"</span>;',
                '}',
                '',
                '<span class="tk-cmt">// ── js ──</span>',
                '<span class="tk-kw">const</span> greet = () => console.<span class="tk-fn">log</span>(<span class="tk-str">"hi!"</span>);'
            ]
        },
        development: {
            file: 'app.html',
            lines: [
                '<span class="tk-cmt">&lt;!-- html --&gt;</span>',
                '<span class="tk-kw">&lt;div</span> <span class="tk-fn">class</span>=<span class="tk-str">"card"</span><span class="tk-kw">&gt;</span>',
                '  <span class="tk-kw">&lt;h1&gt;</span>hello<span class="tk-kw">&lt;/h1&gt;</span>',
                '<span class="tk-kw">&lt;/div&gt;</span>',
                '',
                '<span class="tk-cmt">/* css */</span>',
                '.<span class="tk-fn">card</span> { <span class="tk-fn">background</span>: <span class="tk-str">linear-gradient(...#dff0ff, #d4f7e3)</span>; }',
                '',
                '<span class="tk-cmt"># fastapi</span>',
                '<span class="tk-kw">@app.get</span>(<span class="tk-str">"/api/hello"</span>)',
                '<span class="tk-kw">def</span> <span class="tk-fn">hello</span>(): <span class="tk-kw">return</span> {<span class="tk-str">"msg"</span>: <span class="tk-str">"hi"</span>}'
            ]
        },
        aidata: {
            file: 'train.py',
            lines: [
                '<span class="tk-kw">import</span> torch, numpy <span class="tk-kw">as</span> np',
                '',
                'model = <span class="tk-fn">Sequential</span>(',
                '  <span class="tk-fn">Dense</span>(<span class="tk-num">64</span>, activation=<span class="tk-str">"relu"</span>),',
                '  <span class="tk-fn">Dense</span>(<span class="tk-num">32</span>, activation=<span class="tk-str">"relu"</span>),',
                '  <span class="tk-fn">Dense</span>(<span class="tk-num">1</span>)',
                ')',
                '',
                '<span class="tk-kw">for</span> epoch <span class="tk-kw">in</span> <span class="tk-fn">range</span>(<span class="tk-num">10</span>):',
                '    loss = model.<span class="tk-fn">train</span>()',
                '    <span class="tk-fn">print</span>(<span class="tk-str">f"epoch {epoch} · loss {loss:.3f}"</span>)'
            ]
        },
        other: {
            file: 'PlayerController.cs',
            lines: [
                '<span class="tk-cmt">// unity</span>',
                '<span class="tk-kw">public class</span> <span class="tk-fn">Player</span> : MonoBehaviour {',
                '  <span class="tk-kw">void</span> <span class="tk-fn">Update</span>() {',
                '    transform.<span class="tk-fn">Rotate</span>(<span class="tk-num">0</span>, <span class="tk-num">90</span> * Time.deltaTime, <span class="tk-num">0</span>);',
                '  }',
                '}',
                '',
                '<span class="tk-cmt">// rest api</span>',
                'POST /api/scores',
                '{ <span class="tk-str">"player"</span>: <span class="tk-str">"dile"</span>, <span class="tk-str">"score"</span>: <span class="tk-num">1337</span> }'
            ]
        }
    };

    // Output HTML per lab
    const OUTPUTS = {
        languages: `
            <div class="lab-term-line" style="animation-delay: 0.1s;"><span class="lab-term-prompt">$</span> python hello.py</div>
            <div class="lab-term-line" style="animation-delay: 0.4s;">hi, Hammam!<span class="lab-term-tag tag-py">python</span></div>
            <div class="lab-term-line" style="animation-delay: 0.8s;"><span class="lab-term-prompt">$</span> ./cpp_app</div>
            <div class="lab-term-line" style="animation-delay: 1.1s;">compiled ✓ (0.03s)<span class="lab-term-tag tag-cpp">c++</span></div>
            <div class="lab-term-line" style="animation-delay: 1.5s;"><span class="lab-term-prompt">$</span> node app.js</div>
            <div class="lab-term-line" style="animation-delay: 1.8s;">running on :3000<span class="lab-term-tag tag-js">js</span></div>
            <div class="lab-term-line" style="animation-delay: 2.2s;"><span class="lab-term-prompt">✓</span> all 3 languages ready</div>
        `,
        development: `
            <div class="lab-browser">
                <div class="lab-browser-bar">
                    <span class="lab-browser-dot"></span>
                    <span class="lab-browser-dot"></span>
                    <span class="lab-browser-dot"></span>
                    <span class="lab-browser-url">localhost:8000</span>
                </div>
                <div class="lab-browser-content">
                    <div class="lab-build-box" style="animation-delay: 0.2s;">building layout...</div>
                    <div class="lab-build-box styled" style="animation-delay: 0.9s;">✓ html + css applied</div>
                    <div class="lab-api-call" style="animation-delay: 1.6s;">
                        GET /api/hello <span class="arrow">→</span>
                    </div>
                    <div class="lab-api-response" style="animation-delay: 2.1s;">
                        200 OK · { "msg": "hi from fastapi" }
                    </div>
                </div>
            </div>
            <div class="lab-phone-preview" style="animation-delay: 2.4s;">
                <div class="pp-bar"></div>
                <div class="pp-tile"></div>
                <div class="pp-tile"></div>
                <div class="pp-tile"></div>
            </div>
        `,
        aidata: `
            <div class="lab-ai-header">
                <span>TRAINING</span>
                <span class="epoch-pill">epoch 10 / 10</span>
            </div>
            <div class="lab-ai-chart">
                <svg viewBox="0 0 200 90" preserveAspectRatio="none">
                    <polyline class="loss-line"
                        points="0,80 25,65 50,55 75,42 100,36 125,26 150,20 175,14 200,10"
                        fill="none" stroke="#4fc4dc" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
            </div>
            <div class="lab-ai-neurons">
                <div class="lab-ai-col">
                    <div class="lab-ai-neuron"></div>
                    <div class="lab-ai-neuron"></div>
                    <div class="lab-ai-neuron"></div>
                </div>
                <div class="lab-ai-col">
                    <div class="lab-ai-neuron"></div>
                    <div class="lab-ai-neuron"></div>
                    <div class="lab-ai-neuron"></div>
                    <div class="lab-ai-neuron"></div>
                </div>
                <div class="lab-ai-col">
                    <div class="lab-ai-neuron"></div>
                    <div class="lab-ai-neuron"></div>
                </div>
            </div>
            <div class="lab-ai-sql">
                <table>
                    <thead>
                        <tr><th>epoch</th><th>loss</th><th>acc</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>1</td><td>0.847</td><td>0.42</td></tr>
                        <tr><td>5</td><td>0.312</td><td>0.78</td></tr>
                        <tr><td>10</td><td>0.089</td><td>0.96</td></tr>
                    </tbody>
                </table>
            </div>
        `,
        other: `
            <div class="lab-other-row">
                <div class="lab-cube-scene">
                    <div class="lab-cube">
                        <div class="face f-front"></div>
                        <div class="face f-back"></div>
                        <div class="face f-left"></div>
                        <div class="face f-right"></div>
                        <div class="face f-top"></div>
                        <div class="face f-bottom"></div>
                    </div>
                </div>
                <div class="lab-rest-block">
                    <div class="lab-rest-line">
                        <span class="lab-rest-method">POST</span>
                        <span>/api/scores</span>
                    </div>
                    <div class="lab-rest-line">
                        <span class="lab-rest-status">200</span>
                        <span>saved ✓</span>
                    </div>
                    <div class="lab-rest-line">
                        <span class="lab-rest-method">GET</span>
                        <span>/api/leaderboard</span>
                    </div>
                    <div class="lab-rest-line">
                        <span class="lab-rest-status">200</span>
                        <span>3 players</span>
                    </div>
                </div>
            </div>
            <div class="lab-responsive-block">
                <div class="lab-responsive-label">RESPONSIVE PREVIEW</div>
                <div class="lab-responsive-bar"></div>
            </div>
        `
    };

    // ---------- Build the modal once ----------
    const modal = document.createElement('div');
    modal.className = 'lab-modal';
    modal.innerHTML = `
        <div class="lab-modal-inner">
            <button class="lab-modal-close" aria-label="close">✕</button>
            <div class="lab-modal-head">
                <div class="lab-modal-badge">
                    <span class="dot"></span>
                    <span class="lab-modal-badge-label">LAB</span>
                </div>
                <button class="lab-modal-run">
                    <span>▶</span>
                    <span class="run-label">run</span>
                </button>
            </div>
            <div class="lab-modal-body">
                <div class="lab-code-panel">
                    <div class="lab-code-header">
                        <span class="chip-dot"></span>
                        <span class="chip-dot"></span>
                        <span class="chip-dot"></span>
                        <span class="file-name">code</span>
                    </div>
                    <div class="lab-code-content"></div>
                </div>
                <div class="lab-output-panel">
                    <div class="lab-output-label">
                        <span>output</span>
                        <span class="lab-output-status">idle</span>
                    </div>
                    <div class="lab-output-body">
                        <div class="lab-output-idle">
                            <div class="idle-icon">✦</div>
                            <div>press run to execute</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="lab-modal-foot">
                <div><span class="status-dot-mini"></span>ready</div>
                <div class="lab-modal-foot-right">click outside or press ESC to close</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.lab-modal-close');
    const runBtn = modal.querySelector('.lab-modal-run');
    const badgeLabel = modal.querySelector('.lab-modal-badge-label');
    const fileName = modal.querySelector('.file-name');
    const codeContent = modal.querySelector('.lab-code-content');
    const outputBody = modal.querySelector('.lab-output-body');
    const outputStatus = modal.querySelector('.lab-output-status');
    const runLabel = modal.querySelector('.run-label');

    let typingTimer = null;
    let currentLab = null;
    let codeFinished = false;

    // ---------- Open modal for a lab ----------
    function openLab(labName) {
        const cfg = CODE[labName];
        if (!cfg) return;
        currentLab = labName;
        codeFinished = false;

        badgeLabel.textContent = labName.toUpperCase();
        fileName.textContent = cfg.file;
        codeContent.innerHTML = '';
        outputBody.innerHTML = `<div class="lab-output-idle"><div class="idle-icon">✦</div><div>press run to execute</div></div>`;
        outputStatus.textContent = 'idle';
        runBtn.classList.remove('ready', 'pressed');
        runLabel.textContent = 'run';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Start typing code
        clearTimeout(typingTimer);
        typeCode(cfg.lines);
    }

    // ---------- Type code character by character ----------
    function typeCode(lines) {
        let lineIndex = 0;
        let charIndex = 0;
        let currentLine = null;

        // Build all lines as empty divs first
        const lineEls = lines.map(() => {
            const d = document.createElement('div');
            d.className = 'lab-code-line';
            codeContent.appendChild(d);
            return d;
        });

        // Add cursor
        const cursor = document.createElement('span');
        cursor.className = 'lab-code-cursor';

        function typeNext() {
            if (lineIndex >= lines.length) {
                cursor.remove();
                codeFinished = true;
                runBtn.classList.add('ready');
                outputStatus.textContent = 'ready to run';
                return;
            }

            const rawLine = lines[lineIndex];
            const lineEl = lineEls[lineIndex];

            if (!currentLine) {
                currentLine = '';
                charIndex = 0;
            }

            // Handle HTML tags — reveal them atomically
            const nextChunk = rawLine.slice(charIndex, charIndex + 1);
            currentLine += nextChunk;
            charIndex++;

            // Insert the cursor back at the end of this line
            lineEl.innerHTML = currentLine;
            lineEl.appendChild(cursor);

            // Speed: faster on plain text, slower on tags
            const isTag = nextChunk === '<';
            const delay = isTag ? 8 : 22;

            if (charIndex >= rawLine.length) {
                lineIndex++;
                currentLine = null;
                charIndex = 0;
                // New line pause
                typingTimer = setTimeout(typeNext, 120);
            } else {
                typingTimer = setTimeout(typeNext, delay);
            }
        }

        typeNext();
    }

    // ---------- Run the output demo ----------
    function runOutput() {
        if (!currentLab || !codeFinished) return;
        runBtn.classList.remove('ready');
        runBtn.classList.add('pressed');
        runLabel.textContent = '✓ ran';
        outputStatus.textContent = 'executing...';

        setTimeout(() => {
            runBtn.classList.remove('pressed');
        }, 300);

        // Small delay so the "press" is visible
        setTimeout(() => {
            outputBody.innerHTML = OUTPUTS[currentLab] || '';
            outputStatus.textContent = 'output shown';
        }, 380);
    }

    // ---------- Close modal ----------
    function closeLab() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        clearTimeout(typingTimer);
    }

    // ---------- Attach click handlers to lab boxes ----------
    function attachLabs() {
        document.querySelectorAll('.lab-box').forEach(box => {
            // Skip if already attached
            if (box.dataset.labAttached === '1') return;
            box.dataset.labAttached = '1';

            // Determine lab from class
            let lab = null;
            for (const cls in LABS) {
                if (box.classList.contains(cls)) { lab = LABS[cls]; break; }
            }
            if (!lab) return;

            box.addEventListener('click', (e) => {
                e.stopPropagation();
                openLab(lab);
            });
        });
    }

    // ---------- Global listeners ----------
    closeBtn.addEventListener('click', closeLab);
    runBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!codeFinished) return;
        runOutput();
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLab();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeLab();
    });

    // ---------- Init ----------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachLabs);
    } else {
        attachLabs();
    }
    // Also retry shortly in case other scripts add lab boxes later
    setTimeout(attachLabs, 400);
    setTimeout(attachLabs, 1200);

    console.log('✨ lab-modal.js loaded');
})();