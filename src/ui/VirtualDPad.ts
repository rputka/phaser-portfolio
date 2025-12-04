export type DPadState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

/**
 * Creates a simple DOM-based D-Pad and an optional "Game Boy" frame.
 * It wraps the existing #game container into a framed shell on mobile devices.
 */
export default class VirtualDPad {
  public readonly state: DPadState = { up: false, down: false, left: false, right: false };
  private root: HTMLElement | null = null;

  constructor() {
    this.buildDom();
  }

  private buildDom(): void {
    const game = document.getElementById('game');
    if (!game) return;

    // Build the frame
    const frame = document.createElement('div');
    frame.className = 'gameboy';

    const screen = document.createElement('div');
    screen.className = 'gb-screen';
    frame.appendChild(screen);

    // Move #game into screen
    screen.appendChild(game);

    // Logo text in the bottom border
    const logo = document.createElement('div');
    logo.className = 'gb-logo';
    logo.textContent = 'Ryan Putka™';
    screen.appendChild(logo);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'gb-controls';
    frame.appendChild(controls);

    const dpad = document.createElement('div');
    dpad.className = 'gb-dpad';
    controls.appendChild(dpad);

    // Create a single cross shape that listens for input
    const cross = document.createElement('div');
    cross.className = 'gb-cross';
    dpad.appendChild(cross);
    // Center cap (optional visual smoother)
    const center = document.createElement('div');
    center.className = 'gb-cross-center';
    cross.appendChild(center);

    // We'll attach one handler to the cross and detect direction by coordinates
    this.attachCrossHandlers(cross);

    // A/B buttons on the right (visual only for now)
    const abBtnGroup = document.createElement('div');
    abBtnGroup.className = 'gb-ab-group';
    controls.appendChild(abBtnGroup);

    const makeRound = (cls: string, label: string) => {
      const r = document.createElement('div');
      r.className = `gb-round ${cls}`;
      r.textContent = label;
      return r;
    };
    // Order B then A for visual layout (left to right)
    abBtnGroup.appendChild(makeRound('b', 'B'));
    abBtnGroup.appendChild(makeRound('a', 'A'));

    // Insert into body
    document.body.innerHTML = ''; // Replace body with framed shell for mobile
    document.body.appendChild(frame);

    this.root = frame;
  }

  private attachCrossHandlers(el: HTMLElement): void {
    const handle = (e: Event) => {
      e.preventDefault();
      // Reset all
      this.state.up = false;
      this.state.down = false;
      this.state.left = false;
      this.state.right = false;

      // Determine direction based on touch/mouse coordinates relative to center
      let clientX = 0, clientY = 0;
      if (e.type.startsWith('touch')) {
        const t = (e as TouchEvent).targetTouches[0];
        if (t) { clientX = t.clientX; clientY = t.clientY; }
        else return; // no touches left
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const dist = Math.sqrt(dx*dx + dy*dy);

      // Deadzone in center?
      if (dist < rect.width * 0.1) return;

      // Determine dominant axis
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal
        if (dx < 0) this.state.left = true;
        else this.state.right = true;
      } else {
        // Vertical
        if (dy < 0) this.state.up = true;
        else this.state.down = true;
      }
    };

    const stop = (e: Event) => {
      e.preventDefault();
      this.state.up = false;
      this.state.down = false;
      this.state.left = false;
      this.state.right = false;
    };

    el.addEventListener('touchstart', handle, { passive: false });
    el.addEventListener('touchmove', handle, { passive: false }); // Allow dragging
    el.addEventListener('touchend', stop, { passive: false });
    el.addEventListener('touchcancel', stop, { passive: false });
    el.addEventListener('mousedown', handle);
    el.addEventListener('mousemove', (e) => { if (e.buttons) handle(e); });
    el.addEventListener('mouseup', stop);
    el.addEventListener('mouseleave', stop);
  }

  public destroy(): void {
    if (!this.root) return;
    this.root.remove();
    this.root = null;
  }
}


