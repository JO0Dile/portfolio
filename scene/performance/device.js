/* ============================================================
   device.js — one place that decides whether this is a phone
   ------------------------------------------------------------
   Everything that has to be cheaper on a phone reads this rather
   than sniffing the user agent again in five different files.

   Deliberately conservative: a touchscreen laptop is not a phone,
   and a narrow desktop window is not a phone either. It takes a
   coarse pointer AND a small screen, or a mobile user agent AND a
   small screen, before anything gets downgraded.
   ============================================================ */

export const IS_MOBILE = (() => {
    if (typeof window === 'undefined') return false;

    const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const ua = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent || '');
    const narrow = Math.min(window.innerWidth, window.innerHeight) <= 860;

    return (coarse && narrow) || (ua && narrow) || (coarse && ua);
})();

/* The renderer never goes above this. Phones report devicePixelRatio
   of 3 or 4 and rendering this scene at 3x is what kills them; the
   quality manager tightens it further from here. */
export const MAX_DPR = IS_MOBILE ? 1.5 : 2;
