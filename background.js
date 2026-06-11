// background.js — Netflix Household Bypass (Unified Edition)

const GRAPHQL_URL = "*://web.prod.cloud.netflix.com/graphql*";
const WATCH_PATH = '/watch/';
const STORAGE_KEY = 'enabled';

const tabIdToRuleId = new Map(); // Mapea IDs de pestañas a IDs de reglas dinámicas
let nextRuleId = 1;

// --- 1. Inicialización y Gestión de Estado ---

chrome.runtime.onInstalled.addListener(async () => {
    const res = await chrome.storage.local.get([STORAGE_KEY]);
    if (res[STORAGE_KEY] === undefined) {
        await chrome.storage.local.set({ [STORAGE_KEY]: true });
    }
    await updateExtensionState();
});

chrome.runtime.onStartup.addListener(async () => {
    await removeAllDynamicRules();
    await updateExtensionState();
});

chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local' || !changes[STORAGE_KEY]) return;
    console.log("[Storage] Cambio detectado en el estado de la extensión.");
    await updateExtensionState();
    await refreshNetflixTabs();
});

async function updateExtensionState() {
    try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        const isEnabled = data[STORAGE_KEY] !== false;
        console.log(`[State] Extensión configurada como: ${isEnabled ? 'ACTIVA' : 'INACTIVA'}`);

        // Sincronizar el conjunto de reglas estáticas (declarativeNetRequest en manifest)
        await chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: isEnabled ? ['ruleset_main'] : [],
            disableRulesetIds: isEnabled ? [] : ['ruleset_main']
        });

        if (!isEnabled) {
            await removeAllDynamicRules();
        } else {
            await checkAllTabs();
        }
    } catch (error) {
        console.error("[State] Error al actualizar el estado:", error);
    }
}

// --- 2. Gestión de Reglas de Red Dinámicas ---

async function removeAllDynamicRules() {
    try {
        const currentRules = await chrome.declarativeNetRequest.getSessionRules();
        const ruleIdsToRemove = currentRules.map(rule => rule.id);
        if (ruleIdsToRemove.length > 0) {
            await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: ruleIdsToRemove });
        }
        tabIdToRuleId.clear();
        nextRuleId = 1;
        console.log('[Cleanup] Se limpiaron todas las reglas dinámicas de sesión.');
    } catch (error) {
        console.error("[Cleanup] Error eliminando reglas dinámicas:", error);
    }
}

async function addBlockRuleForTab(tabId) {
    try {
        if (!tabIdToRuleId.has(tabId)) {
            tabIdToRuleId.set(tabId, nextRuleId++);
        }
        const ruleId = tabIdToRuleId.get(tabId);
        const currentRules = await chrome.declarativeNetRequest.getSessionRules();
        const ruleExists = currentRules.some(rule => rule.id === ruleId);

        if (!ruleExists) {
            await chrome.declarativeNetRequest.updateSessionRules({
                addRules: [{
                    id: ruleId,
                    priority: 1,
                    action: { type: 'block' },
                    condition: {
                        urlFilter: GRAPHQL_URL,
                        resourceTypes: ['xmlhttprequest'],
                        tabIds: [tabId]
                    }
                }],
                removeRuleIds: []
            });
        }
    } catch (error) {
        console.error(`[Dynamic Rule] Error al añadir regla en pestaña ${tabId}:`, error.message);
    }
}

async function removeSpecificBlockRuleForTab(tabId) {
    try {
        const ruleId = tabIdToRuleId.get(tabId);
        if (ruleId !== undefined) {
            await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId] });
            tabIdToRuleId.delete(tabId);
        }
    } catch (error) {
        console.warn(`[Dynamic Rule] No se pudo remover la regla para pestaña ${tabId}.`);
    }
}

// --- 3. Script de Omisión de Contexto de Página (MAIN World) ---

function bypassScript() {
    if (window.__nhb_injected) return;
    window.__nhb_injected = true;

    // Interceptar API Fetch
    const _fetch = window.fetch;
    window.fetch = async function (...args) {
        const url = (typeof args[0] === 'string' ? args[0] : args[0]?.url) ?? '';
        if (/household|HouseholdVerif|memberVerif|nrdp.*verif/i.test(url)) {
            console.log('[NHB] Fetch interceptado y modificado:', url);
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

    // Interceptar XMLHttpRequest
    const _open = XMLHttpRequest.prototype.open;
    const _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, url, ...r) {
        this._u = String(url || '');
        return _open.call(this, m, url, ...r);
    };
    XMLHttpRequest.prototype.send = function (...args) {
        if (/household|HouseholdVerif|memberVerif/i.test(this._u || '')) {
            console.log('[NHB] XHR interceptado y modificado:', this._u);
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

    console.log('[NHB] Bypass de contexto de página activo ✓');
}

// --- 4. Inyección y Control de Navegación ---

async function injectIntoTab(tabId) {
    try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        if (data[STORAGE_KEY] === false) return;

        await chrome.scripting.executeScript({
            target: { tabId, allFrames: false },
            world: 'MAIN',
            injectImmediately: true,
            func: bypassScript
        });
    } catch (e) {
        // Ignorar errores si la pestaña se cerró o cambió de dirección abruptamente
    }
}

async function handleTabState(tabId, url) {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const isEnabled = data[STORAGE_KEY] !== false;

    if (!isEnabled || !url || !url.includes('netflix.com')) {
        await removeSpecificBlockRuleForTab(tabId);
        return;
    }

    if (url.includes(WATCH_PATH)) {
        // En reproducción (/watch/): Bloquear peticiones dinámicas específicas de GraphQL
        await addBlockRuleForTab(tabId);
    } else {
        // En exploración u otras rutas: Quitar regla de bloqueo y asegurar el script del MAIN world
        await removeSpecificBlockRuleForTab(tabId);
        await injectIntoTab(tabId);
    }
}

// Controlar cambios de rutas y cargas de páginas
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!tab.url?.includes('netflix.com')) return;
    
    if (changeInfo.status === 'loading') {
        injectIntoTab(tabId);
        handleTabState(tabId, tab.url);
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        await handleTabState(activeInfo.tabId, tab?.url);
    } catch (error) {
        // Ignorar si la pestaña ya no existe
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    removeSpecificBlockRuleForTab(tabId);
});

// --- 5. Funciones de Soporte ---

async function checkAllTabs() {
    try {
        const tabs = await chrome.tabs.query({ url: "*://*.netflix.com/*" });
        for (const tab of tabs) {
            await handleTabState(tab.id, tab.url);
        }
    } catch (error) {
        console.error("[checkAllTabs] Error:", error);
    }
}

async function refreshNetflixTabs() {
    try {
        const tabs = await chrome.tabs.query({ url: '*://*.netflix.com/*' });
        for (const tab of tabs) {
            if (typeof tab.id === 'number') {
                chrome.tabs.reload(tab.id);
            }
        }
    } catch (error) {
        console.warn('[NHB] No se pudieron recargar las pestañas de Netflix', error);
    }
}
