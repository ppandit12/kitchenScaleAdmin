import { useId } from 'react';
import type { ProductImage, ProductView } from '@/types';
import { cn } from '@/utils';
import { mediaUrl } from '@/services/mediaService';

/**
 * Original vector illustration of the Mini Spoon Scale.
 * Used as placeholder product imagery until licensed photography is supplied.
 * The body colour follows the selected variant, so variant changes update the "image".
 */

interface ProductArtProps {
  view?: ProductView;
  /** Handle colour (variant colorHex). */
  color?: string;
  className?: string;
  /** Accessible description. Omit for decorative usage. */
  alt?: string;
  /** Show the background panel (default true). */
  background?: boolean;
  /** LCD reading text. */
  reading?: string;
}

function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}

const BACKGROUNDS: Record<ProductView, [string, string]> = {
  hero: ['#e9efe6', '#cfdccb'],
  front: ['#fbf9f4', '#efe9dd'],
  angle: ['#f3ede2', '#e4d8c4'],
  display: ['#eef2ef', '#d6e0d4'],
  detail: ['#f7f4ee', '#e9e2d4'],
  pack: ['#f2ede4', '#dfe7dc'],
  lifestyle: ['#efe7da', '#e2d3bb'],
};

export function ProductArt({ view = 'hero', color = '#2b2f2c', className, alt, background = true, reading = '12.5' }: ProductArtProps) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (s: string) => `${raw}-${s}`;
  const light = isLight(color);
  const [bg1, bg2] = BACKGROUNDS[view];

  const scale = ({ fill, withSpice }: { fill?: 'flour' | 'spice' | 'coffee'; withSpice?: boolean }) => (
    <g>
      {/* soft contact shadow */}
      <ellipse cx="40" cy="96" rx="330" ry="26" fill="#1b2620" opacity="0.13" filter={`url(#${id('blur')})`} />
      {/* spoon bowl */}
      <g>
        <ellipse cx="-215" cy="0" rx="120" ry="90" fill={`url(#${id('bowl')})`} stroke="#b9c0ba" strokeWidth="2" />
        <ellipse cx="-212" cy="3" rx="99" ry="71" fill={`url(#${id('bowlIn')})`} />
        {(fill || withSpice) && contents(fill ?? 'spice')}
        <ellipse cx="-250" cy="-40" rx="34" ry="12" fill="#fff" opacity="0.55" transform="rotate(-18 -250 -40)" />
      </g>
      {/* neck */}
      <path d="M -112 -22 C -86 -25 -60 -30 -34 -36 L -34 36 C -60 30 -86 25 -112 22 Z" fill={color} />
      <path d="M -112 -22 C -86 -25 -60 -30 -34 -36 L -34 -14 C -60 -10 -86 -8 -112 -6 Z" fill="#fff" opacity={light ? 0.5 : 0.14} />
      {/* handle */}
      <rect x="-44" y="-48" width="350" height="96" rx="48" fill={color} stroke={light ? '#d8d2c6' : 'none'} strokeWidth="2" />
      <rect x="-44" y="-48" width="350" height="96" rx="48" fill={`url(#${id('sheen')})`} />
      {/* display */}
      <rect x="6" y="-28" width="160" height="56" rx="13" fill="#17201b" />
      <rect x="12" y="-22" width="148" height="44" rx="9" fill={`url(#${id('lcd')})`} />
      <text x="128" y="12" textAnchor="end" fontFamily="'DM Mono', ui-monospace, Menlo, monospace" fontSize="30" fontWeight="600" fill="#cdeccf" letterSpacing="1">
        {reading}
      </text>
      <text x="150" y="12" textAnchor="end" fontFamily="ui-monospace, Menlo, monospace" fontSize="14" fill="#9fc5a4">
        g
      </text>
      {/* buttons */}
      {[204, 248].map((cx, i) => (
        <g key={cx}>
          <circle cx={cx} cy="0" r="14" fill={light ? '#e2ddd3' : '#ffffff'} opacity={light ? 1 : 0.16} />
          <circle cx={cx} cy="0" r="14" fill="none" stroke={light ? '#c8c1b4' : '#000'} strokeOpacity={light ? 1 : 0.25} strokeWidth="1.5" />
          <text x={cx} y="4" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="9" fontWeight="700" fill={light ? '#6f675b' : '#e9ece8'} opacity="0.85">
            {i === 0 ? 'ON' : 'T'}
          </text>
        </g>
      ))}
      {/* brand dot */}
      <circle cx="284" cy="0" r="5" fill="#c9a77a" />
    </g>
  );

  const contents = (kind: 'flour' | 'spice' | 'coffee') => {
    const palette =
      kind === 'flour' ? ['#fbf6ea', '#efe5cf', '#f6eedd'] : kind === 'coffee' ? ['#4a2f22', '#5d3b2a', '#3b251a'] : ['#c4622d', '#d7783a', '#b14f22'];
    return (
      <g>
        <ellipse cx="-212" cy="8" rx="84" ry="52" fill={palette[1]} />
        <ellipse cx="-218" cy="-4" rx="64" ry="36" fill={palette[0]} />
        {Array.from({ length: 26 }).map((_, i) => {
          const a = (i * 137.5 * Math.PI) / 180;
          const r = 10 + ((i * 7) % 60);
          return <circle key={i} cx={-212 + Math.cos(a) * r} cy={4 + Math.sin(a) * r * 0.55} r={kind === 'coffee' ? 4 : 2.6} fill={palette[i % 3]} />;
        })}
      </g>
    );
  };

  const defs = (
    <defs>
      <linearGradient id={id('bg')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={bg1} />
        <stop offset="1" stopColor={bg2} />
      </linearGradient>
      <radialGradient id={id('glow')} cx="0.5" cy="0.45" r="0.6">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={id('bowl')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#d5dad5" />
      </linearGradient>
      <radialGradient id={id('bowlIn')} cx="0.45" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#fdfdfc" />
        <stop offset="0.7" stopColor="#e3e7e3" />
        <stop offset="1" stopColor="#c7cdc7" />
      </radialGradient>
      <linearGradient id={id('sheen')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity={light ? 0.6 : 0.28} />
        <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity={light ? 0.06 : 0.22} />
      </linearGradient>
      <linearGradient id={id('lcd')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2c3c33" />
        <stop offset="1" stopColor="#1a251f" />
      </linearGradient>
      <linearGradient id={id('wood')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#c99a6b" />
        <stop offset="1" stopColor="#a87a4f" />
      </linearGradient>
      <filter id={id('blur')} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
    </defs>
  );

  let scene: React.ReactNode;
  switch (view) {
    case 'front':
      scene = (
        <g transform="translate(400 410) scale(0.95)">
          {scale({})}
        </g>
      );
      break;
    case 'angle':
      scene = (
        <g transform="translate(420 420) rotate(-34) scale(1.02)">
          {scale({ fill: "coffee" })}
        </g>
      );
      break;
    case 'display':
      scene = (
        <g transform="translate(400 400) scale(2.35) translate(-86 0) rotate(-6)">
          {scale({})}
        </g>
      );
      break;
    case 'detail':
      scene = (
        <g transform="translate(430 410) rotate(-12) scale(0.9)">
          <g transform="translate(-70 -10) rotate(-8)">
            <ellipse cx="-215" cy="0" rx="120" ry="90" fill={`url(#${id('bowl')})`} stroke="#b9c0ba" strokeWidth="2" />
            <ellipse cx="-212" cy="3" rx="99" ry="71" fill={`url(#${id('bowlIn')})`} />
            <path d="M -112 -22 C -96 -24 -88 -25 -76 -27 L -76 27 C -88 25 -96 24 -112 22 Z" fill="#dfe3df" stroke="#b9c0ba" strokeWidth="2" />
          </g>
          <path d="M -150 70 Q -90 120 -30 70" fill="none" stroke="#8a9a8c" strokeWidth="3" strokeDasharray="8 8" />
          <path d="M -40 62 l 12 12 l -18 4" fill="none" stroke="#8a9a8c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <g>
            <path d="M -60 -26 C -50 -30 -42 -33 -34 -36 L -34 36 C -42 33 -50 30 -60 26 Z" fill={color} />
            <rect x="-44" y="-48" width="350" height="96" rx="48" fill={color} stroke={light ? '#d8d2c6' : 'none'} strokeWidth="2" />
            <rect x="-44" y="-48" width="350" height="96" rx="48" fill={`url(#${id('sheen')})`} />
            <rect x="6" y="-28" width="160" height="56" rx="13" fill="#17201b" />
            <rect x="12" y="-22" width="148" height="44" rx="9" fill={`url(#${id('lcd')})`} />
            <text x="138" y="12" textAnchor="end" fontFamily="ui-monospace, Menlo, monospace" fontSize="30" fontWeight="600" fill="#cdeccf">
              0.0
            </text>
            <circle cx="284" cy="0" r="5" fill="#c9a77a" />
          </g>
        </g>
      );
      break;
    case 'pack':
      scene = (
        <g>
          <g transform="translate(390 300) rotate(-14) scale(0.78)">
            {scale({})}
          </g>
          <g transform="translate(430 510) rotate(-14) scale(0.78)">
            {scale({ fill: "flour" })}
          </g>
        </g>
      );
      break;
    case 'lifestyle':
      scene = (
        <g>
          <g transform="translate(400 430) rotate(-8)">
            <rect x="-330" y="-230" width="660" height="440" rx="48" fill={`url(#${id('wood')})`} />
            {Array.from({ length: 9 }).map((_, i) => (
              <path key={i} d={`M -310 ${-190 + i * 46} C -120 ${-200 + i * 46} 120 ${-176 + i * 46} 310 ${-190 + i * 46}`} stroke="#8e6440" strokeOpacity="0.18" strokeWidth="2" fill="none" />
            ))}
            <circle cx="300" cy="0" r="16" fill="#8e6440" opacity="0.5" />
          </g>
          {/* spice pile */}
          <g transform="translate(600 250)">
            <ellipse cx="0" cy="20" rx="70" ry="22" fill="#000" opacity="0.08" />
            <ellipse cx="0" cy="8" rx="64" ry="30" fill="#b9562a" />
            <ellipse cx="-6" cy="-4" rx="40" ry="20" fill="#d06c34" />
          </g>
          {/* peppercorns + leaves */}
          {[
            [170, 610],
            [196, 628],
            [150, 640],
            [640, 600],
            [664, 585],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="8" fill="#3a2a22" />
          ))}
          <path d="M 120 210 C 170 160 250 170 270 220 C 220 250 150 250 120 210 Z" fill="#7f9a77" />
          <path d="M 120 210 C 180 205 230 210 270 220" stroke="#5f7a58" strokeWidth="2" fill="none" />
          <g transform="translate(410 450) rotate(-16) scale(0.86)">
            {scale({ fill: "spice" })}
          </g>
        </g>
      );
      break;
    case 'hero':
    default:
      scene = (
        <g>
          <circle cx="400" cy="400" r="270" fill={`url(#${id('glow')})`} />
          <g transform="translate(410 420) rotate(-20)">
            {scale({ fill: "flour" })}
          </g>
        </g>
      );
  }

  return (
    <svg
      viewBox="0 0 800 800"
      className={cn('block h-full w-full', className)}
      role={alt ? 'img' : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
      preserveAspectRatio="xMidYMid slice"
    >
      {defs}
      {background && <rect width="800" height="800" fill={`url(#${id('bg')})`} />}
      {scene}
    </svg>
  );
}

/**
 * Renders a product image: the real photo when `image.src` exists, otherwise the illustration.
 */
export function ProductImageView({ image, color, className }: { image: ProductImage; color: string; className?: string }) {
  if (image.src) {
    return <img src={mediaUrl(image.src)} alt={image.alt} loading="lazy" className={cn('h-full w-full object-cover', className)} />;
  }
  return <ProductArt view={image.view} color={color} alt={image.alt} className={className} />;
}
