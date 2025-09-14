const STORAGE_KEY = 'kwik_apps';
const FAVORITES_KEY = 'kwik_favorites';
const RECENT_KEY = 'kwik_recent';
const DARK_MODE_KEY = 'kwik_darkmode';
const OPENING_ANIM_KEY = 'kwik_show_opening_anim';

let apps = [];
let favorites = [];
let recentlyUsed = [];
let darkMode = false;
let dragSrcEl = null;
let editingIndex = null;

const appsGrid = document.getElementById('appsGrid');
const addAppBtn = document.getElementById('addAppBtn');
const searchInput = document.getElementById('searchInput');
const modalBackdrop = document.getElementById('modalBackdrop');
const appNameInput = document.getElementById('appNameInput');
const appUrlInput = document.getElementById('appUrlInput');
const appIconInput = document.getElementById('appIconInput');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const favoritesFilterBtn = document.getElementById('favoritesFilterBtn');
const sortAlphaBtn = document.getElementById('sortAlphaBtn');
const recentlyUsedSection = document.getElementById('recentlyUsedSection');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModalBackdrop = document.getElementById('settingsModalBackdrop');
const clearAllBtn = document.getElementById('clearAllBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const tipsBtn = document.getElementById('tipsBtn');
const tipsModalBackdrop = document.getElementById('tipsModalBackdrop');
const tipText = document.getElementById('tipText');
const closeTipsBtn = document.getElementById('closeTipsBtn');
const themeSelect = document.getElementById('themeSelect');
const showTipsStartup = document.getElementById('showTipsStartup');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const backupBtn = document.getElementById('backupBtn');
const backupModalBackdrop = document.getElementById('backupModalBackdrop');
const exportBtn = document.getElementById('exportBtn');
const importFileInput = document.getElementById('importFileInput');
const closeBackupBtn = document.getElementById('closeBackupBtn');
const showOpeningAnim = document.getElementById('showOpeningAnim');

const tips = [
    "Tip: Drag and drop apps to reorder them.",
    "Tip: Use the star button to mark your favorite apps.",
    "Tip: Try themes in the Settings menu for a different look!",
    "Tip: You can edit or remove any app, any time.",
    "Tip: Use the backup button to export your app list.",
    "Tip: Use custom emojis for your app icons.",
    "Tip: Filter apps by name using the search box.",
    "Tip: Use protocol URLs for desktop apps (e.g. mailto:)."
];

const SPECIAL_APPS = [
    {
        name: "KWIK About",
        url: "about.html",
        icon: "ℹ️"
    }
];

let showFavoritesOnly = false;

function isProtocolUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol !== 'http:' && parsed.protocol !== 'https:' && parsed.protocol !== 'file:';
    } catch {
        return false;
    }
}

function ensureSpecialApps() {
    let changed = false;
    SPECIAL_APPS.forEach(special => {
        if (!apps.some(app => app.url === special.url)) {
            apps.push(special);
            changed = true;
        }
    });
    if (changed) saveApps();
}

function loadApps(callback) {
    chrome.storage.local.get([STORAGE_KEY], result => {
        apps = result[STORAGE_KEY] || [];
        ensureSpecialApps();
        callback && callback();
    });
}

function saveApps() {
    chrome.storage.local.set({ [STORAGE_KEY]: apps });
}

function loadFavorites() {
    chrome.storage.local.get([FAVORITES_KEY], result => {
        favorites = result[FAVORITES_KEY] || [];
    });
}
function saveFavorites() {
    chrome.storage.local.set({ [FAVORITES_KEY]: favorites });
}

function loadRecentlyUsed() {
    chrome.storage.local.get([RECENT_KEY], result => {
        recentlyUsed = result[RECENT_KEY] || [];
        renderRecentlyUsed();
    });
}
function saveRecentlyUsed() {
    chrome.storage.local.set({ [RECENT_KEY]: recentlyUsed });
}

function loadDarkMode() {
    chrome.storage.local.get([DARK_MODE_KEY], result => {
        darkMode = result[DARK_MODE_KEY] || false;
        setDarkMode(darkMode);
        darkModeToggle.checked = darkMode;
    });
}
function saveDarkMode() {
    chrome.storage.local.set({ [DARK_MODE_KEY]: darkMode });
}

function setDarkMode(enabled) {
    document.body.style.background = enabled ? '#222' : 'white';
    document.body.style.color = enabled ? '#eee' : 'black';
}

