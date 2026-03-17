// 1. Banco de Dados de Produtos
const produtos = [
  {
    id: 1,
    nome: "Tortinha de chocolate",
    preco: 7.50,
    img: "imagens/torta-chocolate.jpg",
    tag: "Clássicas",
    desc: "Chocolate intenso com textura cremosa e sabor irresistível."
  },
  {
    id: 2,
    nome: "Tortinha de limão",
    preco: 7.00,
    img: "imagens/torta-limao.jpg",
    tag: "Clássicas",
    desc: "Creme de limão suave com equilíbrio perfeito entre doce e cítrico."
  },
  {
    id: 3,
    nome: "Tortinha de maracuja",
    preco: 8.00,
    img: "imagens/torta-maracuja.jpg",
    tag: "Especiais",
    desc: "Sabor tropical com equilíbrio entre acidez e doçura."
  },
];

// Configurações
const TAXA_ENTREGA = 2.00;
const ENDERECO_RETIRADA = "Barrinha/SP";
const PRAZO_ESTIMADO = "45 a 60 minutos";

// 2. Estado da Aplicação
let carrinho = [];

// 3. Verificação de Funcionamento da Loja (Centralizado)
function lojaAberta() {
  const agora = new Date();
  const hora = agora.getHours();
  const dia = agora.getDay(); // 0 = domingo, 6 = sábado

  if (dia === 0 || dia === 6) return false;
  return hora >= 8 && hora < 18;
}

function atualizarStatusLoja() {
  const bola = document.getElementById("status-bola");
  const texto = document.getElementById("status-texto");

  if (!bola || !texto) return;

  if (lojaAberta()) {
    bola.className = "bola-aberto";
    texto.textContent = "ABERTO";
    texto.style.color = "#2ecc71";
  } else {
    bola.className = "bola-fechado";
    texto.textContent = "FECHADO";
    texto.style.color = "#e74c3c";
  }
}

// 4. Interface e Scroll
function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    const offset = 80;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = section.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
}

// 5. Renderização e Filtros do Cardápio
function renderProducts(filter = "todos") {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  const filtrados = filter === "todos" ? produtos : produtos.filter(p => p.tag === filter);

  grid.innerHTML = filtrados.map(p => `
    <article class="product-card">
      <img src="${p.img}" alt="${p.nome}">
      <div class="product-body">
        <div class="product-tag">${p.tag}</div>
        <h3 class="product-title">${p.nome}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <span class="product-price">R$ ${p.preco.toFixed(2)}</span>
          <button class="btn-add" onclick="addToCart(${p.id})">Adicionar</button>
        </div>
      </div>
    </article>
  `).join("");
}

function setupFilters() {
  const btns = document.querySelectorAll(".filter-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(btn.getAttribute("data-filter"));
    });
  });
}

// 6. Lógica do Carrinho
function addToCart(id) {
  if (!lojaAberta()) {
    mostrarModalFechado(); 
    return;
  }

  const produto = produtos.find(p => p.id === id);
  if (!produto) return;

  const existente = carrinho.find(item => item.id === id);
  if (existente) {
    existente.qtd += 1;
  } else {
    carrinho.push({ ...produto, qtd: 1 });
  }

  atualizarResumoCarrinho();
}

function atualizarResumoCarrinho() {
  const badgeNavbar = document.getElementById("cartCount");
  const badgeFlutuante = document.getElementById("contadorFlutuante");
  const carrinhoFlutuante = document.getElementById("carrinhoFlutuante");
  
  const totalItens = carrinho.reduce((sum, item) => sum + item.qtd, 0);
  
  if (badgeNavbar) badgeNavbar.textContent = String(totalItens);
  if (badgeFlutuante) badgeFlutuante.textContent = String(totalItens);
  
  if (carrinhoFlutuante) {
      if (totalItens > 0) {
          carrinhoFlutuante.classList.remove("oculto");
          carrinhoFlutuante.classList.remove('anima-carrinho');
          void carrinhoFlutuante.offsetWidth; 
          carrinhoFlutuante.classList.add('anima-carrinho');
      } else {
          carrinhoFlutuante.classList.add("oculto");
      }
  }

  const btnCarrinhoNav = document.querySelector('.cart-button');
  if (btnCarrinhoNav && totalItens > 0) {
    btnCarrinhoNav.classList.remove('anima-carrinho'); 
    void btnCarrinhoNav.offsetWidth; 
    btnCarrinhoNav.classList.add('anima-carrinho'); 
  }

  renderCartDrawer();
}

function removerDoCarrinho(id) {
  carrinho = carrinho.filter(item => item.id !== id);
  atualizarResumoCarrinho();
}

// 7. Gaveta (Drawer) do Carrinho
function abrirCarrinho() {
  document.getElementById("cartOverlay")?.classList.add("is-open");
  document.getElementById("cartDrawer")?.classList.add("is-open");
  
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  
  renderCartDrawer();
}

function fecharCarrinho() {
  document.getElementById("cartOverlay")?.classList.remove("is-open");
  document.getElementById("cartDrawer")?.classList.remove("is-open");
  
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
}

