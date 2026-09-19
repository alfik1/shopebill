import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct } from '../../controllers/productController';
import ProductCard from '../components/ProductCard';

const categories = ['All', 'Shirt', 'T-Shirt', 'Pant', 'Underwear'];

export default function Products() {

  const [products, setProducts] = useState([]);

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
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {

    console.log('[Products] Component mounted');

    loadProducts();

  }, []);


  // ========================================================
  // FILTER
  // ========================================================

  const filtered =
    activeCategory === 'All'
      ? products
      : products.filter(
          (p) =>
            String(p.category || '').toLowerCase() ===
            activeCategory.toLowerCase()
        );

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
              key={c}
              className={`tab${activeCategory === c ? ' active' : ''}`}
              onClick={() => {
                console.log('[Products] Tab clicked:', c);
                setActiveCategory(c);
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <Link to="/add-product" className="btn btn-primary" style={{ width: 'auto' }}>
          + Add Product
        </Link>
      </div>

      <div className="product-grid">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}