// ===== ESTADO GLOBAL =====
const AppState = {
    theme: localStorage.getItem('favorites_theme') || 'auto',
    pinned: JSON.parse(localStorage.getItem('favorites_pinned') || '[]'),
    clickCounts: JSON.parse(localStorage.getItem('favorites_clicks') || '{}'),
    adultVisible: localStorage.getItem('favorites_adult') === 'true',
    settings: {
        maxPinned: parseInt(localStorage.getItem('favorites_maxPinned') || '5'),
        sortOrder: localStorage.getItem('favorites_sortOrder') || 'default'
    }
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initFavicons();
    initClickCounters();
    initPinned();
    initAdultToggle();
    initSearch();
    initKeyboardShortcuts();
    initDragAndDrop();
    initSettings();
    initExportImport();
    initCollapsibles();
    renderPinned();
    applySortOrder();
    showToast('🎉 Favoritos Pro carregado! Pressione Ctrl+K para buscar', 'success');
});

// ===== TEMA (CLARO/ESCURO) =====
function initTheme() {
    applyTheme(AppState.theme);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('themeSelect').value = AppState.theme;
    document.getElementById('themeSelect').addEventListener('change', (e) => {
        AppState.theme = e.target.value;
        localStorage.setItem('favorites_theme', AppState.theme);
        applyTheme(AppState.theme);
    });
}

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        document.querySelector('#themeToggle').textContent = '☀️';
    } else if (theme === 'light') {
        root.removeAttribute('data-theme');
        document.querySelector('#themeToggle').textContent = '🌙';
    } else {
        // Auto: segue preferência do sistema
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', isDark ? 'dark' : '');
        document.querySelector('#themeToggle').textContent = isDark ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    const current = AppState.theme;
    const next = current === 'dark' ? 'light' : current === 'light' ? 'auto' : 'dark';
    AppState.theme = next;
    localStorage.setItem('favorites_theme', next);
    applyTheme(next);
    document.getElementById('themeSelect').value = next;
    showToast(`🎨 Tema: ${next === 'auto' ? 'Automático' : next === 'dark' ? 'Escuro' : 'Claro'}`, 'success');
}

// ===== FAVICONS COM FALLBACK =====
function initFavicons() {
    document.querySelectorAll('.favicon').forEach(img => {
        const domain = img.dataset.domain;
        const sources = [
            `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            `https://icon.horse/icon/${domain}`,
            `https://icons.duckduckgo.com/ip3/${domain}.ico`
        ];

        let loaded = false;
        const trySource = (index) => {
            if (index >= sources.length) {
                // Fallback final: emoji baseado no domínio
                if (!loaded) {
                    img.style.display = 'none';
                    const emoji = getDomainEmoji(domain);
                    img.insertAdjacentHTML('beforebegin',
                        `<span style="width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;background:var(--bg-secondary);border-radius:5px;font-size:14px">${emoji}</span>`
                    );
                }
                return;
            }
            img.src = sources[index];
            img.onerror = () => trySource(index + 1);
            img.onload = () => { loaded = true; };
        };
        trySource(0);
    });
}

function getDomainEmoji(domain) {
    const map = {
        'google': '🔍', 'gmail': '📧', 'youtube': '🎬', 'twitter': '🐦',
        'slack': '💬', 'whatsapp': '💚', 'github': '🐙', 'reddit': '🤖',
        'twitch': '🎮', 'spotify': '🎵', 'linkedin': '💼', 'facebook': '📘',
        'instagram': '📷', 'tiktok': '🎭', 'discord': '🎮', 'telegram': '📱',
        'localhost': '🔧', '127.0.0.1': '🔧', 'qwen': '✨', 'ofertaesperta': '💰',
        'hardmob': '🔥', 'myinstants': '🔊', 'whatsmyname': '🔍'
    };
    for (const [key, emoji] of Object.entries(map)) {
        if (domain.toLowerCase().includes(key)) return emoji;
    }
    return '🌐';
}

