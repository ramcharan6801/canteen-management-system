const API_URL = 'http://localhost:5002/api';

const menuGrid = document.getElementById('menuGrid');
const emptyMessage = document.getElementById('emptyMessage');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const closeCart = document.getElementById('closeCart');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const checkoutForm = document.getElementById('checkoutForm');

const addItemBtn = document.getElementById('addItemBtn');
const addItemModal = document.getElementById('addItemModal');
const closeAddItem = document.getElementById('closeAddItem');
const addItemForm = document.getElementById('addItemForm');

const toast = document.getElementById('toast');
const paymentOverlay = document.getElementById('paymentOverlay');
const paymentStatusText = document.getElementById('paymentStatusText');

const ordersBtn = document.getElementById('ordersBtn');
const ordersModal = document.getElementById('ordersModal');
const closeOrders = document.getElementById('closeOrders');
const ordersList = document.getElementById('ordersList');
const orderStatusFilter = document.getElementById('orderStatusFilter');

let currentMenu = [] // last-fetched menu items, kept in memory
let cart = {} // { menuItemId: { name, price, quantity, maxStock } }

// ---- Fetch & render menu ----
async function fetchMenu() {
  const params = new URLSearchParams();
  if (searchInput.value) params.append('search', searchInput.value);
  if (categoryFilter.value) params.append('category', categoryFilter.value);

  try {
    const res = await fetch(`${API_URL}/menu?${params.toString()}`);
    const items = await res.json();
    currentMenu = items;
    renderMenu(items);
  } catch (err) {
    console.error('Failed to fetch menu:', err);
    menuGrid.innerHTML = '';
    emptyMessage.textContent = 'Could not load menu. Is the backend running?';
    emptyMessage.classList.remove('hidden');
  }
}

function renderMenu(items) {
  menuGrid.innerHTML = '';

  if (!items.length) {
    emptyMessage.textContent = 'No menu items found.';
    emptyMessage.classList.remove('hidden');
    return;
  }
  emptyMessage.classList.add('hidden');

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'menu-card';

    let stockBadgeClass = 'in-stock';
    let stockLabel = `${item.stock} in stock`;
    if (item.stock === 0) {
      stockBadgeClass = 'out-of-stock';
      stockLabel = 'Out of stock';
    } else if (item.stock <= 5) {
      stockBadgeClass = 'low-stock';
      stockLabel = `Only ${item.stock} left`;
    }

    const imageHtml = item.imageUrl
      ? `<img src="http://localhost:5002${item.imageUrl}" alt="${escapeHtml(item.name)}" />`
      : `<div class="no-image">No image</div>`;

    card.innerHTML = `
      ${imageHtml}
      <div class="menu-card-body">
        <div class="menu-card-title-row">
          <h3>${escapeHtml(item.name)}</h3>
          <div class="card-actions">
            <button class="editItemBtn" data-id="${item._id}" title="Edit">✎</button>
            <button class="deleteItemBtn" data-id="${item._id}" title="Delete">🗑</button>
          </div>
        </div>
        <span class="category">${escapeHtml(item.category)}</span>
        <span class="price">₹${item.price}</span>
        <span class="stock-badge ${stockBadgeClass}">${stockLabel}</span>
        <div class="qty-row">
          <button class="qtyMinus" data-id="${item._id}">−</button>
          <input type="number" class="qtyInput" data-id="${item._id}" value="1" min="1" max="${item.stock}" ${item.stock === 0 ? 'disabled' : ''} />
          <button class="qtyPlus" data-id="${item._id}">+</button>
        </div>
        <button class="add-to-cart-btn" data-id="${item._id}" ${item.stock === 0 ? 'disabled' : ''}>
          ${item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    `;
    menuGrid.appendChild(card);
  });

  wireQuantityControls();
  wireAddToCartButtons();
  wireEditDeleteButtons();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Quantity +/- buttons (real-time, capped at available stock) ----
function wireQuantityControls() {
  document.querySelectorAll('.qtyMinus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.querySelector(`.qtyInput[data-id="${btn.dataset.id}"]`);
      const val = parseInt(input.value) || 1;
      input.value = Math.max(1, val - 1);
    });
  });
  document.querySelectorAll('.qtyPlus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.querySelector(`.qtyInput[data-id="${btn.dataset.id}"]`);
      const max = parseInt(input.max) || 1;
      const val = parseInt(input.value) || 1;
      input.value = Math.min(max, val + 1);
    });
  });
}