function renderRecentlyUsed() {
    if (!recentlyUsed.length) {
        recentlyUsedSection.innerHTML = '';
        return;
    }
    recentlyUsedSection.innerHTML = `<div style="font-size:0.95em; font-weight:600; margin-bottom:4px;">Recently Used:</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
            ${recentlyUsed.slice(0,3).map(app => {
                if (app.icon && app.icon.startsWith('http')) {
                    return `<span style="background:#f0f0f0; border-radius:8px; padding:4px 8px; display:flex; align-items:center; gap:4px; cursor:pointer;" title="${app.name}" tabindex="0">
                        <img src="${app.icon}" alt="icon" style="width:22px;height:22px;border-radius:4px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.08);" onerror="this.replaceWith(document.createElement('span')); this.outerHTML='<span class=&quot;app-icon&quot; title=&quot;Icon&quot;>🔗</span>'">
                        <span style="font-size:0.95em;">${app.name}</span>
                    </span>`;
                } else {
                    return `<span style="background:#f0f0f0; border-radius:8px; padding:4px 8px; display:flex; align-items:center; gap:4px; cursor:pointer;" title="${app.name}" tabindex="0">
                        <span class="app-icon" title="Icon">${app.icon || '🔗'}</span>
                        <span style="font-size:0.95em;">${app.name}</span>
                    </span>`;
                }
            }).join('')}
        </div>`;
    Array.from(recentlyUsedSection.querySelectorAll('span[title]')).forEach((el, i) => {
        el.onclick = () => {
            window.open(recentlyUsed[i].url, '_blank');
            addToRecentlyUsed(recentlyUsed[i]);
        };
        el.onkeydown = e => {
            if (e.key === 'Enter' || e.key === ' ') {
                window.open(recentlyUsed[i].url, '_blank');
                addToRecentlyUsed(recentlyUsed[i]);
            }
        };
    });
}

function addToRecentlyUsed(app) {
    recentlyUsed = recentlyUsed.filter(a => a.url !== app.url);
    recentlyUsed.unshift(app);
    if (recentlyUsed.length > 5) recentlyUsed = recentlyUsed.slice(0,5);
    saveRecentlyUsed();
    renderRecentlyUsed();
}

function isSpecialApp(app) {
    return SPECIAL_APPS.some(special => special.url === app.url);
}

function renderApps() {
    const filter = searchInput.value.toLowerCase().trim();
    appsGrid.innerHTML = '';

    let filteredApps = apps.filter(app => app.name.toLowerCase().includes(filter));
    if (showFavoritesOnly) {
        filteredApps = filteredApps.filter(app => favorites.includes(app.url));
    }

    if (filteredApps.length === 0) {
        appsGrid.innerHTML = `<p style="color:#999; text-align:center; margin-top:20px;">No apps found.</p>`;
        return;
    }

    filteredApps.forEach((app, index) => {
        const tile = document.createElement('div');
        tile.className = 'app-tile';
        tile.setAttribute('draggable', 'true');
        tile.setAttribute('tabindex', '0');
        tile.setAttribute('role', 'button');
        tile.setAttribute('aria-label', `Launch ${app.name}`);

        const isFav = favorites.includes(app.url);

        let iconHtml;
        if (app.icon && app.icon.startsWith('http')) {
            iconHtml = `<img src="${app.icon}" alt="icon" style="width:32px;height:32px;border-radius:6px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.08);" onerror="this.replaceWith(document.createElement('span')); this.outerHTML='<span class=&quot;app-icon&quot; title=&quot;Icon&quot;>🔗</span>'">`;
        } else {
            iconHtml = `<span class="app-icon" title="Icon">${app.icon || '🔗'}</span>`;
        }

        tile.innerHTML = `
            ${iconHtml}
            <div class="app-name">${app.name}</div>
            <button class="btn-small btn-remove" aria-label="Remove ${app.name}">✕</button>
            <button class="btn-small btn-edit" aria-label="Edit ${app.name}">✎</button>
            <button class="btn-small btn-fav" aria-label="${isFav ? 'Unfavorite' : 'Favorite'} ${app.name}" style="background:${isFav ? '#ffd700' : '#bbb'}; top:32px; right:6px;">⭐</button>
            ${isProtocolUrl(app.url) ? `<div class="protocol-badge" title="Protocol URL">PROTOCOL</div>` : ''}
        `;

        tile.addEventListener('click', e => {
            if (e.target.closest('button')) return;
            if (isSpecialApp(app)) {
                // Open in popup (same window, same tab)
                window.location.href = app.url;
            } else {
                window.open(app.url, '_blank');
            }
            addToRecentlyUsed(app);
        });

        tile.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (isSpecialApp(app)) {
                    window.location.href = app.url;
                } else {
                    window.open(app.url, '_blank');
                }
                addToRecentlyUsed(app);
            }
        });

        tile.querySelector('.btn-remove').addEventListener('click', e => {
            e.stopPropagation();
            const skipConfirm = e.shiftKey;
            if (skipConfirm || confirm(`Remove "${app.name}"?`)) {
                const realIndex = apps.indexOf(app);
                apps.splice(realIndex, 1);
                favorites = favorites.filter(url => url !== app.url);
                recentlyUsed = recentlyUsed.filter(a => a.url !== app.url);
                saveApps();
                saveFavorites();
                saveRecentlyUsed();
                renderApps();
                renderRecentlyUsed();
            }
        });

        tile.querySelector('.btn-edit').addEventListener('click', e => {
            e.stopPropagation();
            editingIndex = apps.indexOf(app);
            openEditModal(app);
        });

        tile.querySelector('.btn-fav').addEventListener('click', e => {
            e.stopPropagation();
            if (favorites.includes(app.url)) {
                favorites = favorites.filter(url => url !== app.url);
            } else {
                favorites.push(app.url);
            }
            saveFavorites();
            renderApps();
        });

        tile.addEventListener('dragstart', dragStart);
        tile.addEventListener('dragover', dragOver);
        tile.addEventListener('dragenter', dragEnter);
        tile.addEventListener('dragleave', dragLeave);
        tile.addEventListener('drop', drop);
        tile.addEventListener('dragend', dragEnd);

        appsGrid.appendChild(tile);
    });
}

