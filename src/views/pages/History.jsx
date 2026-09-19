import { useEffect, useState } from 'react';
import { getHistory } from '../../controllers/historyController';
import { downloadReceipt } from '../../controllers/billController';

export default function History() {
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ========================================================
  // LOAD HISTORY
  // ========================================================

  const loadHistory = async () => {
    console.log('########################################');
    console.log('[History] LOAD HISTORY START');
    console.log('[History] Filters:', { status, search });

    setLoading(true);
    setError('');

    try {
      const data = await getHistory({ status, search: search.trim() });

      console.log('[History] History loaded:', data);

      console.log('[History] History count:', data.length);

      setHistory(data);
    } catch (err) {
      console.error('[History] LOAD HISTORY ERROR:', err);

      setHistory([]);

      setError(err?.message || 'Failed to load billing history');
    } finally {
      setLoading(false);

      console.log('[History] LOAD HISTORY END');
      console.log('########################################');
    }
  };

  // Load on mount and whenever the status filter changes
  useEffect(() => {
    console.log('[History] Loading, status filter:', status);

    loadHistory();
  }, [status]);

  const handleSearch = (e) => {
    e.preventDefault();

    loadHistory();
  };

  const handleReceipt = async (id) => {
    console.log('[History] Download receipt:', id);

    setError('');

    try {
      await downloadReceipt(id);
    } catch (err) {
      console.error('[History] RECEIPT ERROR:', err);

      setError(err?.message || 'Failed to download receipt');
    }
  };

  return (
    <div className="card">
      <div className="card-title">Billing History</div>
      <div className="card-sub">All past transactions</div>

      <form
        onSubmit={handleSearch}
        style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}
      >
        <input
          className="input"
          style={{ flex: '1 1 200px', width: 'auto' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer or bill no"
        />
        <select
          className="select"
          style={{ width: 'auto' }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="paid">Paid</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn btn-outline" type="submit">
          Search
        </button>
      </form>

      {error && <div className="error-text">{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ color: '#777' }}>
                  Loading...
                </td>
              </tr>
            )}
            {!loading && history.length === 0 && (
              <tr>
                <td colSpan={7} style={{ color: '#777' }}>
                  No bills found.
                </td>
              </tr>
            )}
            {!loading &&
              history.map((h) => (
                <tr key={h.id}>
                  <td>{h.number}</td>
                  <td>{h.date}</td>
                  <td>{h.customer}</td>
                  <td>{h.items}</td>
                  <td>₹{h.amount}</td>
                  <td>
                    <span className={`badge ${h.statusKey === 'paid' ? 'badge-success' : 'badge-pending'}`}>
                      {h.status}
                    </span>
                  </td>
                  <td>
                    {h.statusKey === 'paid' && (
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: 12 }}
                        type="button"
                        onClick={() => handleReceipt(h.id)}
                      >
                        Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}