// content.js — Netflix Household Bypass v5 — DOM Safety Net
// Hecha por Ackor.exe ♥
// Runs in extension world (document_idle) — handles UI/DOM layer

(function () {
  'use strict';

  let bypassEnabled = true;

  const BLOCK_TEXT = [
    'no forma parte del hogar',
    'not part of your netflix household',
    'tu dispositivo no forma parte',
    'your device is not part',
    'obtén un código para ver',
    'get a code to watch',
    'enviaremos un código',
    "we'll send a verification",
    'código para ver contenido',
  ];

  const BYPASS_BTN_TEXT = [
    'ver temporalmente',
    'watch temporarily',
    'ver de todas formas',
    'watch anyway',
    'seguir viendo',
    'continue watching',
  ];

  function bodyText() {
    return (document.body?.innerText || '').toLowerCase();
  }

  function setEnabled(enabled) {
    bypassEnabled = enabled !== false;
  }

  function isBlockPage() {
    const t = bodyText();
    return BLOCK_TEXT.some(p => t.includes(p));
  }

  function clickBypassButton() {
    const btns = document.querySelectorAll('button, [role="button"]');
    for (const b of btns) {
      const txt = (b.innerText || '').toLowerCase().trim();
      if (BYPASS_BTN_TEXT.some(p => txt.includes(p))) {
        console.log('[NHB] Auto-click:', b.innerText.trim());
        b.click();
        return true;
      }
    }
    return false;
  }

  function removeBlockUI() {
    [
      '[data-uia="household-interstitial"]',
      '[data-uia="not-you-interstitial"]',
      '[data-uia="household-modal"]',
      '.nf-modal.interstitial-full-screen',
      '[class*="interstitial"]',
    ].forEach(sel => document.querySelectorAll(sel).forEach(el => el.remove()));
    if (document.body) document.body.style.overflow = '';
  }

  let attempts = 0;
  function run() {
    if (!bypassEnabled) return;
    if (!isBlockPage()) { attempts = 0; return; }
    attempts++;
    console.log('[NHB] Block page detected, attempt', attempts);
    removeBlockUI();
    if (!clickBypassButton() && attempts < 10) {
      setTimeout(run, 500);
    }
  }

  // Watch for DOM mutations
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });

  // Periodic scan
  setInterval(run, 1000);

  chrome.storage.local.get(['enabled'], (res) => {
    setEnabled(res.enabled);
    if (bypassEnabled) run();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.enabled) return;
    setEnabled(changes.enabled.newValue);
    if (bypassEnabled) run();
  });

  // Initial run
  if (document.readyState !== 'loading') run();
  else document.addEventListener('DOMContentLoaded', run);
})();
