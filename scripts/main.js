    /*
    ═══════════════════════════════════════════════════
    INFINITE CANVAS NAVIGATION SYSTEM

    Contents:
    1. Constants
    2. Wall definitions (must match DOM)
    3. State variables
    4. Collision detection
    5. Zone detection (for HUD label)
    6. Render loop (camera + cursor update)
    7. Pointer lock setup
    8. Mouse movement handler
    9. Keyboard fallback (WASD / arrows)
    10. Resize handler
    11. Initialisation
    ═══════════════════════════════════════════════════
    */


    /* ──────────────────────────────────────
       1. CONSTANTS
    ────────────────────────────────────── */

    const WORLD_W     = 4000;   // world width in px
    const WORLD_H     = 3000;   // world height in px
    const MOUSE_SPEED = 1.0;    // cursor sensitivity multiplier
    const CAM_LERP    = 0.07;   // camera smoothing (0=static, 1=instant)
    const CURSOR_R    = 4;      // collision radius around cursor in px


    /* ──────────────────────────────────────
       2. WALL DEFINITIONS
       Each entry: { x, y, w, h } in world px.
       ⚠ MUST match the DOM .wall elements above.
         Visual desync if these diverge.
    ────────────────────────────────────── */

    const walls = [

      // ── Outer boundary (60px thick) ──
      { x: 0,    y: 0,    w: 4000, h: 60   }, // top
      { x: 0,    y: 2940, w: 4000, h: 60   }, // bottom
      { x: 0,    y: 0,    w: 60,   h: 3000 }, // left
      { x: 3940, y: 0,    w: 60,   h: 3000 }, // right

      // ── Vertical void wall (x=3050..3100) ──
      // Gap at y=750..1000 — secret passage to east zone
      { x: 3050, y: 60,   w: 50, h: 690  }, // top segment (y=60..750)
      { x: 3050, y: 1000, w: 50, h: 1940 }, // bottom segment (y=1000..2940)

      // ── Horizontal mid-wall (y=1460..1500) ──
      // Gap at x=1300..1700 — passage to southern zone
      { x: 60,   y: 1460, w: 1240, h: 40 }, // west segment (x=60..1300)
      { x: 1700, y: 1460, w: 1350, h: 40 }, // east segment (x=1700..3050)

    ];


    /* ──────────────────────────────────────
       3. STATE VARIABLES
    ────────────────────────────────────── */

    // Cursor position in world space (float)
    // Initialised near the HERO island
    let cursorX = 1740;
    let cursorY = 1080;

    // Camera position: world-space top-left of viewport
    // Initialised to frame the starting area
    let camX = cursorX - window.innerWidth  / 2;
    let camY = cursorY - window.innerHeight / 2;

    // Clamp camera to valid range on init
    camX = Math.max(0, Math.min(WORLD_W - window.innerWidth,  camX));
    camY = Math.max(0, Math.min(WORLD_H - window.innerHeight, camY));

    let isLocked = false;   // is pointer lock active?
    let rafId    = null;    // requestAnimationFrame handle


    /* ──────────────────────────────────────
       4. COLLISION DETECTION

       isInsideWall(px, py)
         → true if the cursor circle (radius CURSOR_R)
           overlaps any wall rectangle.

       moveCursor(dx, dy)
         → axis-separated movement. Tries X then Y
           independently, so cursor slides along walls
           rather than stopping dead when cornered.
    ────────────────────────────────────── */

    function isInsideWall(px, py) {
      return walls.some(w =>
        px + CURSOR_R > w.x          &&
        px - CURSOR_R < w.x + w.w   &&
        py + CURSOR_R > w.y          &&
        py - CURSOR_R < w.y + w.h
      );
    }

    function moveCursor(dx, dy) {
      const nx = cursorX + dx;
      const ny = cursorY + dy;

      // Attempt X movement independently
      if (!isInsideWall(nx, cursorY)) cursorX = nx;
      // Attempt Y movement (uses potentially updated cursorX for slide)
      if (!isInsideWall(cursorX, ny)) cursorY = ny;

      // Hard clamp to world bounds (belt-and-suspenders)
      cursorX = Math.max(CURSOR_R, Math.min(WORLD_W - CURSOR_R, cursorX));
      cursorY = Math.max(CURSOR_R, Math.min(WORLD_H - CURSOR_R, cursorY));
    }


    /* ──────────────────────────────────────
       5. ZONE DETECTION
       Returns a short string label for the
       region the cursor currently occupies.
       Displayed in the HUD.
    ────────────────────────────────────── */

    function getZone() {
      if (cursorX > 3100) return 'VOID';
      if (cursorY > 1500) return 'SOUTH';
      return 'NORTH';
    }


    /* ──────────────────────────────────────
       6. RENDER LOOP
       Runs every animation frame while locked.

       Per frame:
       a) Lerp camera toward cursor
       b) Clamp camera to world bounds
       c) Apply camera via CSS transform on #world
       d) Position #cursor in screen space
       e) Update HUD text
    ────────────────────────────────────── */

    const worldEl  = document.getElementById('world');
    const cursorEl = document.getElementById('cursor');
    const coordsEl = document.getElementById('hud-coords');
    const zoneEl   = document.getElementById('hud-zone');

    function render() {
      // ── Camera target: keep cursor centred ──
      const targetX = cursorX - window.innerWidth  / 2;
      const targetY = cursorY - window.innerHeight / 2;

      // Clamp target to world bounds
      const clampX = Math.max(0, Math.min(WORLD_W - window.innerWidth,  targetX));
      const clampY = Math.max(0, Math.min(WORLD_H - window.innerHeight, targetY));

      // Lerp camera position (smooth follow)
      camX += (clampX - camX) * CAM_LERP;
      camY += (clampY - camY) * CAM_LERP;

      // ── Apply camera transform ──
      // Math.round prevents subpixel blurring on text
      worldEl.style.transform =
        `translate(${-Math.round(camX)}px, ${-Math.round(camY)}px)`;

      // ── Position fake cursor in screen space ──
      cursorEl.style.left = `${cursorX - camX}px`;
      cursorEl.style.top  = `${cursorY - camY}px`;

      // ── Update HUD ──
      const cx = String(Math.round(cursorX)).padStart(4, '0');
      const cy = String(Math.round(cursorY)).padStart(4, '0');
      coordsEl.textContent = `x:${cx} y:${cy}`;
      zoneEl.textContent   = getZone();

      rafId = requestAnimationFrame(render);
    }


    /* ──────────────────────────────────────
       7. POINTER LOCK SETUP

       Pointer Lock API:
       - requestPointerLock()  — request capture
       - pointerlockchange     — fires on acquire/release
       - pointerlockerror      — fires on failure
       Once locked, mousemove.movementX/Y gives raw delta
       (unbounded, not clamped to viewport).
    ────────────────────────────────────── */

    const overlayEl  = document.getElementById('overlay');
    const enterBtnEl = document.getElementById('enter-btn');

    enterBtnEl.addEventListener('click', () => {
      document.body.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      isLocked = (document.pointerLockElement === document.body);

      if (isLocked) {
        // Lock acquired — hide overlay, start loop
        overlayEl.classList.add('hidden');
        if (!rafId) rafId = requestAnimationFrame(render);
      } else {
        // Lock released (user pressed ESC) — show overlay, stop loop
        overlayEl.classList.remove('hidden');
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });

    document.addEventListener('pointerlockerror', () => {
      // This can happen if the browser blocks the request.
      // Common cause: page not focused, or HTTPS required in some contexts.
      console.warn('[open-field] Pointer lock request failed.');
    });


    /* ──────────────────────────────────────
       8. MOUSE MOVEMENT HANDLER
       movementX/Y: delta since last event.
       Only processed while lock is active.
    ────────────────────────────────────── */

    document.addEventListener('mousemove', (e) => {
      if (!isLocked) return;
      moveCursor(
        e.movementX * MOUSE_SPEED,
        e.movementY * MOUSE_SPEED
      );
    });


    /* ──────────────────────────────────────
       9. KEYBOARD FALLBACK
       WASD and arrow keys as alternative
       navigation — useful if pointer lock
       isn't available or as accessibility aid.
    ────────────────────────────────────── */

    const KEY_STEP = 8; // px per keydown event

    document.addEventListener('keydown', (e) => {
      if (!isLocked) return;

      if (e.key === 'ArrowLeft'  || e.key === 'a') moveCursor(-KEY_STEP, 0);
      if (e.key === 'ArrowRight' || e.key === 'd') moveCursor( KEY_STEP, 0);
      if (e.key === 'ArrowUp'    || e.key === 'w') moveCursor(0, -KEY_STEP);
      if (e.key === 'ArrowDown'  || e.key === 's') moveCursor(0,  KEY_STEP);
    });


    /* ──────────────────────────────────────
       10. RESIZE HANDLER
       Re-clamps camera when viewport resizes
       so we don't see outside world bounds.
    ────────────────────────────────────── */

    window.addEventListener('resize', () => {
      camX = Math.max(0, Math.min(WORLD_W - window.innerWidth,  camX));
      camY = Math.max(0, Math.min(WORLD_H - window.innerHeight, camY));
    });


    /* ──────────────────────────────────────
       11. INITIALISATION
       Run one synchronous render to position
       the world correctly before the overlay
       is dismissed. This prevents a visible
       "snap" on first pointer lock acquisition.
    ────────────────────────────────────── */

    (function init() {
      // Snap camera directly to start position (no lerp)
      const startX = Math.max(0, Math.min(WORLD_W - window.innerWidth,
        cursorX - window.innerWidth  / 2));
      const startY = Math.max(0, Math.min(WORLD_H - window.innerHeight,
        cursorY - window.innerHeight / 2));
      camX = startX;
      camY = startY;

      worldEl.style.transform =
        `translate(${-Math.round(camX)}px, ${-Math.round(camY)}px)`;
      cursorEl.style.left = `${cursorX - camX}px`;
      cursorEl.style.top  = `${cursorY - camY}px`;
    })();