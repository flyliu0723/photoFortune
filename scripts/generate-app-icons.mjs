/**
 * 从 GuajiLogo 品牌规范生成各平台 App 图标
 * 运行: node scripts/generate-app-icons.mjs
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'assets');
const SIZE = 1024;
const CX = SIZE / 2;
const CY = SIZE / 2;

const COLORS = {
  background: '#0A0A0F',
  surface: '#1A1A2E',
  primary: '#00F5FF',
  primaryDim: 'rgba(0,245,255,0.4)',
  primaryFill: 'rgba(0,245,255,0.12)',
};

/** 镜头外环半径（占画布 ~36%） */
const OUTER_R = 370;
/** 内八卦圆半径 */
const INNER_R = OUTER_R * 0.55;
/** 外环描边 */
const OUTER_STROKE = 28;
/** 内环描边 */
const INNER_RING_STROKE = 6;
/** 内环与外环间距 */
const INNER_RING_R = OUTER_R - OUTER_STROKE - 18;

function buildLogoSvg({ background = 'none', monochrome = false } = {}) {
  const bg = background === 'none' ? '' : `<rect width="${SIZE}" height="${SIZE}" fill="${background}"/>`;
  const stroke = monochrome ? '#FFFFFF' : COLORS.primary;
  const fillSurface = monochrome ? 'none' : COLORS.surface;
  const fillRing = monochrome ? 'none' : COLORS.primaryFill;
  const innerStroke = monochrome ? '#FFFFFF' : COLORS.primaryDim;
  const yinFill = monochrome ? '#FFFFFF' : COLORS.primary;
  const yangFill = monochrome ? 'none' : COLORS.primaryFill;
  const dotYin = monochrome ? '#0A0A0F' : COLORS.background;
  const dotYang = monochrome ? '#FFFFFF' : COLORS.primary;

  const taijiR = INNER_R * 0.88;
  const taijiSmallR = taijiR / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${bg}
  <g transform="translate(${CX}, ${CY})">
    <!-- 镜头外环 -->
    <circle r="${OUTER_R}" fill="${fillSurface}" stroke="${stroke}" stroke-width="${OUTER_STROKE}"/>
    <!-- 内光晕环 -->
    <circle r="${INNER_RING_R}" fill="none" stroke="${innerStroke}" stroke-width="${INNER_RING_STROKE}"/>
    <!-- 八卦圆 -->
    <circle r="${INNER_R}" fill="${fillRing}" stroke="${stroke}" stroke-width="${monochrome ? 8 : 4}"/>
    <!-- 太极 -->
    <circle r="${taijiR}" fill="${yangFill}" stroke="${monochrome ? stroke : 'none'}" stroke-width="${monochrome ? 4 : 0}"/>
    <path
      d="M0,-${taijiR} A${taijiR},${taijiR} 0 0,1 0,${taijiR} A${taijiSmallR},${taijiSmallR} 0 0,1 0,0 A${taijiSmallR},${taijiSmallR} 0 0,0 0,-${taijiR} Z"
      fill="${yinFill}"
    />
    <circle cy="-${taijiSmallR}" r="${taijiSmallR * 0.22}" fill="${dotYang}"/>
    <circle cy="${taijiSmallR}" r="${taijiSmallR * 0.22}" fill="${dotYin}"/>
  </g>
</svg>`;
}

function buildBackgroundSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="70%">
      <stop offset="0%" stop-color="${COLORS.surface}"/>
      <stop offset="100%" stop-color="${COLORS.background}"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
</svg>`;
}

async function svgToPng(svg, outPath, resize) {
  let pipeline = sharp(Buffer.from(svg)).png();
  if (resize) {
    pipeline = pipeline.resize(resize, resize);
  }
  const buffer = await pipeline.toBuffer();
  writeFileSync(outPath, buffer);
  console.log(`  ✓ ${outPath}`);
}

async function main() {
  mkdirSync(ASSETS_DIR, { recursive: true });

  console.log('生成卦叽 App 图标...');

  await svgToPng(
    buildLogoSvg({ background: COLORS.background }),
    join(ASSETS_DIR, 'icon.png')
  );

  await svgToPng(
    buildLogoSvg({ background: 'none' }),
    join(ASSETS_DIR, 'android-icon-foreground.png')
  );

  await svgToPng(
    buildBackgroundSvg(),
    join(ASSETS_DIR, 'android-icon-background.png')
  );

  await svgToPng(
    buildLogoSvg({ background: 'none', monochrome: true }),
    join(ASSETS_DIR, 'android-icon-monochrome.png')
  );

  const iconBuffer = await sharp(join(ASSETS_DIR, 'icon.png'))
    .resize(48, 48)
    .png()
    .toBuffer();
  writeFileSync(join(ASSETS_DIR, 'favicon.png'), iconBuffer);
  console.log(`  ✓ ${join(ASSETS_DIR, 'favicon.png')}`);

  await svgToPng(
    buildLogoSvg({ background: 'none' }),
    join(ASSETS_DIR, 'splash-icon.png'),
    512
  );

  console.log('完成。');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
