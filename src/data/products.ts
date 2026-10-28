export const phone = '5511942756602';
/** Referências demonstrativas: substituir pelo catálogo aprovado da fábrica. */
export const products = [
  { id: 'nuvem', name: 'Tênis Nuvem', category: 'Tênis', color: 'Rosa & creme', palette: 'pink' },
  { id: 'jardim', name: 'Sandalinha Jardim', category: 'Sandálias', color: 'Verde sálvia', palette: 'sage' },
  { id: 'sol', name: 'Tênis Raio de Sol', category: 'Tênis', color: 'Amarelo & creme', palette: 'yellow' },
  { id: 'flor', name: 'Sapatilha Flor', category: 'Sapatilhas', color: 'Rosa', palette: 'rose' },
];
export const whatsapp = (text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
