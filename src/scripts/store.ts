import { products, whatsapp } from '../data/products';

type Selection = { id: string; quantity: number };
const storageKey = 'doce-pe-peknin-sacola-v1';
const selection = new Map<string, number>();
const bag = document.querySelector<HTMLDialogElement>('#bag-dialog')!;
const detail = document.querySelector<HTMLDialogElement>('#product-dialog')!;
const bagToggle = document.querySelector<HTMLButtonElement>('.bag-toggle')!;
const sendOrder = document.querySelector<HTMLAnchorElement>('#send-order')!;
const toast = document.querySelector<HTMLElement>('#toast')!;
let toastTimer: ReturnType<typeof setTimeout>;
let detailId = '';

// No personal information is collected. Browsers that deny storage still work.
try {
  const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) {
    for (const item of saved) {
      if (item && products.some(product => product.id === item.id) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20) {
        selection.set(item.id, item.quantity);
      }
    }
  }
} catch { /* An unavailable or invalid local cache is safe to ignore. */ }

function save() {
  try {
    const items: Selection[] = [...selection].map(([id, quantity]) => ({ id, quantity }));
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch { /* Keep the current page fully usable without browser storage. */ }
}

function openBag() {
  if (detail.open) detail.close();
  if (!bag.open) bag.showModal();
  bagToggle.setAttribute('aria-expanded', 'true');
  toast.classList.remove('show');
}

function button(label: string, action: () => void, className = '') {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  element.className = className;
  element.addEventListener('click', action);
  return element;
}

function renderBag() {
  let total = 0;
  const list = document.querySelector<HTMLUListElement>('#bag-items')!;
  list.replaceChildren();
  const orderItems: string[] = [];
  for (const [id, quantity] of selection) {
    const product = products.find(item => item.id === id)!;
    total += quantity;
    orderItems.push(`${quantity}x ${product.name} (${product.color})`);
    const item = document.createElement('li');
    const image = document.createElement('span');
    image.className = `shoe-image bag-thumb shoe-${id}`;
    image.setAttribute('role', 'img');
    image.setAttribute('aria-label', `Imagem ilustrativa de ${product.name}`);
    const content = document.createElement('div');
    content.className = 'bag-item-copy';
    const name = document.createElement('span');
    name.className = 'bag-item-name';
    name.textContent = product.name;
    const color = document.createElement('span');
    color.className = 'bag-item-color';
    color.textContent = product.color;
    const controls = document.createElement('div');
    controls.className = 'bag-item-controls';
    const quantities = document.createElement('div');
    quantities.className = 'quantity-controls';
    const decrease = button('−', () => updateQuantity(id, quantity - 1));
    decrease.setAttribute('aria-label', `Diminuir quantidade de ${product.name}`);
    const output = document.createElement('output');
    output.textContent = String(quantity);
    output.setAttribute('aria-label', `Quantidade de ${product.name}`);
    const increase = button('+', () => updateQuantity(id, quantity + 1));
    increase.setAttribute('aria-label', `Aumentar quantidade de ${product.name}`);
    increase.disabled = quantity >= 20;
    quantities.append(decrease, output, increase);
    const remove = button('Remover', () => updateQuantity(id, 0), 'remove-item');
    remove.setAttribute('aria-label', `Remover ${product.name}`);
    controls.append(quantities, remove);
    content.append(name, color, controls);
    item.append(image, content);
    list.append(item);
  }
  document.querySelector('#bag-count')!.textContent = String(total);
  document.querySelector<HTMLElement>('#empty-bag')!.hidden = total > 0;
  sendOrder.hidden = total === 0;
  sendOrder.href = whatsapp(`Olá! Vim pelo site da Doce Pé Peknin. Gostaria de consultar estas referências do catálogo demonstrativo:\n\n${orderItems.join('\n')}\n\nQuais modelos reais, tamanhos e preços estão disponíveis?`);
}

function updateQuantity(id: string, quantity: number) {
  const focused = document.activeElement;
  const focusedLabel = focused?.getAttribute('aria-label');
  if (quantity <= 0) selection.delete(id);
  else selection.set(id, Math.min(quantity, 20));
  save();
  renderBag();
  // Restore focus after replacing the controls, including when the row disappears.
  if (focusedLabel && bag.open) {
    const replacement = [...bag.querySelectorAll<HTMLButtonElement>('button')].find(element => element.getAttribute('aria-label') === focusedLabel);
    (replacement || bag.querySelector<HTMLButtonElement>('.dialog-close'))?.focus();
  }
}

function addProduct(id: string) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const quantity = selection.get(id) || 0;
  if (quantity >= 20) return;
  updateQuantity(id, quantity + 1);
  toast.replaceChildren();
  const message = document.createElement('span');
  message.textContent = `${product.name} na sacola.`;
  const view = button('Ver sacola →', openBag);
  toast.append(message, view);
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
}

function filterBy(category: string) {
  document.querySelectorAll<HTMLButtonElement>('.filter').forEach(element => {
    const active = element.dataset.category === category;
    element.classList.toggle('active', active);
    element.setAttribute('aria-pressed', String(active));
  });
  let count = 0;
  document.querySelectorAll<HTMLElement>('.product').forEach(card => {
    card.hidden = category !== 'Todos' && card.dataset.category !== category;
    if (!card.hidden) count++;
  });
  document.querySelector('#result-count')!.textContent = String(count);
}

function viewProduct(id: string) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  detailId = id;
  document.querySelector('#detail-name')!.textContent = product.name;
  document.querySelector('#detail-category')!.textContent = product.category;
  document.querySelector('#detail-color')!.textContent = product.color;
  const photo = document.querySelector<HTMLElement>('#detail-photo')!;
  photo.className = `shoe-image shoe-${id}`;
  photo.setAttribute('aria-label', `Imagem ilustrativa de ${product.name}`);
  if (!detail.open) detail.showModal();
}

document.querySelectorAll<HTMLButtonElement>('[data-id]').forEach(element => element.addEventListener('click', () => addProduct(element.dataset.id!)));
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(element => element.addEventListener('click', () => viewProduct(element.dataset.view!)));
document.querySelectorAll<HTMLButtonElement>('.filter').forEach(element => element.addEventListener('click', () => filterBy(element.dataset.category!)));
document.querySelectorAll<HTMLAnchorElement>('[data-category-link]').forEach(element => element.addEventListener('click', () => filterBy(element.dataset.categoryLink!)));
document.querySelector('#detail-add')!.addEventListener('click', () => { addProduct(detailId); detail.close(); });
document.querySelector('#detail-open-bag')!.addEventListener('click', openBag);
bagToggle.addEventListener('click', openBag);
bag.addEventListener('close', () => bagToggle.setAttribute('aria-expanded', 'false'));
document.querySelector('#back-to-products')!.addEventListener('click', () => { bag.close(); document.querySelector('#colecao')!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
document.querySelectorAll<HTMLButtonElement>('[data-close]').forEach(element => element.addEventListener('click', () => document.querySelector<HTMLDialogElement>(`#${element.dataset.close}`)!.close()));
for (const dialog of [bag, detail]) {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}
renderBag();
