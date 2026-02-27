import * as XLSX from "xlsx";
import type {
  CatalogItem,
  CatalogCategory,
  ImportReport,
  CatalogState,
} from "./catalog-types";
import { CATEGORY_MARKERS } from "./catalog-types";

// ── Helpers ──

function hashTitle(title: string): string {
  let hash = 0;
  const s = title.toLowerCase().trim();
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return "TTL" + Math.abs(hash).toString().padStart(10, "0").slice(0, 10);
}

function cleanIsbn(raw: string): string {
  if (!raw) return "";
  let s = String(raw).trim();
  // Handle scientific notation
  if (/e\+/i.test(s)) {
    try {
      const n = Number(s);
      if (!isNaN(n)) s = n.toFixed(0);
    } catch { /* keep as-is */ }
  }
  s = s.replace(/[^0-9]/g, "");
  return s;
}

function isValidIsbn(isbn: string): boolean {
  return isbn.length >= 10;
}

function isIsbnPlaceholder(raw: string): boolean {
  const u = String(raw).toUpperCase().trim();
  return u === "ISBN A CONFIRMAR" || u === "S/D" || u === "";
}

function shouldSkipRow(firstCell: string): boolean {
  const u = firstCell.toUpperCase().trim();
  return (
    !u ||
    u === "TITULO" ||
    u === "TÍTULO" ||
    u === "SUBTOTAL" ||
    u === "SUB TOTAL" ||
    u.startsWith("POR FAVOR COMPLETAR")
  );
}

function detectCategory(firstCell: string): CatalogCategory | null {
  const u = firstCell.toUpperCase().trim();
  for (const [marker, cat] of Object.entries(CATEGORY_MARKERS)) {
    if (u.includes(marker)) return cat;
  }
  return null;
}

function parsePrice(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  return isNaN(n) ? null : Math.round(n);
}

// ── Main import function ──

