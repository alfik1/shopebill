import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addProduct } from '../../controllers/productController';
import { getCategories } from '../../controllers/categoryController';

const emptyForm = {
  name: '',
  categoryId: '',
  size: '',
  price: '',
  stock: '',
  sku: '',
};

export default function AddProduct() {
  const navigate = useNavigate();
  const skuRef = useRef(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);

  // Fetch categories from the API for the dropdown
  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      console.log('[AddProduct] LOAD CATEGORIES START');

      try {
        const list = await getCategories();

        console.log('[AddProduct] Categories loaded:', list);

        if (!active) {
          return;
        }

        const safeList = Array.isArray(list) ? list : [];

        setCategories(safeList);

        // Select the first category by default
        setForm((prev) =>
          prev.categoryId || safeList.length === 0
            ? prev
            : { ...prev, categoryId: String(safeList[0].id) }
        );
      } catch (err) {
        console.error('[AddProduct] LOAD CATEGORIES ERROR:', err);

        if (active) {
          setCategories([]);
          setError(err?.message || 'Unable to load categories');
        }
      } finally {
        if (active) {
          setCategoriesLoading(false);
        }

        console.log('[AddProduct] LOAD CATEGORIES END');
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  // USB QR scanner: it types like a keyboard. If nothing is focused when the
  // scan starts, send the typing to the SKU field so no click is needed
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;

      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) {
        return;
      }

      console.log('[AddProduct] Scanner input detected, focusing SKU field');

      skuRef.current?.focus();

      skuRef.current?.select();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Scan buttons: clear the SKU field and focus it, the QR reader machine
  // types the scanned value straight into it
  const startScan = () => {
    console.log('[AddProduct] Ready for QR reader, SKU field focused');

    setForm((prev) => ({ ...prev, sku: '' }));

    skuRef.current?.focus();
  };

  // Called when the QR reader sends Enter after typing the code
  const handleScan = (decodedText) => {
    console.log('[AddProduct] QR scanned:', decodedText);

    if (!decodedText) {
      return;
    }

    try {
      const parsed = JSON.parse(decodedText);

      console.log('[AddProduct] QR parsed as JSON:', parsed);

      // QR category can be a category name or a category id
      const wanted =
        parsed.category === undefined || parsed.category === null
          ? ''
          : String(parsed.category).toLowerCase();

      const matchedCategory = wanted
        ? categories.find(
            (c) =>
              String(c.id).toLowerCase() === wanted ||
              String(c.name || '').toLowerCase() === wanted
          )
        : null;

      console.log('[AddProduct] QR category match:', matchedCategory);

      setForm((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        categoryId: matchedCategory ? String(matchedCategory.id) : prev.categoryId,
        size: parsed.size || prev.size,
        price: parsed.price ?? prev.price,
        stock: parsed.stock ?? prev.stock,
        sku: parsed.sku || decodedText,
      }));
    } catch {
      console.log('[AddProduct] QR is plain text, using as SKU');

      setForm((prev) => ({ ...prev, sku: decodedText }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('########################################');
    console.log('[AddProduct] SUBMIT START');
    console.log('[AddProduct] Form:', form);

    setError('');

    try {
      const matched = categories.find(
        (c) => String(c.id) === String(form.categoryId)
      );

      console.log('[AddProduct] Selected category:', matched);

      if (!matched) {
        throw new Error('Please select a category');
      }

      // const created = await addProduct({
      //   ...form,
      //   categoryId: matched.id,
      //   price: Number(form.price),
      //   stock: Number(form.stock),
      // });
const created = await addProduct({
  ...form,
  barcode: form.sku,          // <-- added
  categoryId: matched.id,
  price: Number(form.price),
  stock: Number(form.stock),
});
      console.log('[AddProduct] Product created:', created);

      setSuccess('Product added successfully');
      setForm({
        ...emptyForm,
        categoryId: categories[0] ? String(categories[0].id) : '',
      });
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('[AddProduct] SUBMIT ERROR:', err);

      setError(err?.message || 'Failed to add product');
    } finally {
      console.log('[AddProduct] SUBMIT END');
      console.log('########################################');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div className="card-title">Add Product</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-scan" type="button" onClick={startScan}>
            📷 Scan QR
          </button>
          <button className="btn btn-outline" type="button" onClick={() => navigate('/products')}>
            View Products
          </button>
        </div>
      </div>

      {success && <div className="success-banner">{success}</div>}

      {error && <div className="error-text">{error}</div>}

      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Product Name</label>
            <input className="input" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              className="select"
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              disabled={categoriesLoading}
              required
            >
              {categoriesLoading ? (
                <option value="">Loading categories...</option>
              ) : categories.length === 0 ? (
                <option value="">No categories found</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Size</label>
            <input className="input" name="size" value={form.size} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Price (₹)</label>
            <input className="input" type="number" name="price" value={form.price} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Stock</label>
            <input className="input" type="number" name="stock" value={form.stock} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>SKU / QR Code</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={skuRef}
                className="input"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="Scan QR with reader"
                onKeyDown={(e) => {
                  // QR reader types the code then presses Enter
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScan(e.target.value.trim());
                  }
                }}
                required
              />
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                onClick={startScan}
              >
                Scan
              </button>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} type="submit">Save Product</button>
      </form>
    </div>
  );
}