//  WhatsApp
const WHATSAPP_PHONE = "5516993201091";

// Produtos
const productsBase = [
  { id: "chocolate", name: "Tortinha de Chocolate", price: 7.50, img: "imagens/torta-chocolate.jpg", desc: "Cacau intenso e recheio cremoso.", tags: ["Gourmet"] },
  { id: "limão", name: "Tortinha de Limão", price: 7.00, img: "imagens/torta-limao.jpg", desc: "Sabor premium e marcante.", tags: ["Gourmet"] },
  { id: "maracuja", name: "Tortinha de Maracujá", price: 8.00, img: "imagens/torta-maracuja.jpg", desc: "Azeddinha na medida certa.", tags: ["Gourmet"] },
];

let state = {
  products: [...productsBase],
  cart: {}, // {id: qty}
};

// ====== HELPERS ======
const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const byId = (id) => document.getElementById(id);

function getProduct(id){ return productsBase.find(p => p.id === id); }

function cartCount(){
  return Object.values(state.cart).reduce((acc, q) => acc + q, 0);
}
function cartSubtotal(){
  return Object.entries(state.cart).reduce((acc, [id, q]) => acc + (getProduct(id).price * q), 0);
}

function saveCart(){
  localStorage.setItem("lamag_cart", JSON.stringify(state.cart));
}
function loadCart(){
  try{
    const raw = localStorage.getItem("lamag_cart");
    if(raw) state.cart = JSON.parse(raw) || {};
  }catch(e){}
}

function setCartQty(id, qty){
  if(qty <= 0) delete state.cart[id];
  else state.cart[id] = qty;
}
function addToCart(id, delta){
  const current = state.cart[id] || 0;
  const next = Math.max(0, current + delta);
  setCartQty(id, next);
  saveCart();
}

// ====== UI REFS ======
const grid = byId("productsGrid");
const cartDrawer = byId("cartDrawer");
const cartItems = byId("cartItems");
const cartCountEl = byId("cartCount");
const cartSubtotalEl = byId("cartSubtotal");
const yearEl = byId("year");

const searchInput = byId("searchInput");
const sortSelect = byId("sortSelect");

const openCartBtn = byId("openCartBtn");
const openCartBtn2 = byId("openCartBtn2");
const closeCartBtn = byId("closeCartBtn");
const closeCartOverlay = byId("closeCartOverlay");

const sendWhatsBtn = byId("sendWhatsBtn");
const clearCartBtn = byId("clearCartBtn");
const whatsQuickBtn = byId("whatsQuickBtn");

const customerName = byId("customerName");
const customerNotes = byId("customerNotes");

// ====== RENDER ======
function renderProducts(list){
  grid.innerHTML = "";

  list.forEach(p => {
    const qty = state.cart[p.id] || 0;

    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <img class="card__img" src="${p.img}" alt="${p.name}">
      <div class="card__body">
        <div class="card__title">
          <div>
            <h3>${p.name}</h3>
            <div class="tags">
              ${p.tags.map(t => `<span class="tag">${t}</span>`).join("")}
            </div>
          </div>
          <div class="price">${brl(p.price)}</div>
        </div>

        <p class="desc">${p.desc}</p>

        <div class="card__actions">
          <div class="qty" aria-label="Quantidade">
            <button data-action="dec" data-id="${p.id}" aria-label="Diminuir">−</button>
            <span id="qty-${p.id}">${qty}</span>
            <button data-action="inc" data-id="${p.id}" aria-label="Aumentar">+</button>
          </div>
          <button class="btn btn--ghost" data-action="add" data-id="${p.id}" type="button">Adicionar</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  grid.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if(action === "inc" || action === "add") addToCart(id, 1);
      if(action === "dec") addToCart(id, -1);

      const q = state.cart[id] || 0;
      const qtyEl = document.querySelector(`#qty-${id}`);
      if(qtyEl) qtyEl.textContent = q;

      renderCart();
    });
  });
}

