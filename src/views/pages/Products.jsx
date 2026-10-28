import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../../controllers/productController';
import { getCategories } from '../../controllers/categoryController';
import ProductCard from '../components/ProductCard';

export default function Products() {

  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([{ id: 'all', name: 'All' }]);

  const [activeCategory, setActiveCategory] = useState('All');


  // ========================================================
  // LOAD PRODUCTS
  // ========================================================

  const loadProducts = async () => {

    console.log('########################################');
    console.log('[Products] LOAD PRODUCTS START');

    try {

      const data = await getProducts();

      console.log('[Products] Products loaded:', data);

      console.log('[Products] Products count:', data.length);

      setProducts(data);

    } catch (error) {

      console.error('[Products] LOAD PRODUCTS ERROR:', error);

      setProducts([]);

    } finally {

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
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {

    console.log('[Products] Component mounted');

    loadProducts();
    loadCategories();

  }, []);


  // ========================================================
  // STOCK HELPERS
  // ========================================================

  const getStock = (p) => Number(p.stock ?? p.stock_qty) || 0;

  // Total stock for a tab: "All" = every product, otherwise that category
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
    <div>
      <div className="page-head">
        <div className="category-tabs">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`tab${activeCategory === c.name ? ' active' : ''}`}
              onClick={() => {
                console.log('[Products] Tab clicked:', c.name);
                setActiveCategory(c.name);
              }}
            >
              {c.name} ({getTotalStock(c.name)})
            </button>
          ))}
        </div>
        <Link to="/add-product" className="btn btn-primary" style={{ width: 'auto' }}>
          + Add Product
        </Link>
      </div>

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