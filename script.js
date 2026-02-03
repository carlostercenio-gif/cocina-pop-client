// ═══════════════════════════════════════════════
// 🥑 COCINA POP CLIENT - MI DESPENSA
//    Scan for Flavor
// ═══════════════════════════════════════════════

(function() {

// ═══════════════════════════════════════════════
// ⚙️ CONFIGURACIÓN
// ═══════════════════════════════════════════════
const WA_NUMERO = "5491156444379";

// ═══════════════════════════════════════════════
// 💾 MI DESPENSA (productos escaneados)
// ═══════════════════════════════════════════════
let miDespensa = {
    MARKET: [],
    FREEZER: [],
    HELADERA: []
};

let currentProducto = null;
let scanner = null;
let catActual = 'MARKET';

function loadData() {
    try {
        const saved = localStorage.getItem('cp_client_despensa');
        if (saved) {
            miDespensa = JSON.parse(saved);
        }
    } catch(e) {
        console.error('Error cargando despensa:', e);
    }
}

function saveData() {
    localStorage.setItem('cp_client_despensa', JSON.stringify(miDespensa));
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
        renderHome();
        renderCatalogo();
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

    if (tab === 'home') renderHome();
    if (tab === 'catalogo') renderCatalogo();
};

// ═══════════════════════════════════════════════
// 🏠 HOME
// ═══════════════════════════════════════════════
function renderHome() {
    const totalProductos = miDespensa.MARKET.length + miDespensa.FREEZER.length + miDespensa.HELADERA.length;
    
    const el = document.getElementById('favoritos-home');
    
    if (totalProductos === 0) {
        el.innerHTML = '<p class="empty-msg">Escaneá tu primer producto 📦</p>';
        document.getElementById('ultimo-pedido').innerHTML = '<p class="empty-msg">Tu despensa está vacía</p>';
        return;
    }

    // Mostrar últimos 5 productos escaneados (de todas las categorías)
    const todos = [
        ...miDespensa.MARKET.map(p => ({...p, cat: 'MARKET'})),
        ...miDespensa.FREEZER.map(p => ({...p, cat: 'FREEZER'})),
        ...miDespensa.HELADERA.map(p => ({...p, cat: 'HELADERA'}))
    ].sort((a, b) => new Date(b.fechaEscaneo) - new Date(a.fechaEscaneo)).slice(0, 5);

    el.innerHTML = `
        <p style="opacity:0.5; font-size:12px; margin-bottom:10px;">Últimos productos escaneados:</p>
        ${todos.map(p => {
            const diasVenc = calcularDiasVencimiento(p.vencimiento);
            const alertaVenc = diasVenc <= 3 ? '⚠️' : '';
            
            return `
            <div class="fav-item" onclick="verDetalleProducto('${p.id}', '${p.cat}')">
                <div class="fav-item-emoji">${p.emoji || '📦'}</div>
                <div class="fav-item-info">
                    <strong>${p.nom}</strong>
                    <small>${p.cat} • Vence: ${formatDate(p.vencimiento)} ${alertaVenc}</small>
                </div>
                <button class="fav-item-btn" onclick="event.stopPropagation(); pedirProducto('${p.id}', '${p.cat}')">
                    <i class="fa-brands fa-whatsapp"></i> Pedir
                </button>
            </div>`;
        }).join('')}
    `;

    // Resumen
    document.getElementById('ultimo-pedido').innerHTML = `
        <div class="pedido-card">
            <div class="pedido-card-fecha">📊 RESUMEN DE TU DESPENSA</div>
            <div class="pedido-card-items">
                <span>🛒 Market: ${miDespensa.MARKET.length} productos</span>
                <span>❄️ Freezer: ${miDespensa.FREEZER.length} productos</span>
                <span>🧊 Heladera: ${miDespensa.HELADERA.length} productos</span>
            </div>
        </div>`;
}

// ═══════════════════════════════════════════════
// 📖 MI DESPENSA (antes "catálogo")
// ═══════════════════════════════════════════════
window.filtrarCat = function(cat, btn) {
    catActual = cat;
    document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCatalogo();
};

function renderCatalogo() {
    const grid = document.getElementById('catalogo-grid');
    const productos = miDespensa[catActual] || [];

    if (productos.length === 0) {
        grid.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;">Sin productos en ' + catActual + '<br>Escaneá uno para agregarlo</p>';
        return;
    }

    grid.innerHTML = productos.map(p => {
        const diasVenc = calcularDiasVencimiento(p.vencimiento);
        const alertaVenc = diasVenc <= 3 ? '⚠️ ' : '';
        const textoVenc = diasVenc < 0 ? 'VENCIDO' : diasVenc === 0 ? 'Vence HOY' : `${diasVenc} días`;
        
        return `
            <div class="cat-card" onclick="verDetalleProducto('${p.id}', '${catActual}')">
                <div class="cat-card-img">${p.emoji || '📦'}</div>
                <div class="cat-card-info">
                    <strong>${p.nom}</strong>
                    <div class="cat-card-precio">$${formatPrecio(p.precio)}</div>
                    <div class="cat-card-unidades">${alertaVenc}${textoVenc}</div>
                </div>
            </div>`;
    }).join('');
}

// ═══════════════════════════════════════════════
// 📱 VER DETALLE DE PRODUCTO
// ═══════════════════════════════════════════════
window.verDetalleProducto = function(id, cat) {
    const p = miDespensa[cat].find(prod => prod.id === id);
    if (!p) return;
    
    currentProducto = { ...p, cat };

    const diasVenc = calcularDiasVencimiento(p.vencimiento);
    const alertaVenc = diasVenc <= 3 ? '⚠️ ' : '';
    const textoVenc = diasVenc < 0 ? 'VENCIDO' : diasVenc === 0 ? 'Vence HOY' : `Vence en ${diasVenc} días`;

    document.getElementById('modal-img').innerText = p.emoji || '📦';
    document.getElementById('modal-nom').innerText = p.nom;
    document.getElementById('modal-precio').innerText = `$${formatPrecio(p.precio)}`;
    document.getElementById('modal-cat').innerText = `${cat} • ${alertaVenc}${textoVenc}`;

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
        if (p.videos.youtube) html += `<a href="${p.videos.youtube}" target="_blank" class="video-btn youtube"><i class="fa-brands fa-youtube"></i> Ver en YouTube</a>`;
        if (p.videos.tiktok) html += `<a href="${p.videos.tiktok}" target="_blank" class="video-btn tiktok"><i class="fa-brands fa-tiktok"></i> Ver en TikTok</a>`;
    }
    videosEl.innerHTML = html;

    // Cambiar botón favorito por "ELIMINAR DE MI DESPENSA"
    const btnFav = document.getElementById('btn-favorito');
    btnFav.innerHTML = '<i class="fa-solid fa-trash"></i> ELIMINAR DE MI DESPENSA';
    btnFav.classList.remove('active');

    document.getElementById('modal-producto').classList.add('active');
};

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
};

