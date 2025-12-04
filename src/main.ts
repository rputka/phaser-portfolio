import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

// Prefer desktop to use Scale FIT + auto center; keep mobile fixed and let the
// Game Boy wrapper handle sizing to avoid double-scaling.
const isTouchDevice = typeof window !== 'undefined'
  && ('ontouchstart' in window || navigator.maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0);

const baseWidth = 1500;
const baseHeight = 850;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  width: baseWidth,
  height: baseHeight,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
  },
  // Desktop: fill available space (height included) and keep centered.
  // ENVELOP ensures the canvas covers the parent entirely; it may crop on the
  // narrower axis, but avoids letterboxing so height is fully used.
  scale: isTouchDevice ? undefined : {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game',
    width: baseWidth,
    height: baseHeight,
  },
  scene: [MainScene],
};

new Phaser.Game(config);
