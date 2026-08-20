// ============================================
// BANGLE STORE AI - COMPLETE APP
// ============================================

// Data Storage
const STORAGE_KEYS = {
    INVENTORY: 'bangle_inventory',
    SECTIONS: 'bangle_sections',
    BILLS: 'bangle_bills',
    DESIGNS: 'bangle_designs',
    SETTINGS: 'bangle_settings'
};

const DEFAULT_SECTIONS = ['24 Pc Box', '12 Pc Box', 'Daily Use 24 Pc Box', 'Other Inventory'];

let state = {
    inventory: [],
    sections: [],
    bills: [],
    designs: [],
    settings: {},
    saleItems: [],
    selectedPayment: null,
    currentScreen: 'homeScreen'
};

// Storage Functions
function loadData() {
    state.inventory = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY)) || [];
    state.sections = JSON.parse(localStorage.getItem(STORAGE_KEYS.SECTIONS)) || DEFAULT_SECTIONS;
    state.bills = JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS)) || [];
    state.designs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DESIGNS)) || [];
    state.settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
    state.saleItems = [];
    if (state.sections.length === 0) { state.sections = DEFAULT_SECTIONS; saveSections(); }
    updateUI();
}

function saveInventory() { localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(state.inventory)); }
function saveSections() { localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(state.sections)); }
function saveBills() { localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(state.bills)); }
function saveDesigns() { localStorage.setItem(STORAGE_KEYS.DESIGNS, JSON.stringify(state.designs)); }
function saveSettings() { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings)); }

