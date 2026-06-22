import React from 'react';
import { Icon, Clover } from './primitives';
// HelloLilly — design-system layer: completed atoms/molecules/organisms
// + the GRID TEMPLATES. Templates take data as PROPS/SLOTS (never import a
// fixture), so the coming useCase() data layer drops straight in.
// Mirror of the prototype's ds-system.jsx, in Vite module style.

/* ============================== ATOMS ============================== */

export function Field({ label, hint, icon, placeholder, type = 'text', required, error, value, onChange }) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      {label && <span className="field__label">{label}{required && <span className="req">*</span>}</span>}
      <span className="field__wrap">
        {icon && <Icon name={icon} size={18} />}
        <input className="field__input" type={type} placeholder={placeholder} value={value} onChange={onChange} />
      </span>
      {(error || hint) && <span className="field__hint">{error || hint}</span>}
    </label>
  );
}

export function MatchRing({ value = 72, size = 84, stroke = 9, color = 'var(--ll-blue)' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div className="mring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ll-border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <span className="mring__n" style={{ fontSize: size * 0.32 }}>{value}</span>
    </div>
  );
}

/* ============================ MOLECULES ============================ */

export function BigStat({ n, label, sub, tone = '' }) {
  return (
    <div className={`bigstat ${tone ? 'bigstat--' + tone : ''}`}>
      <div className="bigstat__n">{n}</div>
      {label && <div className="bigstat__l">{label}</div>}
      {sub && <div className="bigstat__sub">{sub}</div>}
    </div>
  );
}

export function CrosslinkCard({ kind = 'Tips', title, why, icon, nav, onPick }) {
  const k = kind.toLowerCase().replace('ö', 'o');
  return (
    <button className="xlink" onClick={onPick}>
      <span className="xlink__icon"><Icon name={icon || 'sparkle'} size={21} /></span>
      <span className={`xlink__kind xlink__kind--${k}`}>{kind}</span>
      <span className="xlink__title">{title}</span>
      <span className="xlink__nav">{nav || title}</span>
      {why && <span className="xlink__why">{why}</span>}
    </button>
  );
}

export function JobRow({ job = {}, onPick }) {
  const logo = (job.company || 'J').slice(0, 2).toUpperCase();
  return (
    <button className="jobrow" onClick={onPick}>
      <span className="jobrow__logo">{logo}</span>
      <span className="jobrow__b">
        <span className="jobrow__t">{job.title || 'Lagermedarbetare'}</span>
        <span className="jobrow__m">{job.company || 'Nordlog AB'} · {job.place || 'Göteborg'} · {job.type || 'Heltid'}</span>
      </span>
      {job.match != null && <span className="jobrow__score"><b className="num">{job.match}%</b><span className="jobrow__score-l">match</span></span>}
    </button>
  );
}

/* ============================ ORGANISMS ============================ */

export function Hero({ eyebrow, title, body, actions, tone = '' }) {
  return (
    <section className={`hero ${tone ? 'hero--' + tone : ''}`}>
      {eyebrow && <div className="hero__eyebrow"><Icon name="sparkle" size={15} />{eyebrow}</div>}
      <h2 className="hero__title">{title}</h2>
      {body && <p className="hero__body">{body}</p>}
      {actions && <div className="hero__actions">{actions}</div>}
      <Clover size={180} className="hero__clover" />
    </section>
  );
}

// Crosslinking column — first-class grid area, not a sidebar.
export function CrossColumn({ title = 'Relaterat', sub, label = 'För det du gör nu', items = [], onPick }) {
  const pick = (it) => {
    if (onPick) return onPick(it);
    window.dispatchEvent(new CustomEvent('ll:helpful:open', { detail: it }));
  };
  return (
    <aside className="ll-cross" aria-label="Kopplingar och stöd">
      <div className="ll-cross__head">
        <Clover size={18} color="#2B6CF0" />
        <h2>{title}</h2>
      </div>
      {sub && <p className="ll-cross__sub">{sub}</p>}
      {label && <div className="ll-cross__label">{label}</div>}
      {items.map((it, i) => (
        <CrosslinkCard key={i} kind={it.kind} title={it.title} why={it.why} icon={it.icon} nav={it.nav} onPick={() => pick(it)} />
      ))}
    </aside>
  );
}

/* ============================ TEMPLATES ============================ */

// Content area: single combined middle, or split into two boxes.
export function ContentArea({ mode = 'single', split, children }) {
  const isSplit = mode === 'split';
  const style = split ? { '--split-cols': split } : undefined;
  return (
    <div className={`ll-content ${isSplit ? 'll-content--split' : ''}`} style={style}>
      {children}
    </div>
  );
}

export function ContentBox({ tone = '', span2, className = '', children, ...rest }) {
  const cls = ['ll-box', tone && 'll-box--' + tone, span2 && 'll-span-2', className].filter(Boolean).join(' ');
  return <section className={cls} {...rest}>{children}</section>;
}

// The page primitive: nav | content | cross. Crosslinking always present.
// Mobile chrome (hamburger top bar + left drawer + scrim) is built in here
// so every template inherits it. The container context lives on .ll-shell
// so .ll-page itself can be reflowed by @container.
export function PageTemplate({ nav, content, cross, hasDrawer = true, label, brand = 'HelloLilly', defaultNavOpen = false }) {
  const [open, setOpen] = React.useState(defaultNavOpen);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const brandParts = String(brand).split('Lilly');
  return (
    <div className="ll-shell">
      <div className={`ll-page ${hasDrawer ? 'll-page--has-drawer' : ''}`} data-nav-open={open} data-screen-label={label}>
        <div className="ll-page__bar">
          <button className="ll-burger" aria-label="Meny" aria-expanded={open} onClick={() => setOpen(o => !o)}>
            <Icon name="menu" size={20} />
          </button>
          <b>{brandParts[0]}<span>Lilly</span></b>
        </div>
        <div className="ll-scrim" onClick={() => setOpen(false)} />
        <div className="ll-page__nav">{nav}</div>
        <div className="ll-page__content">{content}</div>
        <div className="ll-page__cross">{cross}</div>
      </div>
    </div>
  );
}

/* ============================== LINKS ==============================
   Distinct from buttons.
   • Link (official) → main colour, semibold, trailing chevron
   • Link inline     → underlined, in running text
   =================================================================== */
export function Link({ href = '#', children, inline = false, tone = '', ...rest }) {
  const cls = inline
    ? `ll-link ll-link--text ${tone ? 'll-link--' + tone : ''}`
    : `ll-link ${tone ? 'll-link--' + tone : ''}`;
  return (
    <a className={cls} href={href} {...rest}>
      {children}{!inline && <span className="ll-link__chev" aria-hidden="true">›</span>}
    </a>
  );
}