// ═══════════════════════════════════════════════
// 🗑️ ELIMINAR PRODUCTO (antes era "toggle favorito")
// ═══════════════════════════════════════════════
window.toggleFavorito = function() {
    if (!currentProducto) return;
    
    if (confirm(`¿Eliminar ${currentProducto.nom} de tu despensa?`)) {
        miDespensa[currentProducto.cat] = miDespensa[currentProducto.cat].filter(p => p.id !== currentProducto.id);
        saveData();
        closeModal('modal-producto');
        renderHome();
        renderCatalogo();
    }
};

// ═══════════════════════════════════════════════
// 💬 WHATSAPP
// ═══════════════════════════════════════════════
window.pedirWhatsApp = function() {
    if (!currentProducto) return;
    pedirProducto(currentProducto.id, currentProducto.cat);
};

window.pedirProducto = function(id, cat) {
    const p = miDespensa[cat].find(prod => prod.id === id);
    if (!p) return;

    const msg = encodeURIComponent(
        `Hola Cocina Pop! 🥑\n\nQuiero pedir:\n• ${p.nom} - $${formatPrecio(p.precio)}\n\n¿Está disponible? Gracias!`
    );
    window.open(`https://wa.me/${WA_NUMERO}?text=${msg}`, '_blank');
};

window.consultarWA = function() {
    const msg = encodeURIComponent(`Hola Cocina Pop! 🥑\nTengo una pregunta sobre un producto. ¿Puede ayudarme?`);
    window.open(`https://wa.me/${WA_NUMERO}?text=${msg}`, '_blank');
};

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
                try {
                    const producto = JSON.parse(texto);
                    
                    if (producto.id && producto.nom && producto.cat) {
                        mostrarProductoEscaneado(producto);
                    } else {
                        document.getElementById('modal-no-encontrado').classList.add('active');
                    }
                } catch(e) {
                    console.error('Error parseando QR:', e);
                    document.getElementById('modal-no-encontrado').classList.add('active');
                }
            }, 350);
        }
    ).catch(err => {
        console.log("Error cámara:", err);
        alert("No se pudo acceder a la cámara");
    });
};

window.closeScanner = function() {
    document.getElementById('modal-scanner').classList.remove('active');
    if (scanner) {
        scanner.stop().catch(() => {});
    }
};

// ═══════════════════════════════════════════════
// ✅ AGREGAR PRODUCTO ESCANEADO
// ═══════════════════════════════════════════════
function mostrarProductoEscaneado(producto) {
    // Verificar si ya existe en esa categoría
    const yaExiste = miDespensa[producto.cat].some(p => p.id === producto.id);
    
    if (yaExiste) {
        alert(`Ya tenés "${producto.nom}" en tu ${producto.cat}`);
        return;
    }

    // Agregar fecha de escaneo
    producto.fechaEscaneo = new Date().toISOString();
    
    // Agregar a la categoría correspondiente
    miDespensa[producto.cat].push(producto);
    saveData();
    
    // Mostrar confirmación
    alert(`✅ "${producto.nom}" agregado a ${producto.cat}`);
    
    // Actualizar vistas
    renderHome();
    if (catActual === producto.cat) {
        renderCatalogo();
    }
}

// ═══════════════════════════════════════════════
// 🛠️ UTILS
// ═══════════════════════════════════════════════
function calcularDiasVencimiento(fechaVenc) {
    if (!fechaVenc) return 999;
    const hoy = new Date();
    const venc = new Date(fechaVenc);
    const diff = venc - hoy;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
    if (!dateStr) return 'Sin vencimiento';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR');
}

function formatPrecio(num) {
    return num.toLocaleString('es-AR');
}

// ═══════════════════════════════════════════════
console.log('🥑 Cocina Pop Client - Mi Despensa Iniciado');
// ═══════════════════════════════════════════════

})();