// ===== CONTADOR DE CLIQUES =====
function initClickCounters() {
    // Restaurar contadores salvos
    document.querySelectorAll('.link-count').forEach(el => {
        const link = el.closest('.link-item');
        const url = link.dataset.url;
        if (AppState.clickCounts[url]) {
            el.textContent = AppState.clickCounts[url];
        }
    });

    // Registrar cliques
    document.querySelectorAll('.link-item a[target="_blank"]').forEach(link => {
        link.addEventListener('click', () => {
            const url = link.closest('.link-item').dataset.url;
            AppState.clickCounts[url] = (AppState.clickCounts[url] || 0) + 1;
            localStorage.setItem('favorites_clicks', JSON.stringify(AppState.clickCounts));

            // Atualizar display
            const counter = link.closest('.link-item').querySelector('.link-count');
            if (counter) counter.textContent = AppState.clickCounts[url];

            // Feedback visual sutil
            counter.style.transform = 'scale(1.2)';
            counter.style.color = 'var(--success)';
            setTimeout(() => {
                counter.style.transform = '';
                counter.style.color = '';
            }, 200);
        });
    });
}

// ===== FAVORITOS FIXADOS =====
function initPinned() {
    // Botões de fixar
    document.querySelectorAll('.link-pin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePin(btn.closest('.link-item'));
        });
    });
}

function togglePin(linkItem) {
    const url = linkItem.dataset.url;
    const name = linkItem.dataset.name;
    const icon = linkItem.querySelector('.favicon')?.src || linkItem.querySelector('span')?.outerHTML || '📌';
    const index = AppState.pinned.findIndex(p => p.url === url);

    if (index === -1) {
        // Adicionar
        if (AppState.pinned.length >= AppState.settings.maxPinned) {
            showToast(`⚠️ Máximo de ${AppState.settings.maxPinned} fixados atingido`, 'warning');
            return;
        }
        AppState.pinned.push({ url, name, icon, added: Date.now() });
        linkItem.classList.add('pinned');
        showToast(`📌 ${name} fixado! (Ctrl+${AppState.pinned.length})`, 'success');
    } else {
        // Remover
        AppState.pinned.splice(index, 1);
        linkItem.classList.remove('pinned');
        showToast(`📍 ${name} desfixado`, 'success');
    }

    localStorage.setItem('favorites_pinned', JSON.stringify(AppState.pinned));
    renderPinned();
}

function renderPinned() {
    const grid = document.getElementById('pinnedGrid');
    const section = document.getElementById('pinnedSection');

    if (AppState.pinned.length === 0) {
        section.classList.remove('visible');
        return;
    }

    section.classList.add('visible');
    grid.innerHTML = AppState.pinned.slice(0, AppState.settings.maxPinned).map((pin, i) => `
        <a href="${pin.url}" target="_blank" rel="noopener" class="pinned-item" title="${pin.name}">
            ${pin.icon?.includes('<') ? pin.icon : `<img src="${pin.icon}" alt="">`}
            <span>${pin.name}</span>
            <span class="pinned-shortcut">Ctrl+${i+1}</span>
        </a>
    `).join('');
}

// ===== CONTEÚDO SENSÍVEL =====
function initAdultToggle() {
    const btn = document.getElementById('toggleAdult');
    const section = document.getElementById('adultSection');

    // Estado inicial
    if (AppState.adultVisible) {
        section.classList.add('visible');
        btn.textContent = '🔞 Ocultar';
        btn.classList.add('btn-primary');
    }

    btn.addEventListener('click', () => {
        AppState.adultVisible = !AppState.adultVisible;
        localStorage.setItem('favorites_adult', AppState.adultVisible);

        if (AppState.adultVisible) {
            section.classList.add('visible');
            btn.textContent = '🔞 Ocultar';
            btn.classList.add('btn-primary');
            showToast('🔞 Conteúdo sensível visível', 'warning');
        } else {
            section.classList.remove('visible');
            btn.textContent = '🔞 Conteúdo';
            btn.classList.remove('btn-primary');
            showToast('🔒 Conteúdo sensível ocultado', 'success');
        }
    });
}