function dragStart(e) {
    dragSrcEl = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    this.classList.add('dragging');
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function dragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function dragLeave(e) {
    this.classList.remove('drag-over');
}

function drop(e) {
    e.stopPropagation();
    if (dragSrcEl !== this) {
        const nodes = Array.from(appsGrid.children);
        const fromIndex = nodes.indexOf(dragSrcEl);
        const toIndex = nodes.indexOf(this);

        const movedApp = apps.splice(fromIndex, 1)[0];
        apps.splice(toIndex, 0, movedApp);
        saveApps();
        renderApps();
    }
    return false;
}

function dragEnd(e) {
    this.classList.remove('dragging');
    Array.from(appsGrid.children).forEach(child => child.classList.remove('drag-over'));
}

addAppBtn.addEventListener('click', () => {
    editingIndex = null;
    openEditModal({ name: '', url: '', icon: '🔗' });
});

searchInput.addEventListener('input', renderApps);

function openEditModal(app) {
    appNameInput.value = app.name || '';
    appUrlInput.value = app.url || '';
    appIconInput.value = app.icon || '🔗';

    modalBackdrop.style.display = 'flex';
    appNameInput.focus();
}

function closeModal() {
    modalBackdrop.style.display = 'none';
    editingIndex = null;
}

saveBtn.addEventListener('click', async () => {
    const name = appNameInput.value.trim();
    const url = appUrlInput.value.trim();
    let icon = appIconInput.value.trim();

    if (!name) {
        alert('Please enter a valid app name.');
        appNameInput.focus();
        return;
    }
    if (!url) {
        alert('Please enter a valid URL or protocol.');
        appUrlInput.focus();
        return;
    }

    try {
        new URL(url);
    } catch {
        alert('Please enter a valid URL or protocol format.');
        appUrlInput.focus();
        return;
    }

    if (!icon) {
        try {
            const u = new URL(url);
            if (
                u.protocol !== 'http:' &&
                u.protocol !== 'https:' &&
                u.protocol !== 'file:' &&
                !u.hostname.includes('.')
            ) {
                icon = `https://store-images.microsoft.com/image/apps.${u.hostname}.1.0.0.0.png`;
            } else {
                icon = `https://www.google.com/s2/favicons?domain=${u.hostname}`;
            }
            await new Promise((resolve, reject) => {
                const img = new window.Image();
                img.onload = () => resolve();
                img.onerror = () => reject();
                img.src = icon;
            });
        } catch {
            icon = '🔗';
        }
    } else if (icon.startsWith('http')) {
        try {
            await new Promise((resolve, reject) => {
                const img = new window.Image();
                img.onload = () => resolve();
                img.onerror = () => reject();
                img.src = icon;
            });
        } catch {
            icon = '🔗';
        }
    }

    if (editingIndex !== null) {
        apps[editingIndex] = { name, url, icon };
    } else {
        apps.push({ name, url, icon });
    }

    saveApps();
    renderApps();
    closeModal();
});

cancelBtn.addEventListener('click', () => {
    closeModal();
});

modalBackdrop.addEventListener('click', e => {
    if (e.target === modalBackdrop) {
        closeModal();
    }
});

favoritesFilterBtn.addEventListener('click', () => {
    showFavoritesOnly = !showFavoritesOnly;
    favoritesFilterBtn.style.color = showFavoritesOnly ? '#ffd700' : '';
    renderApps();
});

sortAlphaBtn.addEventListener('click', () => {
    apps.sort((a, b) => a.name.localeCompare(b.name));
    saveApps();
    renderApps();
});

const THEME_KEY = 'kwik_theme';
const SHOW_TIPS_KEY = 'kwik_show_tips';

function loadTheme() {
    chrome.storage.local.get([THEME_KEY], result => {
        const theme = typeof result[THEME_KEY] === "string" ? result[THEME_KEY] : 'default';
        themeSelect.value = theme;
        applyTheme(theme);
    });
}
function saveTheme(theme) {
    chrome.storage.local.set({ [THEME_KEY]: theme });
}
function applyTheme(theme) {
    document.body.classList.remove('theme-blue', 'theme-pink', 'dark-mode');
    document.querySelector('.popup-container').classList.remove('theme-blue', 'theme-pink', 'dark-mode');
    document.querySelector('.header').classList.remove('theme-blue', 'theme-pink', 'dark-mode');
    document.getElementById('addAppBtn').classList.remove('theme-blue', 'theme-pink', 'dark-mode');
    document.getElementById('saveBtn').classList.remove('theme-blue', 'theme-pink', 'dark-mode');
    document.getElementById('searchInput').classList.remove('theme-blue', 'theme-pink', 'dark-mode');
    document.getElementById('settingsBtn').classList.remove('theme-blue', 'theme-pink', 'dark-mode');
    document.querySelector('h1').classList.remove('theme-blue', 'theme-pink', 'dark-mode');
    switch (theme) {
        case 'dark':
            document.body.classList.add('dark-mode');
            document.querySelector('.popup-container').classList.add('dark-mode');
            document.querySelector('.header').classList.add('dark-mode');
            document.getElementById('addAppBtn').classList.add('dark-mode');
            document.getElementById('saveBtn').classList.add('dark-mode');
            document.getElementById('searchInput').classList.add('dark-mode');
            document.getElementById('settingsBtn').classList.add('dark-mode');
            document.querySelector('h1').classList.add('dark-mode');
            break;
        case 'blue':
            document.body.classList.add('theme-blue');
            document.querySelector('.popup-container').classList.add('theme-blue');
            document.querySelector('.header').classList.add('theme-blue');
            document.getElementById('addAppBtn').classList.add('theme-blue');
            document.getElementById('saveBtn').classList.add('theme-blue');
            document.getElementById('searchInput').classList.add('theme-blue');
            document.getElementById('settingsBtn').classList.add('theme-blue');
            document.querySelector('h1').classList.add('theme-blue');
            break;
        case 'pink':
            document.body.classList.add('theme-pink');
            document.querySelector('.popup-container').classList.add('theme-pink');
            document.querySelector('.header').classList.add('theme-pink');
            document.getElementById('addAppBtn').classList.add('theme-pink');
            document.getElementById('saveBtn').classList.add('theme-pink');
            document.getElementById('searchInput').classList.add('theme-pink');
            document.getElementById('settingsBtn').classList.add('theme-pink');
            document.querySelector('h1').classList.add('theme-pink');
            break;
        default:
            break;
    }
}

function loadShowTipsStartup() {
    chrome.storage.local.get([SHOW_TIPS_KEY], result => {
        showTipsStartup.checked = !!result[SHOW_TIPS_KEY];
    });
}
function saveShowTipsStartup(val) {
    chrome.storage.local.set({ [SHOW_TIPS_KEY]: val });
}

function loadShowOpeningAnim() {
    chrome.storage.local.get([OPENING_ANIM_KEY], result => {
        showOpeningAnim.checked = result[OPENING_ANIM_KEY] !== false;
    });
}
function saveShowOpeningAnim(val) {
    chrome.storage.local.set({ [OPENING_ANIM_KEY]: val });
}

themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value);
    saveTheme(themeSelect.value);
});

