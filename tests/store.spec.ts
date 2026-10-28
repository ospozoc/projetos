import {test,expect} from '@playwright/test';
test('catálogo, filtros e consulta pelo WhatsApp',async({page})=>{
 await page.goto('/');
 await expect(page).toHaveTitle(/Doce Pé Peknin/);
 await expect(page.locator('.product:visible')).toHaveCount(4);
 await page.getByRole('button',{name:'Sandálias',exact:true}).click();
 await expect(page.locator('.product:visible')).toHaveCount(1);
 await expect(page.locator('.product:visible h3')).toHaveText('Sandalinha Jardim');
 await page.getByRole('button',{name:'Adicionar Sandalinha Jardim à sacola',exact:true}).click();
 await page.getByRole('button',{name:'Abrir sacola'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 const order=page.getByRole('link',{name:'Consultar pelo WhatsApp'});
 await expect(order).toHaveAttribute('href',/^https:\/\/wa.me\/5511942756602\?text=/);
 expect(decodeURIComponent((await order.getAttribute('href'))!)).toContain('Sandalinha Jardim');
 await page.getByRole('button',{name:'Remover Sandalinha Jardim'}).click();
 await expect(order).toBeHidden();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('links de contato e teclado',async({page})=>{
 await page.goto('/');
 await page.keyboard.press('Tab');
 await expect(page.getByRole('link',{name:'Pular para o catálogo'})).toBeFocused();
 await page.getByRole('link',{name:'Quero ver os modelos'}).click();
 await expect(page).toHaveURL(/#colecao$/);
 await expect(page.getByRole('link',{name:'Chamar no WhatsApp'})).toHaveAttribute('href',/^https:\/\/wa.me\/5511942756602/);
 await expect(page.getByRole('link',{name:'(11) 94275-6602',exact:true})).toHaveAttribute('href','tel:+5511942756602');
});

test('detalhes do modelo e sacola após recarregar', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name:'Ver detalhes de Tênis Nuvem', exact:true}).click();
  const detail = page.getByRole('dialog', {name:'Tênis Nuvem', exact:true});
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('Modelo demonstrativo');
  await detail.getByRole('button', {name:'Adicionar à sacola'}).click();
  await expect(detail).toBeHidden();
  await page.reload();
  await expect(page.locator('#bag-count')).toHaveText('1');
  await page.getByRole('button', {name:'Abrir sacola'}).click();
  await page.getByRole('button', {name:'Aumentar quantidade de Tênis Nuvem',exact:true}).click();
  await expect(page.getByLabel('Quantidade de Tênis Nuvem', {exact:true})).toHaveText('2');
  const href = await page.getByRole('link', {name:'Consultar pelo WhatsApp'}).getAttribute('href');
  expect(decodeURIComponent(href!)).toContain('2x Tênis Nuvem');
  await page.getByRole('button', {name:'Diminuir quantidade de Tênis Nuvem',exact:true}).click();
  await expect(page.locator('#bag-count')).toHaveText('1');
});

test('categorias, perguntas e ausência de dependências externas', async ({page}) => {
  const remoteRequests: string[] = [];
  const errors: string[] = [];
  page.on('request', request => {
    if (!new URL(request.url()).hostname.match(/^(localhost|127\.0\.0\.1)$/)) remoteRequests.push(request.url());
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('link', {name:'Sapatilhas', exact:false}).click();
  await expect(page.locator('.product:visible')).toHaveCount(1);
  await expect(page.locator('.product:visible h3')).toHaveText('Sapatilha Flor');
  await page.getByRole('button', {name:'Todos', exact:true}).click();
  await expect(page.locator('.product:visible')).toHaveCount(4);
  await page.locator('summary').filter({hasText:'Como faço para comprar?'}).click();
  await expect(page.locator('details[open]')).toContainText('A compra é combinada por lá.');
  const sheet = await page.locator('.hero-shoe').evaluate(async element => {
    const src = getComputedStyle(element).backgroundImage.slice(5, -2);
    const image = new Image(); image.src = src;
    await image.decode(); return image.naturalWidth;
  });
  expect(sheet).toBeGreaterThan(1000);
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