// ---- Add to cart ----
function wireAddToCartButtons() {
  document.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = currentMenu.find((m) => m._id === id);
      const qtyInput = document.querySelector(`.qtyInput[data-id="${id}"]`);
      const quantity = parseInt(qtyInput.value) || 1;

      if (!item || quantity < 1) return;

      // If already in cart, increase (capped at stock)
      const existing = cart[id];
      const newQty = existing ? Math.min(item.stock, existing.quantity + quantity) : quantity;

      cart[id] = {
        name: item.name,
        price: item.price,
        quantity: newQty,
        maxStock: item.stock,
      };

      updateCartUI();
      showToast(`${item.name} added to cart`);
    });
  });
}

// ---- Cart UI ----
function updateCartUI() {
  const ids = Object.keys(cart);
  const totalItems = ids.reduce((sum, id) => sum + cart[id].quantity, 0);
  cartCount.textContent = totalItems;

  cartItemsEl.innerHTML = '';
  let total = 0;

  if (!ids.length) {
    cartItemsEl.innerHTML = `<p style="color:#999; font-size:0.9rem;">Your cart is empty.</p>`;
  }

  ids.forEach((id) => {
    const { name, price, quantity } = cart[id];
    total += price * quantity;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <span>${escapeHtml(name)} × ${quantity}</span>
      <span>
        ₹${(price * quantity).toFixed(2)}
        <button data-id="${id}" class="removeFromCart">Remove</button>
      </span>
    `;
    cartItemsEl.appendChild(row);
  });

  cartTotalEl.textContent = total.toFixed(2);

  document.querySelectorAll('.removeFromCart').forEach((btn) => {
    btn.addEventListener('click', () => {
      delete cart[btn.dataset.id];
      updateCartUI();
    });
  });
}

cartBtn.addEventListener('click', () => {
  cartModal.classList.remove('hidden');
});
closeCart.addEventListener('click', () => cartModal.classList.add('hidden'));
cartModal.addEventListener('click', (e) => {
  if (e.target === cartModal) cartModal.classList.add('hidden');
});

// ---- Checkout ----
checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const ids = Object.keys(cart);
  if (!ids.length) {
    alert('Your cart is empty.');
    return;
  }

  const customerName = document.getElementById('customerName').value;
  const paymentMethod = checkoutForm.querySelector('input[name="paymentMethod"]:checked').value;
  const items = ids.map((id) => ({ menuItemId: id, quantity: cart[id].quantity }));

  // Simulate a payment gateway delay for UPI/Card so the flow feels real; Cash skips straight through
  if (paymentMethod !== 'cash') {
    paymentStatusText.textContent = `Processing ${paymentMethod.toUpperCase()} payment...`;
    paymentOverlay.classList.remove('hidden');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    paymentStatusText.textContent = 'Payment successful!';
    await new Promise((resolve) => setTimeout(resolve, 700));
    paymentOverlay.classList.add('hidden');
  }

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerName, items, paymentMethod }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Could not place order.');
      return;
    }

    cart = {};
    updateCartUI();
    checkoutForm.reset();
    cartModal.classList.add('hidden');
    showToast(
      paymentMethod === 'cash' ? 'Order placed — pay at counter' : 'Order placed — payment received'
    );
    fetchMenu(); // refresh stock counts (real-time quantity update)
  } catch (err) {
    console.error(err);
    alert('Something went wrong placing your order.');
  }
});

// ---- Add Menu Item ----
addItemBtn.addEventListener('click', () => addItemModal.classList.remove('hidden'));
closeAddItem.addEventListener('click', () => addItemModal.classList.add('hidden'));
addItemModal.addEventListener('click', (e) => {
  if (e.target === addItemModal) addItemModal.classList.add('hidden');
});

addItemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(addItemForm);

  try {
    const res = await fetch(`${API_URL}/menu`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to add item');

    addItemForm.reset();
    addItemModal.classList.add('hidden');
    showToast('Menu item added');
    fetchMenu();
  } catch (err) {
    console.error(err);
    alert('Could not add menu item.');
  }
});

// ---- Edit & Delete menu items ----
const editItemModal = document.getElementById('editItemModal');
const closeEditItem = document.getElementById('closeEditItem');
const editItemForm = document.getElementById('editItemForm');

function wireEditDeleteButtons() {
  document.querySelectorAll('.editItemBtn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = currentMenu.find((m) => m._id === btn.dataset.id);
      if (!item) return;

      editItemForm.itemId.value = item._id;
      editItemForm.name.value = item.name;
      editItemForm.category.value = item.category;
      editItemForm.price.value = item.price;
      editItemForm.stock.value = item.stock;
      editItemForm.description.value = item.description || '';

      editItemModal.classList.remove('hidden');
    });
  });

  document.querySelectorAll('.deleteItemBtn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const item = currentMenu.find((m) => m._id === btn.dataset.id);
      if (!item) return;

      const confirmed = confirm(`Delete "${item.name}"? This cannot be undone.`);
      if (!confirmed) return;

      try {
        const res = await fetch(`${API_URL}/menu/${item._id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        showToast(`${item.name} deleted`);
        fetchMenu();
      } catch (err) {
        console.error(err);
        alert('Could not delete item.');
      }
    });
  });
}

