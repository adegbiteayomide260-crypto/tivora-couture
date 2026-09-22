/* ==========================================================================
   TIVORA COUTURE — PRODUCT PAGE
   Reads ?id= from the URL, loads that product from Firestore, renders the
   gallery/variants/info, and tracks "recently viewed" in localStorage.
   ========================================================================== */

(function () {
  'use strict';
  let product = null;
  let selectedSize = null, selectedColor = null, selectedImage = 0;

  document.addEventListener('DOMContentLoaded', async () => {
    const id = new URLSearchParams(location.search).get('id');
    const root = document.getElementById('productRoot');
    const notFound = document.getElementById('productNotFound');
    if (!id) { showNotFound(); return; }

    try {
      product = window.TivoraFirestore ? await window.TivoraFirestore.getProduct(id) : null;
    } catch (e) { product = null; }

    if (!product) { showNotFound(); return; }
    if (root) root.hidden = false;
    if (notFound) notFound.hidden = true;
    render();
    trackRecentlyViewed(product);
    renderRecentlyViewed();

    function showNotFound() {
      if (root) root.hidden = true;
      if (notFound) notFound.hidden = false;
    }
  });

  function render() {
    document.title = `${product.name} — Tivora Couture`;
    setText('productName', product.name);
    setText('productPrice', window.TivoraHelpers.formatNaira(product.price));
    setText('productDescription', product.description || '');
    setText('productCare', product.careInstructions || 'Care guidance will be added by our atelier.');
    setText('productPrepTime', product.madeToOrder ? (product.preparationTime || 'Made to order — preparation time provided at checkout.') : 'Ready to ship.');

    const mainImg = document.getElementById('productMainImage');
    const images = product.images && product.images.length ? product.images : [product.image];
    if (mainImg) mainImg.src = images[selectedImage] || images[0];

    const thumbs = document.getElementById('productThumbs');
    if (thumbs) {
      thumbs.innerHTML = images.map((src, i) =>
        `<button type="button" class="thumb-btn ${i === selectedImage ? 'active' : ''}" data-i="${i}"><img src="${src}" alt="${product.name} view ${i + 1}"></button>`
      ).join('');
      thumbs.querySelectorAll('.thumb-btn').forEach(btn => btn.addEventListener('click', () => {
        selectedImage = Number(btn.dataset.i); render();
      }));
    }

    const sizesWrap = document.getElementById('productSizes');
    if (sizesWrap && product.sizes) {
      sizesWrap.innerHTML = product.sizes.map(s =>
        `<button type="button" class="variant-chip ${s === selectedSize ? 'active' : ''}" data-size="${s}">${s}</button>`
      ).join('');
      sizesWrap.querySelectorAll('[data-size]').forEach(btn => btn.addEventListener('click', () => {
        selectedSize = btn.dataset.size; render();
      }));
    }

    const colorsWrap = document.getElementById('productColors');
    if (colorsWrap && product.colors) {
      colorsWrap.innerHTML = product.colors.map(c =>
        `<button type="button" class="variant-chip ${c === selectedColor ? 'active' : ''}" data-color="${c}">${c}</button>`
      ).join('');
      colorsWrap.querySelectorAll('[data-color]').forEach(btn => btn.addEventListener('click', () => {
        selectedColor = btn.dataset.color; render();
      }));
    }

    const wishBtn = document.getElementById('productWishlistBtn');
    if (wishBtn) {
      const active = window.TivoraWishlist.has(product.id);
      wishBtn.classList.toggle('active', active);
      wishBtn.onclick = () => {
        const isActive = window.TivoraWishlist.toggle({ id: product.id, name: product.name, price: product.price, image: images[0] });
        wishBtn.classList.toggle('active', isActive);
        window.TivoraComponents.toast(isActive ? 'Added to wishlist' : 'Removed from wishlist');
      };
    }

    const addBtn = document.getElementById('productAddToCart');
    if (addBtn) {
      addBtn.onclick = () => {
        const qty = Number(document.getElementById('productQty')?.value) || 1;
        window.TivoraCart.add({
          id: product.id, name: product.name, price: product.price, image: images[0],
          size: selectedSize, color: selectedColor, qty
        });
        window.TivoraComponents.toast(`${product.name} added to cart`);
      };
    }

    const orderNowBtn = document.getElementById('productOrderNow');
    if (orderNowBtn) {
      orderNowBtn.onclick = () => {
        window.TivoraCart.add({ id: product.id, name: product.name, price: product.price, image: images[0], size: selectedSize, color: selectedColor, qty: 1 });
        location.href = 'checkout.html';
      };
    }
  }

  function trackRecentlyViewed(p) {
    const KEY = 'tivora_recent_v1';
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}
    recent = recent.filter(r => r.id !== p.id);
    recent.unshift({ id: p.id, name: p.name, price: p.price, image: (p.images && p.images[0]) || p.image });
    localStorage.setItem(KEY, JSON.stringify(recent.slice(0, 8)));
  }

  function renderRecentlyViewed() {
    const wrap = document.getElementById('recentlyViewed');
    if (!wrap) return;
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem('tivora_recent_v1')) || []; } catch (e) {}
    recent = recent.filter(r => r.id !== product.id);
    if (!recent.length) { wrap.closest('.section')?.setAttribute('hidden', ''); return; }
    wrap.innerHTML = recent.map(r => `
      <a href="product.html?id=${r.id}" class="product-card">
        <div class="thumb"><img src="${r.image}" alt="${r.name}" loading="lazy"></div>
        <div class="info"><span class="name">${r.name}</span><span class="price">${window.TivoraHelpers.formatNaira(r.price)}</span></div>
      </a>`).join('');
  }

  function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
})();
