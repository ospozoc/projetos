import catalogue from '../../public/catalogo/products.json';

export interface Product {
  id: string;
  reference: string;
  name: string;
  category: string;
  color: string;
  sizes: string;
  image: string;
  page: number;
  brand: string;
}

/** Photos and specifications taken from the supplied July 2026 catalogue. */
export const products: Product[] = catalogue;
export const categories = ['Todos', 'Sapatinhos baby', 'Sapatilhas', 'Sandálias baby', 'Sandálias fashion'];
export const phone = '5511942756602';
export const whatsapp = (text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
export const assetPath = (path: string) => /^(data:|blob:)/.test(path) ? path : `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
