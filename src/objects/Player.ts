import Phaser from 'phaser';

/**
 * Player character with velocity-based 4-direction movement for a top-down map.
 *
 * Key ideas:
 * - Uses Arcade Physics velocities; collisions are handled by physics colliders
 * - Only one direction at a time (vertical takes priority over horizontal)
 * - Physics body is positioned at the feet so blocking happens at ground level
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {
  // Keyboard input (arrow keys and WASD)
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: { up: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private moveSpeed = 120;
  private keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  private virtual?: { up: boolean; down: boolean; left: boolean; right: boolean };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
  ) {
    super(scene, x, y, texture, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Keep a small collision box at the feet so head/hat can pass under canopies
    this.setSize(16, 16).setOffset(24, 42);
    this.setCollideWorldBounds(true);

    // Input
    this.keyboard = scene.input.keyboard!;
    this.cursors = this.keyboard.createCursorKeys();
    this.wasd = {
      up: this.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      down: this.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      right: this.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.createAnimations(scene);
  }

  /** Stop walk animation when a physics collision occurs. */
  public handleCollision(): void {
    this.anims.stop();
  }

  /** Link a virtual D-Pad state object for mobile controls. */
  public setVirtualInput(state: { up: boolean; down: boolean; left: boolean; right: boolean }): void {
    this.virtual = state;
  }

  private createAnimations(scene: Phaser.Scene) {
    const anims = scene.anims;
    const has = (key: string) => anims.exists(key);

    // Simple 4-direction walk cycles; play only while moving
    if (!has('walk-down')) {
      anims.create({ key: 'walk-down', frames: anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 10, repeat: -1 });
    }
    if (!has('walk-right')) {
      anims.create({ key: 'walk-right', frames: anims.generateFrameNumbers('player', { start: 8, end: 11 }), frameRate: 10, repeat: -1 });
    }
    if (!has('walk-up')) {
      anims.create({ key: 'walk-up', frames: anims.generateFrameNumbers('player', { start: 12, end: 15 }), frameRate: 10, repeat: -1 });
    }
    if (!has('walk-left')) {
      anims.create({ key: 'walk-left', frames: anims.generateFrameNumbers('player', { start: 4, end: 7 }), frameRate: 10, repeat: -1 });
    }
  }

  update() {
    const up = (this.cursors.up?.isDown || this.wasd.up.isDown) || Boolean(this.virtual?.up);
    const down = (this.cursors.down?.isDown || this.wasd.down.isDown) || Boolean(this.virtual?.down);
    const left = (this.cursors.left?.isDown || this.wasd.left.isDown) || Boolean(this.virtual?.left);
    const right = (this.cursors.right?.isDown || this.wasd.right.isDown) || Boolean(this.virtual?.right);

    let vx = 0;
    let vy = 0;

    // Choose a single cardinal direction (no diagonals). Vertical has priority.
    if (up) {
      vy = -this.moveSpeed;
    } else if (down) {
      vy = this.moveSpeed;
    } else if (left) {
      vx = -this.moveSpeed;
    } else if (right) {
      vx = this.moveSpeed;
    }

    this.setVelocity(vx, vy);

    // If not moving or body is blocked by world/layers, stop the walk animation
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (
      (vx === 0 && vy === 0) ||
      (body && (body.blocked.left || body.blocked.right || body.blocked.up || body.blocked.down))
    ) {
      this.anims.stop();
      return;
    }

    if (vx !== 0) {
      this.play(vx > 0 ? 'walk-right' : 'walk-left', true);
    } else {
      this.play(vy > 0 ? 'walk-down' : 'walk-up', true);
    }
  }
}
