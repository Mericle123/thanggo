'use client';

import { useCallback, useEffect, useState } from 'react';

// Tiny data-fetch helper: runs `fn` on mount (and when `deps` change), exposes
// { data, loading, error, reload } so every dashboard view gets real loading /
// error / empty / success states.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    let alive = true;
    setLoading(true); setError(null);
    fn()
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e?.message || 'Something went wrong'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);
  return { data, loading, error, reload: run };
}
