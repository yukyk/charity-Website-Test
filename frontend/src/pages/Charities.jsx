import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { getCharities } from '../api/charities';
import CharityCard from '../components/shared/CharityCard';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useDebounce from '../hooks/useDebounce';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

const CATEGORIES = [
  'education', 'health', 'environment', 'poverty', 'disaster', 'animals', 'other',
];

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'raised-desc', label: 'Most Raised' },
  { value: 'raised-asc', label: 'Least Raised' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];

function applySort(charities, sort) {
  if (!sort || !charities?.length) return charities;
  const arr = [...charities];
  if (sort === 'raised-desc') return arr.sort((a, b) => parseFloat(b.raisedAmount || 0) - parseFloat(a.raisedAmount || 0));
  if (sort === 'raised-asc')  return arr.sort((a, b) => parseFloat(a.raisedAmount || 0) - parseFloat(b.raisedAmount || 0));
  if (sort === 'name-asc')    return arr.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'name-desc')   return arr.sort((a, b) => b.name.localeCompare(a.name));
  return arr;
}

function SidebarContent({ search, onSearch, activeCategory, onCategoryToggle, sort, onSort }) {
  return (
    <div className="charities-sidebar">
      <h3 style={{ fontSize: 16, marginBottom: 20 }}>Filters</h3>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Search
        </label>
        <Input
          placeholder="Search charities..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          icon={<Search size={16} />}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Category
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CATEGORIES.map((cat) => (
            <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 15 }}>
              <input
                type="checkbox"
                checked={activeCategory === cat}
                onChange={() => onCategoryToggle(cat)}
                style={{ width: 16, height: 16, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <span style={{ textTransform: 'capitalize' }}>{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Sort By
        </label>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--color-border)', fontSize: 15,
            fontFamily: 'inherit', background: '#fff', cursor: 'pointer', color: 'var(--color-text)',
            outline: 'none',
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 176 }} />
      <div style={{ padding: 24 }}>
        <div className="skeleton" style={{ height: 20, width: '65%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 13, width: '40%', marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 13, width: '100%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 13, width: '85%', marginBottom: 18 }} />
        <div className="skeleton" style={{ height: 7, width: '100%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 13, width: '55%' }} />
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPage }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && arr[i - 1] !== p - 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 48, flexWrap: 'wrap' }}>
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>

      {pages.map((p, i) =>
        p === '...'
          ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--color-text-muted)' }}>…</span>
          : (
            <button
              key={p}
              onClick={() => onPage(p)}
              style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                border: p === page ? 'none' : '1.5px solid var(--color-border)',
                background: p === page ? 'var(--color-primary)' : '#fff',
                color: p === page ? '#fff' : 'var(--color-text)',
                fontWeight: p === page ? 700 : 400,
                cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
              }}
            >
              {p}
            </button>
          )
      )}

      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  );
}

export default function Charities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { setPage(1); }, [debouncedSearch, activeCategory]);

  const queryParams = {
    page,
    limit: 9,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(activeCategory && { category: activeCategory }),
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['charities', queryParams],
    queryFn: () => getCharities(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
  });

  const rawCharities = data?.data || [];
  const charities = applySort(rawCharities, sort);
  const pagination = data?.pagination || {};
  const totalPages = pagination.totalPages || 1;
  const totalCount = pagination.total ?? rawCharities.length;

  function handleCategoryToggle(cat) {
    const next = activeCategory === cat ? '' : cat;
    setActiveCategory(next);
    if (next) {
      setSearchParams({ category: next });
    } else {
      setSearchParams({});
    }
  }

  function clearCategory() { handleCategoryToggle(activeCategory); }
  function clearSearch() { setSearch(''); }

  const hasFilters = debouncedSearch || activeCategory;

  return (
    <motion.div {...pageVariants}>

      {/* Page header */}
      <div style={{ background: 'var(--color-primary-dark)', padding: '56px 0 48px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#fff', marginBottom: 12 }}>Browse Charities</h1>
          <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 17, maxWidth: 520, margin: '0 auto' }}>
            Discover verified organizations making real impact. Filter by category or search by name.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 20px 80px' }}>

        {/* Mobile controls */}
        <div className="charities-mobile-toggle" style={{ marginBottom: 20, gap: 12 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMobileOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasFilters && (
              <span style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                1
              </span>
            )}
          </Button>
          <div style={{ flex: 1 }}>
            <Input
              placeholder="Search charities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
        </div>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.40)', zIndex: 40 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                style={{
                  position: 'fixed', left: 0, top: 0, bottom: 0, width: 300,
                  zIndex: 50, overflowY: 'auto',
                  boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
                }}
              >
                <div style={{
                  padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', background: 'var(--color-primary)', color: '#fff',
                }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>Filters</span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={22} />
                  </button>
                </div>
                <SidebarContent
                  search={search} onSearch={setSearch}
                  activeCategory={activeCategory} onCategoryToggle={handleCategoryToggle}
                  sort={sort} onSort={setSort}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="charities-layout">
          {/* Desktop sidebar */}
          <div className="desktop-sidebar">
            <SidebarContent
              search={search} onSearch={setSearch}
              activeCategory={activeCategory} onCategoryToggle={handleCategoryToggle}
              sort={sort} onSort={setSort}
            />
          </div>

          {/* Main content */}
          <div>
            {/* Result summary + active filter chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 24, minHeight: 32 }}>
              {!isLoading && (
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                  {totalCount} {totalCount === 1 ? 'charity' : 'charities'} found
                </span>
              )}

              {activeCategory && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(13,110,110,0.10)', color: 'var(--color-primary)',
                  borderRadius: 999, padding: '4px 12px', fontSize: 13, fontWeight: 500,
                  textTransform: 'capitalize',
                }}>
                  {activeCategory}
                  <button onClick={clearCategory} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', padding: 0 }}>
                    <X size={13} />
                  </button>
                </span>
              )}

              {debouncedSearch && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(13,110,110,0.10)', color: 'var(--color-primary)',
                  borderRadius: 999, padding: '4px 12px', fontSize: 13, fontWeight: 500,
                }}>
                  "{debouncedSearch}"
                  <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', display: 'flex', padding: 0 }}>
                    <X size={13} />
                  </button>
                </span>
              )}
            </div>

            {/* Grid */}
            <div
              className="grid-3"
              style={{ opacity: isFetching && data ? 0.65 : 1, transition: 'opacity 0.25s' }}
            >
              {isLoading
                ? [1, 2, 3, 4, 5, 6].map((n) => <CardSkeleton key={n} />)
                : charities.length === 0
                  ? (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                      <div className="empty-state-icon">
                        <Search size={48} />
                      </div>
                      <h3>No charities found</h3>
                      <p>Try adjusting your search or filters to find what you're looking for.</p>
                    </div>
                  )
                  : charities.map((charity, i) => (
                    <motion.div
                      key={charity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.06 }}
                    >
                      <CharityCard charity={charity} showActions />
                    </motion.div>
                  ))
              }
            </div>

            {totalPages > 1 && !isLoading && (
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
