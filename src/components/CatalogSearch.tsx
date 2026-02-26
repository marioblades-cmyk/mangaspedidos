import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import { useCatalog, CatalogProduct } from "@/hooks/useCatalog";

interface CatalogSearchProps {
  onSelect: (titulo: string) => void;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function CatalogSearch({ onSelect, value, onChange, className = "", placeholder = "Buscar en catálogo..." }: CatalogSearchProps) {
  const { searchCatalog } = useCatalog();
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchCatalog(val);
      setResults(res);
      setOpen(res.length > 0);
      setSearching(false);
    }, 300);
  };

  const handleSelect = (product: CatalogProduct) => {
    onSelect(product.titulo);
    onChange(product.titulo);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={`pl-7 ${className}`}
        />
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0"
            >
              <div className="font-medium text-foreground">{p.titulo}</div>
              <div className="text-muted-foreground text-[10px]">
                {p.editorial}{p.isbn ? ` · ISBN: ${p.isbn}` : ""}
                {p.precio_costo_ars != null ? ` · ARS $${p.precio_costo_ars.toLocaleString()}` : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