closeEditItem.addEventListener('click', () => editItemModal.classList.add('hidden'));
editItemModal.addEventListener('click', (e) => {
  if (e.target === editItemModal) editItemModal.classList.add('hidden');
});

editItemForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(editItemForm);
  const itemId = formData.get('itemId');
  formData.delete('itemId'); // not a schema field, just used to know which item to update

  try {
    const res = await fetch(`${API_URL}/menu/${itemId}`, {
      method: 'PATCH',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to update item');

    editItemModal.classList.add('hidden');
    showToast('Item updated');
    fetchMenu();
  } catch (err) {
    console.error(err);
    alert('Could not update item.');
  }
});

// ---- Orders view ----
ordersBtn.addEventListener('click', () => {
  ordersModal.classList.remove('hidden');
  fetchOrders();
});
closeOrders.addEventListener('click', () => ordersModal.classList.add('hidden'));
ordersModal.addEventListener('click', (e) => {
  if (e.target === ordersModal) ordersModal.classList.add('hidden');
});
orderStatusFilter.addEventListener('change', fetchOrders);

async function fetchOrders() {
  ordersList.innerHTML = `<p style="color:#999; font-size:0.9rem;">Loading orders...</p>`;
  try {
    const res = await fetch(`${API_URL}/orders`);
    let orders = await res.json();

    if (orderStatusFilter.value) {
      orders = orders.filter((o) => o.status === orderStatusFilter.value);
    }

    renderOrders(orders);
  } catch (err) {
    console.error(err);
    ordersList.innerHTML = `<p style="color:#b3261e; font-size:0.9rem;">Could not load orders.</p>`;
  }
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersList.innerHTML = `<p style="color:#999; font-size:0.9rem;">No orders found.</p>`;
    return;
  }

  ordersList.innerHTML = orders
    .map((order) => {
      const itemsText = order.items.map((i) => `${escapeHtml(i.name)} × ${i.quantity}`).join(', ');
      return `
        <div class="order-card">
          <div class="order-card-header">
            <strong>${escapeHtml(order.customerName)}</strong>
            <span class="order-date">${new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div class="order-items-list">${itemsText}</div>
          <div class="order-card-footer">
            <span class="order-total">
              ₹${order.totalAmount.toFixed(2)}
              ${order.paymentMethod
                ? `<span class="payment-badge ${order.paymentStatus}">${order.paymentMethod.toUpperCase()} · ${order.paymentStatus}</span>`
                : `<span class="payment-badge unpaid">No payment info</span>`
              }
            </span>
            <select class="status-select ${order.status}" data-id="${order._id}">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
              <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
              <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
        </div>
      `;
    })
    .join('');

  document.querySelectorAll('.status-select').forEach((select) => {
    select.addEventListener('change', async () => {
      const id = select.dataset.id;
      const newStatus = select.value;
      try {
        await fetch(`${API_URL}/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        select.className = `status-select ${newStatus}`;
        showToast(`Order marked as ${newStatus}`);
      } catch (err) {
        console.error(err);
        alert('Could not update order status.');
      }
    });
  });
}

// ---- Toast ----
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2000);
}

// ---- Filters ----
let debounceTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchMenu, 300);
});
categoryFilter.addEventListener('change', fetchMenu);

// ---- Initial load ----
fetchMenu();