import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, deleteProduct } from '../../controllers/productController';
import { getCategories } from '../../controllers/categoryController';
import ProductCard from '../components/ProductCard';

export default function Products() {

  const [searchParams] = useSearchParams();

  const search = (searchParams.get('search') || '').trim();

  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([{ id: 'all', name: 'All' }]);

  const [activeCategory, setActiveCategory] = useState('All');

  const [loading, setLoading] = useState(false);

  // Ignores old responses when the user types quickly
  const requestId = useRef(0);


  // ========================================================
  // LOAD PRODUCTS (API: /api/products/?search=)
  // ========================================================

  const loadProducts = async () => {

    const currentRequest = ++requestId.current;

    console.log('########################################');
    console.log('[Products] LOAD PRODUCTS START, search:', search);

    setLoading(true);

    try {

      const data = await getProducts({ search });

      if (currentRequest !== requestId.current) return;

      console.log('[Products] Products loaded:', data);

      console.log('[Products] Products count:', data.length);

      setProducts(data);

    } catch (error) {

      if (currentRequest !== requestId.current) return;

      console.error('[Products] LOAD PRODUCTS ERROR:', error);

      setProducts([]);

    } finally {

      if (currentRequest === requestId.current) {
        setLoading(false);
      }

      console.log('[Products] LOAD PRODUCTS END');

      console.log('########################################');
    }
  };


  // ========================================================
  // LOAD CATEGORIES
  // ========================================================

  const loadCategories = async () => {

    console.log('########################################');
    console.log('[Products] LOAD CATEGORIES START');

    try {

      const data = await getCategories();

      console.log('[Products] Categories loaded:', data);

      setCategories([{ id: 'all', name: 'All' }, ...data]);

    } catch (error) {

      console.error('[Products] LOAD CATEGORIES ERROR:', error);

      setCategories([{ id: 'all', name: 'All' }]);

    } finally {

      console.log('[Products] LOAD CATEGORIES END');

      console.log('########################################');
    }
  };


  // ========================================================
  // INITIAL LOAD (categories once)
  // ========================================================

  useEffect(() => {

    console.log('[Products] Component mounted');

    loadCategories();

  }, []);


  // ========================================================
  // LOAD PRODUCTS ON MOUNT AND WHENEVER SEARCH CHANGES
  // ========================================================

  useEffect(() => {

    console.log('[Products] Search value:', search);

    loadProducts();

  }, [search]);


  // ========================================================
  // STOCK HELPERS
  // ========================================================

  const getStock = (p) => Number(p.stock ?? p.stock_qty) || 0;

  // Total stock for an option: "All" = every product, otherwise that category
  const getTotalStock = (categoryName) => {

    const list =
      categoryName === 'All'
        ? products
        : products.filter(
            (p) =>
              String(p.category || '').toLowerCase() ===
              categoryName.toLowerCase()
          );

    return list.reduce((sum, p) => sum + getStock(p), 0);
  };


  // ========================================================
  // FILTER
  // ========================================================

  const categoryFiltered =
    activeCategory === 'All'
      ? products
      : products.filter(
          (p) =>
            String(p.category || '').toLowerCase() ===
            activeCategory.toLowerCase()
        );

  // Products with stock 0 go to the end (original order kept otherwise)
  const filtered = [
    ...categoryFiltered.filter((p) => getStock(p) > 0),
    ...categoryFiltered.filter((p) => getStock(p) <= 0),
  ];

  console.log(
    '[Products] Active category:',
    activeCategory,
    '| Search:',
    search,
    '| Showing:',
    filtered.length,
    'of',
    products.length
  );


  // ========================================================
  // DELETE
  // ========================================================

  const handleDelete = async (id) => {

    console.log('########################################');
    console.log('[Products] DELETE START, id:', id);

    try {

      await deleteProduct(id);

      console.log('[Products] Product deleted:', id);

      await loadProducts();

    } catch (error) {

      console.error('[Products] DELETE ERROR:', error);

    } finally {

      console.log('[Products] DELETE END');

      console.log('########################################');
    }
  };


  // ========================================================
  // UI
  // ========================================================

  return (
    <div style={{ width: '100%', minWidth: 0 }}>

      {/* Scoped styles: works without touching your stylesheet */}
      <style>{`
        .pp-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .pp-select-wrap {
          position: relative;
          flex: 0 1 300px;
          min-width: 0;
        }

        .pp-select {
          display: block;
          width: 100%;
          height: 46px;
          padding: 0 44px 0 18px;
          border: 1px solid #e6e6e6;
          border-radius: 14px;
          background-color: #ffffff;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23111111' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          color: #111111;
          cursor: pointer;
          outline: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          text-overflow: ellipsis;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .pp-select:hover {
          border-color: #cfcfcf;
        }

        .pp-select:focus {
          border-color: #111111;
          box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.08);
        }

        .pp-select option {
          font-weight: 500;
          color: #111111;
        }

        .pp-add-btn {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          width: auto !important;
          flex: 0 0 auto !important;
          height: 46px;
          padding: 0 22px !important;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.1s ease, filter 0.15s ease;
        }

        .pp-add-btn:hover {
          filter: brightness(0.96);
        }

        .pp-add-btn:active {
          transform: scale(0.97);
        }

        .pp-info {
          margin: 0 0 16px;
          font-size: 13px;
          font-weight: 600;
          color: #666666;
        }

        .pp-empty {
          padding: 48px 16px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: #888888;
        }

        /* Mobile */
        @media (max-width: 600px) {
          .pp-head {
            gap: 10px;
            margin-bottom: 16px;
          }

          .pp-select-wrap {
            flex: 1 1 auto;
          }

          .pp-select {
            height: 44px;
            font-size: 13px;
            padding-left: 14px;
          }

          .pp-add-btn {
            height: 44px;
            padding: 0 16px !important;
            font-size: 13px;
          }
        }
      `}</style>

      <div className="pp-head">

        <div className="pp-select-wrap">
          <select
            className="pp-select"
            value={activeCategory}
            onChange={(e) => {
              console.log('[Products] Category selected:', e.target.value);
              setActiveCategory(e.target.value);
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} ({getTotalStock(c.name)})
              </option>
            ))}
          </select>
        </div>

        <Link to="/add-product" className="btn btn-primary pp-add-btn">
          + Add Product
        </Link>

      </div>

      {search && (
        <p className="pp-info">Results for "{search}"</p>
      )}

      {!loading && filtered.length === 0 && (
        <div className="pp-empty">No products found</div>
      )}

      <div className="product-grid">
        {filtered.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onDelete={handleDelete}
            onUpdated={loadProducts}
          />
        ))}
      </div>
    </div>
  );
}