// Navigation
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-screen="${screenId}"]`)?.classList.add('active');
    state.currentScreen = screenId;
    if (screenId === 'homeScreen') updateHome();
    if (screenId === 'inventoryScreen') renderInventory();
    if (screenId === 'addProductScreen') populateSections();
}

function showHome() { navigateTo('homeScreen'); }
function showInventory() { navigateTo('inventoryScreen'); }
function showAISetMaker() { navigateTo('aiSetMakerScreen'); }
function showBulkAdd() { navigateTo('bulkAddScreen'); }
function showAddProduct() { navigateTo('addProductScreen'); populateSections(); }
function showNewSale() { navigateTo('newSaleScreen'); }
function showMore() { navigateTo('moreScreen'); }

// Modal
function showModal(title, bodyHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:var(--primary);color:white;padding:12px 24px;border-radius:12px;font-size:14px;z-index:9999;max-width:90%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:fadeIn 0.3s ease;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 2500);
}

// Product Functions
function generateSKU(name, colour, size) {
    const prefix = name.substring(0, 2).toUpperCase();
    const colourCode = colour.substring(0, 4).toUpperCase();
    const sizeCode = size.replace('.', '');
    return `${prefix}-${colourCode}-${sizeCode}`;
}

function getQuantity(product) { return product.quantity || 0; }
function getTotalProducts() { return state.inventory.length; }
function getLowStockCount() {
    const limit = state.settings.lowStockLimit || 5;
    return state.inventory.filter(p => p.quantity > 0 && p.quantity <= limit).length;
}
function getOutOfStockCount() { return state.inventory.filter(p => p.quantity <= 0).length; }

// Home Screen
function updateHome() {
    document.getElementById('totalProducts').textContent = getTotalProducts();
    document.getElementById('totalSections').textContent = state.sections.length;
    document.getElementById('lowStockCount').textContent = getLowStockCount();
    document.getElementById('outOfStockCount').textContent = getOutOfStockCount();
    renderSections();
    renderRecentProducts();
}

function renderSections() {
    const container = document.getElementById('sectionList');
    if (state.sections.length === 0) { container.innerHTML = '<div class="empty-card">No sections added yet</div>'; return; }
    container.innerHTML = state.sections.map(section => `
        <div class="section-item" onclick="showSectionProducts('${section}')">
            <span class="section-name">📦 ${section}</span>
            <span class="section-count">${getSectionCount(section)} items</span>
        </div>
    `).join('');
}

function getSectionCount(section) { return state.inventory.filter(p => p.section === section).length; }

function showSectionProducts(section) {
    showModal(`📦 ${section}`, `
        <div style="margin-bottom:12px;">
            ${state.inventory.filter(p => p.section === section).map(p => `
                <div class="product-card">
                    <img src="${p.image || ''}" alt="${p.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22%3E%3Crect width=%2256%22 height=%2256%22 fill=%22%23dfe6e9%22/%3E%3Ctext x=%2228%22 y=%2232%22 text-anchor=%22middle%22 fill=%22%23636e72%22 font-size=%2220%22%3E📦%3C/text%3E%3C/svg%3E'">
                    <div class="info"><div class="name">${p.name}</div><div class="details">${p.colour} • ${p.size} • ${p.quantity} pcs</div></div>
                </div>
            `).join('') || '<div class="empty-card">No products in this section</div>'}
        </div>
        <button class="save-btn" onclick="closeModal(); showAddProduct();">➕ Add Product</button>
    `);
}

function renderRecentProducts() {
    const container = document.getElementById('recentProducts');
    const recent = [...state.inventory].slice(-5).reverse();
    if (recent.length === 0) { container.innerHTML = '<div class="empty-card">No products added yet</div>'; return; }
    container.innerHTML = recent.map(p => `
        <div class="recent-item" onclick="showProductDetail('${p.sku}')">
            <img src="${p.image || ''}" alt="${p.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2236%22 height=%2236%22%3E%3Crect width=%2236%22 height=%2236%22 fill=%22%23dfe6e9%22/%3E%3Ctext x=%2218%22 y=%2224%22 text-anchor=%22middle%22 fill=%22%23636e72%22 font-size=%2214%22%3E📦%3C/text%3E%3C/svg%3E'">
            <div class="info"><div class="name">${p.name}</div><div class="details">${p.colour} • ${p.size} • ${p.quantity} pcs</div></div>
        </div>
    `).join('');
}

function showProductDetail(sku) {
    const product = state.inventory.find(p => p.sku === sku);
    if (!product) return;
    showModal(`${product.name}`, `
        <div style="text-align:center;margin-bottom:12px;">
            <img src="${product.image || ''}" alt="${product.name}" style="max-width:100%;max-height:200px;border-radius:12px;" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23dfe6e9%22/%3E%3Ctext x=%22100%22 y=%22112%22 text-anchor=%22middle%22 fill=%22%23636e72%22 font-size=%2248%22%3E📦%3C/text%3E%3C/svg%3E'">
        </div>
        <div class="form-group"><label>Name</label><div>${product.name}</div></div>
        <div class="form-row"><div class="form-group"><label>Colour</label><div>${product.colour}</div></div><div class="form-group"><label>Size</label><div>${product.size}</div></div></div>
        <div class="form-row"><div class="form-group"><label>SKU</label><div style="font-family:monospace;">${product.sku}</div></div><div class="form-group"><label>Quantity</label><div>${product.quantity} pcs</div></div></div>
        <div class="form-row"><div class="form-group"><label>Purchase Price</label><div>${state.settings.currency || '₹'} ${product.purchasePrice || 0}</div></div><div class="form-group"><label>Selling Price</label><div>${state.settings.currency || '₹'} ${product.sellingPrice || 0}</div></div></div>
        <div class="form-group"><label>Section</label><div>${product.section}</div></div>
        ${product.notes ? `<div class="form-group"><label>Notes</label><div>${product.notes}</div></div>` : ''}
        <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="save-btn" onclick="closeModal();editProduct('${product.sku}')" style="flex:1;">✏️ Edit</button>
            <button class="save-btn" onclick="closeModal();deleteProduct('${product.sku}')" style="flex:1;background:var(--danger);">🗑️ Delete</button>
        </div>
    `);
}

function searchProducts(query) {
    if (!query || query.trim() === '') { renderRecentProducts(); return; }
    const q = query.toLowerCase().trim();
    const results = state.inventory.filter(p => p.name.toLowerCase().includes(q) || p.colour.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    const container = document.getElementById('recentProducts');
    if (results.length === 0) { container.innerHTML = '<div class="empty-card">No products found</div>'; return; }
    container.innerHTML = results.map(p => `
        <div class="recent-item" onclick="showProductDetail('${p.sku}')">
            <img src="${p.image || ''}" alt="${p.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2236%22 height=%2236%22%3E%3Crect width=%2236%22 height=%2236%22 fill=%22%23dfe6e9%22/%3E%3Ctext x=%2218%22 y=%2224%22 text-anchor=%22middle%22 fill=%22%23636e72%22 font-size=%2214%22%3E📦%3C/text%3E%3C/svg%3E'">
            <div class="info"><div class="name">${p.name}</div><div class="details">${p.colour} • ${p.size} • ${p.quantity} pcs</div></div>
        </div>
    `).join('');
}

// Add Product
function populateSections() {
    const select = document.getElementById('productSection');
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select Section</option>' + state.sections.map(s => `<option value="${s}">${s}</option>`).join('');
    if (currentValue) select.value = currentValue;
}

function previewProductImage(input) {
    const preview = document.getElementById('productImagePreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { preview.innerHTML = `<img src="${e.target.result}" alt="Product">`; };
        reader.readAsDataURL(input.files[0]);
    }
}

function saveProduct(event) {
    event.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const colour = document.getElementById('productColour').value.trim();
    const size = document.getElementById('productSize').value.trim();
    const sku = document.getElementById('productSKU').value.trim();
    const quantity = parseInt(document.getElementById('productQuantity').value) || 0;
    const purchasePrice = parseFloat(document.getElementById('productPurchasePrice').value) || 0;
    const sellingPrice = parseFloat(document.getElementById('productSellingPrice').value) || 0;
    const section = document.getElementById('productSection').value;
    const notes = document.getElementById('productNotes').value.trim();
    const fileInput = document.getElementById('productImage');
    let imageData = null;
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { imageData = e.target.result; saveProductData(name, colour, size, sku, quantity, purchasePrice, sellingPrice, section, notes, imageData); };
        reader.readAsDataURL(fileInput.files[0]);
    } else { saveProductData(name, colour, size, sku, quantity, purchasePrice, sellingPrice, section, notes, null); }
}

function saveProductData(name, colour, size, sku, quantity, purchasePrice, sellingPrice, section, notes, imageData) {
    if (state.inventory.some(p => p.sku === sku)) { showToast('❌ SKU already exists!'); return; }
    const product = { name, colour, size, sku: sku || generateSKU(name, colour, size), quantity, purchasePrice, sellingPrice, section, notes, image, createdAt: new Date().toISOString() };
    state.inventory.push(product);
    saveInventory();
    showToast('✅ Product added successfully!');
    document.getElementById('productForm').reset();
    document.getElementById('productImagePreview').innerHTML = `<span>📷</span><p>Tap to add image</p>`;
    navigateTo('homeScreen');
    updateUI();
}

function deleteProduct(sku) {
    if (!confirm('Delete this product?')) return;
    state.inventory = state.inventory.filter(p => p.sku !== sku);
    saveInventory();
    closeModal();
    updateUI();
    showToast('🗑️ Product deleted');
}

function editProduct(sku) {
    const product = state.inventory.find(p => p.sku === sku);
    if (!product) return;
    closeModal();
    showAddProduct();
    document.getElementById('productName').value = product.name;
    document.getElementById('productColour').value = product.colour;
    document.getElementById('productSize').value = product.size;
    document.getElementById('productSKU').value = product.sku;
    document.getElementById('productQuantity').value = product.quantity;
    document.getElementById('productPurchasePrice').value = product.purchasePrice || '';
    document.getElementById('productSellingPrice').value = product.sellingPrice || '';
    document.getElementById('productSection').value = product.section;
    document.getElementById('productNotes').value = product.notes || '';
    if (product.image) { document.getElementById('productImagePreview').innerHTML = `<img src="${product.image}" alt="Product">`; }
    state.inventory = state.inventory.filter(p => p.sku !== sku);
    saveInventory();
    showToast('✏️ Edit product, then save');
}

// Inventory Screen
function renderInventory() {
    const sectionFilter = document.getElementById('sectionFilter');
    const currentSection = sectionFilter.value;
    sectionFilter.innerHTML = '<option value="">All Sections</option>' + state.sections.map(s => `<option value="${s}">${s}</option>`).join('');
    if (currentSection) sectionFilter.value = currentSection;
    const colourFilter = document.getElementById('colourFilter');
    const currentColour = colourFilter.value;
    const colours = [...new Set(state.inventory.map(p => p.colour))];
    colourFilter.innerHTML = '<option value="">All Colours</option>' + colours.map(c => `<option value="${c}">${c}</option>`).join('');
    if (currentColour) colourFilter.value = currentColour;
    filterInventory();
}

function filterInventory() {
    const search = document.getElementById('inventorySearch').value.toLowerCase().trim();
    const section = document.getElementById('sectionFilter').value;
    const colour = document.getElementById('colourFilter').value;
    let filtered = state.inventory;
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || p.colour.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search));
    if (section) filtered = filtered.filter(p => p.section === section);
    if (colour) filtered = filtered.filter(p => p.colour === colour);
    const container = document.getElementById('inventoryList');
    if (filtered.length === 0) { container.innerHTML = '<div class="empty-card">No products found</div>'; return; }
    container.innerHTML = filtered.map(p => `
        <div class="product-card">
            <img src="${p.image || ''}" alt="${p.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22%3E%3Crect width=%2256%22 height=%2256%22 fill=%22%23dfe6e9%22/%3E%3Ctext x=%2228%22 y=%2232%22 text-anchor=%22middle%22 fill=%22%23636e72%22 font-size=%2220%22%3E📦%3C/text%3E%3C/svg%3E'">
            <div class="info"><div class="name">${p.name}</div><div class="details">${p.colour} • ${p.size} • ${p.quantity} pcs</div><div class="sku">${p.sku}</div></div>
            <div class="actions">
                <button class="edit-btn" onclick="editProduct('${p.sku}')">✏️</button>
                <button class="stock-in-btn" onclick="stockIn('${p.sku}')">➕</button>
                <button class="stock-out-btn" onclick="stockOut('${p.sku}')">➖</button>
                <button class="delete-btn" onclick="deleteProduct('${p.sku}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function stockIn(sku) {
    const product = state.inventory.find(p => p.sku === sku);
    if (!product) return;
    showModal('➕ Stock In', `
        <div class="form-group"><label>Product: ${product.name}</label><div style="font-size:12px;color:var(--muted);">Current: ${product.quantity} pcs</div></div>
        <div class="form-group"><label>Add Quantity</label><input type="number" id="stockQuantity" min="1" value="1"></div>
        <button class="save-btn" onclick="confirmStockIn('${sku}')">✅ Add Stock</button>
    `);
}

