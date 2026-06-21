// Configuration: Auto-detect environment
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://ahbaphataydepo-service.onrender.com';

// Update log file download link dynamically
const logLink = document.getElementById('log-file-link');
if (logLink) {
    logLink.href = `${API_BASE}/logs`;
}

// Global Application State
let productsState = [];
let updatingProductId = null;

// DOM Elements
const app = document.querySelector('#app');
const inputProductName = document.querySelector('#input-product-name');
const inputQuantity = document.querySelector('#input-quantity');
const btnAddProduct = document.getElementById('btn-add-product');
const btnUpdateProduct = document.getElementById('btn-update-product');
const btnCancelUpdate = document.getElementById('btn-cancel-update');
const formPanelTitle = document.getElementById('form-panel-title');
const connectionStatus = document.getElementById('connection-status');
const searchInput = document.getElementById('search-input');

// Toast Notifications
const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'warning' ? 'toast-warning' : ''}`;
    toast.innerHTML = `<span>${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅'}</span> ${message}`;

    container.appendChild(toast);

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Render Statistics Widget
const updateStats = (products) => {
    const totalItems = products.length;
    const totalUnits = products.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const lowStockCount = products.filter(item => {
        const qty = parseInt(item.quantity) || 0;
        return qty >= 0 && qty < 10;
    }).length;

    document.getElementById('stat-total-items').textContent = totalItems;
    document.getElementById('stat-total-stock').textContent = totalUnits;
    
    const lowStockEl = document.getElementById('stat-low-stock');
    lowStockEl.textContent = lowStockCount;
    if (lowStockCount > 0) {
        lowStockEl.style.color = 'var(--accent-amber)';
    } else {
        lowStockEl.style.color = 'var(--text-primary)';
    }
};

// Render Products list in the DOM
const renderProducts = (products) => {
    if (!app) return;
    
    if (products.length === 0) {
        app.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <p>No products found in registry</p>
            </div>
        `;
        return;
    }

    app.innerHTML = '';
    products.forEach((item) => {
        const qty = parseInt(item.quantity) || 0;
        let badgeClass = 'badge-ok';
        let badgeText = 'In Stock';

        if (qty === 0) {
            badgeClass = 'badge-critical';
            badgeText = 'Out of Stock';
        } else if (qty < 10) {
            badgeClass = 'badge-low';
            badgeText = 'Low Stock';
        }

        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-header">
                <span class="product-title">${escapeHTML(item.productname)}</span>
                <span class="product-badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="product-stock">
                <span class="stock-num">${qty}</span>
                <span class="stock-label">units</span>
            </div>
            <div class="product-actions">
                <button class="btn-sm edit-action" onclick="readyToUpdate(${item.id})">✏️ Edit</button>
                <button class="btn-sm delete-action" onclick="handleDelete(${item.id})">🗑️ Delete</button>
            </div>
        `;
        app.appendChild(productCard);
    });
};

// Search & Filter
const handleSearch = () => {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = productsState.filter(item => 
        item.productname.toLowerCase().includes(query)
    );
    renderProducts(filtered);
};

// Escape HTML helper to prevent XSS
const escapeHTML = (str) => {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
};

// API Call: Fetch all products
const getProducts = async () => {
    try {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error('Failed to retrieve inventory data');
        const data = await res.json();
        
        if (data.err) {
            throw new Error(data.err);
        }

        productsState = data.products || [];
        updateStats(productsState);
        
        // Render filtered if search has input, otherwise render all
        handleSearch();

        // Update connection status visual
        if (connectionStatus) {
            connectionStatus.textContent = 'Connected';
            connectionStatus.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            connectionStatus.style.color = 'var(--accent-emerald)';
        }
    } catch (error) {
        console.error(error);
        showToast(`Server Connection Offline: ${error.message}`, 'error');
        if (connectionStatus) {
            connectionStatus.textContent = 'Offline';
            connectionStatus.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            connectionStatus.style.color = 'var(--accent-rose)';
        }
    }
};

// API Call: Add new product
const addProduct = async () => {
    const productname = inputProductName.value.trim();
    const quantityStr = inputQuantity.value.trim();

    if (!productname) {
        showToast('Please enter a product name', 'warning');
        return;
    }
    if (quantityStr === '' || isNaN(quantityStr)) {
        showToast('Please enter a valid stock number', 'warning');
        return;
    }

    const quantity = parseInt(quantityStr);

    try {
        const res = await fetch(`${API_BASE}/product`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productname, quantity })
        });
        
        const data = await res.json();
        if (!res.ok || data.err) {
            throw new Error(data.err || 'Failed to add product');
        }

        showToast(`Successfully added "${productname}"`);
        inputProductName.value = '';
        inputQuantity.value = '';
        await getProducts();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
};

// Edit State setup
const readyToUpdate = async (id) => {
    try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        
        if (data.err || !data.product) {
            throw new Error(data.err || 'Item information unavailable');
        }

        const product = data.product;
        updatingProductId = id;

        // Populate fields
        inputProductName.value = product.productname;
        inputQuantity.value = product.quantity;

        // Toggle UI buttons
        formPanelTitle.textContent = 'Edit Product';
        btnAddProduct.style.display = 'none';
        btnUpdateProduct.style.display = 'block';
        btnCancelUpdate.style.display = 'block';
        
        // Scroll to form smoothly
        inputProductName.scrollIntoView({ behavior: 'smooth' });
        inputProductName.focus();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
};

// API Call: Save modifications
const saveProductUpdate = async () => {
    if (!updatingProductId) return;

    const productname = inputProductName.value.trim();
    const quantityStr = inputQuantity.value.trim();

    if (!productname) {
        showToast('Product name cannot be empty', 'warning');
        return;
    }
    if (quantityStr === '' || isNaN(quantityStr)) {
        showToast('Please enter a valid quantity', 'warning');
        return;
    }

    const quantity = parseInt(quantityStr);

    try {
        const res = await fetch(`${API_BASE}/products/${updatingProductId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ productname, quantity })
        });

        const data = await res.json();
        if (!res.ok || data.err) {
            throw new Error(data.err || 'Failed to save modifications');
        }

        showToast(`Updated stock for "${productname}"`);
        cancelUpdate();
        await getProducts();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
};

// Exit edit mode
const cancelUpdate = () => {
    updatingProductId = null;
    inputProductName.value = '';
    inputQuantity.value = '';

    formPanelTitle.textContent = 'Add New Product';
    btnAddProduct.style.display = 'block';
    btnUpdateProduct.style.display = 'none';
    btnCancelUpdate.style.display = 'none';
};

// API Call: Delete item
const handleDelete = async (id) => {
    const item = productsState.find(p => p.id === id);
    const name = item ? item.productname : 'Selected item';
    
    if (!confirm(`Are you sure you want to delete "${name}" from stock?`)) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });

        const data = await res.json();
        if (!res.ok || data.err) {
            throw new Error(data.err || 'Failed to delete item');
        }

        showToast(`Removed "${name}" from registry`, 'warning');
        
        // If the item deleted was currently being edited, reset form
        if (updatingProductId === id) {
            cancelUpdate();
        }

        await getProducts();
    } catch (error) {
        console.error(error);
        showToast(error.message, 'error');
    }
};

// Bind update button event once globally
if (btnUpdateProduct) {
    btnUpdateProduct.addEventListener('click', saveProductUpdate);
}

// Initial Fetch
getProducts();
