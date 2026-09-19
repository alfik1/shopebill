export default function ProductCard({ product, onDelete }) {
  return (
    <div className="product-card">
      <div className="product-icon">{product.icon}</div>
      <div className="p-name">{product.name}</div>
      <div className="p-cat">{product.category} • Size {product.size} • {product.sku}</div>
      <div className="p-row">
        <div className="p-price">₹{product.price}</div>
        <div style={{ fontSize: 12, color: '#8A8A94' }}>Stock: {product.stock}</div>
      </div>
      {onDelete && (
        <button
          className="btn btn-outline"
          style={{ width: '100%', marginTop: 12, fontSize: 12 }}
          onClick={() => onDelete(product.id)}
        >
          Remove
        </button>
      )}
    </div>
  );
}