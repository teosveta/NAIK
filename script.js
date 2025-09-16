// Navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav-list');
if (navToggle && navList) {
  navToggle.addEventListener('click', () => navList.classList.toggle('is-open'));
}

// Smooth close nav on link click (mobile)
document.querySelectorAll('.nav-list a').forEach(a => {
  a.addEventListener('click', () => navList && navList.classList.remove('is-open'));
});

// Service modals
const modalMap = new Map();
document.querySelectorAll('dialog.modal').forEach(d => modalMap.set(d.id, d));
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('click', () => {
    const id = card.getAttribute('data-modal');
    const modal = modalMap.get(id);
    if (modal && typeof modal.showModal === 'function') {
      modal.showModal();
    }
  });
});
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const dialog = e.target.closest('dialog');
    if (dialog) dialog.close();
  });
});

// Pricing wizard
const form = document.getElementById('priceForm');
const steps = Array.from(document.querySelectorAll('.wizard .step'));
const progressBar = document.getElementById('progressBar');
const calcBtn = document.getElementById('calcPrice');
const priceMinEl = document.getElementById('priceMin');
const priceMaxEl = document.getElementById('priceMax');

let currentStepIndex = 0;

function setStep(index) {
  steps.forEach((s, i) => s.classList.toggle('is-active', i === index));
  currentStepIndex = index;
  const pct = Math.round(((index + 1) / steps.length) * 100);
  if (progressBar) progressBar.style.width = `${pct}%`;
}

function nextStep() {
  // validate required fields in current step
  const active = steps[currentStepIndex];
  const requiredInputs = Array.from(active.querySelectorAll('input[required], select[required], textarea[required]'));
  let valid = true;
  requiredInputs.forEach(el => {
    if (!el.value || (el.type === 'number' && el.value < 0)) {
      el.classList.add('is-invalid');
      valid = false;
    } else {
      el.classList.remove('is-invalid');
    }
  });
  if (!valid) {
    active.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (currentStepIndex < steps.length - 1) setStep(currentStepIndex + 1);
}

function prevStep() {
  if (currentStepIndex > 0) setStep(currentStepIndex - 1);
}

document.querySelectorAll('.wizard .next').forEach(btn => btn.addEventListener('click', nextStep));
document.querySelectorAll('.wizard .prev').forEach(btn => btn.addEventListener('click', prevStep));

function computePriceRange(data) {
  // Base by invoices volume
  const baseByInvoices = {
    '0-100': 180,
    '101-300': 300,
    '301-600': 520,
    '601-900': 780,
    '900+': 1100
  }[data.invoices] || 200;

  let price = baseByInvoices;

  // VAT surcharge
  if (data.vat === 'Да') price += 80;
  // OSS surcharge
  if (data.oss === 'Да') price += 90;
  // Staff
  const staffCount = Number(data.staffCount || 0);
  if (data.staffType && data.staffType !== 'Няма') price += 40 + staffCount * 25;
  // Bank accounts
  price += Math.max(0, Number(data.bankAccounts || 0) - 1) * 20;
  // POS and stores
  price += Number(data.posCount || 0) * 15;
  price += Number(data.stores || 0) * 25;
  // Addons
  if (Array.isArray(data.addons)) {
    data.addons.forEach(a => {
      if (a === 'yearEnd') price += 120;
      if (a === 'gfr') price += 150;
      if (a === 'taxConsult') price += 80;
      if (a === 'admin') price += 60;
    });
  }

  const min = Math.round(price * 0.9);
  const max = Math.round(price * 1.15);
  return { min, max };
}

calcBtn?.addEventListener('click', () => {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  // gather checkboxes
  const addons = [];
  form.querySelectorAll('input[name="addons"]:checked').forEach(cb => addons.push(cb.value));
  data.addons = addons;
  const { min, max } = computePriceRange(data);
  priceMinEl.textContent = min.toString();
  priceMaxEl.textContent = max.toString();
});

// Submit contact and price forms via mailto fallback
function buildMailto(subject, body) {
  const to = 'naik_vkp_ood@abv.bg';
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const lines = [];
  fd.forEach((v, k) => lines.push(`${k}: ${v}`));
  const addons = Array.from(form.querySelectorAll('input[name="addons"]:checked')).map(cb => cb.value).join(', ');
  if (addons) lines.push(`addons: ${addons}`);
  const pr = `Ориентировъчна цена: ${priceMinEl.textContent} - ${priceMaxEl.textContent} лв./месец`;
  const href = buildMailto('Запитване от калкулатора — НАЙК', lines.concat('', pr).join('\n'));
  window.location.href = href;
});

const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(contactForm);
  const body = [`Име: ${fd.get('name')}`, `Контакт: ${fd.get('contact')}`, '', `Съобщение:`, `${fd.get('message')}`].join('\n');
  const href = buildMailto('Онлайн запитване — НАЙК', body);
  window.location.href = href;
});

// Year in footer
document.getElementById('year').textContent = new Date().getFullYear().toString();