function toggleEndereco(mostrar) {
  const campo = document.getElementById("campoEndereco");
  if (mostrar) {
    campo.classList.remove("hidden");
  } else {
    campo.classList.add("hidden");
  }
  renderCartDrawer();
}

function renderCartDrawer() {
  const list = document.getElementById("cartDrawerList");
  const totalEl = document.getElementById("cartTotal");
  const footerArea = document.querySelector(".cart-drawer-footer");
  
  if (!list || !totalEl) return;

  const subtotal = carrinho.reduce((sum, item) => sum + (item.preco * item.qtd), 0);
  const isEntrega = document.querySelector('input[name="tipoEntrega"]:checked')?.value === 'entrega';
  const totalGeral = isEntrega ? subtotal + TAXA_ENTREGA : subtotal;

  if (carrinho.length === 0) {
    list.innerHTML = '<p class="cart-drawer-empty" style="text-align:center; padding: 20px;">Seu carrinho está vazio.</p>';
  } else {
    list.innerHTML = carrinho.map(item => `
      <div class="cart-drawer-item" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #44251a; padding: 10px 0;">
        <div class="cart-info">
          <span style="display:block; font-size: 0.9rem;">${item.nome}</span>
          <span style="font-size: 0.8rem; color: #e4cbb0;">Qtd: ${item.qtd}</span>
        </div>
        <div style="text-align:right;">
            <span style="display:block; color: #e28a3a; font-weight:bold;">R$ ${(item.preco * item.qtd).toFixed(2)}</span>
            <button onclick="removerDoCarrinho(${item.id})" style="background:transparent; border:none; color:#e4cbb0; cursor:pointer;">Remover</button>
        </div>
      </div>
    `).join("");
  }

  totalEl.textContent = `R$ ${totalGeral.toFixed(2)}`;

  // Atualiza o botão de finalizar conforme o status da loja
  const btnFinalizar = document.getElementById("btnFinalizarPedido");
  if (btnFinalizar) {
      btnFinalizar.onclick = lojaAberta() ? finalizarCompra : mostrarModalFechado;
  }
}

// 8. Finalização da Compra via WhatsApp
function finalizarCompra() {
  if (!lojaAberta()) {
    mostrarModalFechado();
    return;
  }

  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  const nome = document.getElementById("clienteNome")?.value;
  const telefone = document.getElementById("clienteTelefone")?.value;
  const tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked')?.value;
  const endereco = document.getElementById("clienteEndereco")?.value;

  if (!nome || !telefone) {
    alert("Por favor, preencha seu nome e WhatsApp.");
    return;
  }

  if (tipoEntrega === 'entrega' && !endereco) {
    alert("Por favor, informe o endereço para entrega.");
    return;
  }

  const numero = "5516993201091";
  const resumoItens = carrinho.map((item) => `- ${item.nome} (x${item.qtd}): R$ ${(item.preco * item.qtd).toFixed(2)}`).join("\n");
  const subtotal = carrinho.reduce((sum, item) => sum + (item.preco * item.qtd), 0);
  const total = tipoEntrega === 'entrega' ? subtotal + TAXA_ENTREGA : subtotal;

  let msg = `*Novo Pedido - Lá M.A.G*\n\n`;
  msg += `*Cliente:* ${nome}\n`;
  msg += `*WhatsApp:* ${telefone}\n`;
  msg += `--------------------------\n`;
  msg += `*ITENS:*\n${resumoItens}\n`;
  msg += `--------------------------\n`;

  if (tipoEntrega === 'entrega') {
    msg += `*MODO:* Entrega 🚀\n`;
    msg += `*ENDEREÇO:* ${endereco}\n`;
    msg += `*TAXA:* R$ ${TAXA_ENTREGA.toFixed(2)}\n`;
    msg += `*PRAZO:* ${PRAZO_ESTIMADO}\n`;
  } else {
    msg += `*MODO:* Retirada 🏪\n`;
    msg += `*LOCAL:* ${ENDERECO_RETIRADA}\n`;
  }

  msg += `\n*TOTAL: R$ ${total.toFixed(2)}*`;

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank");
}

// 9. Funções do Modal de Aviso
function mostrarModalFechado() {
    const modal = document.getElementById('closedModal');
    if (modal) {
        modal.classList.add('is-open');
        
        // Trava o scroll de um jeito que não "quebra" o fundo
        document.body.style.overflow = "hidden";
        document.body.style.height = "100vh";
        
        // Se for iPhone/Safari, essa linha ajuda a não bugar:
        document.documentElement.style.overflow = "hidden";
    }
}

function fecharModalFechado() {
    const modal = document.getElementById('closedModal');
    if (modal) {
        modal.classList.remove('is-open');
        
        // Libera a rolagem
        document.body.style.overflow = "";
        document.body.style.height = "";
        document.documentElement.style.overflow = "";
    }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('closedModal');
    if (event.target == modal) {
        fecharModalFechado();
    }
}

// 10. Inicialização da Página
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  setupFilters();
  atualizarStatusLoja();
  setInterval(atualizarStatusLoja, 60000);
});
