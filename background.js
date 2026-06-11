// background.js — Netflix Household Bypass v5
// Hecha por Ackor.exe ♥

// Init storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['enabled'], (res) => {
    if (res.enabled === undefined) chrome.storage.local.set({ enabled: true });
  });
});

async function syncRuleset(enabled) {
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: enabled ? ['ruleset_main'] : [],
      disableRulesetIds: enabled ? [] : ['ruleset_main']
    });
  } catch (e) {
    console.warn('[NHB] Could not update ruleset state', e);
  }
}

async function syncEnabledState() {
  const { enabled } = await chrome.storage.local.get(['enabled']);
  await syncRuleset(enabled !== false);
}

async function refreshNetflixTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: '*://*.netflix.com/*' });
    for (const tab of tabs) {
      if (typeof tab.id === 'number') {
        chrome.tabs.reload(tab.id);
      }
    }
  } catch (e) {
    console.warn('[NHB] Could not refresh Netflix tabs', e);
  }
}

chrome.runtime.onStartup.addListener(syncEnabledState);
chrome.runtime.onInstalled.addListener(syncEnabledState);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.enabled) return;
  syncRuleset(changes.enabled.newValue !== false);
  refreshNetflixTabs();
});

// The bypass code that runs in the PAGE context (not extension sandbox)
// This is injected via scripting.executeScript with world: "MAIN"
function bypassScript() {
  if (window.__nhb_injected) return;
  window.__nhb_injected = true;

  const _fetch = window.fetch;
  window.fetch = async function (...args) {
    const url = (typeof args[0] === 'string' ? args[0] : args[0]?.url) ?? '';
    if (/household|HouseholdVerif|memberVerif|nrdp.*verif/i.test(url)) {
      console.log('[NHB] fetch blocked:', url);
      return new Response(
        JSON.stringify({
          status: 'success',
          result: 'VERIFIED',
          requiresVerification: false,
          isInHousehold: true,
          isVerified: true
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return _fetch.apply(this, args);
  };

  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, url, ...r) {
    this._u = String(url || '');
    return _open.call(this, m, url, ...r);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    if (/household|HouseholdVerif|memberVerif/i.test(this._u || '')) {
      console.log('[NHB] XHR blocked:', this._u);
      const self = this;
      setTimeout(() => {
        Object.defineProperty(self, 'readyState',    { get: () => 4, configurable: true });
        Object.defineProperty(self, 'status',        { get: () => 200, configurable: true });
        Object.defineProperty(self, 'responseText',  { get: () => '{"status":"success","result":"VERIFIED","isInHousehold":true}', configurable: true });
        self.dispatchEvent(new Event('readystatechange'));
        self.dispatchEvent(new Event('load'));
      }, 2);
      return;
    }
    return _send.apply(this, args);
  };

  console.log('[NHB] Page-context bypass active ✓');
}

// Inject into a tab at document_start in MAIN world
async function injectIntoTab(tabId) {
  try {
    const { enabled } = await chrome.storage.local.get(['enabled']);
    if (enabled === false) return;

    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      world: 'MAIN',
      injectImmediately: true,
      func: bypassScript
    });
  } catch (e) {
    // Tab may have navigated away, ignore
  }
}

// Listen to every navigation on Netflix
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url?.includes('netflix.com')) return;
  if (changeInfo.status === 'loading') {
    injectIntoTab(tabId);
  }
});

// Also inject when extension loads if Netflix is already open
chrome.tabs.query({ url: '*://*.netflix.com/*' }, (tabs) => {
  tabs.forEach(t => injectIntoTab(t.id));
});