function confirmStockIn(sku) {
    const quantity = parseInt(document.getElementById('stockQuantity').value) || 1;
    const product = state.inventory.find(p => p.sku === sku);
    if (product) { product.quantity += quantity; saveInventory(); closeModal(); updateUI(); showToast(`✅ Added ${quantity} pcs to ${product.name}`); }
}

function stockOut(sku) {
    const product = state.inventory.find(p => p.sku === sku);
    if (!product) return;
    showModal('➖ Stock Out', `
        <div class="form-group"><label>Product: ${product.name}</label><div style="font-size:12px;color:var(--muted);">Current: ${product.quantity} pcs</div></div>
        <div class="form-group"><label>Remove Quantity</label><input type="number" id="stockQuantityOut" min="1" max="${product.quantity}" value="1"></div>
        <button class="save-btn" onclick="confirmStockOut('${sku}')" style="background:var(--warning);">➖ Remove Stock</button>
    `);
}

function confirmStockOut(sku) {
    const quantity = parseInt(document.getElementById('stockQuantityOut').value) || 1;
    const product = state.inventory.find(p => p.sku === sku);
    if (product && product.quantity >= quantity) { product.quantity -= quantity; saveInventory(); closeModal(); updateUI(); showToast(`➖ Removed ${quantity} pcs from ${product.name}`); }
    else showToast('❌ Not enough stock!');
}