showTipsStartup.addEventListener('change', () => {
    saveShowTipsStartup(showTipsStartup.checked);
});
showOpeningAnim.addEventListener('change', () => {
    saveShowOpeningAnim(showOpeningAnim.checked);
});

resetSettingsBtn.addEventListener('click', () => {
    if (confirm('Reset all settings to default?')) {
        chrome.storage.local.remove([THEME_KEY, SHOW_TIPS_KEY, DARK_MODE_KEY, OPENING_ANIM_KEY]);
        themeSelect.value = 'default';
        applyTheme('default');
        showTipsStartup.checked = false;
        showOpeningAnim.checked = true;
        alert('Settings reset!');
    }
});

settingsBtn.addEventListener('click', () => {
    settingsModalBackdrop.style.display = 'flex';
    loadTheme();
    loadShowTipsStartup();
    loadShowOpeningAnim();
});

closeSettingsBtn.addEventListener('click', () => {
    settingsModalBackdrop.style.display = 'none';
});

settingsModalBackdrop.addEventListener('click', e => {
    if (e.target === settingsModalBackdrop) {
        settingsModalBackdrop.style.display = 'none';
    }
});

clearAllBtn.addEventListener('click', () => {
    if (confirm('Clear all apps?')) {
        apps = [];
        favorites = [];
        recentlyUsed = [];
        saveApps();
        saveFavorites();
        saveRecentlyUsed();
        renderApps();
        renderRecentlyUsed();
        settingsModalBackdrop.style.display = 'none';
    }
});

