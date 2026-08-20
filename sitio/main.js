// AIUTO — comportamiento del sitio estático.

/* ---------- menú móvil: toggle accesible, Escape y clic fuera ---------- */
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-nav-toggle]');
  const nav = document.querySelector('.nav');
  if (t) {
    const open = nav.dataset.open !== 'true';
    nav.dataset.open = open ? 'true' : 'false';
    t.setAttribute('aria-expanded', open ? 'true' : 'false');
    t.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  } else if (nav && nav.dataset.open === 'true' && !e.target.closest('.nav')) {
    nav.dataset.open = 'false';
    nav.querySelector('[data-nav-toggle]')?.setAttribute('aria-expanded', 'false');
  }
  const apply = e.target.closest('[data-apply]');
  if (apply && !apply.disabled) {
    apply.dataset.state = 'applied'; apply.textContent = 'Aplicada ✓'; apply.disabled = true;
    apply.closest('.job').dataset.state = 'applied';
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const nav = document.querySelector('.nav[data-open="true"]');
  if (nav) {
    nav.dataset.open = 'false';
    const t = nav.querySelector('[data-nav-toggle]');
    t?.setAttribute('aria-expanded', 'false'); t?.focus();
  }
});

/* ---------- formularios: validación en cliente + honeypot; el envío sigue simulado ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const fieldError = (input, msg) => {
  const field = input.closest('.field'); if (!field) return;
  clearError(input);
  const id = 'err-' + (input.name || Math.random().toString(36).slice(2));
  const err = document.createElement('span');
  err.className = 'error'; err.id = id;
  err.innerHTML = '<span class="dia"></span>' + msg;
  field.appendChild(err);
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', id);
};
const clearError = (input) => {
  input.removeAttribute('aria-invalid');
  const field = input.closest('.field');
  field?.querySelector('.error')?.remove();
};
const validate = (form) => {
  let first = null;
  form.querySelectorAll('.input').forEach((input) => {
    clearError(input);
    const v = input.value.trim();
    if (input.required && !v) { fieldError(input, 'Este campo es obligatorio.'); first = first || input; }
    else if (input.type === 'email' && v && !EMAIL_RE.test(v)) {
      fieldError(input, 'Ingresa un correo válido, por ejemplo nombre@empresa.com');
      first = first || input;
    }
  });
  if (first) first.focus();
  return !first;
};
document.querySelectorAll('form[data-mock-submit]').forEach((form) => {
  form.setAttribute('novalidate', '');
  form.addEventListener('input', (e) => { if (e.target.matches('.input')) clearError(e.target); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (form.querySelector('input[name="_hp"]')?.value) return; // honeypot
    if (!validate(form)) return;
    const btn = form.querySelector('button[type="submit"]');
    const ok = form.querySelector('[data-success]');
    const label = btn.textContent;
    btn.innerHTML = '<span class="spinner"></span>Enviando…'; btn.disabled = true;
    setTimeout(() => {
      btn.disabled = false; btn.textContent = 'Solicitud enviada ✓';
      if (ok) { ok.hidden = false; }
      if (form.dataset.mockSubmit === 'replace') { form.hidden = true; const p = form.parentElement.querySelector('[data-success-panel]'); if (p) p.hidden = false; }
      setTimeout(() => { btn.textContent = label; }, 4000);
    }, 900);
  });
});

/* ---------- bolsa de trabajo: búsqueda + filtros por select ---------- */
const q = document.querySelector('[data-job-search]');
if (q) {
  const rows = [...document.querySelectorAll('.job')];
  const selects = [...document.querySelectorAll('[data-job-filter]')];
  const count = document.querySelector('[data-job-count]');
  const empty = document.querySelector('[data-job-empty]');
  const run = () => {
    const terms = [q.value.trim().toLowerCase()];
    selects.forEach((s) => { if (s.selectedIndex > 0) terms.push(s.value.toLowerCase()); });
    let n = 0;
    rows.forEach((r) => {
      const hit = terms.every((t) => !t || r.dataset.search.includes(t));
      r.hidden = !hit; if (hit) n++;
    });
    if (count) count.textContent = n + (n === 1 ? ' vacante' : ' vacantes');
    if (empty) empty.hidden = n > 0;
    document.querySelector('.jobs__head').hidden = n === 0;
  };
  q.addEventListener('input', run);
  selects.forEach((s) => s.addEventListener('change', run));
  document.querySelector('[data-job-run]')?.addEventListener('click', run);
  document.querySelectorAll('[data-clear-search]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault(); q.value = ''; selects.forEach((s) => { s.selectedIndex = 0; }); run();
  }));
}

/* ---------- plantilla maestra de categoría: ?cat=slug pinta color, nombre, icono y servicios ---------- */
if (document.body.dataset.page === 'categoria') {
  const paint = (cats) => {
    const slug = new URLSearchParams(location.search).get('cat') || cats[0].slug;
    const c = cats.find(x => x.slug === slug) || cats[0];
    const r = document.documentElement.style;
    r.setProperty('--cat', c.color); r.setProperty('--cat-dark', c.dark); r.setProperty('--cat-tint', c.tint);
    document.title = c.name + ' · AIUTO';
    document.querySelector('[data-cat-name]').textContent = c.name;
    document.querySelector('[data-cat-prop]').textContent = c.prop;
    document.querySelector('[data-cat-icon] path').setAttribute('d', c.icon);
    document.querySelector('[data-cat-services]').innerHTML = c.services
      .map(s => '<div><span class="dia" style="background:var(--cat)"></span><span style="font-size:16.5px;font-weight:500">' + s + '</span></div>').join('');
    document.querySelector('[data-cat-chips]').innerHTML = cats
      .map(x => '<a class="chip" href="categoria.html?cat=' + x.slug + '"' + (x.slug === c.slug ? ' aria-current="true"' : '') + '>' + x.short + '</a>').join('');
  };
  if (window.AIUTO_CATS) paint(window.AIUTO_CATS);
  else fetch('categorias.json').then(r => r.json()).then(paint);
}

/* ---------- entrada suave de secciones (respeta prefers-reduced-motion) ---------- */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('main > section');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((s) => { s.classList.add('reveal'); io.observe(s); });
})();
