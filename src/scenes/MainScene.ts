import Phaser from 'phaser';
import Player from '../objects/Player';
import VirtualDPad from '../ui/VirtualDPad';

export default class MainScene extends Phaser.Scene {
  private player!: Player;
  private dpad?: VirtualDPad;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Load assets like tilemap, tileset, and player sprite
    this.load.image('tiles', 'tilesets/pokemon_tileset_from_public_tiles_32x32_by_chaoticcherrycake_dab2byf.png');
    this.load.image('adobe-tiles', 'tilesets/Adobe Express - file.png');
    this.load.image('imgur-tiles', 'tilesets/undefined - Imgur.png');
    this.load.tilemapTiledJSON('map', 'maps/new-port.embedded.json');
    this.load.spritesheet('player', 'sprites/sprite.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    // Create tilemap, layers, and player
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('pokemon_tileset_from_public_tiles_32x32_by_chaoticcherrycake_dab2byf', 'tiles');
    const adobeTileset = map.addTilesetImage('Adobe Express - file', 'adobe-tiles');
    const imgurTileset = map.addTilesetImage('undefined - Imgur', 'imgur-tiles');


    if (tileset && adobeTileset && imgurTileset) {
      const allTilesets = [tileset, adobeTileset, imgurTileset];

      // Render layers (visible)
      const groundLayers = [
        map.createLayer('Ground', allTilesets, 0, 0),
        map.createLayer('Ground-Overlay1', allTilesets, 0, 0),
        map.createLayer('Ground-Overlay2', allTilesets, 0, 0),
      ];

      // Collision layers (invisible but solid)
      const collisionLayers = [
        map.createLayer('Collision1', allTilesets, 0, 0),
        map.createLayer('Collision2', allTilesets, 0, 0),
        map.createLayer('Collision3', allTilesets, 0, 0),
        map.createLayer('Collision4', allTilesets, 0, 0),
        map.createLayer('Collision5', allTilesets, 0, 0),
      ];

      // Overlay layers (visible and drawn over player)
      const overlayLayers = [
        map.createLayer('Collision-Overlay1', allTilesets, 0, 0),
        map.createLayer('Collision-Overlay2', allTilesets, 0, 0),
      ];

      // Enable collisions on the collision layers
      collisionLayers.forEach(layer => {
        if (layer) {
          layer.setCollisionByProperty({ collides: true });
          layer.setVisible(true); // Hide collision layers from view
        }
      });

      // Build custom Arcade bodies from Tiled per-tile collision rectangles
      const customCollisionGroup = this.physics.add.staticGroup();

      collisionLayers.forEach(layer => {
        if (!layer) return;

        // We won't add a physics collider against the whole layer to avoid tile-rect collisions
        // Instead, we iterate tiles and create static bodies for each custom rectangle shape
        layer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
          if (!tile || tile.index <= 0) return;
          const props: any = (tile as any).properties || {};
          if (props.collides !== true) return;

          const gid = tile.index;
          // Find the tileset that owns this gid
          const ts = (map.tilesets as any[]).find(tsAny => {
            const first = tsAny.firstgid;
            const count = tsAny.total || tsAny.tileCount || 0;
            return gid >= first && gid < first + count;
          });
          if (!ts) return;

          const localId = gid - (ts.firstgid as number);
          const tdata = (ts as any).tileData ? (ts as any).tileData[localId] : undefined;
          const og = tdata && tdata.objectgroup ? tdata.objectgroup : undefined;
          if (!og) return;

          const rawObjects: any[] = Array.isArray(og.objects)
            ? og.objects
            : og.object
              ? (Array.isArray(og.object) ? og.object : [og.object])
              : [];

          rawObjects.forEach((o: any) => {
            // Only handle rectangle shapes for Arcade
            if (o.ellipse || o.polygon || o.polyline) return;
            const ox = Number(o.x || 0);
            const oy = Number(o.y || 0);
            const ow = Number(o.width || 0);
            const oh = Number(o.height || 0);
            if (ow <= 0 || oh <= 0) return;

            // Convert tile-relative to world coordinates (Arcade bodies are centered)
            const worldX = tile.pixelX + ox + ow / 2;
            const worldY = tile.pixelY + oy + oh / 2;

            const zone = this.add.zone(worldX, worldY, ow, oh);
            this.physics.add.existing(zone, true); // static body
            customCollisionGroup.add(zone);
          });
        });
      });

      // Player
      const startX = 1122;
      const startY = 950;
      const tileSize = map.tileWidth;
      const snappedX = Math.round(startX / tileSize) * tileSize;
      const snappedY = Math.round(startY / tileSize) * tileSize;
      this.player = new Player(this, snappedX, snappedY, 'player');

      // Depth sorting
      groundLayers.forEach(layer => layer?.setDepth(0));
      this.player.setDepth(20);
      overlayLayers.forEach(layer => layer?.setDepth(30));

      // Physics colliders: use custom shapes, not the tile layers
      this.physics.add.collider(this.player, customCollisionGroup, () => {
        this.player.handleCollision();
      });

    } else {
      console.error('Tileset not found. Make sure the tileset name in Tiled matches the key used here.');
    }

    // World & camera bounds
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);


    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);

    // Mobile: wrap in Game Boy shell and enable virtual D-Pad
    const isTouch = this.sys.game.device.input.touch;
    if (isTouch) {
      this.dpad = new VirtualDPad();
      this.player.setVirtualInput(this.dpad.state);
    }

    // Physics
  }

  update() {
    // Handle player movement and interactions
    if (this.player) {
      this.player.update();
    }
  }
}