export function importExcel(
  fileBuffer: ArrayBuffer,
  existingState: CatalogState
): { state: CatalogState; report: ImportReport } {
  const wb = XLSX.read(fileBuffer, { type: "array" });

  // Find sheet with "Ivrea" in name
  let sheetName = wb.SheetNames.find((n) =>
    n.toLowerCase().includes("ivrea")
  );
  if (!sheetName) sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("No se encontró ninguna pestaña en el archivo.");

  const ws = wb.Sheets[sheetName]!;
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: "",
  });

  console.log(`[Catálogo] Pestaña: "${sheetName}", Total filas: ${rows.length}`);

  const report: ImportReport = {
    timestamp: new Date().toISOString(),
    totalRows: 0,
    itemsLoaded: 0,
    newItems: 0,
    updatedItems: 0,
    skippedRows: 0,
    byCategory: {},
    duplicateIsbns: [],
    reassignedIsbns: [],
    noValidIsbn: [],
    noPrice: [],
    reimpresionMatches: [],
    categoryChanges: [],
    errors: [],
  };

  const parsedItems: CatalogItem[] = [];
  const reimpresionItems: { title: string; isbn: string; price: number | null }[] = [];
  let currentCategory: CatalogCategory | null = null;
  const isbnSeen = new Map<string, string[]>();

  // Scan ALL rows (starting from 0) to find category markers and items
  // Categories can appear before row 9 — we scan from the start but only collect items after the first category is found
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const firstCell = String(row[0] ?? "").trim();
    
    if (!firstCell) {
      if (currentCategory) report.skippedRows++;
      continue;
    }

    // Check for category marker on ANY row
    const detectedCat = detectCategory(firstCell);
    if (detectedCat) {
      currentCategory = detectedCat;
      console.log(`[Catálogo] Categoría detectada en fila ${i + 1}: ${detectedCat}`);
      continue;
    }

    // Skip header/summary rows
    if (shouldSkipRow(firstCell)) {
      if (currentCategory) report.skippedRows++;
      continue;
    }

    // Only process item rows once we've found at least one category
    if (!currentCategory) continue;

    report.totalRows++;

    const title = firstCell;
    const rawIsbn = String(row[1] ?? "");
    const price = parsePrice(row[2]);

    let isbn = "";
    if (!isIsbnPlaceholder(rawIsbn)) {
      isbn = cleanIsbn(rawIsbn);
    }

    // Track for reimpresion category
    if (currentCategory === "REIMPRESIONES") {
      reimpresionItems.push({ title, isbn, price });
      continue;
    }

    // Handle ISBN
    let finalIsbn = isbn;
    let isbnReassigned = false;

    if (!isValidIsbn(isbn)) {
      finalIsbn = hashTitle(title);
      report.noValidIsbn.push({ title, generatedIsbn: finalIsbn });
      isbnReassigned = true;
    }

    // Check for duplicate ISBN
    if (isbnSeen.has(finalIsbn)) {
      const existing = isbnSeen.get(finalIsbn)!;
      existing.push(title);
      const oldIsbn = finalIsbn;
      finalIsbn = hashTitle(title + "_dup");
      report.reassignedIsbns.push({ title, oldIsbn, newIsbn: finalIsbn });
      isbnReassigned = true;
    }

    if (!isbnReassigned && isbn && isbn !== finalIsbn) {
      report.reassignedIsbns.push({ title, oldIsbn: isbn || "(vacío)", newIsbn: finalIsbn });
    }

    isbnSeen.set(finalIsbn, [title]);

    if (price === null) {
      report.noPrice.push(title);
    }

    const item: CatalogItem = {
      id: finalIsbn,
      title,
      isbn: finalIsbn,
      price,
      category: currentCategory,
      reimpresion: false,
      lastUpdated: new Date().toISOString(),
    };

    parsedItems.push(item);
    report.byCategory[currentCategory] = (report.byCategory[currentCategory] || 0) + 1;
  }

  console.log(`[Catálogo] Items parseados: ${parsedItems.length}, Reimpresiones: ${reimpresionItems.length}`);

  // Build duplicate ISBN report
  for (const [isbn, titles] of isbnSeen) {
    if (titles.length > 1) {
      report.duplicateIsbns.push({ isbn, titles });
    }
  }

  // ── Merge with existing catalog ──
  const existingItems = [...existingState.items];
  const mergedMap = new Map<string, CatalogItem>();

  // Index existing by title (lowercase) and isbn
  const existingByTitle = new Map<string, CatalogItem>();
  const existingByIsbn = new Map<string, CatalogItem>();
  for (const item of existingItems) {
    existingByTitle.set(item.title.toLowerCase(), item);
    existingByIsbn.set(item.isbn, item);
  }

  // Merge parsed items
  for (const item of parsedItems) {
    const matchByTitle = existingByTitle.get(item.title.toLowerCase());
    const matchByIsbn = existingByIsbn.get(item.isbn);
    const match = matchByTitle || matchByIsbn;

    if (match) {
      // Track category changes
      if (match.category !== item.category) {
        report.categoryChanges.push({
          title: item.title,
          oldCategory: match.category,
          newCategory: item.category,
        });
      }
      mergedMap.set(match.id, {
        ...match,
        title: item.title,
        isbn: item.isbn,
        price: item.price ?? match.price,
        category: item.category,
        lastUpdated: item.lastUpdated,
      });
      report.updatedItems++;
    } else {
      mergedMap.set(item.id, item);
      report.newItems++;
    }
  }

  // Keep items not in the new import (don't delete)
  for (const item of existingItems) {
    if (!mergedMap.has(item.id)) {
      mergedMap.set(item.id, item);
    }
  }

  // ── Apply reimpresion tags ──
  for (const rItem of reimpresionItems) {
    let found: CatalogItem | undefined;
    for (const [, item] of mergedMap) {
      if (item.title.toLowerCase() === rItem.title.toLowerCase()) {
        found = item;
        break;
      }
    }
    if (!found && rItem.isbn && isValidIsbn(rItem.isbn)) {
      found = mergedMap.get(rItem.isbn);
    }

    if (found) {
      found.reimpresion = true;
      if (rItem.price !== null) found.price = rItem.price;
      report.reimpresionMatches.push({ title: rItem.title, category: found.category });
    } else {
      const isbn = isValidIsbn(rItem.isbn) ? rItem.isbn : hashTitle(rItem.title);
      const newItem: CatalogItem = {
        id: isbn,
        title: rItem.title,
        isbn,
        price: rItem.price,
        category: "NOVEDADES",
        reimpresion: true,
        lastUpdated: new Date().toISOString(),
      };
      mergedMap.set(newItem.id, newItem);
      report.newItems++;
      report.reimpresionMatches.push({ title: rItem.title, category: "SIN MATCH (nuevo)" });
    }
  }

  report.itemsLoaded = parsedItems.length;

  const finalItems = Array.from(mergedMap.values());
  console.log(`[Catálogo] Items finales en catálogo: ${finalItems.length}`);

  const newState: CatalogState = {
    items: finalItems,
    lastImportDate: new Date().toISOString(),
    importHistory: [report, ...existingState.importHistory].slice(0, 20),
  };

  return { state: newState, report };
}
