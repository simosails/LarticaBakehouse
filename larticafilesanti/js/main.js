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
  const modal = document.getElementById('order-modal');
  const modalClose = document.getElementById('modal-close');
  const orderForm = document.getElementById('order-form');
  const orderSummary = document.getElementById('order-summary');

  // ─── HEADER SHADOW ON SCROLL ─────────────────────────
  let lastScroll = 0;
  window.addEventListener('scroll', function() {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('scrolled', y > 20);
    }
    lastScroll = y;
  }, { passive: true });

  // ─── HAMBURGER TOGGLE ────────────────────────────────
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function() {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
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
    var observer = new IntersectionObserver(function(entries) {
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

  // ─── ORDER MODAL ─────────────────────────────────────
  function openModal(productName) {
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Pre-fill product if provided
    if (productName) {
      var productSelect = document.getElementById('order-product');
      if (productSelect) {
        // Try exact match first, then partial
        var found = false;
        for (var i = 0; i < productSelect.options.length; i++) {
          if (productSelect.options[i].value === productName ||
              productSelect.options[i].text.toLowerCase().includes(productName.toLowerCase())) {
            productSelect.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found && productName) {
          // Set the "other" option and show product name in notes
          var notesEl = document.getElementById('order-notes');
          if (notesEl && !notesEl.value) {
            notesEl.value = 'Produit : ' + productName;
          }
        }
        updateOrderSummary();
      }
    }

    // Focus first input
    setTimeout(function() {
      var firstInput = modal.querySelector('input, select');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Close button
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  // Close on overlay click
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // ─── OPEN MODAL BUTTONS ──────────────────────────────
  document.querySelectorAll('[data-open-order]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var product = this.getAttribute('data-product') || '';
      openModal(product);
    });
  });

  // ─── FORM VALIDATION ─────────────────────────────────
  var validators = {
    'order-name': function(val) {
      if (!val || val.trim().length < 2) return 'Veuillez entrer votre nom (min. 2 caractères)';
      return '';
    },
    'order-phone': function(val) {
      // Accept Moroccan phone numbers: 06/07/05 + 8 digits, or +212...
      var cleaned = val.replace(/[\s\-\.]/g, '');
      if (!cleaned) return 'Veuillez entrer votre numéro de téléphone';
      var pattern = /^(\+212|0)(5|6|7)\d{8}$/;
      if (!pattern.test(cleaned)) return 'Format : 06XXXXXXXX ou +212 6XXXXXXXX';
      return '';
    },
    'order-product': function(val) {
      if (!val) return 'Veuillez sélectionner un produit';
      return '';
    },
    'order-qty': function(val) {
      var n = parseInt(val, 10);
      if (!val || isNaN(n) || n < 1) return 'Quantité minimum : 1';
      if (n > 100) return 'Pour les grosses commandes, contactez-nous directement';
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

  // Real-time validation on blur
  Object.keys(validators).forEach(function(fieldId) {
    var field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('blur', function() {
        validateField(fieldId);
      });
      field.addEventListener('input', function() {
        if (field.classList.contains('error')) {
          validateField(fieldId);
        }
        updateOrderSummary();
      });
      field.addEventListener('change', function() {
        updateOrderSummary();
      });
    }
  });

  // ─── ORDER SUMMARY ──────────────────────────────────
  function updateOrderSummary() {
    if (!orderSummary) return;
    var product = document.getElementById('order-product');
    var qty = document.getElementById('order-qty');
    var date = document.getElementById('order-date');

    if (product && product.value && qty && qty.value) {
      var summaryItems = orderSummary.querySelector('.order-summary-items');
      if (summaryItems) {
        var productText = product.options[product.selectedIndex].text;
        var dateText = date && date.value
          ? new Date(date.value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
          : '—';

        summaryItems.innerHTML =
          '<li><span>Produit</span><span>' + productText + '</span></li>' +
          '<li><span>Quantité</span><span>' + qty.value + '</span></li>' +
          '<li><span>Date</span><span>' + dateText + '</span></li>';
      }
      orderSummary.classList.add('visible');
    } else {
      orderSummary.classList.remove('visible');
    }
  }

  // ─── WHATSAPP MESSAGE BUILDER ────────────────────────
  function buildWhatsAppMessage() {
    var name = (document.getElementById('order-name').value || '').trim();
    var phone = (document.getElementById('order-phone').value || '').trim();
    var productEl = document.getElementById('order-product');
    var product = productEl ? productEl.options[productEl.selectedIndex].text : '';
    var qty = (document.getElementById('order-qty').value || '1');
    var date = document.getElementById('order-date').value || '';
    var notes = (document.getElementById('order-notes').value || '').trim();

    var dateFormatted = '';
    if (date) {
      dateFormatted = new Date(date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    var msg = 'Bonjour Lartica Bakehouse 👋\n\n';
    msg += '📋 *Nouvelle commande*\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '👤 Nom : ' + name + '\n';
    msg += '📞 Tél : ' + phone + '\n';
    msg += '🥐 Produit : ' + product + '\n';
    msg += '📦 Quantité : ' + qty + '\n';
    if (dateFormatted) {
      msg += '📅 Date souhaitée : ' + dateFormatted + '\n';
    }
    if (notes) {
      msg += '📝 Notes : ' + notes + '\n';
    }
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += 'Merci de confirmer la disponibilité ! 🙏';

    return msg;
  }

  // ─── FORM SUBMIT → WHATSAPP ──────────────────────────
  if (orderForm) {
    orderForm.addEventListener('submit', function(e) {
      e.preventDefault();

      if (!validateAllFields()) {
        // Scroll to first error
        var firstError = orderForm.querySelector('.error');
        if (firstError) {
          firstError.focus();
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      var message = buildWhatsAppMessage();
      var waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
      window.open(waUrl, '_blank', 'noopener');
    });
  }

  // ─── SET MINIMUM DATE TO TODAY ───────────────────────
  var dateInput = document.getElementById('order-date');
  if (dateInput) {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    dateInput.setAttribute('min', yyyy + '-' + mm + '-' + dd);
  }

  // ─── SMOOTH SCROLL FOR ANCHOR LINKS ──────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
        var top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ─── STICKY CTA VISIBILITY ──────────────────────────
  // Show sticky CTA only after scrolling past hero
  var stickyCta = document.querySelector('.sticky-cta');
  var heroSection = document.getElementById('hero');
  if (stickyCta && heroSection) {
    var stickyObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        stickyCta.style.display = e.isIntersecting ? 'none' : '';
      });
    }, { threshold: 0 });
    stickyObserver.observe(heroSection);
  }

  // ─── EXPOSE openModal GLOBALLY ───────────────────────
  window.openOrderModal = openModal;

})();
