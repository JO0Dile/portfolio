/* ============================================================
   BUILDING-ROWS.JS — make "currently building" rows clickable
   Opens the matching project modal (reuses openModal from script.js)
   ============================================================ */

(function () {
    'use strict';

    // Map building-row name → project id
    const ROW_TO_PROJECT = {
        'RL-Scientist':            '03',
        'AIMaze':                  '05',
        'AAUP Academic Planner':   '01'
    };

    function attach() {
        document.querySelectorAll('.building-row').forEach(row => {
            if (row.dataset.bRow === '1') return;
            row.dataset.bRow = '1';

            const nameEl = row.querySelector('span');
            if (!nameEl) return;
            const name = nameEl.textContent.trim();
            const projectId = ROW_TO_PROJECT[name];
            if (!projectId) return;

            // Cursor + visual hint
            row.style.cursor = 'pointer';
            row.setAttribute('title', 'open project');

            row.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof openModal === 'function') {
                    openModal(projectId);
                } else if (typeof window.openModal === 'function') {
                    window.openModal(projectId);
                }
            });

            // Hover brighten
            row.addEventListener('mouseenter', () => {
                row.style.background = 'var(--cyan-soft)';
                row.style.transition = 'background 0.25s ease, transform 0.25s ease';
                row.style.transform = 'translateX(4px)';
            });
            row.addEventListener('mouseleave', () => {
                row.style.background = '';
                row.style.transform = '';
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attach);
    } else {
        attach();
    }
    setTimeout(attach, 400);
    setTimeout(attach, 1200);

    console.log('✨ building-rows.js loaded');
})();