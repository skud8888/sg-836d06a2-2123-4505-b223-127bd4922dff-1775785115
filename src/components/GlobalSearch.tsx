import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Users, Mail, BookOpen, Loader2 } from "lucide-react";

type SearchResult = {
  result_type: string;
  result_id: string;
  title: string;
  subtitle: string;
  metadata: any;
  relevance: number;
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Cmd+K or Ctrl+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("universal_search", {
        p_query: query,
        p_limit: 10
      });

      if (!error && data) {
        setResults(data);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    setOpen(false);
    
    // Navigate based on result type
    switch (result.result_type) {
      case "booking":
        router.push("/admin/bookings");
        break;
      case "enquiry":
        router.push("/admin/enquiries");
        break;
      case "document":
        // Open document viewer or download
        break;
      case "course":
        router.push("/admin/courses");
        break;
    }
  }, [router]);

  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Users className="h-4 w-4" />;
      case "enquiry":
        return <Mail className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "course":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const groupResults = () => {
    const grouped: { [key: string]: SearchResult[] } = {};
    
    results.forEach((result) => {
      if (!grouped[result.result_type]) {
        grouped[result.result_type] = [];
      }
      grouped[result.result_type].push(result);
    });

    return grouped;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search everything...</span>
        <kbd className="hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search bookings, enquiries, documents, courses..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              "No results found."
            )}
          </CommandEmpty>

          {Object.entries(groupResults()).map(([type, items]) => (
            <CommandGroup 
              key={type} 
              heading={type.charAt(0).toUpperCase() + type.slice(1) + "s"}
            >
              {items.map((result) => (
                <CommandItem
                  key={result.result_id}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getIcon(result.result_type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {(result.relevance * 100).toFixed(0)}%
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}