// ===== BUSCA COM TAGS =====
function initSearch() {
    const input = document.getElementById('searchInput');

    // Busca em tempo real
    input.addEventListener('input', filterLinks);

    // Filtro por tag ao clicar
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
            const tag = e.target.dataset.tag;
            input.value = `tag:${tag}`;
            filterLinks();
            input.focus();
        }
    });
}

function filterLinks() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const isTagSearch = query.startsWith('tag:');
    const searchTag = isTagSearch ? query.slice(4) : null;

    document.querySelectorAll('.link-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        const tags = item.dataset.tags?.split(',') || [];
        const name = item.dataset.name?.toLowerCase() || '';

        let match = false;
        if (isTagSearch && searchTag) {
            match = tags.some(t => t.toLowerCase().includes(searchTag));
        } else if (query) {
            match = text.includes(query) || name.includes(query) || tags.some(t => t.includes(query));
        } else {
            match = true;
        }

        item.style.display = match ? 'flex' : 'none';
    });

    // Mostrar/ocultar categorias vazias
    document.querySelectorAll('.category').forEach(cat => {
        const visibleLinks = cat.querySelectorAll('.link-item[style="display: flex"], .link-item:not([style])');
        const hasVisible = Array.from(visibleLinks).some(l => l.style.display !== 'none');
        cat.style.display = (hasVisible || cat.classList.contains('adult') && !AppState.adultVisible) ? '' : 'none';
    });
}

// ===== ATALHOS DE TECLADO =====
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ignorar se estiver digitando em input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Ctrl+K: focar busca
        if (e.ctrlKey && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
            document.getElementById('searchInput').select();
            showToast('🔍 Digite para buscar...', 'success');
        }

        // Ctrl+1 a Ctrl+5: abrir fixados
        if (e.ctrlKey && /^[1-5]$/.test(e.key)) {
            e.preventDefault();
            const index = parseInt(e.key) - 1;
            if (AppState.pinned[index]) {
                window.open(AppState.pinned[index].url, '_blank');
                showToast(`🚀 Abrindo: ${AppState.pinned[index].name}`, 'success');
            }
        }

        // D: alternar tema
        if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleTheme();
        }

        // E: exportar
        if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            exportFavorites();
        }

        // S: abrir configurações
        if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleSettings();
        }

        // Escape: limpar busca
        if (e.key === 'Escape') {
            document.getElementById('searchInput').value = '';
            filterLinks();
        }
    });
}

// ===== DRAG & DROP (Reordenar) =====
function initDragAndDrop() {
    let draggedItem = null;

    // Links dentro de categorias
    document.querySelectorAll('.link-item[draggable="true"]').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
        });
    });

    // Listas como drop zones
    document.querySelectorAll('.links[data-sortable="true"]').forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement) {
                list.insertBefore(draggedItem, afterElement);
            } else {
                list.appendChild(draggedItem);
            }
        });
    });

    // Categorias também podem ser arrastadas (reordenar seções)
    document.querySelectorAll('.category-header[draggable="true"]').forEach(header => {
        header.addEventListener('dragstart', (e) => {
            header.closest('.category').classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        header.addEventListener('dragend', () => {
            header.closest('.category').classList.remove('dragging');
        });
    });
}

function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll('.link-item:not(.dragging)')];
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ===== CONFIGURAÇÕES =====
function initSettings() {
    const toggle = document.getElementById('settingsToggle');
    const panel = document.getElementById('settingsPanel');

    toggle.addEventListener('click', toggleSettings);

    // Max pinned
    document.getElementById('maxPinned').value = AppState.settings.maxPinned;
    document.getElementById('maxPinned').addEventListener('change', (e) => {
        AppState.settings.maxPinned = parseInt(e.target.value);
        localStorage.setItem('favorites_maxPinned', AppState.settings.maxPinned);
        renderPinned();
        showToast(`📌 Máximo de fixados: ${AppState.settings.maxPinned}`, 'success');
    });

    // Ordenação
    document.getElementById('sortOrder').value = AppState.settings.sortOrder;
    document.getElementById('sortOrder').addEventListener('change', (e) => {
        AppState.settings.sortOrder = e.target.value;
        localStorage.setItem('favorites_sortOrder', AppState.settings.sortOrder);
        applySortOrder();
        showToast('🔄 Ordenação atualizada', 'success');
    });

    // Reset contadores
    document.getElementById('resetCounters').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja zerar todos os contadores de cliques?')) {
            AppState.clickCounts = {};
            localStorage.setItem('favorites_clicks', '{}');
            document.querySelectorAll('.link-count').forEach(el => el.textContent = '0');
            showToast('🗑️ Contadores resetados', 'success');
        }
    });
}

