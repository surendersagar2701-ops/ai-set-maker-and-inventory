// ============================================
// SIMPLE APP.JS - WORKING VERSION
// ============================================

console.log('✅ App.js loaded successfully!');

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function navigateTo(screenId) {
    console.log('Navigating to:', screenId);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
    });
    
    // Show target screen
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        console.log('✅ Showing:', screenId);
    } else {
        console.log('❌ Screen not found:', screenId);
    }
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
    });
    const navBtn = document.querySelector(`.nav-btn[data-screen="${screenId}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }
}

// ============================================
// SCREEN FUNCTIONS
// ============================================

function showHome() {
    console.log('🏠 Home clicked');
    navigateTo('homeScreen');
}

function showInventory() {
    console.log('📦 Inventory clicked');
    navigateTo('inventoryScreen');
}

function showAISetMaker() {
    console.log('✨ AI Set Maker clicked');
    navigateTo('aiSetMakerScreen');
}

function showBulkAdd() {
    console.log('📚 Bulk Add clicked');
    navigateTo('bulkAddScreen');
}

function showAddProduct() {
    console.log('➕ Add Product clicked');
    navigateTo('addProductScreen');
}

function showNewSale() {
    console.log('🧾 New Sale clicked');
    navigateTo('newSaleScreen');
}

function showMore() {
    console.log('☰ More clicked');
    navigateTo('moreScreen');
}

function showSettings() {
    alert('⚙️ Settings clicked!');
    console.log('⚙️ Settings clicked');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
    console.log('Modal closed');
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================

window.navigateTo = navigateTo;
window.showHome = showHome;
window.showInventory = showInventory;
window.showAISetMaker = showAISetMaker;
window.showBulkAdd = showBulkAdd;
window.showAddProduct = showAddProduct;
window.showNewSale = showNewSale;
window.showMore = showMore;
window.showSettings = showSettings;
window.closeModal = closeModal;

console.log('✅ All functions registered!');
console.log('Available functions:', Object.keys(window).filter(k => k.startsWith('show')));

