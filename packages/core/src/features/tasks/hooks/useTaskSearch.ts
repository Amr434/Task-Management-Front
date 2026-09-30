import { useEffect, useState } from 'react';
import { searchTasks } from '../api';
import { TaskItem } from '../types';

// Live task search shared by web and mobile. Waits until typing pauses
// (debounce) before calling the API, and ignores out-of-date responses.
export function useTaskSearch(query: string, delayMs = 250) {
  const [results, setResults] = useState<TaskItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedFor, setSearchedFor] = useState('');

  const trimmed = query.trim();

  useEffect(() => {
    if (!trimmed) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setIsSearching(true);
      searchTasks(trimmed)
        .then((data) => {
          if (cancelled) return;
          setResults(data);
          setError(null);
          setSearchedFor(trimmed);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : String(err));
          setSearchedFor(trimmed);
        })
        .finally(() => {
          if (!cancelled) setIsSearching(false);
        });
    }, delayMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, delayMs]);

  // Empty box: nothing to show (without a setState in the effect).
  const active = trimmed.length > 0;
  return {
    results: active ? results : [],
    isSearching: active && (isSearching || searchedFor !== trimmed),
    error: active ? error : null,
    // True once the current text has come back with no matches.
    noResults: active && !isSearching && searchedFor === trimmed && results.length === 0 && !error,
  };
}
