#!/usr/bin/env node
/** Export the static home page as a portable, offline HTML file. */
import { readFile, writeFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildRoot = await realpath(path.resolve(process.argv[2] || path.join(projectRoot, 'dist')));
const output = path.resolve(process.argv[3] || '/workspace/doce-pe-peknin-abrir.html');
const warnings = new Set();
let embedded = 0;
const types = {
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
};
const isRemote = value => /^(?:https?:)?\/\//i.test(value);
const isInline = value => /^(?:data:|blob:|#)/i.test(value);
async function replaceAsync(value, regex, replacer) {
  const matches = [...value.matchAll(regex)];
  const replacements = await Promise.all(matches.map(match => replacer(...match)));
  let index = 0;
  return value.replace(regex, () => replacements[index++]);
}
async function localFile(url, parent = path.join(buildRoot, 'index.html')) {
  if (isRemote(url)) throw new Error(`Asset remoto não é portátil: ${url}`);
  const clean = decodeURIComponent(url.split(/[?#]/)[0]);
  const candidate = path.resolve(clean.startsWith('/') ? buildRoot : path.dirname(parent), '.' + (clean.startsWith('/') ? clean : '/' + clean));
  const resolved = await realpath(candidate);
  if (!resolved.startsWith(buildRoot + path.sep)) throw new Error(`Asset fora do build: ${url}`);
  return resolved;
}
async function dataUrl(url, parent) {
  if (isInline(url)) return url;
  const file = await localFile(url, parent);
  embedded++;
  return `data:${types[path.extname(file)] || 'application/octet-stream'};base64,${(await readFile(file)).toString('base64')}`;
}
async function cssContents(text, parent) {
  // A multi-megabyte data URI exceeds Chromium's custom-property value limit.
  // Expand asset variables before embedding so the image URL is used directly.
  const assetVariables = [...text.matchAll(/(--[\w-]+)\s*:\s*(url\(\s*(?:"[^"]*"|'[^']*'|[^'")]*?)\s*\))\s*;/g)];
  for (const [declaration, name, value] of assetVariables) {
    const use = new RegExp(`var\\(\\s*${name}\\s*\\)`, 'g');
    if (use.test(text)) text = text.replace(declaration, '').replace(use, value);
  }

  text = await replaceAsync(text, /@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?\s*;/gi, async (_all, url) => {
    if (isRemote(url)) {
      warnings.add(`Fonte/estilo remoto omitido na cópia offline: ${url}`);
      return '';
    }
    const file = await localFile(url, parent);
    return cssContents(await readFile(file, 'utf8'), file);
  });
  return replaceAsync(text, /url\(\s*(?:"([^"]*)"|'([^']*)'|([^'")]*))\s*\)/gi, async (all, doubleQuoted, singleQuoted, unquoted) => {
    const url = doubleQuoted ?? singleQuoted ?? unquoted;
    if (isInline(url)) return all;
    return `url("${await dataUrl(url, parent)}")`;
  });
}
async function scriptContents(js, parent) {
  // Product images are also assigned dynamically by the product dialog and bag.
  // Embed only quoted local image paths; contact URLs and ordinary strings stay intact.
  return replaceAsync(js, /(["'`])((?:\.{0,2}\/)[^"'`\r\n]*?\.(?:avif|webp|png|jpe?g|gif|svg|ico)(?:[?#][^"'`\r\n]*)?)\1/gi,
    async (all, quote, url) => {
      if (url.includes('${')) return all;
      return `${quote}${await dataUrl(url, parent)}${quote}`;
    });
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1];
}
let html = await readFile(path.join(buildRoot, 'index.html'), 'utf8');
// Stylesheets need their own original directory for resolving fonts and images.
html = await replaceAsync(html, /<link\b[^>]*>/gi, async tag => {
  const rel = attr(tag, 'rel');
  const href = attr(tag, 'href');
  if (!href) return tag;
  if (['preconnect', 'dns-prefetch', 'modulepreload', 'preload'].includes(rel)) return '';
  if (rel === 'stylesheet') {
    if (isRemote(href)) {
      warnings.add(`Estilo remoto omitido na cópia offline: ${href}`);
      return '';
    }
    const file = await localFile(href);
    return `<style>${await cssContents(await readFile(file, 'utf8'), file)}</style>`;
  }
  if (rel?.includes('icon')) return tag.replace(href, await dataUrl(href));
  return tag;
});
html = await replaceAsync(html, /<style\b([^>]*)>([\s\S]*?)<\/style>/gi, async (_all, attrs, contents) => `<style${attrs}>${await cssContents(contents, path.join(buildRoot, 'index.html'))}</style>`);
html = await replaceAsync(html, /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, async (_all, attrs, contents) => {
  const src = attr(attrs, 'src');
  const file = src ? await localFile(src) : path.join(buildRoot, 'index.html');
  const js = src ? await readFile(file, 'utf8') : contents;
  if (src && /\b(?:import|export)\s*(?:[^;]*?from\s*)?["']|\bimport\s*\(/.test(js)) {
    throw new Error('Script com imports exige um bundle único antes da exportação: ' + src);
  }
  const portableJs = await scriptContents(js, file);
  return `<script${attrs.replace(/\s*src\s*=\s*["'][^"']+["']/i, '')}>${portableJs.replace(/<\/script/gi, '<\\/script')}</script>`;
});
html = await replaceAsync(html, /<(?:img|source|video|audio|input)\b[^>]*>/gi, async tag => {
  tag = await replaceAsync(tag, /\b(src|poster)\s*=\s*(["'])(.*?)\2/gi, async (_all, name, quote, value) => `${name}=${quote}${await dataUrl(value)}${quote}`);
  return replaceAsync(tag, /\bsrcset\s*=\s*(["'])(.*?)\1/gi, async (_all, quote, value) => {
    const sources = await Promise.all(value.split(',').map(async source => {
      const [url, ...descriptors] = source.trim().split(/\s+/);
      return [await dataUrl(url), ...descriptors].join(' ');
    }));
    return `srcset=${quote}${sources.join(', ')}${quote}`;
  });
});
await writeFile(output, html);
console.log(`HTML portátil gerado: ${output} (${Buffer.byteLength(html)} bytes, ${embedded} assets embutidos)`);
for (const warning of warnings) console.warn(warning);
