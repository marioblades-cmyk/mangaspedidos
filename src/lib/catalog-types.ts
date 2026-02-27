export interface CatalogItem {
  id: string;
  title: string;
  isbn: string;
  price: number | null;
  category: CatalogCategory;
  reimpresion: boolean;
  lastUpdated: string;
}

export type CatalogCategory =
  | "NOVEDADES"
  | "REIMPRESIONES"
  | "MANGA EN CURSO"
  | "MANGAS YA COMPLETOS"
  | "MANGAS DE TOMO ÚNICO"
  | "COMICS";

export const CATEGORIES: CatalogCategory[] = [
  "NOVEDADES",
  "REIMPRESIONES",
  "MANGA EN CURSO",
  "MANGAS YA COMPLETOS",
  "MANGAS DE TOMO ÚNICO",
  "COMICS",
];

export const CATEGORY_MARKERS: Record<string, CatalogCategory> = {
  "NOVEDADES": "NOVEDADES",
  "REIMPRESIONES": "REIMPRESIONES",
  "MANGAS EN CURSO": "MANGA EN CURSO",
  "MANGA EN CURSO": "MANGA EN CURSO",
  "MANGAS YA COMPLETOS": "MANGAS YA COMPLETOS",
  "MANGAS DE TOMO ÚNICO": "MANGAS DE TOMO ÚNICO",
  "MANGAS DE TOMO UNICO": "MANGAS DE TOMO ÚNICO",
  "COMICS": "COMICS",
};

export interface ImportReport {
  timestamp: string;
  totalRows: number;
  itemsLoaded: number;
  newItems: number;
  updatedItems: number;
  skippedRows: number;
  byCategory: Record<string, number>;
  duplicateIsbns: { isbn: string; titles: string[] }[];
  reassignedIsbns: { title: string; oldIsbn: string; newIsbn: string }[];
  noValidIsbn: { title: string; generatedIsbn: string }[];
  noPrice: string[];
  reimpresionMatches: { title: string; category: string }[];
  categoryChanges: { title: string; oldCategory: string; newCategory: string }[];
  errors: string[];
}

export interface CatalogState {
  items: CatalogItem[];
  lastImportDate: string | null;
  importHistory: ImportReport[];
}

export const STORAGE_KEY = "catalog_entelequia";

export function loadCatalog(): CatalogState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { items: [], lastImportDate: null, importHistory: [] };
}

export function saveCatalog(state: CatalogState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
