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
// ═══════════════════════════════════════════════
// 💾 MI DESPENSA (productos escaneados por categoría)
// ═══════════════════════════════════════════════
let miDespensa = {
    MARKET: [],
    FREEZER: [],
    HELADERA: []
};

let catalogoProductos = {}; // Productos disponibles (desde productos.json)
let currentProducto = null;
let scanner = null;

async function loadData() {
    try {
        const saved = localStorage.getItem('cp_client_despensa');
        if (saved) {
            miDespensa = JSON.parse(saved);
        }
    } catch(e) {
        console.error('Error cargando despensa:', e);
    }
    
    // Cargar catálogo de productos
    await cargarCatalogo();
}

async function cargarCatalogo() {
    try {
        // Intentar cargar desde Supabase
        const response = await fetch('https://hmuufyyxbfksslbstjra.supabase.co/rest/v1/productos?select=*', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'sb_publishable_hfCaIjbpKHiFUuZjl32BTg_hPe3s0Jl',
                'Authorization': 'Bearer sb_publishable_hfCaIjbpKHiFUuZjl32BTg_hPe3s0Jl'
            }
        });
        if (response.ok) {
            const productosArray = await response.json();
            
            // Convertir array a objeto {id: producto}
            catalogoProductos = {};
            productosArray.forEach(item => {
                catalogoProductos[item.id] = item.data;
            });
            
            console.log('✅ Catálogo cargado desde Supabase:', Object.keys(catalogoProductos).length, 'productos');
            return;
        } else {
            console.warn('⚠️ Error al cargar desde Supabase, intentando fallback...');
        }
    } catch (error) {
        console.error('❌ Error cargando desde Supabase:', error);
    }
    // FALLBACK: Si falla Supabase, intentar cargar el productos.json local
    try {
        const response = await fetch('/productos.json');
        if (response.ok) {
            catalogoProductos = await response.json();
            console.log('✅ Catálogo cargado desde JSON local (fallback):', Object.keys(catalogoProductos).length, 'productos');
        } else {
            console.warn('⚠️ No se encontró productos.json');
        }
    } catch(e) {
        console.error('❌ Error cargando catálogo:', e);
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
        renderAll();
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
    if (tab === 'catalogo') renderMarket();
    if (tab === 'favoritos') renderFreezer();
    if (tab === 'historial') renderHeladera();
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
    el.innerHTML = todos.map(p => {
        const diasVenc = calcularDiasVencimiento(p.vencimiento);
        const alertaVenc = diasVenc <= 3 ? '⚠️' : '';
        
        return `
        <div class="fav-item" onclick="verDetalleProducto('${p.uniqueId}', '${p.cat}')">
            <div class="fav-item-emoji">${p.emoji || '📦'}</div>
            <div class="fav-item-info">
                <strong>${p.nom}</strong>
                <small>${p.cat} • Vence: ${formatDate(p.vencimiento)} ${alertaVenc}</small>
            </div>
            <button class="fav-item-btn" onclick="event.stopPropagation(); pedirProducto('${p.uniqueId}', '${p.cat}')">
                <i class="fa-brands fa-whatsapp"></i> Pedir
            </button>
        </div>`;
    }).join('');
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
// 🛒 MARKET
// ═══════════════════════════════════════════════
function renderMarket() {
    const grid = document.getElementById('catalogo-grid');
    const productos = miDespensa.MARKET || [];
    if (productos.length === 0) {
        grid.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;">Sin productos en MARKET<br>Escaneá uno para agregarlo</p>';
        return;
    }
    grid.innerHTML = productos.map(p => {
        const diasVenc = calcularDiasVencimiento(p.vencimiento);
        const alertaVenc = diasVenc <= 3 ? '⚠️ ' : '';
        const textoVenc = diasVenc < 0 ? 'VENCIDO' : diasVenc === 0 ? 'Vence HOY' : `${diasVenc} días`;
        
        return `
            <div class="cat-card" onclick="verDetalleProducto('${p.uniqueId}', 'MARKET')">
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
// ❄️ FREEZER
// ═══════════════════════════════════════════════
function renderFreezer() {
    const el = document.getElementById('lista-favoritos');
    const productos = miDespensa.FREEZER || [];
    if (productos.length === 0) {
        el.innerHTML = '<p class="empty-msg">Sin productos en FREEZER<br>Escaneá uno para agregarlo</p>';
        return;
    }
    el.innerHTML = productos.map(p => {
        const diasVenc = calcularDiasVencimiento(p.vencimiento);
        const alertaVenc = diasVenc <= 3 ? '⚠️ ' : '';
        const textoVenc = diasVenc < 0 ? 'VENCIDO' : diasVenc === 0 ? 'Vence HOY' : `${diasVenc} días`;
        
        return `
            <div class="fav-page-item">
                <div class="fav-page-item-emoji">${p.emoji || '📦'}</div>
                <div class="fav-page-item-info">
                    <strong>${p.nom}</strong>
                    <small>$${formatPrecio(p.precio)} • ${alertaVenc}${textoVenc}</small>
                </div>
                <div class="fav-page-item-actions">
                    <button class="btn-repedir" onclick="verDetalleProducto('${p.uniqueId}', 'FREEZER')">
                        <i class="fa-solid fa-eye"></i> Ver
                    </button>
                    <button class="btn-repedir" onclick="pedirProducto('${p.uniqueId}', 'FREEZER')" style="background: var(--green);">
                        <i class="fa-brands fa-whatsapp"></i> Pedir
                    </button>
                </div>
            </div>`;
    }).join('');
}

// ═══════════════════════════════════════════════
// 🧊 HELADERA
// ═══════════════════════════════════════════════
function renderHeladera() {
    const el = document.getElementById('lista-historial');
    const productos = miDespensa.HELADERA || [];
    if (productos.length === 0) {
        el.innerHTML = '<p class="empty-msg">Sin productos en HELADERA<br>Escaneá uno para agregarlo</p>';
        return;
    }
    el.innerHTML = productos.map(p => {
        const diasVenc = calcularDiasVencimiento(p.vencimiento);
        const alertaVenc = diasVenc <= 3 ? '⚠️ ' : '';
        const textoVenc = diasVenc < 0 ? 'VENCIDO' : diasVenc === 0 ? 'Vence HOY' : `${diasVenc} días`;
        
        return `
            <div class="historial-item">
                <div class="historial-item-emoji">${p.emoji || '📦'}</div>
                <div class="historial-item-info">
                    <strong>${p.nom}</strong>
                    <small>$${formatPrecio(p.precio)} • ${alertaVenc}${textoVenc}</small>
                </div>
                <div style="display:flex; gap:6px;">
                    <button class="historial-repedir" onclick="verDetalleProducto('${p.uniqueId}', 'HELADERA')">
                        <i class="fa-solid fa-eye"></i> Ver
                    </button>
                    <button class="historial-repedir" onclick="pedirProducto('${p.uniqueId}', 'HELADERA')" style="border-color: var(--green); color: var(--green);">
                        <i class="fa-brands fa-whatsapp"></i> Pedir
                    </button>
                </div>
            </div>`;
    }).join('');
}
// ═══════════════════════════════════════════════
// 📱 VER DETALLE DE PRODUCTO
// ═══════════════════════════════════════════════
window.verDetalleProducto = function(id, cat) {
    const p = miDespensa[cat].find(prod => prod.uniqueId === id);
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
    document.getElementById('modal-producto').classList.add('active');
};
window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
};
// ═══════════════════════════════════════════════
// 🗑️ ELIMINAR PRODUCTO
// ═══════════════════════════════════════════════
window.toggleFavorito = function() {
    if (!currentProducto) return;
    
 if (confirm('¿Eliminar ' + currentProducto.nom + ' de tu despensa?')) {
        miDespensa[currentProducto.cat] = miDespensa[currentProducto.cat].filter(p => p.uniqueId !== currentProducto.uniqueId);
        saveData();
        closeModal('modal-producto');
        renderAll();
    }
};
```

---

## 🔑 CAMBIOS:

- Línea 4: Arreglé sintaxis del `confirm()` (tenía backticks raros)
- Línea 5: `p.id !== currentProducto.id` → `p.uniqueId !== currentProducto.uniqueId`

**Pegá esto encima!** ✅

---

## 🎉 LISTO! YA ESTÁN TODAS LAS FUNCIONES ACTUALIZADAS

Ahora hacé **commit y push** del cliente:
```
Mensaje: "✨ Sistema FIFO - Permite duplicados ordenados por vencimiento"

// ═══════════════════════════════════════════════
// 💬 WHATSAPP
// ═══════════════════════════════════════════════
window.pedirWhatsApp = function() {
    if (!currentProducto) return;
    pedirProducto(currentProducto.uniqueId, currentProducto.cat);
};
window.pedirProducto = function(id, cat) {
    const p = miDespensa[cat].find(prod => prod.uniqueId === id);
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
                    const qrData = JSON.parse(texto);
                    
                    // QR simple trae solo: {"id":"p_123"}
                    if (qrData.id && catalogoProductos[qrData.id]) {
                        const producto = catalogoProductos[qrData.id];
                        agregarProductoEscaneado(producto, qrData.id);
                    } else {
                        console.error('Producto no encontrado en catálogo:', qrData.id);
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
// ═══════════════════════════════════════════════
// ✅ AGREGAR PRODUCTO ESCANEADO
// ═══════════════════════════════════════════════
function agregarProductoEscaneado(producto, id) {
    // Verificar categoría válida
    if (!['MARKET', 'FREEZER', 'HELADERA'].includes(producto.cat)) {
        alert('Este producto no es para clientes (categoría: ' + producto.cat + ')');
        return;
    }
    
    // Obtener vencimiento del lote más viejo (FIFO)
    let vencimiento = null;
    if (producto.lotes && producto.lotes.length > 0) {
        const lotesSorted = [...producto.lotes].sort((a, b) => new Date(a.ven) - new Date(b.ven));
        vencimiento = lotesSorted[0].ven;
    }
    
    // Crear objeto para Mi Despensa con ID único
    const productoParaDespensa = {
        id: id,
        uniqueId: id + '_' + Date.now(), // ID único para permitir duplicados
        nom: producto.nom,
        precio: producto.pre,
        emoji: producto.emoji || '📦',
        cat: producto.cat,
        vencimiento: vencimiento,
        videos: producto.videos || {},
        tips: producto.tips || [],
        fechaEscaneo: new Date().toISOString()
    };
    
    // Agregar a la categoría correspondiente (sin verificar duplicados)
    miDespensa[producto.cat].push(productoParaDespensa);
    
    // Ordenar por vencimiento (FIFO - primero los que vencen antes)
    miDespensa[producto.cat].sort((a, b) => {
        if (!a.vencimiento) return 1;
        if (!b.vencimiento) return -1;
        return new Date(a.vencimiento) - new Date(b.vencimiento);
    });
    
    saveData();
    
    // Mostrar confirmación
    alert(`✅ "${producto.nom}" agregado a ${producto.cat}`);
    
    // Actualizar vistas
    renderAll();
}
// ═══════════════════════════════════════════════
// 🔄 RENDER ALL
// ═══════════════════════════════════════════════
function renderAll() {
    renderHome();
    renderMarket();
    renderFreezer();
    renderHeladera();
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

// ═══════════════════════════════════════════════════════════════════
// ⚡ ACTUALIZAR CATÁLOGO
// ═══════════════════════════════════════════════════════════════════

window.actualizarCatalogo = async function() {
    const icono = document.querySelector('.header-icon');
    
    // Animación de loading
    icono.classList.add('fa-spin');
    
    try {
        // Mostrar toast de cargando
        mostrarToast('🔄 Actualizando desde Supabase...', 'info');
        
        // Descargar desde Supabase
        const response = await fetch('https://hmuufyyxbfksslbstjra.supabase.co/rest/v1/productos?select=*', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'sb_publishable_hfCaIjbpKHiFUuZjl32BTg_hPe3s0Jl',
                'Authorization': 'Bearer sb_publishable_hfCaIjbpKHiFUuZjl32BTg_hPe3s0Jl'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al descargar: ' + response.status);
        }
        
        const productosArray = await response.json();
        
        // Convertir array a objeto
        const nuevosCatalogo = {};
        productosArray.forEach(item => {
            nuevosCatalogo[item.id] = item.data;
        });
        
        // Actualizar catálogo en memoria
        catalogoProductos = nuevosCatalogo;
        
        const cantProductos = Object.keys(nuevosCatalogo).length;
        
        // Quitar animación
        icono.classList.remove('fa-spin');
        
        // Toast de éxito con cantidad de productos
        mostrarToast(`✅ ${cantProductos} productos actualizados`, 'success');
        
        // Efecto visual en el rayo (verde por 1 segundo)
        icono.style.color = '#4caf50';
        icono.style.textShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
        setTimeout(() => { 
            icono.style.color = ''; 
            icono.style.textShadow = '';
        }, 1000);
        
        // Vibración táctil si está disponible
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
    } catch (error) {
        console.error('Error al actualizar:', error);
        
        // Quitar animación
        icono.classList.remove('fa-spin');
        
        // Toast de error
        mostrarToast('❌ Error al actualizar. Intenta de nuevo.', 'error');
        
        // Efecto visual de error (rojo por 1 segundo)
        icono.style.color = '#ff4757';
        setTimeout(() => { icono.style.color = ''; }, 1000);
    }
};

// ═══════════════════════════════════════════════════════════════════
// 🍞 SISTEMA DE TOASTS
// ═══════════════════════════════════════════════════════════════════

function mostrarToast(mensaje, tipo = 'info') {
    // Remover toast anterior si existe
    const toastAnterior = document.querySelector('.toast-notification');
    if (toastAnterior) toastAnterior.remove();
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-' + tipo;
    toast.textContent = mensaje;
    
    // Agregar al DOM
    document.body.appendChild(toast);
    
    // Trigger animación de entrada
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-remover después de 2.5s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
    
    // Vibración táctil sutil
    if (navigator.vibrate && tipo === 'success') {
        navigator.vibrate(30);
    }
}

// ═══════════════════════════════════════════════
console.log('🥑 Cocina Pop Client - Mi Despensa Iniciado');
// ═══════════════════════════════════════════════
})();