// AI Set Maker
function detectRealAIColour(input) {
    const preview = document.getElementById('imagePreview');
    const result = document.getElementById('colourResult');
    const suggested = document.getElementById('suggestedSet');
    if (!input.files || !input.files[0]) { showToast('❌ Please select an image'); return; }
    result.innerHTML = `<div style="text-align:center;padding:20px;"><div style="font-size:32px;margin-bottom:8px;">⏳</div><p>AI is analysing image...</p></div>`;
    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageData = e.target.result;
        preview.innerHTML = `<img src="${imageData}" alt="Saree" style="max-width:100%;max-height:200px;border-radius:12px;">`;
        const colours = await detectRealColours(imageData);
        if (colours && colours.length > 0) displayAIColourResults(colours);
        else { result.innerHTML = `<div style="text-align:center;padding:20px;color:var(--danger);">❌ No colours detected</div>`; }
    };
    reader.readAsDataURL(input.files[0]);
}

function displayAIColourResults(colours) {
    const result = document.getElementById('colourResult');
    const suggested = document.getElementById('suggestedSet');
    colours.sort((a, b) => b.score - a.score);
    const topColours = colours.slice(0, 5);
    result.innerHTML = `
        <div class="colour-match">
            <div class="detected">🎨 AI Detected Colours:</div>
            ${topColours.map(c => `
                <div style="display:flex;align-items:center;gap:12px;padding:4px 0;border-bottom:1px solid var(--border);">
                    <div style="width:24px;height:24px;border-radius:50%;background:${c.hex};border:1px solid var(--border);"></div>
                    <span style="flex:1;">${c.name}</span>
                    <span style="font-size:12px;color:var(--muted);">${Math.round(c.score * 100)}%</span>
                </div>
            `).join('')}
        </div>
    `;
    const matchingProducts = [];
    topColours.forEach(c => {
        const products = state.inventory.filter(p => p.colour.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(p.colour.toLowerCase()));
        matchingProducts.push(...products);
    });
    if (matchingProducts.length > 0) {
        suggested.innerHTML = `
            <div class="colour-match">
                <div class="detected">✨ AI Suggested Set</div>
                ${matchingProducts.slice(0, 6).map(p => `
                    <div class="match-item"><span>${p.name} • ${p.size}</span><span>${p.quantity} pcs • ${state.settings.currency || '₹'}${p.sellingPrice}</span></div>
                `).join('')}
                <button class="save-btn" onclick="saveDesign()" style="margin-top:12px;">💾 Save This Set</button>
                <button class="save-btn" onclick="applySetToSale()" style="margin-top:8px;background:var(--success);">🛒 Add to Sale</button>
            </div>
        `;
        window.lastAISet = matchingProducts;
    }
}

function saveDesign() {
    if (!window.lastAISet) { showToast('❌ No set to save'); return; }
    const design = { id: Date.now(), name: 'AI Set ' + new Date().toLocaleDateString(), products: window.lastAISet.map(p => p.sku), createdAt: new Date().toISOString() };
    state.designs.push(design);
    saveDesigns();
    showToast('💾 Design saved!');
}

function applySetToSale() {
    if (!window.lastAISet) { showToast('❌ No set to apply'); return; }
    showNewSale();
    window.lastAISet.forEach(p => addToSale(p.sku, 1));
    closeModal();
    showToast('✨ Set added to sale!');
}

