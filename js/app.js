// js/app.js

// Keys
const STORAGE_KEY = 'mi_coleccion_items';

// Referencias DOM
const form = document.getElementById('itemForm');
const itemsTableBody = document.querySelector('#itemsTable tbody');
const cardsContainer = document.getElementById('cardsContainer');
const resetBtn = document.getElementById('resetBtn');
const filterFav = document.getElementById('filterFav');
const filterAll = document.getElementById('filterAll');
const clearStorage = document.getElementById('clearStorage');
const editIdInput = document.getElementById('editId');

// Estado local
let items = loadItems();

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Util: crear id simple
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

// Render tabla y tarjetas
function render(list = items) {
  // tabla
  itemsTableBody.innerHTML = '';
  list.forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(it.title)}</td>
      <td>${escapeHtml(it.category)}</td>
      <td>${it.quantity}</td>
      <td>${it.acquired || ''}</td>
      <td>${it.favorite ? '⭐' : ''}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" data-id="${it.id}" data-act="edit">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-id="${it.id}" data-act="delete">Borrar</button>
      </td>
    `;
    itemsTableBody.appendChild(tr);
  });

  // tarjetas
  cardsContainer.innerHTML = '';
  list.forEach(it => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
      <div class="title">${escapeHtml(it.title)}</div>
      <div class="meta">${escapeHtml(it.creator || '')} • ${escapeHtml(it.category)}</div>
      <div class="meta">Cantidad: ${it.quantity}</div>
      <div class="meta">Adq: ${it.acquired || '—'}</div>
      <div class="actions">
        <button class="btn btn-sm btn-outline-primary" data-id="${it.id}" data-act="edit">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-id="${it.id}" data-act="delete">Borrar</button>
      </div>
    `;
    cardsContainer.appendChild(div);
  });
}

// Simple sanitización para evitar inyecciones
function escapeHtml(text = '') {
  return String(text).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

// Manejo submit (crear o editar)
form.addEventListener('submit', function(e){
  e.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  const data = {
    title: form.title.value.trim(),
    creator: form.creator.value.trim(),
    category: form.category.value,
    quantity: Number(form.quantity.value) || 1,
    acquired: form.acquired.value || '',
    notes: form.notes.value.trim(),
    favorite: form.favorite.checked
  };

  const editId = editIdInput.value;
  if (editId) {
    // editar
    const idx = items.findIndex(x => x.id === editId);
    if (idx >= 0) {
      items[idx] = {...items[idx], ...data};
    }
  } else {
    // crear nuevo
    const newItem = {...data, id: genId(), createdAt: new Date().toISOString()};
    items.push(newItem);
  }
  saveItems();
  render();
  form.reset();
  editIdInput.value = '';
  form.classList.remove('was-validated');
});

// Delegación de botones editar/borrar
document.addEventListener('click', function(e){
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  if (act === 'edit') {
    const it = items.find(x => x.id === id);
    if (!it) return;
    // rellenar form
    form.title.value = it.title;
    form.creator.value = it.creator;
    form.category.value = it.category;
    form.quantity.value = it.quantity;
    form.acquired.value = it.acquired;
    form.notes.value = it.notes;
    form.favorite.checked = !!it.favorite;
    editIdInput.value = it.id;
    window.location.hash = '#form';
  } else if (act === 'delete') {
    if (!confirm('¿Eliminar este ítem?')) return;
    items = items.filter(x => x.id !== id);
    saveItems();
    render();
  }
});

// Reset botón
resetBtn.addEventListener('click', () => {
  form.reset();
  editIdInput.value = '';
  form.classList.remove('was-validated');
});

// Filtros
filterFav.addEventListener('click', () => render(items.filter(i => i.favorite)));
filterAll.addEventListener('click', () => render(items));

// Borrar todo
clearStorage.addEventListener('click', () => {
  if (!confirm('Borrar todo el inventario?')) return;
  items = [];
  saveItems();
  render();
});

// Inicial
render();