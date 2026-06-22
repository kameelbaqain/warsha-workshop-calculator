const $ = (selector, parent = document) => parent.querySelector(selector);
const list = $('#itemsList');
const template = $('#itemTemplate');
const money = new Intl.NumberFormat('ar-JO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let nextNumber = Number(localStorage.getItem('warshaNextQuote') || 1);
let currentNumber = nextNumber;
let currentQuoteSaved = false;

function jd(value) { return `${money.format(value || 0)} د.أ`; }
function dateToday() { $('#quoteDate').value = new Date().toISOString().slice(0, 10); }
function quoteNumber() { $('#quoteNumber').textContent = `#${String(currentNumber).padStart(4, '0')}`; }
function typeLabel(type) { return ({ window: 'نافذة', door: 'باب', sliding: 'شباك سحاب' })[type]; }
function getValue(el, selector) { return Number($(selector, el).value) || 0; }

function addItem(data = {}) {
  const node = template.content.cloneNode(true);
  const card = $('.item-card', node);
  $('.item-type', card).value = data.type || 'window';
  $('.item-name', card).value = data.name || '';
  $('.item-width', card).value = data.width || 120;
  $('.item-height', card).value = data.height || 120;
  $('.item-qty', card).value = data.qty || 1;
  $('.item-rate', card).value = data.rate || 42;
  card.addEventListener('input', update);
  card.addEventListener('change', update);
  $('.remove-item', card).addEventListener('click', () => { card.remove(); update(); });
  list.append(card);
  update();
}

function calculateItem(card) {
  const width = getValue(card, '.item-width') / 100;
  const height = getValue(card, '.item-height') / 100;
  const qty = getValue(card, '.item-qty');
  const rate = getValue(card, '.item-rate');
  const type = $('.item-type', card).value;
  const area = width * height * qty;
  const perimeter = (width + height) * 2 * qty;
  const panels = type === 'sliding' ? 2 : 1;
  const accessories = qty * (type === 'door' ? 3 : panels * 2);
  const materials = area * rate;
  $('.item-title', card).textContent = $('.item-name', card).value.trim() || typeLabel(type);
  $('.item-area', card).textContent = `${area.toFixed(2)} م²`;
  $('.item-cost', card).textContent = jd(materials);
  return { area, profile: perimeter * 1.1, glass: area * 1.05, accessories, materials };
}

function update() {
  const cards = [...document.querySelectorAll('.item-card')];
  $('#emptyState').style.display = cards.length ? 'none' : 'block';
  const totals = cards.reduce((sum, card) => {
    const item = calculateItem(card);
    Object.keys(sum).forEach(key => sum[key] += item[key]);
    return sum;
  }, { area: 0, profile: 0, glass: 0, accessories: 0, materials: 0 });
  const labour = totals.materials * (Number($('#labourRate').value) || 0) / 100;
  const margin = (totals.materials + labour) * (Number($('#marginRate').value) || 0) / 100;
  $('#materialsTotal').textContent = jd(totals.materials);
  $('#labourTotal').textContent = jd(labour);
  $('#marginTotal').textContent = jd(margin);
  $('#grandTotal').innerHTML = `${money.format(totals.materials + labour + margin)} <small>د.أ</small>`;
  $('#materialsSummary').innerHTML = [
    ['إجمالي المساحة', `${totals.area.toFixed(2)} م²`],
    ['مقاطع ألمنيوم تقريبية', `${totals.profile.toFixed(1)} متر`],
    ['زجاج مطلوب', `${totals.glass.toFixed(2)} م²`],
    ['إكسسوارات', `${Math.ceil(totals.accessories)} قطعة`]
  ].map(([label, value]) => `<div class="material-box"><span>${label}</span><strong>${value}</strong></div>`).join('');
  return { totals, labour, margin };
}

function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2600); }
function saveQuote() {
  const result = update();
  const quote = { id: currentNumber, customer: $('#customerName').value, phone: $('#customerPhone').value, project: $('#projectName').value, date: $('#quoteDate').value, items: [...document.querySelectorAll('.item-card')].map(card => ({ type: $('.item-type', card).value, name: $('.item-name', card).value, width: $('.item-width', card).value, height: $('.item-height', card).value, qty: $('.item-qty', card).value, rate: $('.item-rate', card).value })), result, savedAt: new Date().toISOString() };
  const saved = JSON.parse(localStorage.getItem('warshaQuotes') || '[]').filter(existing => existing.id !== currentNumber); saved.unshift(quote); localStorage.setItem('warshaQuotes', JSON.stringify(saved));
  if (!currentQuoteSaved) { nextNumber = currentNumber + 1; localStorage.setItem('warshaNextQuote', nextNumber); currentQuoteSaved = true; }
  toast('تم حفظ عرض السعر على هذا الجهاز');
}
function newQuote() { if (currentQuoteSaved) { currentNumber = nextNumber; currentQuoteSaved = false; quoteNumber(); } list.innerHTML = ''; $('#customerName').value = ''; $('#customerPhone').value = ''; $('#projectName').value = ''; dateToday(); addItem(); update(); }

$('#addItem').addEventListener('click', () => addItem());
$('#newQuote').addEventListener('click', newQuote);
$('#saveQuote').addEventListener('click', saveQuote);
$('#printQuote').addEventListener('click', () => window.print());
$('#labourRate').addEventListener('input', update); $('#marginRate').addEventListener('input', update);
dateToday(); quoteNumber(); addItem({ name: 'نافذة غرفة المعيشة', width: 180, height: 140, qty: 2, rate: 42 });
