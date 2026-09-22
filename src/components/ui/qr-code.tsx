import Svg, { Rect } from 'react-native-svg';

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function QRCodeView({
  value,
  size = 180,
  color = '#0A1E3C',
  backgroundColor = 'transparent',
}: {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}) {
  const modules = 25;
  const rand = mulberry32(hashString(value));

  const isFinder = (row: number, col: number) => {
    const inBox = (r: number, c: number) => row >= r && row < r + 7 && col >= c && col < c + 7;
    return inBox(0, 0) || inBox(0, modules - 7) || inBox(modules - 7, 0);
  };

  const finderDark = (row: number, col: number) => {
    const rel = (r: number, c: number) => {
      if (row < 7 && col < 7) return [row - r, col - c];
      if (row < 7) return [row - r, col - (modules - 7)];
      return [row - (modules - 7), col - c];
    };
    const [dr, dc] = rel(0, 0);
    const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
    return ring === 3 || ring <= 1;
  };

  const cell = size / modules;
  const rects: React.ReactElement[] = [];

  if (backgroundColor !== 'transparent') {
    rects.push(
      <Rect key="bg" x={0} y={0} width={size} height={size} fill={backgroundColor} />,
    );
  }

  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      const dark = isFinder(row, col)
        ? finderDark(row, col)
        : rand() > 0.52;
      if (dark) {
        rects.push(
          <Rect
            key={`${row}-${col}`}
            x={col * cell}
            y={row * cell}
            width={cell}
            height={cell}
            rx={cell * 0.25}
            fill={color}
          />,
        );
      }
    }
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rects}
    </Svg>
  );
}
