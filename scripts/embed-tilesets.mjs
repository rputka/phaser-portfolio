import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

const root = path.resolve('.');
const mapsDir = path.join(root, 'assets', 'maps');
const tilesetsDir = path.join(root, 'assets', 'tilesets');
const inputMap = path.join(mapsDir, 'new-port.json');
const outputMap = path.join(mapsDir, 'new-port.embedded.json');

function embedTilesets(json) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  json.tilesets = json.tilesets.map(ts => {
    if (!ts.source) return ts;
    const tsxPath = path.isAbsolute(ts.source) ? ts.source : path.join(tilesetsDir, path.basename(ts.source));
    const xml = fs.readFileSync(tsxPath, 'utf-8');
    const tsx = parser.parse(xml).tileset;
    const image = tsx.image;

    return {
      firstgid: ts.firstgid,
      name: tsx.name,
      tilewidth: Number(tsx.tilewidth),
      tileheight: Number(tsx.tileheight),
      tilecount: Number(tsx.tilecount),
      columns: Number(tsx.columns),
      image: image?.source ? path.basename(image.source) : undefined,
      imagewidth: image?.width ? Number(image.width) : undefined,
      imageheight: image?.height ? Number(image.height) : undefined,
      tiles: (Array.isArray(tsx.tile) ? tsx.tile : tsx.tile ? [tsx.tile] : []).map(tile => {
        if (tile.properties?.property) {
          const property = Array.isArray(tile.properties.property) ? tile.properties.property : [tile.properties.property];
          const coerceValue = (p) => {
            if (p.type === 'bool') return p.value === true || p.value === 'true';
            if (p.type === 'int') return Number.parseInt(p.value, 10);
            if (p.type === 'float') return Number.parseFloat(p.value);
            return p.value;
          };
          tile.properties = property.map((p) => ({
            name: p.name,
            type: p.type,
            value: coerceValue(p),
          }));
        }
        return tile;
      }),
    };
  });
  return json;
}

function main() {
  const json = JSON.parse(fs.readFileSync(inputMap, 'utf-8'));
  const embedded = embedTilesets(json);
  fs.writeFileSync(outputMap, JSON.stringify(embedded, null, 2));
  console.log(`Wrote ${outputMap}`);
}

main();
