/* ============================================================
   LAB.JS — code playground for the Lab section
   Four categories, each with realistic code + terminal output
   ============================================================ */

(function () {
    'use strict';

    // ============================================
    // 1. CONTENT
    // ============================================
    // Inline syntax token format: [[cls:text]]
    // Supported cls: kw | str | fn | num | cmt | op | cls | self
    // ============================================

    const LABS = [
        {
            id: 'languages',
            num: '01',
            name: 'Languages',
            file: 'main.py',
            items: [
                ['Python', 'primary'],
                ['C++', 'systems'],
                ['JavaScript', 'web'],
                ['SQL', 'data']
            ],
            code: [
                '[[cmt:# ── python ──────────────────]]',
                '[[kw:import]] [[cls:torch]]',
                '[[kw:import]] [[cls:numpy]] [[kw:as]] [[self:np]]',
                '',
                '[[kw:def]] [[fn:train_agent]](env, epochs[[op:=]][[num:100]]):',
                '    [[self:agent]] [[op:=]] [[cls:PPO]](env)',
                '    [[kw:for]] epoch [[kw:in]] [[fn:range]](epochs):',
                '        loss [[op:=]] [[self:agent]].[[fn:step]]()',
                '        [[kw:if]] loss [[op:<]] [[num:0.05]]:',
                '            [[kw:break]]',
                '    [[kw:return]] [[self:agent]]',
                '',
                '[[cmt:// ── c++ ─────────────────────]]',
                '[[kw:#include]] [[str:<iostream>]]',
                '[[kw:int]] [[fn:main]]() {',
                '    std::cout [[op:<<]] [[str:"compiled"]];',
                '}',
                '',
                '[[cmt:// ── js ──────────────────────]]',
                '[[kw:const]] [[fn:run]] [[op:=]] () [[op:=>]] {',
                '    console.[[fn:log]]([[str:"ready"]]);',
                '};'
            ],
            output: [
                { t: 120, cls: 'out-dim', text: '$ python main.py' },
                { t: 380, cls: 'out-info', text: '▸ importing torch 2.4.0 (cuda:12.1)' },
                { t: 220, cls: 'out-dim', text: '  loading PPO agent...' },
                { t: 520, cls: 'out-ok', text: '✓ model loaded · 4.2M params' },
                { t: 400, cls: '', text: '' },
                { t: 120, cls: 'out-dim', text: '$ ./cpp_main' },
                { t: 340, cls: 'out-ok', text: '✓ compiled in 0.42s' },
                { t: 120, cls: '', text: 'compiled' },
                { t: 380, cls: 'out-dim', text: '$ node app.js' },
                { t: 240, cls: 'out-ok', text: '✓ server listening on :3000' },
                { t: 340, cls: 'out-info', text: 'ready' },
                { t: 480, cls: 'out-ok', text: '● all 3 languages · ready' }
            ]
        },

        {
            id: 'frameworks',
            num: '02',
            name: 'Frameworks',
            file: 'server.py',
            items: [
                ['FastAPI', 'backend'],
                ['Android', 'mobile'],
                ['PostgreSQL', 'database'],
                ['Unity', 'simulation']
            ],
            code: [
                '[[cmt:# ── fastapi ──────────────────]]',
                '[[kw:from]] [[cls:fastapi]] [[kw:import]] [[cls:FastAPI]]',
                '[[kw:from]] [[cls:pydantic]] [[kw:import]] [[cls:BaseModel]]',
                '',
                '[[self:app]] [[op:=]] [[cls:FastAPI]]()',
                '',
                '[[kw:class]] [[cls:Score]]([[cls:BaseModel]]):',
                '    player: [[cls:str]]',
                '    score:  [[cls:int]]',
                '',
                '[[op:@]][[self:app]].[[fn:post]]([[str:"/api/scores"]] )',
                '[[kw:async def]] [[fn:submit]](s: [[cls:Score]]):',
                '    [[kw:await]] db.[[fn:insert]](',
                '        [[str:"scores"]], s.[[fn:dict]]()',
                '    )',
                '    [[kw:return]] {[[str:"ok"]]: [[kw:True]]}',
                '',
                '[[cmt:# ── sql query ─────────────────]]',
                '[[kw:SELECT]] player, [[fn:AVG]](score)',
                '[[kw:FROM]]   scores',
                '[[kw:GROUP BY]] player',
                '[[kw:ORDER BY]] [[fn:AVG]](score) [[kw:DESC]];'
            ],
            output: [
                { t: 140, cls: 'out-dim', text: '$ uvicorn server:app --reload' },
                { t: 420, cls: 'out-info', text: 'INFO:     starting uvicorn server' },
                { t: 320, cls: 'out-dim', text: 'INFO:     loading app from server.py' },
                { t: 380, cls: 'out-ok', text: 'INFO:     routes registered · 3 endpoints' },
                { t: 340, cls: 'out-dim', text: 'INFO:     connected to postgres@localhost:5432' },
                { t: 420, cls: 'out-ok', text: 'INFO:     uvicorn running on http://127.0.0.1:8000' },
                { t: 500, cls: '', text: '' },
                { t: 120, cls: 'out-dim', text: '$ curl -X POST /api/scores' },
                { t: 260, cls: 'out-info', text: '  {"player":"dile","score":1337}' },
                { t: 380, cls: 'out-ok', text: '✓ 201 created · 12ms' },
                { t: 420, cls: '', text: '' },
                { t: 120, cls: 'out-dim', text: '$ psql -c "SELECT player, AVG(score)..."' },
                { t: 340, cls: '', text: '  player    | avg' },
                { t: 200, cls: '', text: '  ----------+--------' },
                { t: 200, cls: 'out-ok', text: '  dile      | 1337.0' },
                { t: 200, cls: 'out-ok', text: '  yousef    |  892.5' },
                { t: 200, cls: 'out-ok', text: '  mahmoud   |  745.0' },
                { t: 220, cls: 'out-dim', text: '  (3 rows · 4.2ms)' }
            ]
        },

        {
            id: 'aidata',
            num: '03',
            name: 'AI / Data',
            file: 'train.py',
            items: [
                ['Reinforcement Learning', 'focus'],
                ['Machine Learning', 'core'],
                ['Local LLMs', 'ollama'],
                ['Data pipelines', 'ETL']
            ],
            code: [
                '[[cmt:# ── build the model ─────────────]]',
                '[[kw:import]] [[cls:torch]]',
                '[[kw:import]] [[cls:torch.nn]] [[kw:as]] [[self:nn]]',
                '',
                '[[kw:class]] [[cls:ActorCritic]]([[self:nn]].[[cls:Module]]):',
                '    [[kw:def]] [[fn:__init__]]([[self:self]], obs_dim, act_dim):',
                '        [[fn:super]]().[[fn:__init__]]()',
                '        [[self:self]].actor  [[op:=]] [[cls:MLP]](obs_dim, act_dim)',
                '        [[self:self]].critic [[op:=]] [[cls:MLP]](obs_dim, [[num:1]])',
                '',
                '    [[kw:def]] [[fn:forward]]([[self:self]], obs):',
                '        logits [[op:=]] [[self:self]].actor(obs)',
                '        value  [[op:=]] [[self:self]].critic(obs)',
                '        [[kw:return]] logits, value',
                '',
                '[[cmt:# ── train loop ────────────────]]',
                'optimizer [[op:=]] [[cls:Adam]](model.[[fn:parameters]](),',
                '                                lr[[op:=]][[num:3e-4]])',
                '',
                '[[kw:for]] epoch [[kw:in]] [[fn:range]]([[num:100]]):',
                '    loss [[op:=]] ppo.[[fn:update]](model, buffer)',
                '    optimizer.[[fn:step]]()',
                '    [[kw:if]] epoch [[op:%]] [[num:10]] [[op:==]] [[num:0]]:',
                '        [[fn:log]](epoch, loss.[[fn:item]]())'
            ],
            output: [
                { t: 140, cls: 'out-dim', text: '$ python train.py --algo ppo --env maze-v3' },
                { t: 400, cls: 'out-info', text: '▸ loading env maze-v3' },
                { t: 320, cls: 'out-info', text: '▸ obs_dim=64  act_dim=4' },
                { t: 340, cls: 'out-info', text: '▸ initializing ActorCritic (2 layers, 128 hidden)' },
                { t: 380, cls: '', text: '' },
                { t: 200, cls: 'out-dim', text: 'epoch    loss      reward    entropy' },
                { t: 100, cls: 'out-dim', text: '──────   ──────    ──────    ───────' },
                { t: 260, cls: '', text: '   0     0.847      -3.21      1.84' },
                { t: 220, cls: '', text: '  10     0.412       1.05      1.62' },
                { t: 220, cls: '', text: '  20     0.281       3.88      1.41' },
                { t: 220, cls: '', text: '  30     0.196       5.42      1.28' },
                { t: 220, cls: 'out-ok', text: '  40     0.131       6.97      1.14' },
                { t: 220, cls: 'out-ok', text: '  50     0.098       7.84      0.98' },
                { t: 220, cls: 'out-ok', text: '  60     0.075       8.11      0.91' },
                { t: 220, cls: 'out-ok', text: '  70     0.061       8.32      0.87' },
                { t: 220, cls: 'out-ok', text: '  80     0.052       8.41      0.84' },
                { t: 220, cls: 'out-ok', text: '  90     0.046       8.44      0.82' },
                { t: 400, cls: 'out-info', text: '✓ best reward: 8.47 · saved to checkpoints/best.pt' }
            ]
        },

        {
            id: 'other',
            num: '04',
            name: 'Other',
            file: 'PlayerController.cs',
            items: [
                ['REST APIs', 'design'],
                ['Responsive Web', 'frontend'],
                ['Git', 'workflow'],
                ['Linux', 'dev']
            ],
            code: [
                '[[cmt:// ── unity · player ────────────]]',
                '[[kw:using]] [[cls:UnityEngine]];',
                '[[kw:using]] [[cls:System.Net.Http]];',
                '',
                '[[kw:public class]] [[cls:Player]] : [[cls:MonoBehaviour]] {',
                '    [[kw:public float]] speed [[op:=]] [[num:5f]];',
                '    [[kw:private]] [[cls:Rigidbody]] rb;',
                '',
                '    [[kw:void]] [[fn:Start]]() {',
                '        rb [[op:=]] [[fn:GetComponent]]<[[cls:Rigidbody]]>();',
                '        [[fn:SubmitScore]]([[num:1337]]);',
                '    }',
                '',
                '    [[kw:void]] [[fn:Update]]() {',
                '        [[kw:float]] h [[op:=]] [[cls:Input]].[[fn:GetAxis]]([[str:"Horizontal"]]);',
                '        rb.[[fn:AddForce]](h [[op:*]] speed, [[num:0]], [[num:0]]);',
                '    }',
                '',
                '    [[kw:async void]] [[fn:SubmitScore]]([[kw:int]] s) {',
                '        [[kw:var]] body [[op:=]] [[fn:Json]]({ player: [[str:"dile"]], score: s });',
                '        [[kw:await]] http.[[fn:PostAsync]](',
                '            [[str:"https://api.local/scores"]], body);',
                '    }',
                '}'
            ],
            output: [
                { t: 140, cls: 'out-dim', text: '$ dotnet build · PlayerController.cs' },
                { t: 380, cls: 'out-info', text: '▸ resolving references...' },
                { t: 320, cls: 'out-info', text: '▸ compiling assembly-csharp.dll' },
                { t: 420, cls: 'out-ok', text: '✓ build succeeded · 0 errors · 0 warnings' },
                { t: 500, cls: '', text: '' },
                { t: 160, cls: 'out-dim', text: '$ unity-editor --batchmode --run' },
                { t: 340, cls: 'out-info', text: '▸ scene loaded · Assets/Scenes/Maze.unity' },
                { t: 300, cls: 'out-info', text: '▸ physics initialized · 60Hz' },
                { t: 260, cls: 'out-ok', text: '✓ Player.Start() invoked' },
                { t: 420, cls: '', text: '' },
                { t: 140, cls: 'out-dim', text: 'REST  POST /scores' },
                { t: 280, cls: 'out-info', text: '  → { "player": "dile", "score": 1337 }' },
                { t: 380, cls: 'out-ok', text: '  ← 201 Created · 18ms' },
                { t: 340, cls: '', text: '' },
                { t: 140, cls: 'out-dim', text: 'git log --oneline -3' },
                { t: 200, cls: '', text: '  a3f9d21  add score submission' },
                { t: 180, cls: '', text: '  b81c04e  fix rigidbody force' },
                { t: 180, cls: '', text: '  7d2a905  initial player controller' },
                { t: 380, cls: 'out-ok', text: '● all systems nominal' }
            ]
        }
    ];

    // ============================================
    // 2. STATE
    // ============================================
    const state = {
        active: null,      // current lab object
        typing: false,
        typed: false,
        running: false,
        typeTimer: null,
        outputTimers: []
    };

    // ============================================
    // 3. DOM REFS (queried once)
    // ============================================
    const grid        = document.getElementById('lab-grid');
    const modal       = document.getElementById('lab-modal');
    const elNum       = document.getElementById('lab-num');
    const elTitle     = document.getElementById('lab-title');
    const elStatus    = document.getElementById('lab-status');
    const elFile      = document.getElementById('lab-file');
    const elRun       = document.getElementById('lab-run');
    const elGutter    = document.getElementById('lab-gutter');
    const elCode      = document.getElementById('lab-code');
    const elOutStatus = document.getElementById('lab-output-status');
    const elOutBody   = document.getElementById('lab-output-body');

    // ============================================
    // 4. RENDER LAB CARDS
    // ============================================
    function renderCards() {
        if (!grid) return;
        LABS.forEach((lab, i) => {
            const card = document.createElement('button');
            card.className = 'lab-card';
            card.setAttribute('data-lab', lab.id);
            card.setAttribute('data-reveal-delay', String((i % 2) * 80));

            const items = lab.items.map(([name, note]) =>
                `<li><span>${name}</span><span class="lab-list-note">${note}</span></li>`
            ).join('');

            card.innerHTML = `
                <div class="lab-card-head">
                    <span class="lab-card-num">${lab.num}</span>
                    <span class="lab-card-name">${lab.name}</span>
                    <span class="lab-card-arrow">↗</span>
                </div>
                <ul class="lab-card-list">${items}</ul>
            `;

            card.addEventListener('click', () => openLab(lab.id));
            grid.appendChild(card);
        });
    }

    // ============================================
    // 5. PARSE SYNTAX TOKENS
    // ============================================
    // Converts "[[cls:text]]" inline markup to structured tokens.
    // Returns array of {cls, text}.
    // ============================================
    function parseLine(raw) {
        const tokens = [];
        const re = /\[\[([a-z]+):(.*?)\]\]/g;
        let lastIndex = 0;
        let m;
        while ((m = re.exec(raw)) !== null) {
            if (m.index > lastIndex) {
                tokens.push({ cls: null, text: raw.slice(lastIndex, m.index) });
            }
            tokens.push({ cls: m[1], text: m[2] });
            lastIndex = re.lastIndex;
        }
        if (lastIndex < raw.length) {
            tokens.push({ cls: null, text: raw.slice(lastIndex) });
        }
        return tokens;
    }

    // ============================================
    // 6. OPEN LAB MODAL
    // ============================================
    function openLab(id) {
        const lab = LABS.find(l => l.id === id);
        if (!lab) return;

        resetState();
        state.active = lab;

        elNum.textContent = lab.num;
        elTitle.textContent = lab.name;
        elStatus.textContent = 'ready';
        elFile.textContent = lab.file;
        elRun.disabled = true;
        elRun.classList.remove('running');
        elRun.querySelector('span:last-child').textContent = 'Run';
        elCode.innerHTML = '';
        elGutter.textContent = '';
        elOutStatus.textContent = 'idle';
        elOutBody.innerHTML = '<span class="lab-output-idle">— press Run to execute —</span>';

        // Build parsed lines
        const parsed = lab.code.map(parseLine);

        // Gutter
        elGutter.textContent = parsed.map((_, i) => i + 1).join('\n');

        // Start typing
        state.typing = true;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => startTyping(parsed));
    }

    // ============================================
    // 7. TYPE CODE, CHARACTER BY CHARACTER
    // ============================================
    function startTyping(parsed) {
        // Flatten to a linear sequence of {lineIdx, tokenIdx, charIdx, cls, ch}
        // Easier: type token by token, char by char, and rebuild the visible HTML.
        // We'll write into a growing structure per line.

        const lineHTML = parsed.map(() => '');  // string of HTML per line
        const lineEls = parsed.map((_, i) => {
            const div = document.createElement('div');
            div.className = 'lab-code-line';
            if (i < parsed.length - 1) div.textContent = '\u00A0'; // placeholder to reserve height
            else div.textContent = '\u00A0';
            elCode.appendChild(div);
            return div;
        });

        let li = 0, ti = 0, ci = 0;

        function escapeHtml(s) {
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function flushLine(idx) {
            const html = lineHTML[idx];
            lineEls[idx].innerHTML = html + '<span class="lab-cursor"></span>';
        }

        function clearCursor(idx) {
            lineEls[idx].innerHTML = lineHTML[idx] || '\u00A0';
        }

        function step() {
            if (li >= parsed.length) {
                // Done
                state.typing = false;
                state.typed = true;
                elRun.disabled = false;
                elStatus.textContent = 'ready to run';
                return;
            }

            const line = parsed[li];

            // Empty line case
            if (line.length === 0) {
                lineHTML[li] = '\u00A0';
                clearCursor(li);
                li++; ti = 0; ci = 0;
                state.typeTimer = setTimeout(step, 90);
                return;
            }

            const token = line[ti];
            if (!token) {
                // End of line
                clearCursor(li);
                li++; ti = 0; ci = 0;
                state.typeTimer = setTimeout(step, 90);
                return;
            }

            const ch = token.text[ci];
            const esc = escapeHtml(ch);
            const isTag = token.cls !== null;

            if (isTag) {
                // Continue the same wrapped tag as long as class stays the same
                // Simplest: wrap each char individually — slightly more markup but correct
                lineHTML[li] += `<span class="tk-${token.cls}">${esc}</span>`;
            } else {
                lineHTML[li] += esc;
            }
            flushLine(li);

            ci++;
            if (ci >= token.text.length) {
                ti++;
                ci = 0;
            }

            // Speed: slightly slower for tags, faster for plain text
            const delay = isTag ? 10 : 14;
            state.typeTimer = setTimeout(step, delay);
        }

        step();
    }

    // ============================================
    // 8. RUN OUTPUT
    // ============================================
    function runOutput() {
        if (!state.active || !state.typed || state.running) return;
        state.running = true;

        elRun.disabled = true;
        elRun.classList.add('running');
        elRun.querySelector('span:last-child').textContent = 'Running…';
        elStatus.textContent = 'executing';
        elOutStatus.textContent = 'running';
        elOutBody.innerHTML = '';

        // Clear any previous timers
        state.outputTimers.forEach(clearTimeout);
        state.outputTimers = [];

        const lines = state.active.output;

        lines.forEach((line, i) => {
            const delay = lines.slice(0, i).reduce((sum, l) => sum + l.t, 0);
            const timer = setTimeout(() => {
                appendOutputLine(line);
                if (i === lines.length - 1) {
                    // Done
                    elRun.classList.remove('running');
                    elRun.disabled = false;
                    elRun.querySelector('span:last-child').textContent = 'Run again';
                    elStatus.textContent = 'complete';
                    elOutStatus.textContent = 'done';
                    state.running = false;
                }
            }, delay);
            state.outputTimers.push(timer);
        });

        elOutBody.scrollTop = 0;
    }

    function appendOutputLine(line) {
        // Empty line
        if (!line.text) {
            const spacer = document.createElement('span');
            spacer.className = 'lab-output-line';
            spacer.innerHTML = '&nbsp;';
            elOutBody.appendChild(spacer);
            elOutBody.scrollTop = elOutBody.scrollHeight;
            return;
        }

        const el = document.createElement('span');
        el.className = 'lab-output-line ' + (line.cls || '');
        el.textContent = line.text;
        elOutBody.appendChild(el);
        elOutBody.scrollTop = elOutBody.scrollHeight;
    }

    // ============================================
    // 9. RESET / CLOSE
    // ============================================
    function resetState() {
        clearTimeout(state.typeTimer);
        state.outputTimers.forEach(clearTimeout);
        state.outputTimers = [];
        state.active = null;
        state.typing = false;
        state.typed = false;
        state.running = false;
    }

    function closeLab() {
        resetState();
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // ============================================
    // 10. WIRE UP EVENTS
    // ============================================
    function wireEvents() {
        if (!modal) return;

        modal.querySelectorAll('[data-close]').forEach(el => {
            el.addEventListener('click', closeLab);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeLab();
            }
        });

        if (elRun) {
            elRun.addEventListener('click', runOutput);
        }
    }

    // ============================================
    // 11. INIT
    // ============================================
    function init() {
        renderCards();
        wireEvents();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('lab — loaded');
})();