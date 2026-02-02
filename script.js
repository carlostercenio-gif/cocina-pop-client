// ═══════════════════════════════════════════════
// 🥑 COCINA POP CLIENT - ENGINE
//    Scan for Flavor
// ═══════════════════════════════════════════════

(function() {

// ═══════════════════════════════════════════════
// 📦 CATÁLOGO DE PRODUCTOS
// Editá esto con tus productos reales
// ═══════════════════════════════════════════════
const CATALOGO = {
    "P-milanesas": {
        nom: "Milanesas de Pollo",
        emoji: "🍗",
        precio: 8000,
        cat: "FREEZER",
        unidades: "x4 unidades",
        tips: [
            "Freír 3 min por lado a fuego medio",
            "Horno a 180° por 20 minutos",
            "Servir con ensalada fresca"
        ],
        videos: {
            instagram: "",
            youtube: ""
        }
    },
    "P-empanadas": {
        nom: "Empanadas de Carne",
        emoji: "🥟",
        precio: 6500,
        cat: "FREEZER",
        unidades: "x12 unidades",
        tips: [
            "Horno a 200° por 15-20 minutos",
            "Hasta que estén doradas",
            "Servir calientes con salsa"
        ],
        videos: {
            instagram: "",
            youtube: ""
        }
    },
    "P-pizza": {
        nom: "Pizza Muzzarella",
        emoji: "🍕",
        precio: 9000,
        cat: "FREEZER",
        unidades: "x1 pizza",
        tips: [
            "Horno a 200° por 12-15 minutos",
            "Hasta que el queso se dore",
            "Cortá en 8 porciones"
        ],
        videos: {
            instagram: ""
        }
    },
    "P-tarta": {
        nom: "Tarta de Verdura",
        emoji: "🥧",
        precio: 7000,
        cat: "FREEZER",
        unidades: "x1 tarta",
        tips: [
            "Horno a 180° por 25 minutos",
            "Dejá reposar 5 min antes de cortar",
            "Se puede servir fría o caliente"
        ],
        videos: {}
    },
    "P-vinagreta": {
        nom: "Vinagreta",
        emoji: "🥗",
        precio: 6500,
        cat: "MARKET",
        unidades: "x1 frasco",
        tips: [
            "Ideal para ensaladas",
            "Mezclá bien antes de usar",
            "Se conserva 30 días al abrir"
        ],
        videos: {}
    },
    "P-coca": {
        nom: "Coca Cola",
        emoji: "🥤",
        precio: 666,
        cat: "HELADERA",
        unidades: "x1 unidad",
        tips: [
            "Servir bien fría",
            "Ideal como acompañamiento"
        ],
        videos: {}
    }
};

// ═══ CONFIGURACIÓN ═══
// ← CAMBIÓ POR EL NÚMERO DE WHATSAPP REAL (sin espacios, con código de país)
const WA_NUMERO = "541234567890";

// ═══════════════════════════════════════════════
// 💾 STATE & STORAGE
// ═══════════════════════════════════════════════
let favoritos = [];
let historial = [];
let currentProductId = null;
let scanner = null;
let catActual = 'MARKET';

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
// 🎬 SPLASH
// ═══════════════════════════════════════════════
window.entrar = function() {
    const splash = document.getElementById('splash');
    splash.classList.add('hide');
    setTimeout(() => {
        splash.style.display = 'none';
        document.getElementById('app').classList.add('visible');
        loadData();
        renderAll();
    }, 600);
};

// ═══════════════════════════════════════════════
// 🔀 TABS / NAVEGACIÓN
// ═══════════════════════════════════════════════
window.goTab = function(tab, el) {
    // Cambiar página
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + tab).classList.add('active');

    // Cambiar nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');

    // Render según página
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

    // Mostrar máximo 3
    el.innerHTML = favoritos.slice(0, 3).map(f => {
        const p = CATALOGO[f.id];
        if (!p) return '';
        return `
            <div class="fav-item" onclick="abrirProducto('${f.id}')">
                <div class="fav-item-emoji">${p.emoji}</div>
                <div class="fav-item-info">
                    <strong>${p.nom}</strong>
                    <small>$${formatPrecio(p.precio)} • ${p.unidades}</small>
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
    const productos = Object.entries(CATALOGO).filter(([id, p]) => p.cat === catActual);

    if (productos.length === 0) {
        grid.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;">Sin productos en esta categoría</p>';
        return;
    }

    grid.innerHTML = productos.map(([id, p]) => `
        <div class="cat-card" onclick="abrirProducto('${id}')">
            <div class="cat-card-img">${p.emoji}</div>
            <div class="cat-card-info">
                <strong>${p.nom}</strong>
                <div class="cat-card-precio">$${formatPrecio(p.precio)}</div>
                <div class="cat-card-unidades">${p.unidades}</div>
            </div>
        </div>
    `).join('');
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
                <div class="fav-page-item-emoji">${p.emoji}</div>
                <div class="fav-page-item-info">
                    <strong>${p.nom}</strong>
                    <small>$${formatPrecio(p.precio)} • Último: ${formatDate(f.fecha)}</small>
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

    // Agrupar por fecha
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

    // Datos
    document.getElementById('modal-img').innerText = p.emoji;
    document.getElementById('modal-nom').innerText = p.nom;
    document.getElementById('modal-precio').innerText = `$${formatPrecio(p.precio)}`;
    document.getElementById('modal-cat').innerText = `${p.cat} • ${p.unidades}`;

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

    // Estado favorito
    const esFav = favoritos.some(f => f.id === id);
    const btnFav = document.getElementById('btn-favorito');
    if (esFav) {
        btnFav.innerHTML = '<i class="fa-solid fa-star" style="color:var(--yellow)"></i> EN TUS FAVORITOS';
        btnFav.classList.add('active');
    } else {
        btnFav.innerHTML = '<i class="fa-solid fa-star"></i> AGREGAR A FAVORITOS';
        btnFav.classList.remove('active');
    }

    // Abrir modal
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
        // Agregar
        favoritos.push({ id: currentProductId, fecha: getHoy() });
        btnFav.innerHTML = '<i class="fa-solid fa-star" style="color:var(--yellow)"></i> EN TUS FAVORITOS';
        btnFav.classList.add('active');
    } else {
        // Borrar
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

    // Registrar en historial
    agregarHistorial([id]);

    const msg = encodeURIComponent(
        `Hola Cocina Pop! 🥑\n\nQuiero pedir:\n• ${p.nom} (${p.unidades}) - $${formatPrecio(p.precio)}\n\n¿Está disponible? Gracias!`
    );
    window.open(`https://wa.me/${WA_NUMERO}?text=${msg}`, '_blank');
};

window.repetirPedido = function(idx) {
    const pedido = historial[idx];
    if (!pedido) return;

    const lines = pedido.items.map(id => {
        const p = CATALOGO[id];
        return p ? `• ${p.nom} (${p.unidades}) - $${formatPrecio(p.precio)}` : null;
    }).filter(Boolean);

    if (lines.length === 0) return;

    // Nuevo historial
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
            // ✅ QR leído
            closeScanner();
            setTimeout(() => {
                if (CATALOGO[texto]) {
                    abrirProducto(texto);
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
console.log('🥑 Cocina Pop Client - Iniciado');
// ═══════════════════════════════════════════════

})();
