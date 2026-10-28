import { test, expect, type Page } from '@playwright/test';
import products from '../public/catalogo/products.json' with { type: 'json' };

const categories = [...new Set(products.map(product => product.category))];
const firstProduct = products[0]!;
const sandal = products.find(product => product.category === 'Sandálias baby')!;

function card(page: Page, id: string) {
  return page.locator(`.product:has([data-id="${id}"])`);
}

function orderMessage(href: string | null) {
  expect(href).not.toBeNull();
  const url = new URL(href!);
  expect(url.origin).toBe('https://wa.me');
  expect(url.pathname).toBe('/5511942756602');
  return url.searchParams.get('text') || '';
}

test('catálogo real, filtros e consulta de referência pelo WhatsApp', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Doce Pé/);
  await expect(page.locator('.product:visible')).toHaveCount(products.length);

  for (const category of categories) {
    const filter = page.locator(`.filter[data-category="${category}"]`);
    await filter.click();
    await expect(filter).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.product:visible')).toHaveCount(
      products.filter(product => product.category === category).length,
    );
  }

  await page.locator('.filter[data-category="Sandálias baby"]').click();
  await expect(card(page, sandal.id)).toBeVisible();
  await card(page, sandal.id).locator(`[data-id="${sandal.id}"]`).click();
  await page.getByRole('button', { name: 'Abrir sacola', exact: true }).click();

  const bag = page.locator('#bag-dialog');
  await expect(bag).toBeVisible();
  const order = bag.locator('#send-order');
  await expect(order).toBeVisible();
  const message = orderMessage(await order.getAttribute('href'));
  expect(message).toContain(sandal.reference);
  expect(message).toContain(sandal.color);
  expect(message).toContain(sandal.name);

  await bag.getByRole('button', { name: `Remover ${sandal.name}`, exact: true }).click();
  await expect(order).toBeHidden();
  await expect(bag.locator('#empty-bag')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(bag).toBeHidden();
  await expect(page.getByRole('button', { name: 'Abrir sacola', exact: true })).toHaveAttribute('aria-expanded', 'false');
});

test('detalhes do catálogo, quantidades e sacola preservada após recarga', async ({ page }) => {
  await page.goto('/');
  await card(page, firstProduct.id).locator('[data-view]').first().click();
  const detail = page.locator('#product-dialog');
  await expect(detail).toBeVisible();
  await expect(detail.locator('#detail-name')).toHaveText(firstProduct.name);
  await expect(detail.locator('#detail-reference')).toContainText(firstProduct.reference);
  await expect(detail.locator('#detail-sizes')).toContainText(firstProduct.sizes);
  await detail.getByRole('button', { name: 'Adicionar à sacola' }).click();
  await expect(detail).toBeHidden();

  await page.reload();
  await expect(page.locator('#bag-count')).toHaveText('1');
  await page.getByRole('button', { name: 'Abrir sacola', exact: true }).click();
  const bag = page.locator('#bag-dialog');
  await expect(bag).toContainText(firstProduct.name);
  await bag.getByRole('button', { name: `Aumentar quantidade de ${firstProduct.name}`, exact: true }).click();
  await expect(bag.getByLabel(`Quantidade de ${firstProduct.name}`, { exact: true })).toHaveText('2');
  await expect(page.locator('#bag-count')).toHaveText('2');
  const message = orderMessage(await bag.locator('#send-order').getAttribute('href'));
  expect(message).toContain('2x');
  expect(message).toContain(firstProduct.reference);
  expect(message).toContain(firstProduct.color);

  await bag.getByRole('button', { name: `Diminuir quantidade de ${firstProduct.name}`, exact: true }).click();
  await expect(page.locator('#bag-count')).toHaveText('1');
});

test('busca por referência, combinação com categoria e estado sem resultados', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Buscar no catálogo', exact: true });
  await search.fill(firstProduct.reference);
  await expect(page.locator('.product:visible')).toHaveCount(1);
  await expect(card(page, firstProduct.id)).toBeVisible();

  const otherCategory = categories.find(category => category !== firstProduct.category)!;
  await page.locator(`.filter[data-category="${otherCategory}"]`).click();
  await expect(page.locator('.product:visible')).toHaveCount(0);
  await expect(page.locator('#no-results')).toBeVisible();

  await page.locator(`.filter[data-category="${firstProduct.category}"]`).click();
  await expect(page.locator('.product:visible')).toHaveCount(1);
  await expect(page.locator('#no-results')).toBeHidden();
  await search.fill('referencia-inexistente-0000');
  await expect(page.locator('.product:visible')).toHaveCount(0);
  await expect(page.locator('#no-results')).toBeVisible();

  await search.fill('');
  await expect(page.locator('.product:visible')).toHaveCount(
    products.filter(product => product.category === firstProduct.category).length,
  );
  await page.locator('.filter[data-category="Todos"]').click();
  await expect(page.locator('.product:visible')).toHaveCount(products.length);
  await expect(page.locator('#no-results')).toBeHidden();
});

test('navegação por teclado e links do contato fornecido', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o catálogo', exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Ver coleção', exact: true }).click();
  await expect(page).toHaveURL(/#colecao$/);

  const filter = page.locator(`.filter[data-category="${firstProduct.category}"]`);
  await filter.focus();
  await page.keyboard.press('Enter');
  await expect(filter).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.product:visible')).toHaveCount(
    products.filter(product => product.category === firstProduct.category).length,
  );

  await expect(page.locator('.header-contact')).toHaveAccessibleName(/\S/);
  const whatsappLinks = page.locator('a[href^="https://wa.me/"]');
  expect(await whatsappLinks.count()).toBeGreaterThan(0);
  for (const link of await whatsappLinks.all()) {
    orderMessage(await link.getAttribute('href'));
  }
  await expect(page.locator('a[href="tel:+5511942756602"]:visible').first()).toBeVisible();

  const toggle = page.getByRole('button', { name: 'Abrir sacola', exact: true });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#bag-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#bag-dialog')).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('fotos e fontes locais carregam, sem erros e sem rolagem horizontal no celular', async ({ page }) => {
  const remoteRequests: string[] = [];
  const failedResponses: string[] = [];
  const errors: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && !['localhost', '127.0.0.1'].includes(url.hostname)) {
      remoteRequests.push(request.url());
    }
  });
  page.on('response', response => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/', { waitUntil: 'networkidle' });

  const images = await page.locator('img[src]:not([src=""])').evaluateAll(async elements => {
    return Promise.all(elements.map(async element => {
      const image = element as HTMLImageElement;
      image.loading = 'eager';
      try {
        await image.decode();
        return { src: image.getAttribute('src'), width: image.naturalWidth };
      } catch {
        return { src: image.getAttribute('src'), width: 0 };
      }
    }));
  });
  expect(images.length).toBeGreaterThanOrEqual(products.length);
  expect(images.filter(image => image.width === 0)).toEqual([]);
  await page.evaluate(() => document.fonts.ready);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(remoteRequests).toEqual([]);
  expect(failedResponses).toEqual([]);
  expect(errors).toEqual([]);
});