tipsBtn.addEventListener('click', () => {
    tipText.textContent = tips[Math.floor(Math.random() * tips.length)];
    tipsModalBackdrop.style.display = 'flex';
});
closeTipsBtn.addEventListener('click', () => {
    tipsModalBackdrop.style.display = 'none';
});
tipsModalBackdrop.addEventListener('click', e => {
    if (e.target === tipsModalBackdrop) tipsModalBackdrop.style.display = 'none';
});

backupBtn.addEventListener('click', () => {
    backupModalBackdrop.style.display = 'flex';
});
closeBackupBtn.addEventListener('click', () => {
    backupModalBackdrop.style.display = 'none';
});
backupModalBackdrop.addEventListener('click', e => {
    if (e.target === backupModalBackdrop) backupModalBackdrop.style.display = 'none';
});
exportBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify(apps, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kwik-apps-backup.json";
    a.click();
});
importFileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const importedApps = JSON.parse(evt.target.result);
            if (Array.isArray(importedApps)) {
                apps = importedApps;
                saveApps();
                renderApps();
                alert("Apps restored from backup!");
                backupModalBackdrop.style.display = 'none';
            } else {
                alert("Invalid backup file.");
            }
        } catch {
            alert("Failed to import backup.");
        }
    };
    reader.readAsText(file);
});

window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (modalBackdrop.style.display === 'flex') closeModal();
        if (settingsModalBackdrop.style.display === 'flex') settingsModalBackdrop.style.display = 'none';
    }
});

window.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get([OPENING_ANIM_KEY], result => {
        if (result[OPENING_ANIM_KEY] !== false) {
            const anim = document.getElementById('popup-opening-animation');
            anim.style.display = 'flex';
            setTimeout(() => {
                anim.classList.add('fade-out');
                setTimeout(() => {
                    anim.style.display = 'none';
                }, 700);
            }, 900);
        }
    });
    loadTheme();
    loadShowTipsStartup();
    loadShowOpeningAnim();
    loadApps(() => {
        loadFavorites();
        loadRecentlyUsed();
        loadDarkMode();
        renderApps();
        renderRecentlyUsed();
    });
    chrome.storage.local.get([SHOW_TIPS_KEY], result => {
        if (result[SHOW_TIPS_KEY]) {
            tipText.textContent = tips[Math.floor(Math.random() * tips.length)];
            tipsModalBackdrop.style.display = 'flex';
        }
    });
});
