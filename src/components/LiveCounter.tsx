import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const POLL_INTERVAL = 10_000;

export default function LiveCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const result = await api<{ count: number }>('/api/counts?table=contributions');
        setCount(result.count);
      } catch {
        // Keep the last known value during transient failures.
      }
    }

    fetch();
    const interval = setInterval(fetch, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-counter" aria-live="polite">
      <span className="counter-number">{count ?? '—'}</span>
      <span className="counter-label">
        voces en el corpus
      </span>
      <style>{`
        .live-counter {
          text-align: center;
          padding: var(--space-4) 0;
        }
        .counter-number {
          display: block;
          font-family: var(--font-mono);
          font-size: 3rem;
          font-weight: 600;
          color: var(--primary);
          line-height: 1;
        }
        .counter-label {
          display: block;
          color: var(--text-muted);
          margin-top: var(--space-2);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