function viewSavedDesigns() {
    if (state.designs.length === 0) { showToast('No saved designs yet'); return; }
    showModal('💾 Saved Designs', `
        ${state.designs.map(d => `
            <div class="product-card">
                <div class="info"><div class="name">${d.name}</div><div class="details">${d.products.length} products</div></div>
                <button onclick="applySavedDesign('${d.id}')" class="edit-btn">Apply</button>
            </div>
        `).join('')}
    `);
}

function applySavedDesign(id) {
    const design = state.designs.find(d => d.id === parseInt(id));
    if (design) { closeModal(); showNewSale(); design.products.forEach(sku => addToSale(sku, 1)); showToast('✨ Design applied'); }
}

// New Sale
function searchSaleProducts(query) {
    if (!query || query.trim() === '') { renderSaleItems(); return; }
    const q = query.toLowerCase().trim();
    const results = state.inventory.filter(p => p.name.toLowerCase().includes(q) || p.colour.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    const container = document.getElementById('saleProducts');
    if (results.length === 0) { container.innerHTML = '<div class="empty-card">No products found</div>'; return; }
    container.innerHTML = results.slice(0, 5).map(p => `
        <div class="product-card" onclick="addToSale('${p.sku}', 1)">
            <div class="info"><div class="name">${p.name}</div><div class="details">${p.colour} • ${p.size} • ${p.quantity} pcs available</div></div>
            <button class="edit-btn">➕</button>
        </div>
    `).join('');
}

function addToSale(sku, quantity = 1) {
    const product = state.inventory.find(p => p.sku === sku);
    if (!product) { showToast('❌ Product not found'); return; }
    if (product.quantity < quantity) { showToast('❌ Not enough stock!'); return; }
    const existing = state.saleItems.find(p => p.sku === sku);
    if (existing) existing.quantity += quantity;
    else state.saleItems.push({ ...product, quantity });
    document.getElementById('saleSearch').value = '';
    renderSaleItems();
    updateTotal();
}

function renderSaleItems() {
    const container = document.getElementById('saleProducts');
    if (state.saleItems.length === 0) { container.innerHTML = '<div class="empty-card">Add products to sale</div>'; return; }
    container.innerHTML = state.saleItems.map((p, i) => `
        <div class="sale-item">
            <div class="details"><div class="name">${p.name}</div><div class="meta">${p.colour} • ${p.size}</div></div>
            <div class="qty-control">
                <button onclick="updateSaleQty(${i}, -1)">−</button>
                <span>${p.quantity}</span>
                <button onclick="updateSaleQty(${i}, 1)">+</button>
            </div>
            <div class="price">${state.settings.currency || '₹'}${(p.sellingPrice * p.quantity).toFixed(2)}</div>
            <button onclick="removeFromSale(${i})" class="remove-btn">✕</button>
        </div>
    `).join('');
}

function updateSaleQty(index, delta) {
    const item = state.saleItems[index];
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) { removeFromSale(index); return; }
    const product = state.inventory.find(p => p.sku === item.sku);
    if (product && newQty > product.quantity) { showToast('❌ Not enough stock!'); return; }
    item.quantity = newQty;
    renderSaleItems();
    updateTotal();
}