function renderCart(){
  cartCountEl.textContent = cartCount();
  cartSubtotalEl.textContent = brl(cartSubtotal());

  const entries = Object.entries(state.cart).filter(([,q]) => q > 0);

  if(entries.length === 0){
    cartItems.innerHTML = `
      <div class="note">
        Seu carrinho está vazio. Escolha suas trufas no cardápio 🍫
      </div>
    `;
    return;
  }

  cartItems.innerHTML = "";
  entries.forEach(([id, q]) => {
    const p = getProduct(id);

    const item = document.createElement("div");
    item.className = "cart-item";
    item.innerHTML = `
      <div>
        <strong>${p.name}</strong>
        <div class="muted">${q} × ${brl(p.price)} • Total: <strong>${brl(p.price * q)}</strong></div>
      </div>
      <div class="cart-item__right">
        <button data-id="${id}" data-action="plus" type="button">+1</button>
        <button data-id="${id}" data-action="minus" type="button">-1</button>
        <button data-id="${id}" data-action="remove" type="button">Remover</button>
      </div>
    `;
    cartItems.appendChild(item);
  });

  cartItems.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if(action === "plus") addToCart(id, 1);
      if(action === "minus") addToCart(id, -1);
      if(action === "remove") { setCartQty(id, 0); saveCart(); }

      const qtyEl = document.querySelector(`#qty-${id}`);
      if(qtyEl) qtyEl.textContent = state.cart[id] || 0;

      renderCart();
    });
  });
}

function applyFilters(){
  const q = (searchInput.value || "").trim().toLowerCase();
  let list = [...productsBase];

  if(q){
    list = list.filter(p => (p.name + " " + p.desc + " " + p.tags.join(" ")).toLowerCase().includes(q));
  }

  const sort = sortSelect.value;
  if(sort === "priceAsc") list.sort((a,b) => a.price - b.price);
  if(sort === "priceDesc") list.sort((a,b) => b.price - a.price);
  if(sort === "nameAsc") list.sort((a,b) => a.name.localeCompare(b.name, "pt-BR"));

  state.products = list;
  renderProducts(list);
}

// ====== DRAWER ======
function openCart(){
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  renderCart();
}
function closeCart(){
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

// ====== WHATSAPP ======
function buildWhatsMessage(){
  const entries = Object.entries(state.cart).filter(([,q]) => q > 0);
  if(entries.length === 0) return null;

  const name = (customerName.value || "").trim();
  if(!name) return "NAME_REQUIRED";

  const notes = (customerNotes.value || "").trim();

  let msg = `Olá! Vim pelo site da Lá M.A.G 🍫%0A`;
  msg += `Nome: ${encodeURIComponent(name)}%0A`;
  msg += `%0A*Meu pedido:*%0A`;

  entries.forEach(([id, q]) => {
    const p = getProduct(id);
    msg += `- ${q}x ${encodeURIComponent(p.name)} (${encodeURIComponent(brl(p.price))})%0A`;
  });

  msg += `%0A*Subtotal:* ${encodeURIComponent(brl(cartSubtotal()))}%0A`;
  if(notes) msg += `%0AObs.: ${encodeURIComponent(notes)}%0A`;
  msg += `%0APodemos combinar entrega/retirada? 😊`;

  return msg;
}

function openWhats(msg){
  const url = `https://wa.me/${WHATSAPP_PHONE}?text=${msg}`;
  window.open(url, "_blank");
}

// ====== EVENTS ======
openCartBtn.addEventListener("click", openCart);
openCartBtn2.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
closeCartOverlay.addEventListener("click", closeCart);

sendWhatsBtn.addEventListener("click", () => {
  const msg = buildWhatsMessage();

  if(msg === null){
    alert("Seu carrinho está vazio 😄");
    return;
  }

  if(msg === "NAME_REQUIRED"){
    alert("Por favor, informe seu nome antes de enviar o pedido 😊");
    customerName.focus();
    return;
  }

  openWhats(msg);
});

clearCartBtn.addEventListener("click", () => {
  state.cart = {};
  saveCart();
  renderCart();
  productsBase.forEach(p => {
    const el = document.querySelector(`#qty-${p.id}`);
    if(el) el.textContent = "0";
  });
});

whatsQuickBtn.addEventListener("click", () => {
  const msg = encodeURIComponent("Olá! Quero fazer um pedido de trufas gourmet da Lá M.A.G 🍫");
  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${msg}`, "_blank");
});

searchInput.addEventListener("input", applyFilters);
sortSelect.addEventListener("change", applyFilters);

// ====== INIT ======
yearEl.textContent = new Date().getFullYear();
loadCart();
renderProducts(state.products);

renderCart();
