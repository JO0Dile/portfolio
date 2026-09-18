/* ============================================================
   FIX-TITLES.JS — removes the green duplicate text on titles
   ============================================================ */
(function () {
    function stripGradient() {
        document.querySelectorAll('.panel-title').forEach(t => {
            t.style.backgroundImage = 'none';
            t.style.webkitBackgroundClip = '';
            t.style.backgroundClip = '';
            t.style.webkitTextFillColor = '';
            t.style.backgroundPosition = '';
            t.style.backgroundSize = '';
        });
    }
    stripGradient();
    setTimeout(stripGradient, 500);
    setTimeout(stripGradient, 1500);
    window.addEventListener('load', stripGradient);
})();