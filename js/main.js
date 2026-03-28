/* ═══════════════════════════════════════════════════════════
   Lartica Bakehouse — Main JavaScript
   Pâtisserie artisanale franco-marocaine · Fès
   ═══════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const WHATSAPP_NUMBER = '212664727887';

  // ─── DOM REFERENCES ──────────────────────────────────
  const header = document.getElementById('site-header');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  
  // ─── HEADER SHADOW ON SCROLL (Debounced) ─────────────
  let scrollTicking = false;
  window.addEventListener('scroll', function() {
    if (!scrollTicking) {
      window.requestAnimationFrame(function() {
        const y = window.scrollY;
        if (header) {
          header.classList.toggle('scrolled', y > 20);
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  // ─── HAMBURGER TOGGLE ────────────────────────────────
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ─── SCROLL-TRIGGERED FADE-UP ────────────────────────
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-up').forEach(function(el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll('.fade-up').forEach(function(el) {
      el.classList.add('visible');
    });
  }

  // ─── PERFORMANCE: SHIMMER TICK & GPU LAYERS ──────────
  const heroImgs = document.querySelectorAll('.hero-main, .hero-tall, .hero-side');
  heroImgs.forEach(img => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'));
    }
  });

  const heroImagesContainer = document.querySelector('.hero-images');
  if (heroImagesContainer) {
    heroImagesContainer.addEventListener('mouseenter', () => {
      heroImgs.forEach(img => img.style.willChange = 'transform');
    });
    heroImagesContainer.addEventListener('mouseleave', () => {
      heroImgs.forEach(img => img.style.willChange = 'auto');
    });
  }

  // ─── SMOOTH SCROLL FOR ANCHOR LINKS ──────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
        const top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ─── STICKY CTA VISIBILITY ──────────────────────────
  const stickyCta = document.querySelector('.sticky-cta');
  const heroSection = document.getElementById('hero');
  if (stickyCta && heroSection) {
    const stickyObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        stickyCta.style.display = e.isIntersecting ? 'none' : '';
      });
    }, { threshold: 0 });
    stickyObserver.observe(heroSection);
  }

  // ─── CART SYSTEM & MULTI-STEP MODAL ──────────────────
  const CATALOG = {
    viennoiseries: {
      name: "Viennoiseries",
      items: [
        { id: "c-nat", name: "Croissant nature", price: 12 },
        { id: "c-pis", name: "Croissant pistache", price: 18 },
        { id: "p-choc", name: "Pain au chocolat", price: 14 },
        { id: "p-suisse", name: "Pain Suisse", price: 16 },
        { id: "cin-roll", name: "Cinnamon Roll", price: 20 }
      ]
    },
    marocains: {
      name: "Classiques marocains",
      items: [
        { id: "k-ghzal", name: "Kaab Ghzal", price: 8 },
        { id: "fekkas", name: "Fekkas amande", price: 10 },
        { id: "ghraybe", name: "Ghraybe", price: 8 },
        { id: "ghriba-n", name: "Ghriba noix", price: 10 }
      ]
    },
    formules: {
      name: "Formules & Gâteaux",
      items: [
        { id: "box-pt", name: "Box Petit-Déjeuner (6 pcs)", price: 70 },
        { id: "plat-ev", name: "Plateau Événement (15 pcs)", price: 250 },
        { id: "mariage", name: "Forfait Mariage", price: 0, surDevis: true },
        { id: "gateau-sm", name: "Gâteau sur mesure", price: 0, surDevis: true }
      ]
    }
  };

  // Pre-compute flat dictionary for quick access
  const ITEMS_DICT = {};
  Object.values(CATALOG).forEach(cat => {
    cat.items.forEach(item => {
      ITEMS_DICT[item.id] = item;
    });
  });

  let cart = {}; // state struct: { [id]: totalQty }

  // Modal DOM elements
  const modal = document.getElementById('order-modal');
  const modalClose = document.getElementById('modal-close');
  const viewCats = document.getElementById('view-categories');
  const viewProds = document.getElementById('view-products');
  const viewCheck = document.getElementById('view-checkout');
  
  const productListContainer = document.getElementById('product-list-container');
  const activeCategoryTitle = document.getElementById('active-category-title');
  const btnBackCats = document.getElementById('btn-back-categories');
  const btnBackCart = document.getElementById('btn-back-cart');
  const btnNextStep = document.getElementById('btn-next-step');
  
  const cartExpandBtn = document.getElementById('cart-expand-btn');
  const cartPreview = document.getElementById('cart-preview');
  const cartItemsList = document.getElementById('cart-items-list');
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');
  
  // Navigation Flow
  function switchView(viewId) {
    document.querySelectorAll('.modal-view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    const isCheckout = viewId === 'view-checkout';
    btnNextStep.textContent = isCheckout ? "Confirmer la commande" : "Suivant";
  }

  btnBackCats.addEventListener('click', () => switchView('view-categories'));
  btnBackCart.addEventListener('click', () => switchView('view-categories'));

  document.querySelectorAll('.category-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const catKey = btn.getAttribute('data-category');
      renderProductList(catKey);
      switchView('view-products');
    });
  });

  // Render products for a category
  function renderProductList(catKey) {
    const data = CATALOG[catKey];
    activeCategoryTitle.textContent = data.name;
    productListContainer.innerHTML = '';

    data.items.forEach(product => {
      const row = document.createElement('div');
      row.className = 'product-row';
      const qty = cart[product.id] || 0;
      
      const priceText = product.surDevis ? "Sur devis" : `${product.price} DH`;

      row.innerHTML = `
        <div class="product-info">
          <strong>${product.name}</strong>
          <span>${priceText}</span>
        </div>
        <div class="product-stepper">
          <button type="button" aria-label="Retirer" data-action="dec" data-id="${product.id}">−</button>
          <span class="qty-display">${qty}</span>
          <button type="button" aria-label="Ajouter" data-action="inc" data-id="${product.id}">+</button>
        </div>
      `;
      productListContainer.appendChild(row);
    });

    // Attach listeners
    productListContainer.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const action = e.target.getAttribute('data-action');
        
        if (action === 'inc') {
          cart[id] = (cart[id] || 0) + 1;
        } else if (action === 'dec') {
          if (cart[id] > 0) cart[id]--;
          if (cart[id] === 0) delete cart[id];
        }
        
        e.target.parentElement.querySelector('.qty-display').textContent = cart[id] || 0;
        updateCartSummary();
      });
    });
  }

  function updateCartSummary() {
    let totalItems = 0;
    let subtotal = 0;
    let hasDevis = false;
    cartItemsList.innerHTML = '';

    // Calculate totals
    Object.keys(cart).forEach(id => {
      const qty = cart[id];
      const item = ITEMS_DICT[id];
      totalItems += qty;
      
      if (item.surDevis) {
        hasDevis = true;
      } else {
        subtotal += (item.price * qty);
      }

      // Add to preview list
      const priceText = item.surDevis ? 'Devis' : `${item.price * qty} DH`;
      cartItemsList.innerHTML += `
        <li>
          <span class="li-title">${qty}x ${item.name}</span>
          <span>${priceText}</span>
        </li>
      `;
    });

    cartCount.textContent = totalItems;
    
    if (totalItems === 0) {
      cartTotal.textContent = "0 DH";
      btnNextStep.disabled = true;
      cartPreview.classList.remove('open');
      cartExpandBtn.setAttribute('aria-expanded', 'false');
    } else {
      btnNextStep.disabled = false;
      if (subtotal > 0 && hasDevis) {
        cartTotal.textContent = `${subtotal} DH + Devis`;
      } else if (hasDevis && subtotal === 0) {
        cartTotal.textContent = "Sur devis";
      } else {
        cartTotal.textContent = `${subtotal} DH`;
      }
    }
  }

  // Toggle Cart footer expansion
  cartExpandBtn.addEventListener('click', () => {
    if (Object.keys(cart).length === 0) return;
    const isExpanded = cartPreview.classList.toggle('open');
    cartExpandBtn.setAttribute('aria-expanded', isExpanded);
  });

  // Next / Submit Button Logic
  btnNextStep.addEventListener('click', () => {
    if (document.getElementById('view-checkout').classList.contains('active')) {
      // We are in checkout view, simulate submit
      handleCheckoutSubmit();
    } else {
      // Go to checkout form
      switchView('view-checkout');
    }
  });

  // ─── VALIDATION ──────────────────────────────────────
  var validators = {
    'order-name': function(val) {
      if (!val || val.trim().length < 2) return 'Veuillez entrer votre nom';
      return '';
    },
    'order-phone': function(val) {
      var cleaned = val.replace(/[\s\-\.]/g, '');
      if (!cleaned) return 'Veuillez entrer votre numéro';
      var pattern = /^(\+212|0)(5|6|7)\d{8}$/;
      if (!pattern.test(cleaned)) return 'Format : 06XXXXXXXX';
      return '';
    },
    'order-date': function(val) {
      if (!val) return 'Veuillez choisir une date';
      var selected = new Date(val);
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) return 'La date doit être aujourd\'hui ou après';
      return '';
    }
  };

  function validateField(fieldId) {
    var field = document.getElementById(fieldId);
    var errorEl = document.getElementById(fieldId + '-error');
    if (!field || !validators[fieldId]) return true;

    var errorMsg = validators[fieldId](field.value);
    if (errorMsg) {
      field.classList.add('error');
      if (errorEl) {
        errorEl.textContent = errorMsg;
        errorEl.classList.add('visible');
      }
      return false;
    } else {
      field.classList.remove('error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
      return true;
    }
  }

  function validateAllFields() {
    var allValid = true;
    Object.keys(validators).forEach(function(fieldId) {
      if (!validateField(fieldId)) allValid = false;
    });
    return allValid;
  }

  // Real-time validation
  Object.keys(validators).forEach(function(fieldId) {
    var field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', () => validateField(fieldId));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) validateField(fieldId);
      });
    }
  });

  function handleCheckoutSubmit() {
    if (!validateAllFields()) {
      var firstError = document.querySelector('.error');
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Build WA Message
    const name = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const date = document.getElementById('order-date').value;
    const notes = document.getElementById('order-notes').value.trim();
    
    let dateFormatted = '';
    if (date) {
      dateFormatted = new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });
    }

    let msg = 'Bonjour Lartica Bakehouse 👋\n\n';
    msg += '📋 *Nouvelle commande*\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += `👤 Nom : ${name}\n`;
    msg += `📞 Tél : ${phone}\n`;
    if (dateFormatted) msg += `📅 Date : ${dateFormatted}\n`;
    if (notes) msg += `📝 Notes : ${notes}\n`;
    
    msg += '━━━━━━━━━━━━━━━━━━\n📦 *Articles*\n';
    
    let subtotal = 0;
    let hasDevis = false;

    Object.keys(cart).forEach(id => {
      const qty = cart[id];
      const item = ITEMS_DICT[id];
      if (item.surDevis) {
        msg += `🔸 ${qty}x ${item.name} = Sur devis\n`;
        hasDevis = true;
      } else {
        const line = qty * item.price;
        subtotal += line;
        msg += `🔸 ${qty}x ${item.name} = ${line} DH\n`;
      }
    });

    msg += '━━━━━━━━━━━━━━━━━━\n';
    if (subtotal > 0 && hasDevis) {
      msg += `*Total estimé : ${subtotal} DH + devis final*\n`;
    } else if (hasDevis) {
      msg += `*Total : Sur devis*\n`;
    } else {
      msg += `*Total : ${subtotal} DH*\n`;
    }
    
    msg += '\nMerci de confirmer la disponibilité ! 🙏';

    const waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    window.open(waUrl, '_blank', 'noopener');
  }

  // ─── MODAL OPEN/CLOSE LOGIC ───────────────────────────
  function openModal(productHint) {
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // Attempt auto-routing to category view if a specific product was clicked from a button
    switchView('view-categories');

    // Simple routing logic to open the correct category based on the hint text
    if (productHint) {
      const hint = productHint.toLowerCase();
      let matchedCat = null;
      if (hint.includes('croissant') || hint.includes('box')) {
        matchedCat = 'formules'; // Quick fix: "Box" was in formules
        if (hint.includes('croissant')) matchedCat = 'viennoiseries';
      } else if (hint.includes('marocain') || hint.includes('plateau')) {
        matchedCat = 'marocains';
      } else if (hint.includes('mariage') || hint.includes('gâteaux')) {
        matchedCat = 'formules';
      }
      
      if (matchedCat) {
        renderProductList(matchedCat);
        switchView('view-products');
        
        // Auto-increment standard hint if exact item exists (Optional enhancement)
        // ... (Skipping complex matching for simplicity, users will manually pick)
      }
    }
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  document.querySelectorAll('[data-open-order]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var product = this.getAttribute('data-product') || '';
      openModal(product);
    });
  });

  // Set minimum date to today
  const dateInput = document.getElementById('order-date');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.setAttribute('min', yyyy + '-' + mm + '-' + dd);
  }

  // Prevent form default submit in checkout
  document.getElementById('order-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCheckoutSubmit();
  });

  window.openOrderModal = openModal;

})();
