// ═══════════════════════════════════════════════
// 🥑 COCINA POP CLIENT - ENGINE v2
//    Scan for Flavor
// ═══════════════════════════════════════════════

(function() {

// ═══════════════════════════════════════════════
// ⚙️ CONFIGURACIÓN
// ═══════════════════════════════════════════════
// ← Tu número de WhatsApp
const WA_NUMERO = "541556444379";

// Supabase config
const SUPABASE_URL = 'https://hmuufyyxbfksslbstjra.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hfCaIjbpKHiFUuZjl32BTg_hPe3s0Jl';

// ═══════════════════════════════════════════════
// 📦 CATÁLOGO - Se carga desde Supabase
// ═══════════════════════════════════════════════
let CATALOGO = {};

// ═══════════════════════════════════════════════
// 💾 STATE & STORAGE
// ═══════════════════════════════════════════════
let favoritos = [];
let historial = [];
let currentProductId = null;
let scanner = null;
let catActual = 'MARKET';
let catalogoLoaded = false;

function loadData() {
    try {
        favoritos = JSON.parse(localStorage.getItem('cp_client_fav')) || [];
        historial = JSON.parse(localStorage.getItem('cp_client_his')) || [];
    } catch(e) {
        favoritos = [];
        historial = [];
    }
}

function saveData() {
    localStorage.setItem('cp_client_fav', JSON.stringify(favoritos));
    localStorage.setItem('cp_client_his', JSON.stringify(historial));
}

// ═══════════════════════════════════════════════
// 📥 CARGAR CATÁLOGO desde Supabase
// ═══════════════════════════════════════════════
async function loadCatalogo() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/productos?id=eq.catalogo&select=data`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        
        if (!res.ok) throw new Error('Error cargando catálogo');
        
        const rows = await res.json();
        if (rows && rows.length > 0 && rows[0].data) {
            CATALOGO = rows[0].data;
            console.log('✅ Catálogo cargado desde Supabase:', Object.keys(CATALOGO).length, 'productos');
        } else {
            CATALOGO = {};
            console.warn('⚠️ Catálogo vacío en Supabase');
        }
        catalogoLoaded = true;
    } catch(e) {
        console.error('❌ Error cargando catálogo:', e.message);
        CATALOGO = {};
        catalogoLoaded = true;
    }
    renderAll();
}

// ═══════════════════════════════════════════════
// 🎬 SPLASH
// ═══════════════════════════════════════════════
window.entrar = function() {
    const splash = document.getElementById('splash');
    splash.classList.add('hide');
    setTimeout(() => {
        splash.style.display = 'none';
        document.getElementById('app').classList.add('visible');
        loadData();
        loadCatalogo();
    }, 600);
};

// ═══════════════════════════════════════════════
// 🔀 TABS / NAVEGACIÓN
// ═══════════════════════════════════════════════
window.goTab = function(tab, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + tab).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');

    if (tab === 'home')       renderHome();
    if (tab === 'catalogo')   renderCatalogo();
    if (tab === 'favoritos')  renderFavoritos();
    if (tab === 'historial')  renderHistorial();
};

// ═══════════════════════════════════════════════
// 🏠 HOME
// ═══════════════════════════════════════════════
function renderHome() {
    renderFavoritosHome();
    renderUltimoPedido();
}

function renderFavoritosHome() {
    const el = document.getElementById('favoritos-home');

    if (favoritos.length === 0) {
        el.innerHTML = '<p class="empty-msg">Sin favoritos aún. Escanear un producto y agregalo ⭐</p>';
        return;
    }

    el.innerHTML = favoritos.slice(0, 3).map(f => {
        const p = CATALOGO[f.id];
        if (!p) return '';
        return `
            <div class="fav-item" onclick="abrirProducto('${f.id}')">
                <div class="fav-item-emoji">${p.emoji || '📦'}</div>
                <div class="fav-item-info">
                    <strong>${p.nom}</strong>
                    <small>$${formatPrecio(p.pre || 0)} • ${calcularStock(p)} disp.</small>
                </div>
                <button class="fav-item-btn" onclick="event.stopPropagation(); pedirDirecto('${f.id}')">
                    <i class="fa-brands fa-whatsapp"></i> Pedir
                </button>
            </div>`;
    }).join('');
}

function renderUltimoPedido() {
    const el = document.getElementById('ultimo-pedido');

    if (historial.length === 0) {
        el.innerHTML = '<p class="empty-msg">Hacé tu primera compra 🛍️</p>';
        return;
    }

    const ultimo = historial[0];
    const items = ultimo.items.map(id => CATALOGO[id] ? CATALOGO[id].nom : id);

    el.innerHTML = `
        <div class="pedido-card">
            <div class="pedido-card-fecha">📅 ${formatDate(ultimo.fecha)}</div>
            <div class="pedido-card-items">
                ${items.map(n => `<span>• ${n}</span>`).join('')}
            </div>
            <button class="pedido-card-btn" onclick="repetirPedido(0)">
                <i class="fa-brands fa-whatsapp"></i> REPETIR PEDIDO
            </button>
        </div>`;
}

// ═══════════════════════════════════════════════
// 📖 CATÁLOGO
// ═══════════════════════════════════════════════
window.filtrarCat = function(cat, btn) {
    catActual = cat;
    document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCatalogo();
};

function renderCatalogo() {
    const grid = document.getElementById('catalogo-grid');

    if (!catalogoLoaded) {
        grid.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;">Cargando catálogo...</p>';
        return;
    }

    const productos = Object.entries(CATALOGO).filter(([id, p]) => {
        if (p.cat !== catActual) return false;
        return calcularStock(p) > 0;
    });

    if (productos.length === 0) {
        grid.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;">Sin productos disponibles en esta categoría</p>';
        return;
    }

    grid.innerHTML = productos.map(([id, p]) => {
        const stock = calcularStock(p);
        return `
            <div class="cat-card" onclick="abrirProducto('${id}')">
                <div class="cat-card-img">${p.emoji || '📦'}</div>
                <div class="cat-card-info">
                    <strong>${p.nom}</strong>
                    <div class="cat-card-precio">$${formatPrecio(p.pre || 0)}</div>
                    <div class="cat-card-unidades">${stock} disponible${stock !== 1 ? 's' : ''}</div>
                </div>
            </div>`;
    }).join('');
}

// ═══════════════════════════════════════════════
// 🧮 CALCULAR STOCK desde lotes FIFO
// ═══════════════════════════════════════════════
function calcularStock(producto) {
    if (producto.lotes && producto.lotes.length > 0) {
        return producto.lotes.reduce((sum, l) => sum + (l.cant || 0), 0);
    }
    return 0;
}

// ═══════════════════════════════════════════════
// ⭐ FAVORITOS PAGE
// ═══════════════════════════════════════════════
function renderFavoritos() {
    const el = document.getElementById('lista-favoritos');

    if (favoritos.length === 0) {
        el.innerHTML = '<p class="empty-msg">Sin favoritos aún.<br>Escanear un producto y tocá ⭐</p>';
        return;
    }

    el.innerHTML = favoritos.map((f, idx) => {
        const p = CATALOGO[f.id];
        if (!p) return '';
        return `
            <div class="fav-page-item">
                <div class="fav-page-item-emoji">${p.emoji || '📦'}</div>
                <div class="fav-page-item-info">
                    <strong>${p.nom}</strong>
                    <small>$${formatPrecio(p.pre || 0)} • Último: ${formatDate(f.fecha)}</small>
                </div>
                <div class="fav-page-item-actions">
                    <button class="btn-repedir" onclick="pedirDirecto('${f.id}')">
                        <i class="fa-brands fa-whatsapp"></i> Pedir
                    </button>
                    <button class="btn-borrar-fav" onclick="borrarFavorito(${idx})">Borrar</button>
                </div>
            </div>`;
    }).join('');
}

// ═══════════════════════════════════════════════
// 📜 HISTORIAL
// ═══════════════════════════════════════════════
function renderHistorial() {
    const el = document.getElementById('lista-historial');

    if (historial.length === 0) {
        el.innerHTML = '<p class="empty-msg">Sin compras registradas aún</p>';
        return;
    }

    const agrupado = {};
    historial.forEach((h, idx) => {
        if (!agrupado[h.fecha]) agrupado[h.fecha] = [];
        agrupado[h.fecha].push({ ...h, idx });
    });

    el.innerHTML = Object.entries(agrupado).map(([fecha, pedidos]) => `
        <div class="historial-dia">
            <div class="historial-dia-fecha">📅 ${formatDate(fecha)}</div>
            ${pedidos.map(ped => `
                <div class="historial-item">
                    <div class="historial-item-emoji">📦</div>
                    <div class="historial-item-info">
                        <strong>${ped.items.map(id => CATALOGO[id] ? CATALOGO[id].nom : id).join(', ')}</strong>
                        <small>${ped.items.length} producto${ped.items.length > 1 ? 's' : ''}</small>
                    </div>
                    <button class="historial-repedir" onclick="repetirPedido(${ped.idx})">
                        <i class="fa-brands fa-whatsapp"></i> Repetir
                    </button>
                </div>
            `).join('')}
        </div>
    `).join('');
}

// ═══════════════════════════════════════════════
// 📱 MODAL PRODUCTO
// ═══════════════════════════════════════════════
window.abrirProducto = function(id) {
    const p = CATALOGO[id];
    if (!p) return;
    currentProductId = id;

    const stock = calcularStock(p);

    document.getElementById('modal-img').innerText = p.emoji || '📦';
    document.getElementById('modal-nom').innerText = p.nom;
    document.getElementById('modal-precio').innerText = `$${formatPrecio(p.pre || 0)}`;
    document.getElementById('modal-cat').innerText = `${p.cat} • ${stock} disponible${stock !== 1 ? 's' : ''}`;

    // Tips
    const tipsEl = document.getElementById('modal-tips');
    if (p.tips && p.tips.length > 0) {
        tipsEl.innerHTML = `<h4>💡 TIPS DE COCINA</h4><ul>${p.tips.map(t => `<li>${t}</li>`).join('')}</ul>`;
        tipsEl.style.display = 'block';
    } else {
        tipsEl.style.display = 'none';
    }

    // Videos
    const videosEl = document.getElementById('modal-videos');
    let html = '';
    if (p.videos) {
        if (p.videos.instagram) html += `<a href="${p.videos.instagram}" target="_blank" class="video-btn instagram"><i class="fa-brands fa-instagram"></i> Ver en Instagram</a>`;
        if (p.videos.youtube)   html += `<a href="${p.videos.youtube}" target="_blank" class="video-btn youtube"><i class="fa-brands fa-youtube"></i> Ver en YouTube</a>`;
        if (p.videos.tiktok)    html += `<a href="${p.videos.tiktok}" target="_blank" class="video-btn tiktok"><i class="fa-brands fa-tiktok"></i> Ver en TikTok</a>`;
    }
    videosEl.innerHTML = html;

    // Favorito
    const esFav = favoritos.some(f => f.id === id);
    const btnFav = document.getElementById('btn-favorito');
    if (esFav) {
        btnFav.innerHTML = '<i class="fa-solid fa-star" style="color:var(--yellow)"></i> EN TUS FAVORITOS';
        btnFav.classList.add('active');
    } else {
        btnFav.innerHTML = '<i class="fa-solid fa-star"></i> AGREGAR A FAVORITOS';
        btnFav.classList.remove('active');
    }

    // Sin stock → deshabilitar pedido
    const btnWA = document.getElementById('btn-whatsapp-modal');
    if (stock === 0) {
        btnWA.style.opacity = '0.4';
        btnWA.style.pointerEvents = 'none';
        btnWA.innerHTML = '<i class="fa-solid fa-ban"></i> SIN STOCK';
    } else {
        btnWA.style.opacity = '1';
        btnWA.style.pointerEvents = 'auto';
        btnWA.innerHTML = '<i class="fa-brands fa-whatsapp"></i> PEDIR POR WHATSAPP';
    }

    document.getElementById('modal-producto').classList.add('active');
};

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
};

// ═══════════════════════════════════════════════
// ⭐ TOGGLE FAVORITO
// ═══════════════════════════════════════════════
window.toggleFavorito = function() {
    if (!currentProductId) return;

    const idx = favoritos.findIndex(f => f.id === currentProductId);
    const btnFav = document.getElementById('btn-favorito');

    if (idx === -1) {
        favoritos.push({ id: currentProductId, fecha: getHoy() });
        btnFav.innerHTML = '<i class="fa-solid fa-star" style="color:var(--yellow)"></i> EN TUS FAVORITOS';
        btnFav.classList.add('active');
    } else {
        favoritos.splice(idx, 1);
        btnFav.innerHTML = '<i class="fa-solid fa-star"></i> AGREGAR A FAVORITOS';
        btnFav.classList.remove('active');
    }

    saveData();
    renderHome();
};

window.borrarFavorito = function(idx) {
    favoritos.splice(idx, 1);
    saveData();
    renderFavoritos();
    renderHome();
};

// ═══════════════════════════════════════════════
// 💬 WHATSAPP
// ═══════════════════════════════════════════════
window.pedirWhatsApp = function() {
    if (!currentProductId) return;
    pedirDirecto(currentProductId);
};

window.pedirDirecto = function(id) {
    const p = CATALOGO[id];
    if (!p) return;
    if (calcularStock(p) === 0) return;

    agregarHistorial([id]);

    const msg = encodeURIComponent(
        `Hola Cocina Pop! 🥑\n\nQuiero pedir:\n• ${p.nom} - $${formatPrecio(p.pre || 0)}\n\n¿Está disponible? Gracias!`
    );
    window.open(`https://wa.me/${WA_NUMERO}?text=${msg}`, '_blank');
};

window.repetirPedido = function(idx) {
    const pedido = historial[idx];
    if (!pedido) return;

    const lines = pedido.items.map(id => {
        const p = CATALOGO[id];
        if (!p) return null;
        return `• ${p.nom} - $${formatPrecio(p.pre || 0)}`;
    }).filter(Boolean);

    if (lines.length === 0) return;

    agregarHistorial(pedido.items);

    const msg = encodeURIComponent(
        `Hola Cocina Pop! 🥑\n\nQuiero repetir mi pedido:\n${lines.join('\n')}\n\n¿Están disponibles? Gracias!`
    );
    window.open(`https://wa.me/${WA_NUMERO}?text=${msg}`, '_blank');
};

window.consultarWA = function() {
    const msg = encodeURIComponent(`Hola Cocina Pop! 🥑\nTengo una pregunta sobre un producto. ¿Puede ayudarme?`);
    window.open(`https://wa.me/${WA_NUMERO}?text=${msg}`, '_blank');
};

// ═══════════════════════════════════════════════
// 📜 HISTORIAL LOGIC
// ═══════════════════════════════════════════════
function agregarHistorial(items) {
    historial.unshift({ fecha: getHoy(), items: items });
    saveData();
    renderHome();
}

// ═══════════════════════════════════════════════
// 📷 SCANNER QR
// ═══════════════════════════════════════════════
window.startScanner = function() {
    document.getElementById('modal-scanner').classList.add('active');

    if (!scanner) {
        scanner = new Html5Qrcode("reader");
    }

    scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (texto) => {
            closeScanner();
            setTimeout(() => {
                // ✅ Parsear QR: la app admin genera JSON {"id":"p_xxx"}
                let productId = texto;
                try {
                    const obj = JSON.parse(texto);
                    if (obj.id) productId = obj.id;
                } catch(e) {
                    // Si no es JSON, usar el texto directo
                }

                if (CATALOGO[productId]) {
                    abrirProducto(productId);
                } else {
                    document.getElementById('modal-no-encontrado').classList.add('active');
                }
            }, 350);
        }
    ).catch(err => {
        console.log("Error cámara:", err);
    });
};

window.closeScanner = function() {
    document.getElementById('modal-scanner').classList.remove('active');
    if (scanner) {
        scanner.stop().catch(() => {});
    }
};

// ═══════════════════════════════════════════════
// 🛠️ UTILS
// ═══════════════════════════════════════════════
function getHoy() {
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
    if (!dateStr) return 'Sin fecha';
    const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    const d = new Date(dateStr + 'T12:00:00');
    return `${d.getDate().toString().padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}

function formatPrecio(num) {
    return num.toLocaleString('es-AR');
}

function renderAll() {
    renderHome();
    renderCatalogo();
}

// ═══════════════════════════════════════════════
console.log('🥑 Cocina Pop Client v2 - Iniciado');
// ═══════════════════════════════════════════════

})();