function removeFromSale(index) { state.saleItems.splice(index, 1); renderSaleItems(); updateTotal(); }
function resetSale() { state.saleItems = []; renderSaleItems(); updateTotal(); document.getElementById('customerName').value = ''; document.getElementById('customerPhone').value = ''; document.getElementById('saleDiscount').value = '0'; document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active')); state.selectedPayment = null; showToast('🔄 Sale reset'); }

function updateTotal() {
    const subtotal = state.saleItems.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
    const total = subtotal - discount;
    document.getElementById('subtotal').textContent = `${state.settings.currency || '₹'}${subtotal.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `${state.settings.currency || '₹'}${Math.max(0, total).toFixed(2)}`;
}

function setPayment(method) {
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.payment-btn').forEach(b => { if (b.textContent.includes(method) || b.textContent.trim() === method) b.classList.add('active'); });
    state.selectedPayment = method;
}

function generateBill() {
    if (state.saleItems.length === 0) { showToast('❌ No items in sale!'); return; }
    if (!state.selectedPayment) { showToast('❌ Select payment method!'); return; }
    const subtotal = state.saleItems.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
    const total = Math.max(0, subtotal - discount);
    const customerName = document.getElementById('customerName').value || 'Guest';
    const customerPhone = document.getElementById('customerPhone').value || '';
    const billNumber = `${state.settings.billPrefix || 'INV-'}${String(state.settings.billStart || 1).padStart(4, '0')}`;
    state.settings.billStart = (state.settings.billStart || 1) + 1;
    saveSettings();
    const bill = { number: billNumber, date: new Date().toISOString(), items: [...state.saleItems], subtotal, discount, total, payment: state.selectedPayment, customer: { name: customerName, phone: customerPhone }, shop: state.settings };
    state.saleItems.forEach(saleItem => { const product = state.inventory.find(p => p.sku === saleItem.sku); if (product) product.quantity -= saleItem.quantity; });
    saveInventory();
    state.bills.push(bill);
    saveBills();
    showBill(bill);
    state.saleItems = [];
    renderSaleItems();
    updateTotal();
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('saleDiscount').value = '0';
    document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
    state.selectedPayment = null;
}

function showBill(bill) {
    const currency = state.settings.currency || '₹';
    showModal('🧾 Bill', `
        <div style="text-align:center;border-bottom:2px dashed var(--border);padding-bottom:12px;margin-bottom:12px;">
            <h3>${state.settings.shopName || 'Bangle Store'}</h3>
            <p style="font-size:11px;color:var(--muted);">${state.settings.shopAddress || ''}</p>
            <p style="font-size:11px;color:var(--muted);">${state.settings.shopPhone || ''}</p>
            <div style="margin-top:6px;"><strong>Bill: ${bill.number}</strong><span style="margin-left:12px;font-size:11px;color:var(--muted);">${new Date(bill.date).toLocaleString()}</span></div>
        </div>
        ${bill.items.map(p => `<div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid var(--border);"><span>${p.name} × ${p.quantity}</span><span>${currency}${(p.sellingPrice * p.quantity).toFixed(2)}</span></div>`).join('')}
        <div style="margin-top:12px;border-top:2px solid var(--border);padding-top:8px;">
            <div style="display:flex;justify-content:space-between;font-size:13px;"><span>Subtotal</span><span>${currency}${bill.subtotal.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--warning);"><span>Discount</span><span>-${currency}${bill.discount.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-top:4px;"><span>TOTAL</span><span>${currency}${bill.total.toFixed(2)}</span></div>
        </div>
        <div style="margin-top:8px;font-size:11px;color:var(--muted);text-align:center;">Payment: ${bill.payment} • Customer: ${bill.customer.name}</div>
        <div style="margin-top:12px;display:flex;gap:8px;">
            <button class="save-btn" onclick="closeModal()" style="flex:1;background:var(--muted);">Done</button>
            <button class="save-btn" onclick="printBill('${bill.number}')" style="flex:1;">🖨️ Print</button>
        </div>
    `);
}

function printBill(billNumber) {
    const bill = state.bills.find(b => b.number === billNumber);
    if (!bill) return;
    const currency = state.settings.currency || '₹';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html><head><title>Bill ${bill.number}</title>
        <style>body{font-family:sans-serif;padding:20px;max-width:400px;margin:auto;}
        .header{text-align:center;border-bottom:2px dashed #ddd;padding-bottom:12px;margin-bottom:12px;}
        .item{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;}
        .total{display:flex;justify-content:space-between;font-size:18px;font-weight:700;margin-top:8px;border-top:2px solid #333;padding-top:8px;}
        .footer{text-align:center;font-size:11px;color:#666;margin-top:16px;border-top:1px solid #ddd;padding-top:12px;}
        </style></head><body>
        <div class="header"><h3>${state.settings.shopName || 'Bangle Store'}</h3><p style="font-size:11px;color:#666;">${state.settings.shopAddress || ''}</p><p style="font-size:11px;color:#666;">${state.settings.shopPhone || ''}</p><strong>Bill: ${bill.number}</strong><span style="margin-left:12px;font-size:11px;color:#666;">${new Date(bill.date).toLocaleString()}</span></div>
        ${bill.items.map(p => `<div class="item"><span>${p.name} × ${p.quantity}</span><span>${currency}${(p.sellingPrice * p.quantity).toFixed(2)}</span></div>`).join('')}
        <div style="margin-top:12px;"><div style="display:flex;justify-content:space-between;font-size:13px;"><span>Subtotal</span><span>${currency}${bill.subtotal.toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;font-size:13px;color:#f39c12;"><span>Discount</span><span>-${currency}${bill.discount.toFixed(2)}</span></div><div class="total"><span>TOTAL</span><span>${currency}${bill.total.toFixed(2)}</span></div></div>
        <div style="margin-top:8px;font-size:11px;color:#666;text-align:center;">Payment: ${bill.payment} • Customer: ${bill.customer.name}</div>
        <div class="footer">Thank you! Visit again 😊</div>
        <script>window.onload=function(){window.print();setTimeout(function(){window.close();},1000);}<\/script>
    `);
    printWindow.document.close();
}