function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel.classList.toggle('visible');
    showToast(panel.classList.contains('visible') ? '⚙️ Configurações abertas' : '⚙️ Configurações fechadas', 'success');
}

function applySortOrder() {
    const order = AppState.settings.sortOrder;
    document.querySelectorAll('.links[data-sortable="true"]').forEach(list => {
        const items = Array.from(list.querySelectorAll('.link-item'));
        if (order === 'clicks') {
            items.sort((a, b) => {
                const countA = parseInt(a.querySelector('.link-count')?.textContent) || 0;
                const countB = parseInt(b.querySelector('.link-count')?.textContent) || 0;
                return countB - countA;
            });
        } else if (order === 'name') {
            items.sort((a, b) => a.dataset.name?.localeCompare(b.dataset.name) || 0);
        }
        // 'default' mantém ordem original do HTML
        items.forEach(item => list.appendChild(item));
    });
}

// ===== EXPORTAR / IMPORTAR =====
function initExportImport() {
    document.getElementById('exportBtn').addEventListener('click', exportFavorites);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importFavorites);
}

function exportFavorites() {
    const data = {
        version: '1.0',
        exported: new Date().toISOString(),
        pinned: AppState.pinned,
        clickCounts: AppState.clickCounts,
        settings: AppState.settings,
        adultVisible: AppState.adultVisible,
        // Extrair estrutura atual dos links
        links: Array.from(document.querySelectorAll('.link-item')).map(item => ({
            url: item.dataset.url,
            name: item.dataset.name,
            tags: item.dataset.tags?.split(',') || [],
            category: item.closest('.category')?.dataset.category,
            clicks: parseInt(item.querySelector('.link-count')?.textContent) || 0,
            pinned: item.classList.contains('pinned')
        }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `favoritos-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('💾 Backup exportado com sucesso!', 'success');
}

function importFavorites(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            // Restaurar estados
            if (data.pinned) {
                AppState.pinned = data.pinned;
                localStorage.setItem('favorites_pinned', JSON.stringify(AppState.pinned));
            }
            if (data.clickCounts) {
                AppState.clickCounts = data.clickCounts;
                localStorage.setItem('favorites_clicks', JSON.stringify(AppState.clickCounts));
            }
            if (data.settings) {
                AppState.settings = {...AppState.settings, ...data.settings};
                localStorage.setItem('favorites_maxPinned', AppState.settings.maxPinned);
                localStorage.setItem('favorites_sortOrder', AppState.settings.sortOrder);
            }

            // Atualizar UI
            initClickCounters();
            renderPinned();
            applySortOrder();

            showToast('📁 Backup importado com sucesso! 🎉', 'success');
        } catch (err) {
            showToast('❌ Erro ao importar arquivo', 'error');
            console.error(err);
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
}

// ===== CATEGORIAS RECOLHÍVEIS =====
function initCollapsibles() {
    document.querySelectorAll('.collapse-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const links = btn.closest('.category-header').nextElementSibling;
            const isCollapsed = links.style.display === 'none';

            links.style.display = isCollapsed ? '' : 'none';
            btn.textContent = isCollapsed ? '−' : '+';
            btn.title = isCollapsed ? 'Recolher' : 'Expandir';
        });
    });
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Remover após animação
    setTimeout(() => toast.remove(), 3000);
}

// ===== SERVICE WORKER PARA PWA (básico) =====
if ('serviceWorker' in navigator) {
    // Nota: Em produção, registre um arquivo sw.js real
    // Este é um placeholder para funcionar offline básico
    console.log('📱 PWA support detected');
}