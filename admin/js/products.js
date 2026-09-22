/* ==========================================================================
   TIVORA COUTURE ADMIN — PRODUCTS
   List, add, edit and delete products. Images go through Cloudinary
   (admin/js/cloudinary.js), product data through Firestore. Category/size/
   color options are simple text/select inputs so this stays editable
   without a build step in SPCK.
   ========================================================================== */

(function () {
  'use strict';
  let products = [];
  let editingId = null;

  document.addEventListener('tivora-admin:ready', load);

  async function load() {
    try {
      products = await window.TivoraFirestore.adminGetAllProducts();
    } catch (err) {
      console.warn('Could not load products:', err.message);
      products = [];
    }
    render();
    wireForm();
  }

  function render() {
    const tbody = document.querySelector('#productsTable tbody');
    const empty = document.getElementById('productsEmpty');
    if (!tbody) return;
    if (!products.length) { tbody.innerHTML = ''; if (empty) empty.hidden = false; return; }
    if (empty) empty.hidden = true;
    const fmt = window.TivoraHelpers.formatNaira;
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.image || (p.images && p.images[0]) || ''}" alt="" style="width:44px;height:56px;object-fit:cover;border-radius:3px;"></td>
        <td>${p.name}</td>
        <td>${p.category || '—'}</td>
        <td>${fmt(p.price)}</td>
        <td>${p.availability || '—'}</td>
        <td>${p.featured ? 'Featured · ' : ''}${p.newArrival ? 'New · ' : ''}${p.madeToOrder ? 'Made to Order' : ''}</td>
        <td>
          <button type="button" class="admin-btn outline" data-edit="${p.id}">Edit</button>
          <button type="button" class="admin-btn danger" data-delete="${p.id}">Delete</button>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openEditor(btn.dataset.edit)));
    tbody.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => onDelete(btn.dataset.delete)));
  }

  function wireForm() {
    const addBtn = document.getElementById('addProductBtn');
    const form = document.getElementById('productForm');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const fileInput = document.getElementById('productImagesInput');
    const preview = document.getElementById('productImagesPreview');

    if (addBtn) addBtn.addEventListener('click', () => openEditor(null));
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditor);
    if (form) form.addEventListener('submit', onSubmit);
    if (fileInput) fileInput.addEventListener('change', () => {
      preview.innerHTML = '';
      Array.from(fileInput.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = document.createElement('img');
          img.src = reader.result;
          preview.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  function openEditor(id) {
    editingId = id;
    const panel = document.getElementById('productEditorPanel');
    const form = document.getElementById('productForm');
    if (!panel || !form) return;
    panel.hidden = false;
    form.reset();
    document.getElementById('productImagesPreview').innerHTML = '';

    const p = id ? products.find(x => x.id === id) : null;
    document.getElementById('productEditorTitle').textContent = p ? 'Edit Product' : 'Add Product';
    if (p) {
      form.name.value = p.name || '';
      form.price.value = p.price || '';
      form.category.value = p.category || '';
      form.sizes.value = (p.sizes || []).join(', ');
      form.colors.value = (p.colors || []).join(', ');
      form.availability.value = p.availability || 'in-stock';
      form.description.value = p.description || '';
      form.careInstructions.value = p.careInstructions || '';
      form.preparationTime.value = p.preparationTime || '';
      form.featured.checked = !!p.featured;
      form.newArrival.checked = !!p.newArrival;
      form.madeToOrder.checked = !!p.madeToOrder;
      if (p.images) {
        const preview = document.getElementById('productImagesPreview');
        p.images.forEach(src => { const img = document.createElement('img'); img.src = src; preview.appendChild(img); });
      }
    }
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeEditor() {
    editingId = null;
    document.getElementById('productEditorPanel').hidden = true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true; submitBtn.textContent = 'Saving…';

    const fileInput = document.getElementById('productImagesInput');
    const existing = editingId ? (products.find(p => p.id === editingId)?.images || []) : [];
    let images = existing;

    try {
      if (fileInput.files.length) {
        const uploaded = await window.TivoraCloudinary.uploadMultiple(fileInput.files, 'tivora-couture/products');
        images = uploaded.map(u => u.url);
      }

      const data = {
        name: form.name.value.trim(),
        price: Number(form.price.value) || 0,
        category: form.category.value,
        sizes: form.sizes.value.split(',').map(s => s.trim()).filter(Boolean),
        colors: form.colors.value.split(',').map(s => s.trim()).filter(Boolean),
        availability: form.availability.value,
        description: form.description.value.trim(),
        careInstructions: form.careInstructions.value.trim(),
        preparationTime: form.preparationTime.value.trim(),
        featured: form.featured.checked,
        newArrival: form.newArrival.checked,
        madeToOrder: form.madeToOrder.checked,
        images,
        image: images[0] || ''
      };

      if (editingId) await window.TivoraFirestore.adminUpdateProduct(editingId, data);
      else await window.TivoraFirestore.adminCreateProduct(data);

      closeEditor();
      await load();
    } catch (err) {
      alert('Could not save product: ' + err.message);
    }
    submitBtn.disabled = false; submitBtn.textContent = 'Save Product';
  }

  async function onDelete(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await window.TivoraFirestore.adminDeleteProduct(id);
      await load();
    } catch (err) {
      alert('Could not delete product: ' + err.message);
    }
  }
})();
