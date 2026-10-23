import { useState } from 'react';
import { updateProduct } from '../../controllers/productController';

export default function ProductCard({ product, onDelete, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(product.price);
  const [stock, setStock] = useState(product.stock);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setPrice(product.price);
    setStock(product.stock);
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await updateProduct(product.id, {
        price,
        stock_qty: stock,
      });

      setEditing(false);

      if (onUpdated) {
        await onUpdated();
      }
    } catch (err) {
      console.error('[ProductCard] UPDATE ERROR:', err);
      setError(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="product-card">
      <div className="product-icon">{product.icon}</div>
      <div className="p-name">{product.name}</div>
      <div className="p-cat">{product.category} • Size {product.size} • {product.sku}</div>

      {editing ? (
        <>
          <div className="p-row" style={{ gap: 8 }}>
            <input
              className="input"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Price"
              style={{ fontSize: 12, padding: '6px 8px' }}
            />
            <input
              className="input"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Stock"
              style={{ fontSize: 12, padding: '6px 8px' }}
            />
          </div>

          {error && (
            <div className="error-text" style={{ marginTop: 8, marginBottom: 0 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, fontSize: 12 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="btn btn-outline"
              style={{ flex: 1, fontSize: 12 }}
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="p-row">
            <div className="p-price">₹{product.price}</div>
            <div style={{ fontSize: 12, color: '#8A8A94' }}>Stock: {product.stock}</div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              className="btn btn-outline"
              style={{ flex: 1, fontSize: 12 }}
              onClick={startEdit}
            >
              Edit
            </button>
            {onDelete && (
              <button
                className="btn btn-outline"
                style={{ flex: 1, fontSize: 12 }}
                onClick={() => onDelete(product.id)}
              >
                Remove
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}