// Bills & Reports
function showBills() {
    if (state.bills.length === 0) { showToast('No bills yet'); return; }
    showModal('📋 Bills', `
        ${state.bills.slice().reverse().map(b => `
            <div class="product-card" onclick="showBill(${JSON.stringify(b).replace(/"/g, '&quot;')})">
                <div class="info"><div class="name">${b.number}</div><div class="details">${new Date(b.date).toLocaleDateString()} • ${b.items.length} items • ${state.settings.currency || '₹'}${b.total.toFixed(2)}</div></div>
                <button onclick="event.stopPropagation();printBill('${b.number}')" class="edit-btn">🖨️</button>
            </div>
        `).join('')}
    `);
}

function showReports() {
    const today = new Date();
    const todayStr = today.toDateString();
    const todaySales = state.bills.filter(b => new Date(b.date).toDateString() === todayStr);
    const totalToday = todaySales.reduce((sum, b) => sum + b.total, 0);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSales = state.bills.filter(b => new Date(b.date) >= weekAgo);
    const totalWeek = weekSales.reduce((sum, b) => sum + b.total, 0);
    showModal('📊 Reports', `
        <h3 style="margin-bottom:12px;">📅 Today</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
            <div class="stat-card"><span class="stat-number">${state.settings.currency || '₹'}${totalToday.toFixed(0)}</span><span class="stat-label">Sales</span></div>
            <div class="stat-card"><span class="stat-number">${todaySales.length}</span><span class="stat-label">Bills</span></div>
            <div class="stat-card"><span class="stat-number">${todaySales.reduce((sum, b) => sum + b.items.length, 0)}</span><span class="stat-label">Items</span></div>
        </div>
        <h3 style="margin-bottom:12px;">📆 7 Days</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
            <div class="stat-card"><span class="stat-number">${state.settings.currency || '₹'}${totalWeek.toFixed(0)}</span><span class="stat-label">Sales</span></div>
            <div class="stat-card"><span class="stat-number">${weekSales.length}</span><span class="stat-label">Bills</span></div>
            <div class="stat-card"><span class="stat-number">${weekSales.reduce((sum, b) => sum + b.items.length, 0)}</span><span class="stat-label">Items</span></div>
        </div>
        <h3 style="margin-bottom:12px;">🏆 Top Products</h3>
        ${getTopProducts(5).map(p => `<div class="match-item"><span>${p.name}</span><span>${p.count} sold</span></div>`).join('') || '<div style="color:var(--muted);font-size:12px;">No sales data yet</div>'}
    `);
}

function getTopProducts(limit) {
    const productCounts = {};
    state.bills.forEach(bill => { bill.items.forEach(item => { productCounts[item.sku] = (productCounts[item.sku] || 0) + item.quantity; }); });
    const sorted = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, limit);
    return sorted.map(([sku, count]) => { const product = state.inventory.find(p => p.sku === sku); return { name: product ? product.name : sku, count }; });
}

// Daily Parcha
function showDailyParcha() {
    const today = new Date().toDateString();
    const todayBills = state.bills.filter(b => new Date(b.date).toDateString() === today);
    const todayTotal = todayBills.reduce((sum, b) => sum + b.total, 0);
    showModal('📝 Daily Parcha', `
        <div style="margin-bottom:12px;">
            <button class="save-btn" onclick="startVoiceCommand()" style="background:var(--gold);">🎤 Voice Command</button>
        </div>
        <div style="background:var(--bg);border-radius:12px;padding:16px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:14px;"><span>📅 ${new Date().toLocaleDateString()}</span><span>💰 ${state.settings.currency || '₹'}${todayTotal.toFixed(2)}</span></div>
            <div style="font-size:12px;color:var(--muted);">${todayBills.length} bills • ${todayBills.reduce((sum, b) => sum + b.items.length, 0)} items</div>
        </div>
        <div id="parchaNotes"><textarea id="dailyNotes" rows="4" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:14px;" placeholder="Write daily notes..."></textarea></div>
        <button class="save-btn" onclick="saveParcha()" style="margin-top:8px;">💾 Save Notes</button>
        <button class="save-btn" onclick="shareParcha()" style="margin-top:8px;background:var(--primary);">📤 Share Parcha</button>
    `);
}

function startVoiceCommand() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            showToast(`🎤 "${transcript}"`);
            if (transcript.includes('add') || transcript.includes('जोड़')) { showAddProduct(); closeModal(); }
            else if (transcript.includes('sale') || transcript.includes('बिक्री')) { showNewSale(); closeModal(); }
            else if (transcript.includes('report') || transcript.includes('रिपोर्ट')) { showReports(); }
            else { showToast(`Command: ${transcript}`); }
        };
        recognition.onerror = function() { showToast('❌ Voice not recognized'); };
        recognition.start();
    } else { showToast('❌ Voice recognition not supported'); }
}

function saveParcha() {
    const notes = document.getElementById('dailyNotes').value;
    localStorage.setItem('daily_parcha_' + new Date().toDateString(), notes);
    showToast('💾 Notes saved!');
}

