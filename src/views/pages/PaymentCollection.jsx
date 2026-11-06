import { useEffect, useRef, useState } from 'react';
import {
  getCollection,
  formatBillDateTime,
} from '../../controllers/collectionController';

// ==========================================================
// HELPERS
// ==========================================================

const pad = (n) => String(n).padStart(2, '0');

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const thisMonth = () => todayIso().slice(0, 7);

const money = (value, decimals = 0) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

const UPI_COLOR = '#5B5BFF';
const CASH_COLOR = '#2FB380';
const OTHER_COLOR = '#F2A93B';

const colorForMethod = (key) => {
  if (key === 'upi') return UPI_COLOR;
  if (key === 'cash') return CASH_COLOR;
  return OTHER_COLOR;
};

const iconForMethod = (key) => {
  if (key === 'upi') return '📱';
  if (key === 'cash') return '💵';
  if (key === 'card') return '💳';
  return '💰';
};


export default function PaymentCollection() {

  const [period, setPeriod] = useState('today');

  const [date, setDate] = useState(todayIso());

  const [month, setMonth] = useState(thisMonth());

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  // Ignores old responses when the filter changes quickly
  const requestId = useRef(0);


  // ========================================================
  // LOAD
  // ========================================================

  const load = async () => {

    const currentRequest = ++requestId.current;

    console.log('########################################');
    console.log('[PaymentCollection] LOAD START', { period, date, month });

    setLoading(true);
    setError('');

    try {

      const result = await getCollection({ period, date, month });

      if (currentRequest !== requestId.current) return;

      console.log('[PaymentCollection] Loaded:', result);

      setData(result);

    } catch (err) {

      if (currentRequest !== requestId.current) return;

      console.error('[PaymentCollection] LOAD ERROR:', err);

      setError(err.message || 'Unable to load collection.');

    } finally {

      if (currentRequest === requestId.current) {
        setLoading(false);
      }

      console.log('[PaymentCollection] LOAD END');
      console.log('########################################');
    }
  };

  useEffect(() => {

    if (period === 'date' && !date) return;
    if (period === 'month' && !month) return;

    load();

  }, [period, date, month]);


  // ========================================================
  // FIRST LOAD / ERROR
  // ========================================================

  if (!data && loading) {
    return <div className="pc-state">Loading collection...</div>;
  }

  if (!data && error) {
    return (
      <div className="pc-state">
        <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const bills = data?.bills || [];

  const categories = data?.categories || [];

  const paymentRows = data?.paymentRows || [];


  // ========================================================
  // UI
  // ========================================================

  return (
    <div style={{ width: '100%', minWidth: 0 }}>

      <style>{`
        .pc-state {
          padding: 60px 16px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--muted);
        }

        .pc-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .pc-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pc-filter {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pc-filter .input {
          width: 190px;
          height: 42px;
          border-radius: 12px;
        }

        .pc-refresh {
          height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          background: var(--dark);
          color: var(--white);
          font-weight: 700;
          font-size: 13px;
        }

        .pc-error {
          color: var(--danger);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .pc-content {
          transition: opacity 0.15s ease;
        }

        .pc-content.dim {
          opacity: 0.55;
          pointer-events: none;
        }

        /* ---------- HERO ---------- */
        .pc-hero {
          background: var(--dark);
          color: #ffffff;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 8px;
        }

        .pc-hero-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .pc-hero-label {
          font-size: 13px;
          font-weight: 700;
          opacity: 0.75;
        }

        .pc-pill {
          background: rgba(255, 255, 255, 0.14);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .pc-hero-total {
          font-size: 42px;
          font-weight: 800;
          margin: 12px 0 20px;
          color: var(--primary);
          word-break: break-word;
        }

        .pc-chips {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .pc-chip-box {
          background: rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          padding: 14px;
        }

        .pc-chip-label {
          font-size: 11px;
          font-weight: 700;
          opacity: 0.7;
        }

        .pc-chip-value {
          font-size: 20px;
          font-weight: 800;
          margin-top: 6px;
        }

        /* ---------- SECTIONS ---------- */
        .pc-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 26px 0 14px;
          font-size: 16px;
          font-weight: 800;
        }

        .pc-section small {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
        }

        .pc-empty {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 40px 16px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--muted);
        }

        .pc-empty span {
          display: block;
          font-size: 28px;
          margin-bottom: 8px;
        }

        /* ---------- CATEGORY ---------- */
        .pc-cat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 14px;
        }

        .pc-cat-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
        }

        .pc-cat-head {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pc-cat-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          flex-shrink: 0;
        }

        .pc-cat-name {
          flex: 1;
          min-width: 0;
          font-size: 14px;
          font-weight: 700;
          word-break: break-word;
        }

        .pc-cat-amount {
          font-size: 16px;
          font-weight: 800;
        }

        .pc-track {
          height: 8px;
          border-radius: 8px;
          background: var(--bg);
          margin: 14px 0 8px;
          overflow: hidden;
        }

        .pc-fill {
          height: 100%;
          border-radius: 8px;
          background: var(--primary-dark);
        }

        .pc-cat-profit {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
        }

        /* ---------- PAYMENT BREAKDOWN ---------- */
        .pc-pay-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 6px 18px;
        }

        .pc-pay-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
        }

        .pc-pay-row:last-child {
          border-bottom: none;
        }

        .pc-pay-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .pc-pay-label {
          flex: 1;
          font-size: 14px;
          font-weight: 700;
        }

        .pc-pay-amount {
          font-size: 15px;
          font-weight: 800;
        }

        .pc-pay-percent {
          min-width: 46px;
          text-align: center;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        /* ---------- BILLS ---------- */
        .pc-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .pc-bold {
          font-weight: 800;
        }

        .pc-profit {
          color: var(--success);
          font-weight: 700;
        }

        .pc-bill-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* mobile tiles hidden on desktop */
        .pc-tiles {
          display: none;
        }

        .pc-tile {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px;
          margin-bottom: 10px;
        }

        .pc-tile-body {
          flex: 1;
          min-width: 0;
        }

        .pc-tile-name {
          font-size: 14px;
          font-weight: 700;
          word-break: break-word;
        }

        .pc-tile-meta {
          font-size: 11px;
          color: var(--muted);
          margin-top: 4px;
        }

        .pc-tile-right {
          text-align: right;
          flex-shrink: 0;
        }

        .pc-tile-amount {
          font-size: 15px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        /* ---------- MOBILE ---------- */
        @media (max-width: 768px) {

          .pc-filter {
            width: 100%;
          }

          .pc-filter .input {
            flex: 1;
            width: auto;
          }

          .pc-hero {
            padding: 18px;
          }

          .pc-hero-total {
            font-size: 32px;
          }

          .pc-chips {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .pc-cat-grid {
            grid-template-columns: 1fr;
          }

          .pc-table-card {
            display: none;
          }

          .pc-tiles {
            display: block;
          }
        }
      `}</style>

      {/* ---------- FILTERS ---------- */}
      <div className="pc-toolbar">

        <div className="pc-tabs">
          {[
            { key: 'today', label: 'Today' },
            { key: 'date', label: 'Date' },
            { key: 'month', label: 'Month' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tab${period === t.key ? ' active' : ''}`}
              onClick={() => setPeriod(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="pc-filter">

          {period === 'date' && (
            <input
              type="date"
              className="input"
              value={date}
              max={todayIso()}
              onChange={(e) => setDate(e.target.value)}
            />
          )}

          {period === 'month' && (
            <input
              type="month"
              className="input"
              value={month}
              max={thisMonth()}
              onChange={(e) => setMonth(e.target.value)}
            />
          )}

          <button
            type="button"
            className="pc-refresh"
            onClick={load}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>

        </div>
      </div>

      {error && <p className="pc-error">{error}</p>}

      {data && (
        <div className={`pc-content${loading ? ' dim' : ''}`}>

          {/* ---------- SUMMARY CARD ---------- */}
          <div className="pc-hero">

            <div className="pc-hero-head">
              <span className="pc-hero-label">Total Collection</span>
              <span className="pc-pill">📅 {data.filterLabel}</span>
            </div>

            <div className="pc-hero-total">
              {money(data.totalCollection, 2)}
            </div>

            <div className="pc-chips">

              <div className="pc-chip-box">
                <div className="pc-chip-label">📱 UPI</div>
                <div className="pc-chip-value">{money(data.upiTotal)}</div>
              </div>

              <div className="pc-chip-box">
                <div className="pc-chip-label">💵 Cash</div>
                <div className="pc-chip-value">{money(data.cashTotal)}</div>
              </div>

              <div className="pc-chip-box">
                <div className="pc-chip-label">📈 Profit</div>
                <div className="pc-chip-value">{money(data.totalProfit)}</div>
              </div>

              <div className="pc-chip-box">
                <div className="pc-chip-label">🧾 Bills</div>
                <div className="pc-chip-value">{data.billCount}</div>
              </div>

            </div>
          </div>

          {/* ---------- CATEGORY COLLECTION ---------- */}
          <div className="pc-section">
            <span>Category Collection</span>
          </div>

          {categories.length === 0 ? (
            <div className="pc-empty">
              <span>🧾</span>
              No sales for this {period === 'month' ? 'month' : 'date'}
            </div>
          ) : (
            <div className="pc-cat-grid">
              {categories.map((c) => {

                const ratio =
                  data.totalCollection === 0
                    ? 0
                    : Math.min(c.saleAmount / data.totalCollection, 1) * 100;

                return (
                  <div className="pc-cat-card" key={c.categoryId || c.name}>

                    <div className="pc-cat-head">
                      <div className="pc-cat-icon">{c.icon}</div>
                      <span className="pc-cat-name">
                        {c.name} • {c.unitsSold} pcs
                      </span>
                      <span className="pc-cat-amount">
                        {money(c.saleAmount)}
                      </span>
                    </div>

                    <div className="pc-track">
                      <div className="pc-fill" style={{ width: `${ratio}%` }} />
                    </div>

                    <div className="pc-cat-profit">
                      Profit: {money(c.profit)}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* ---------- PAYMENT BREAKDOWN ---------- */}
          <div className="pc-section">
            <span>Payment Breakdown</span>
          </div>

          <div className="pc-pay-card">
            {paymentRows.map((row) => {

              const color = colorForMethod(row.key);

              return (
                <div className="pc-pay-row" key={row.key}>

                  <div
                    className="pc-pay-icon"
                    style={{ background: `${color}1F` }}
                  >
                    {iconForMethod(row.key)}
                  </div>

                  <span className="pc-pay-label">
                    {row.label} Collection
                  </span>

                  <span className="pc-pay-amount">{money(row.amount)}</span>

                  <span
                    className="pc-pay-percent"
                    style={{ background: `${color}1F`, color }}
                  >
                    {row.percent}%
                  </span>

                </div>
              );
            })}
          </div>

          {/* ---------- BILLS ---------- */}
          <div className="pc-section">
            <span>{data.filterLabel} Bills</span>
            <small>{bills.length} bills</small>
          </div>

          {bills.length === 0 ? (
            <div className="pc-empty">
              <span>🧾</span>
              No bills for this {period === 'month' ? 'month' : 'date'}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="card pc-table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Bill</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Date / Time</th>
                      <th>Payment</th>
                      <th>Total</th>
                      <th>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => {

                      const color = colorForMethod(b.paymentMode.toLowerCase());

                      return (
                        <tr key={b.id}>
                          <td className="pc-bold">#{b.billId}</td>
                          <td>
                            <div className="pc-bill-cell">
                              <span>{b.icon}</span>
                              <span>{b.itemName}</span>
                            </div>
                          </td>
                          <td>{b.quantity}</td>
                          <td>{formatBillDateTime(b.dateTime)}</td>
                          <td>
                            <span
                              className="pc-badge"
                              style={{ background: `${color}1F`, color }}
                            >
                              {b.paymentMode}
                            </span>
                          </td>
                          <td className="pc-bold">{money(b.total, 2)}</td>
                          <td className="pc-profit">{money(b.profit, 2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile tiles */}
              <div className="pc-tiles">
                {bills.map((b) => {

                  const color = colorForMethod(b.paymentMode.toLowerCase());

                  return (
                    <div className="pc-tile" key={b.id}>

                      <div className="pc-cat-icon">{b.icon}</div>

                      <div className="pc-tile-body">
                        <div className="pc-tile-name">{b.itemName}</div>
                        <div className="pc-tile-meta">
                          Bill #{b.billId} • {formatBillDateTime(b.dateTime)} • Qty {b.quantity}
                        </div>
                      </div>

                      <div className="pc-tile-right">
                        <div className="pc-tile-amount">
                          {money(b.total, 2)}
                        </div>
                        <span
                          className="pc-badge"
                          style={{ background: `${color}1F`, color }}
                        >
                          {b.paymentMode}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}