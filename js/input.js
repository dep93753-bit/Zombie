// Keyboard, mouse and touch input, merged into one simple interface the game reads each frame.

const JOYSTICK_RADIUS = 55;
const TOUCH_LOOK_SCALE = 2.2; // touch drags feel slow compared to a mouse, so boost them

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.lookDX = 0;
    this.lookDY = 0;
    this.fireHeld = false;
    this.firePressed = false;  // true for one frame when fire starts
    this.reloadPressed = false;
    this.pausePressed = false;
    this.joy = { x: 0, y: 0 };  // -1..1, y is forward
    this.isTouch = false;
    this.enabled = false;

    this.#bindKeyboardMouse();
    this.#bindTouch();
  }

  get pointerLocked() {
    return document.pointerLockElement === this.canvas;
  }

  // Movement as { x: strafe, y: forward, sprint }.
  getMove() {
    let x = 0, y = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    let sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');

    if (this.joy.x || this.joy.y) {
      x = this.joy.x;
      y = this.joy.y;
      sprint = Math.hypot(x, y) > 0.95;
    }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, sprint };
  }

  // Call at the end of every frame to clear one-frame inputs.
  endFrame() {
    this.lookDX = 0;
    this.lookDY = 0;
    this.firePressed = false;
    this.reloadPressed = false;
    this.pausePressed = false;
  }

  reset() {
    this.keys.clear();
    this.fireHeld = false;
    this.joy.x = this.joy.y = 0;
    this.endFrame();
  }

  #bindKeyboardMouse() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'KeyR') this.reloadPressed = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.reset());

    document.addEventListener('mousemove', (e) => {
      if (!this.enabled || !this.pointerLocked) return;
      // Some browsers report one huge jump right after the pointer locks; ignore it.
      if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return;
      this.lookDX += e.movementX;
      this.lookDY += e.movementY;
    });
    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled || !this.pointerLocked || e.button !== 0) return;
      this.fireHeld = true;
      this.firePressed = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.fireHeld = false;
    });
  }

  #bindTouch() {
    const joystick = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');
    let joyId = null, joyStartX = 0, joyStartY = 0;
    let lookId = null, lookLastX = 0, lookLastY = 0;

    const setKnob = (dx, dy) => {
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    // The first touch anywhere switches the game into touch mode.
    window.addEventListener('touchstart', () => {
      if (this.isTouch) return;
      this.isTouch = true;
      document.body.classList.add('touch');
      this.onTouchDetected?.();
    }, { passive: true });

    // Left half of the screen is a floating joystick, right half is look.
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch' || !this.enabled) return;
      if (e.clientX < window.innerWidth * 0.45 && joyId === null) {
        joyId = e.pointerId;
        joyStartX = e.clientX;
        joyStartY = e.clientY;
        const r = joystick.offsetWidth / 2;
        joystick.style.left = `${e.clientX - r}px`;
        joystick.style.top = `${e.clientY - r}px`;
        joystick.style.bottom = 'auto';
      } else if (lookId === null) {
        lookId = e.pointerId;
        lookLastX = e.clientX;
        lookLastY = e.clientY;
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId === joyId) {
        let dx = e.clientX - joyStartX;
        let dy = e.clientY - joyStartY;
        const len = Math.hypot(dx, dy);
        if (len > JOYSTICK_RADIUS) { dx *= JOYSTICK_RADIUS / len; dy *= JOYSTICK_RADIUS / len; }
        setKnob(dx, dy);
        this.joy.x = dx / JOYSTICK_RADIUS;
        this.joy.y = -dy / JOYSTICK_RADIUS;
      } else if (e.pointerId === lookId) {
        this.lookDX += (e.clientX - lookLastX) * TOUCH_LOOK_SCALE;
        this.lookDY += (e.clientY - lookLastY) * TOUCH_LOOK_SCALE;
        lookLastX = e.clientX;
        lookLastY = e.clientY;
      }
    });

    const endPointer = (e) => {
      if (e.pointerId === joyId) {
        joyId = null;
        this.joy.x = this.joy.y = 0;
        setKnob(0, 0);
        joystick.style.left = '';
        joystick.style.top = '';
        joystick.style.bottom = '';
      } else if (e.pointerId === lookId) {
        lookId = null;
      }
    };
    this.canvas.addEventListener('pointerup', endPointer);
    this.canvas.addEventListener('pointercancel', endPointer);

    const holdButton = (id, onDown, onUp) => {
      const btn = document.getElementById(id);
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        btn.classList.add('active');
        onDown();
      });
      const up = () => { btn.classList.remove('active'); onUp?.(); };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('pointerleave', up);
    };

    holdButton('btn-fire',
      () => { this.fireHeld = true; this.firePressed = true; },
      () => { this.fireHeld = false; });
    holdButton('btn-reload', () => { this.reloadPressed = true; });
    holdButton('btn-pause', () => { this.pausePressed = true; });
  }
}
