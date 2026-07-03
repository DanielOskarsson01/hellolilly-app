import React, { useState } from 'react';

// HelloLilly — core primitives: icons, clover motif, logo, avatar, photo, tag, button, chip, rating
// Exports shared visual primitives for the app.

/* ---------- Icon set (friendly, rounded stroke) ---------- */
const ICONS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  cv: 'M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm6 0v6h6M9 13h6M9 17h4',
  letter: 'M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm0 1 8 6 8-6',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM6 11a6 6 0 0 0 12 0M12 17v4M9 21h6',
  activity: 'M4 14l4-4 3 3 5-6 4 4M4 20h16',
  library: 'M4 5v15M4 6a2 2 0 0 1 2-2h5v16H6a2 2 0 0 0-2 2M13 4h5a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2h-5z',
  image: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 12 5-5 3 3 3-3 4 4M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  users: 'M16 18v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM21 18v-1a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4-4',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.2-1.8l2-1.5-2-3.4-2.3 1a8 8 0 0 0-3-1.8L14 2h-4l-.5 2.5a8 8 0 0 0-3 1.8l-2.3-1-2 3.4 2 1.5A8 8 0 0 0 4 12c0 .6 0 1.2.2 1.8l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 3 1.8L10 22h4l.5-2.5a8 8 0 0 0 3-1.8l2.3 1 2-3.4-2-1.5c.1-.6.2-1.2.2-1.8Z',
  chevron: 'M9 6l6 6-6 6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
  check: 'M5 12.5 10 17 19 7',
  plus: 'M12 5v14M5 12h14',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  share: 'M16 6l-4-4-4 4M12 2v13M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7',
  download: 'M12 3v12M8 11l4 4 4-4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2',
  upload: 'M12 21V9M8 13l4-4 4 4M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2',
  calendar: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3 9h18M8 3v4M16 3v4',
  play: 'M7 4.5v15l13-7.5z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3Z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  briefcase: 'M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Zm5 0V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18',
  grad: 'M12 4 2 9l10 5 10-5-10-5ZM6 11v5c0 1 2.7 3 6 3s6-2 6-3v-5',
  heart: 'M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5C19 15.5 12 20 12 20Z',
  pen: 'M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3ZM14 6l3 3',
  doc: 'M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm6 0v6h6',
  voice: 'M3 12h2l2-7 4 16 3-12 2 6 2-3h3',
  refresh: 'M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M21 12a9 9 0 0 1-15 6.7L3 16M3 20v-4h4',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9Z',
  thumb: 'M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4-8a2 2 0 0 1 3 1.8V8h4.5a2 2 0 0 1 2 2.3l-1.2 7a2 2 0 0 1-2 1.7H7',
  filter: 'M3 5h18l-7 8v5l-4 2v-7L3 5Z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  lock: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm2 0V8a4 4 0 0 1 8 0v3',
};
function Icon({ name, size = 22, sw = 1.9, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      <path d={ICONS[name] || ICONS.home} />
    </svg>
  );
}

/* ---------- Clover / lily motif ---------- */
// Filled quatrefoil "clover" — the brand cue.
function Clover({ size = 24, color = 'currentColor', style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} className={className} aria-hidden="true">
      <path fill={color} d="M50 8c-8 0-14 6-14 14 0 3 1 6 2 8-2-1-5-2-8-2-8 0-14 6-14 14s6 14 14 14c3 0 6-1 8-2-1 2-2 5-2 8 0 8 6 14 14 14s14-6 14-14c0-3-1-6-2-8 2 1 5 2 8 2 8 0 14-6 14-14s-6-14-14-14c-3 0-6 1-8 2 1-2 2-5 2-8 0-8-6-14-14-14Z"/>
    </svg>
  );
}
// One-time SVG defs: clover clip-path for clover-framed avatars/images.
function CloverDefs() {
  return (
    <svg width="0" height="0" style={{ position:'absolute' }} aria-hidden="true">
      <defs>
        <clipPath id="ll-clover" clipPathUnits="objectBoundingBox">
          <path d="M.5 0C.36 0 .25.11.25.25c0 .05.01.1.04.14C.25.36.2.35.15.35.07.35 0 .42 0 .5s.07.15.15.15c.05 0 .1-.01.14-.04C.26.65.25.7.25.75.25.89.36 1 .5 1s.25-.11.25-.25c0-.05-.01-.1-.04-.14C.75.65.8.65.85.65.93.65 1 .58 1 .5S.93.35.85.35C.8.35.75.36.71.39.74.35.75.3.75.25.75.11.64 0 .5 0Z"/>
        </clipPath>
      </defs>
    </svg>
  );
}

