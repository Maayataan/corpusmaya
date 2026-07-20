import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button, Card } from './ui';
import type { Contribution, Dialect } from '../lib/database.types';

export default function DatasetBrowser() {
  const [entries, setEntries] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialect, setDialect] = useState<Dialect | ''>('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [dialect, page, appliedSearch]);

  async function loadEntries() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (dialect) params.set('dialect', dialect);
    if (appliedSearch) params.set('search', appliedSearch);
    try {
      const result = await api<{ entries: Contribution[]; hasMore: boolean }>(`/api/corpus?${params}`);
      setEntries(result.entries);
      setHasMore(result.hasMore);
    } catch {
      setEntries([]);
      setHasMore(false);
    }
    setLoading(false);
  }

  function handleSearch(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    setPage(0);
    setAppliedSearch(search.trim());
  }

  return (
    <div className="browser">
      <form onSubmit={handleSearch} className="browser-filters">
        <input
          type="search"
          placeholder="Buscar en maya o español..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar en el corpus"
        />
        <select
          value={dialect}
          onChange={(e) => {
            setDialect(e.target.value as Dialect | '');
            setPage(0);
          }}
          aria-label="Filtrar por variante dialectal"
        >
          <option value="">Todas las variantes</option>
          <option value="oriente">Oriente</option>
          <option value="noroccidente">Noroccidente</option>
          <option value="centro">Centro</option>
          <option value="sur">Sur</option>
          <option value="costa">Costa</option>
        </select>
        <Button type="submit" variant="primary">Buscar</Button>
      </form>

      {loading ? (
        <p className="browser-status">Cargando...</p>
      ) : entries.length === 0 ? (
        <div className="browser-empty">
          <p className="empty-maya">Mix máak yaan waye'</p>
          <p className="empty-es">Aún no hay entradas aprobadas.</p>
          <p className="empty-cta">
            <a href="/">Sé el primero en contribuir</a>
          </p>
        </div>
      ) : (
        <>
          <ul className="entry-list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Card>
                  <p className="entry-maya">{entry.maya_text}</p>
                  <p className="entry-es">{entry.spanish_translation}</p>
                  <div className="entry-meta">
                    <span>{entry.dialect}</span>
                    <span>{entry.contributor_name}</span>
                    {entry.audio_url && (
                      <audio controls preload="none" src={entry.audio_url}>
                        <track kind="captions" />
                      </audio>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <div className="browser-pagination">
            <Button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </Button>
            <Button
              type="button"
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </Button>
          </div>
        </>
      )}

      <style>{`
        .browser { display: flex; flex-direction: column; gap: var(--space-4); }
        .browser-filters {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }
        .browser-filters input[type="search"] {
          flex: 1;
          min-width: 200px;
          padding: var(--space-2) var(--space-3);
        }
        .browser-filters select {
          padding: var(--space-2) var(--space-3);
        }
        .browser-status {
          color: var(--text-muted);
          text-align: center;
          padding: var(--space-5);
        }
        .browser-empty {
          text-align: center;
          padding: var(--space-6) 0;
        }
        .empty-maya { font-size: 1.25rem; font-weight: 700; }
        .empty-es { color: var(--text-muted); margin-bottom: var(--space-3); }
        .empty-cta a { color: var(--primary); font-weight: 600; }
        .entry-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .entry-maya {
          font-weight: 600;
          margin-bottom: var(--space-1);
        }
        .entry-es {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: var(--space-2);
        }
        .entry-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-3);
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .entry-meta audio {
          height: 32px;
          max-width: 100%;
        }
        .browser-pagination {
          display: flex;
          justify-content: space-between;
        }
      `}</style>
    </div>
  );
}
