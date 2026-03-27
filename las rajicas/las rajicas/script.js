/*
  Las Rajicas — Interacciones premium (JS ligero)
  - Navbar: sombra al hacer scroll
  - Menú móvil: accesible, cierre al navegar, bloqueo de scroll
  - Reveal: animación sutil al aparecer secciones
  - Galería: lightbox con cierre por ESC/click
  - Form: validación mínima + feedback (front-end)
*/

(() => {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  // Año footer
  const yearEl = qs("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Header shadow on scroll
  const header = qs("[data-header]");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu toggle (accessible)
  const menu = qs("[data-menu]");
  const toggle = qs("[data-menu-toggle]");
  const body = document.body;

  const setMenuOpen = (open) => {
    if (!menu || !toggle) return;
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    body.classList.toggle("is-menu-open", open);

    // Simple scroll lock without layout shift
    if (open) {
      const scrollBarComp = window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      body.style.paddingRight = scrollBarComp > 0 ? `${scrollBarComp}px` : "";
    } else {
      body.style.overflow = "";
      body.style.paddingRight = "";
    }
  };

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = !menu.classList.contains("is-open");
      setMenuOpen(open);
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("is-open")) return;
      const t = e.target;
      if (!(t instanceof Node)) return;
      const clickedInside = menu.contains(t) || toggle.contains(t);
      if (!clickedInside) setMenuOpen(false);
    });

    // Close on ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setMenuOpen(false);
        toggle.focus();
      }
    });

    // Close after clicking a nav link (and keep the scroll smooth)
    qsa("a[href^=\"#\"]", menu).forEach((a) => {
      a.addEventListener("click", () => setMenuOpen(false));
    });
  }

  // Reveal on scroll
  const revealEls = qsa("[data-reveal]");
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target).classList.add("is-revealed");
          io.unobserve(entry.target);
        }
      },
      { root: null, threshold: 0.14 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  // Smoothly route "Reservar" CTAs (keeps URL clean, nudges intent)
  qsa("[data-reserve-cta]").forEach((cta) => {
    cta.addEventListener("click", () => {
      // Hook for analytics later (no-op now)
    });
  });

  // Gallery lightbox
  const lightbox = qs("[data-lightbox]");
  const lbImg = qs("[data-lightbox-img]");
  const lbClose = qsa("[data-lightbox-close]");
  const galleryBtns = qsa("[data-gallery-item]");

  let lastFocused = null;

  const openLightbox = (src, alt) => {
    if (!lightbox || !lbImg) return;
    lastFocused = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || "Imagen ampliada";
    lightbox.hidden = false;
    body.style.overflow = "hidden";
    // Focus close button for accessibility
    const closeBtn = qs("[data-lightbox-close]");
    if (closeBtn) closeBtn.focus();
  };

  const closeLightbox = () => {
    if (!lightbox || !lbImg) return;
    lightbox.hidden = true;
    lbImg.src = "";
    body.style.overflow = "";
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  // Hard reset on load (evita que aparezca borroso al abrir el HTML)
  if (lightbox && lbImg) {
    closeLightbox();
  }

  if (galleryBtns.length && lightbox && lbImg) {
    galleryBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const src = btn.getAttribute("data-src") || "";
        const img = qs("img", btn);
        const alt = img?.getAttribute("alt") || "Imagen de la galería";
        if (src) openLightbox(src, alt);
      });
    });

    lbClose.forEach((el) => el.addEventListener("click", closeLightbox));
    document.addEventListener("keydown", (e) => {
      if (!lightbox || lightbox.hidden) return;
      if (e.key === "Escape") closeLightbox();
    });
  }

  // Contact form (front-end only)
  const form = qs("[data-contact-form]");
  const status = qs("[data-form-status]");

  const setInvalid = (fieldEl, invalid) => {
    const wrapper = fieldEl.closest(".field");
    if (!wrapper) return;
    wrapper.classList.toggle("is-invalid", invalid);
  };

  if (form instanceof HTMLFormElement) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (status) status.textContent = "";

      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const message = String(fd.get("message") || "").trim();

      const nameInput = qs("input[name=\"name\"]", form);
      const emailInput = qs("input[name=\"email\"]", form);
      const msgInput = qs("textarea[name=\"message\"]", form);

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
      const nameOk = name.length >= 2;
      const msgOk = message.length >= 12;

      if (nameInput) setInvalid(nameInput, !nameOk);
      if (emailInput) setInvalid(emailInput, !emailOk);
      if (msgInput) setInvalid(msgInput, !msgOk);

      if (!nameOk || !emailOk || !msgOk) {
        if (status) status.textContent = "Revisa los campos marcados (nombre, email y mensaje).";
        return;
      }

      // Aquí integrarías tu backend / email service (Formspree, Netlify Forms, etc.)
      form.reset();
      if (status) status.textContent = "Mensaje enviado. Te responderemos lo antes posible.";
    });

    // Limpia el estado de error al editar
    qsa("input, textarea", form).forEach((el) => {
      el.addEventListener("input", () => setInvalid(el, false));
    });
  }
})();