function shareParcha() {
    const notes = document.getElementById('dailyNotes').value || 'No notes';
    const text = `📝 Daily Parcha - ${new Date().toLocaleDateString()}\n\n${notes}`;
    if (navigator.share) { navigator.share({ title: 'Daily Parcha', text }); }
    else { navigator.clipboard.writeText(text).then(() => showToast('📋 Copied to clipboard!')); }
}

// Settings
function showSettings() {
    showModal('⚙️ Settings', `
        <div class="form-group"><label>Shop Name</label><input type="text" id="shopName" value="${state.settings.shopName || ''}"></div>
        <div class="form-group"><label>Owner Name</label><input type="text" id="ownerName" value="${state.settings.ownerName || ''}"></div>
        <div class="form-group"><label>Phone</label><input type="text" id="shopPhone" value="${state.settings.shopPhone || ''}"></div>
        <div class="form-group"><label>Address</label><input type="text" id="shopAddress" value="${state.settings.shopAddress || ''}"></div>
        <div class="form-group"><label>GSTIN</label><input type="text" id="shopGSTIN" value="${state.settings.shopGSTIN || ''}"></div>
        <div class="form-group"><label>Currency Symbol</label><input type="text" id="currency" value="${state.settings.currency || '₹'}"></div>
        <div class="form-group"><label>Bill Prefix</label><input type="text" id="billPrefix" value="${state.settings.billPrefix || 'INV-'}"></div>
        <div class="form-group"><label>Starting Bill Number</label><input type="number" id="billStart" value="${state.settings.billStart || 1}"></div>
        <div class="form-group"><label>Low Stock Limit</label><input type="number" id="lowStockLimit" value="${state.settings.lowStockLimit || 5}"></div>
        <button class="save-btn" onclick="saveSettingsFromModal()">💾 Save Settings</button>
    `);
}

function saveSettingsFromModal() {
    state.settings.shopName = document.getElementById('shopName').value;
    state.settings.ownerName = document.getElementById('ownerName').value;
    state.settings.shopPhone = document.getElementById('shopPhone').value;
    state.settings.shopAddress = document.getElementById('shopAddress').value;
    state.settings.shopGSTIN = document.getElementById('shopGSTIN').value;
    state.settings.currency = document.getElementById('currency').value || '₹';
    state.settings.billPrefix = document.getElementById('billPrefix').value || 'INV-';
    state.settings.billStart = parseInt(document.getElementById('billStart').value) || 1;
    state.settings.lowStockLimit = parseInt(document.getElementById('lowStockLimit').value) || 5;
    saveSettings();
    closeModal();
    showToast('✅ Settings saved!');
}

// QR Scanner
let html5QrCode = null;
let isScanning = false;

function openRealScanner() {
    showModal('📷 QR/SKU Scanner', `
        <div id="qr-reader" style="width:100%;max-width:400px;margin:0 auto;"></div>
        <div id="qr-result" style="margin-top:12px;text-align:center;"></div>
        <div style="margin-top:12px;display:flex;gap:8px;">
            <button class="save-btn" onclick="startRealScanner()" style="flex:1;">▶️ Start</button>
            <button class="save-btn" onclick="stopRealScanner()" style="flex:1;background:var(--danger);">⏹️ Stop</button>
        </div>
        <div id="scannedQRProducts" style="margin-top:12px;"></div>
        <button class="save-btn" id="addQRScannedBtn" onclick="addQRScannedProducts()" style="display:none;background:var(--success);">✅ Add All Scanned</button>
    `);
    setTimeout(() => { const element = document.getElementById('qr-reader'); if (element && typeof Html5Qrcode !== 'undefined') { html5QrCode = new Html5Qrcode("qr-reader"); } }, 500);
}

function startRealScanner() {
    if (!html5QrCode) { showToast('❌ Scanner not initialized'); return; }
    if (isScanning) return;
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
            document.getElementById('qr-result').innerHTML = `<div style="background:var(--success);color:white;padding:8px;border-radius:8px;">✅ Scanned: ${decodedText}</div>`;
            const product = state.inventory.find(p => p.sku === decodedText);
            if (product) {
                if (!window.qrScannedItems) window.qrScannedItems = [];
                const existing = window.qrScannedItems.find(p => p.sku === product.sku);
                if (existing) existing.quantity += 1;
                else window.qrScannedItems.push({ ...product, quantity: 1 });
                renderQRScannedList();
            } else showToast('❌ Product not found');
        },
        (err) => {}
    ).then(() => { isScanning = true; showToast('📷 Scanner started'); }).catch(err => showToast('❌ Camera access denied'));
}

function stopRealScanner() { if (html5QrCode && isScanning) { html5QrCode.stop().then(() => { isScanning = false; showToast('⏹️ Scanner stopped'); }); } }

function renderQRScannedList() {
    const container = document.getElementById('scannedQRProducts');
    const addBtn = document.getElementById('addQRScannedBtn');
    if (!window.qrScannedItems || window.qrScannedItems.length === 0) { container.innerHTML = '<div style="