/* ---------- Logo lockup ---------- */
function Logo() {
  return (
    <div className="side__logo">
      <Clover size={30} color="#2B6CF0" />
      <b>Hello<span>Lilly</span></b>
    </div>
  );
}

/* ---------- Friendly person glyph for photo placeholders ---------- */
function PersonGlyph({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="currentColor" aria-hidden="true">
      <circle cx="32" cy="23" r="12" />
      <path d="M12 56c0-11 9-19 20-19s20 8 20 19v2H12z" />
    </svg>
  );
}

/* ---------- Photo placeholder (duotone, clover-watermarked) ---------- */
function Photo({ tone = '', label, clover = true, person = true, className = '', style, children }) {
  return (
    <div className={`media ${className}`} style={style} role="img" aria-label={label || 'Foto'}>
      <div className={`ph ${tone}`}>
        {person && <PersonGlyph className="ph__person" />}
        {clover && <Clover size={130} className="ph__clover" />}
      </div>
      {label && <span className="ph__tag">{label}</span>}
      {children}
    </div>
  );
}

/* ---------- Avatar ---------- */
function Avatar({ name = '', size = 'md', tone = 'av-c1', clover = false }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`av av--${size} ${tone} ${clover ? 'clover-clip' : ''}`} title={name} aria-hidden="true">
      {initials}
    </div>
  );
}
function AvatarStack({ people = [], size = 'sm' }) {
  return (
    <div className="av-stack">
      {people.map((p, i) => <Avatar key={i} name={p.name} tone={p.tone} size={size} />)}
    </div>
  );
}

/* ---------- Tag / Chip ---------- */
function Tag({ children, variant = '', dot = false }) {
  return <span className={`tag ${variant}`}>{dot && <span className="dot" />}{children}</span>;
}
function Chip({ children, on = false, icon }) {
  return <button className={`chip ${on ? 'chip--on' : ''}`}>{icon && <Icon name={icon} size={15} />}{children}</button>;
}

/* ---------- Button ---------- */
function Button(props) {
  const { children, variant = 'primary', size = 'lg', icon, iconRight, block = false } = props;
  const rest = { ...props };
  ['children', 'variant', 'size', 'icon', 'iconRight', 'block'].forEach(k => delete rest[k]);
  return (
    <button className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 19 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 19 : 16} />}
    </button>
  );
}

/* ---------- Rating ---------- */
function Rating({ value = 4, max = 5, size = 15 }) {
  return (
    <span style={{ display:'inline-flex', gap:2 }} aria-label={`${value} av ${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i < value ? 'var(--ll-amber)' : 'var(--ll-border)'} aria-hidden="true">
          <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />
        </svg>
      ))}
    </span>
  );
}

/* ---------- Section header ---------- */
function SectionHeader({ title, sub, seeAll = 'Visa alla' }) {
  return (
    <div className="sec-h">
      <h2>{title}</h2>
      {sub && <span className="sub">{sub}</span>}
      {seeAll && <a className="seeall" href="#">{seeAll}<Icon name="chevron" size={15} /></a>}
    </div>
  );
}

/* ---------- Demo marker ---------- */
// Pane-level label for fixture/sample content. The D3 rule: a pane is either
// wired-real or labelled-demo, never silently in between. Amber, uppercase.
function DemoBar() {
  return (
    <span className="demobar" role="note" aria-label="Demo, exempeldata">
      <Icon name="bulb" size={12} />DEMO — EXEMPELDATA
    </span>
  );
}

export { Icon, Clover, CloverDefs, Logo, PersonGlyph, Photo, Avatar, AvatarStack, Tag, Chip, Button, Rating, SectionHeader, DemoBar, ICONS };
