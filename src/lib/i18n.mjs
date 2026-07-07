// HelloLilly — i18n (multilingual-ready; SV default, EN additive)
// ----------------------------------------------------------------------------
// Strings are authored co-located as { sv, en } and resolved through tr().
// Swedish is the default; English is additive — a string with no `en` falls
// back to `sv`, so the UI never breaks while EN is filled in.
//
// Exports: trFor, tr, getLang, setLang, useLang, LangToggle
// ============================================================================

import React from 'react';

const KEY = 'll.lang';
let lang = 'sv';
if (typeof window !== 'undefined') {
  try { lang = localStorage.getItem(KEY) || 'sv'; } catch (e) { /* storage unavailable */ }
}
const subs = new Set();

// --- pure resolution (testable without DOM) ----------------------------------

/**
 * trFor(lang, obj) — pure, lang-injected resolution for testing.
 * trFor('en', { sv, en }) → en
 * trFor('en', { sv })     → sv  (fallback)
 * trFor('sv', 'literal')  → 'literal'  (string passthrough)
 * trFor('en', null)       → ''
 */
export function trFor(activeLang, obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[activeLang] != null ? obj[activeLang] : (obj.sv != null ? obj.sv : '');
}

// --- live resolution (uses module-level lang) --------------------------------

/** tr({ sv, en } | string) → active-language string */
export function tr(obj) {
  return trFor(lang, obj);
}

// --- language state ----------------------------------------------------------

export function getLang() {
  return lang;
}

export function setLang(next) {
  lang = next === 'en' ? 'en' : 'sv';
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage unavailable */ }
    try { document.documentElement.setAttribute('lang', lang); } catch (e) { /* no DOM */ }
  }
  subs.forEach(fn => fn(lang));
}

// initialise <html lang> on load (browser only)
if (typeof window !== 'undefined') {
  try { document.documentElement.setAttribute('lang', lang); } catch (e) { /* no DOM */ }
}

// --- React hook --------------------------------------------------------------

export function useLang() {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const fn = () => force(n => n + 1);
    subs.add(fn);
    return () => subs.delete(fn);
  }, []);
  return { lang, setLang };
}

// --- LangToggle component ----------------------------------------------------
// Mirrors the usage in design screens: <LangToggle /> inside .ll-pagehead__actions.
// Uses design-system tokens only (no hardcoded hex/px).

export function LangToggle() {
  const { lang: activeLang, setLang: set } = useLang();
  return React.createElement(
    'div',
    { className: 'll-lang-toggle', style: { display: 'flex', gap: 'var(--sp-1)' } },
    React.createElement(
      'button',
      {
        type: 'button',
        className: `btn btn--sm ${activeLang === 'sv' ? 'btn--primary' : 'btn--secondary'}`,
        onClick: () => set('sv'),
        'aria-pressed': activeLang === 'sv',
      },
      'SV'
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        className: `btn btn--sm ${activeLang === 'en' ? 'btn--primary' : 'btn--secondary'}`,
        onClick: () => set('en'),
        'aria-pressed': activeLang === 'en',
      },
      'EN'
    )
  );
}
