/* ==========================================================================
   TIVORA COUTURE — SHOP PAGE
   Loads products from Firestore (falls back to an elegant empty state when
   the backend isn't configured or there's no inventory yet). Supports
   search, category/availability filtering, price range, and sorting.
   Add to Cart / Add to Wishlist work directly from the grid.
   ========================================================================== */

(function () {
  'use strict';
  let allProducts = [];
  const state = { search: '', category: '', availability: '', sort: '', minPrice: null, maxPrice: null };

  document.addEventListener('DOMContentLoaded', async () => {
    wireControls();
    await loadProducts();
    render();
  });

  async function loadProducts() {
    const grid = document.getElementById('productGrid');
    if (grid) grid.innerHTML = skeletonCards(8);
    try {
      allProducts = window.TivoraFirestore ? await window.TivoraFirestore.getProducts() : [];
    } catch (err) {
      allProducts = [];
    }
  }

  function wireControls() {
    const searchInput = document.getElementById('shopSearch');
    const categorySelect = document.getElementById('shopCategory');
    const availabilitySelect = document.getElementById('shopAvailability');
    const sortSelect = document.getElementById('shopSort');

    if (searchInput) searchInput.addEventListener('input', debounce(e => { state.search = e.target.value; render(); }, 200));
    if (categorySelect) categorySelect.addEventListener('change', e => { state.category = e.target.value; render(); });
    if (availabilitySelect) availabilitySelect.addEventListener('change', e => { state.availability = e.target.value; render(); });
    if (sortSelect) sortSelect.addEventListener('change', e => { state.sort = e.target.value; render(); });
  }

  function render() {
    const grid = document.getElementById('productGrid');
    const empty = document.getElementById('shopEmpty');
    if (!grid) return;

    const filtered = window.TivoraHelpers.applyProductFilters(allProducts, state);

    if (!filtered.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    grid.innerHTML = filtered.map(productCard).join('');
    wireCardActions(grid);
  }

  function productCard(p) {
    const inWishlist = window.TivoraWishlist && window.TivoraWishlist.has(p.id);
    return `
    <article class="product-card">
      <a href="product.html?id=${p.id}" class="thumb">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="product-badges">
          ${p.featured ? '<span class="badge gold">Featured</span>' : ''}
          ${p.newArrival ? '<span class="badge">New</span>' : ''}
          ${p.madeToOrder ? '<span class="badge">Made to Order</span>' : ''}
        </div>
      </a>
      <button type="button" class="wishlist-toggle ${inWishlist ? 'active' : ''}" data-id="${p.id}" aria-label="Toggle wishlist">
        ${window.TivoraComponents.icon('heart')}
      </button>
      <a href="product.html?id=${p.id}" class="info">
        <span class="name">${p.name}</span>
        <span class="price">${window.TivoraHelpers.formatNaira(p.price)}</span>
      </a>
      <button type="button" class="add-cart" data-id="${p.id}">Add to Cart</button>
    </article>`;
  }

  function wireCardActions(grid) {
    grid.querySelectorAll('.wishlist-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const p = allProducts.find(x => x.id === id);
        const active = window.TivoraWishlist.toggle({ id: p.id, name: p.name, price: p.price, image: p.image });
        btn.classList.toggle('active', active);
        window.TivoraComponents.toast(active ? 'Added to wishlist' : 'Removed from wishlist');
      });
    });
    grid.querySelectorAll('.add-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const p = allProducts.find(x => x.id === id);
        window.TivoraCart.add({ id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 });
        btn.textContent = 'Added ✓';
        btn.classList.add('confirmed');
        window.TivoraComponents.toast(`${p.name} added to cart`);
        setTimeout(() => { btn.textContent = 'Add to Cart'; btn.classList.remove('confirmed'); }, 1400);
      });
    });
  }

  function skeletonCards(n) {
    return Array.from({ length: n }).map(() =>
      `<div class="product-card"><div class="thumb skeleton"></div></div>`
    ).join('');
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }
})();
