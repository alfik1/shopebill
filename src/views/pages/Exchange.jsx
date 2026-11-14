import { useEffect, useRef, useState } from 'react';
import {
  searchSourceBills,
  getSourceBill,
  createExchange,
  listExchanges,
  scanReturn,
  setReturnQty,
  removeReturn,
  scanReplacement,
  updateReplacement,
  removeReplacement,
  completeExchange,
  cancelExchange,
  downloadExchangeReceipt,
} from '../../controllers/exchangeController';

// QR can hold plain text or JSON with a sku, same as Billing
const normalizeCode = (text) => {
  const value = String(text || '').trim();
  try {
    const parsed = JSON.parse(value);
    return parsed.sku || value;
  } catch {
    return value;
  }
};

const money = (n) => `₹${Number(n || 0).toFixed(2)}`;

export default function Exchange() {
  const returnRef = useRef(null);
  const replRef = useRef(null);

  const [stage, setStage] = useState('start'); // start | draft | done
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // start
  const [search, setSearch] = useState('');
  const [bills, setBills] = useState([]);
  const [searched, setSearched] = useState(false);
  const [sourceBill, setSourceBill] = useState(null);
  const [recent, setRecent] = useState([]);

  // draft
  const [exchange, setExchange] = useState(null);
  const [returnCode, setReturnCode] = useState('');
  const [replCode, setReplCode] = useState('');
  const [discountDrafts, setDiscountDrafts] = useState({});

  // settlement
  const [mode, setMode] = useState('cash'); // cash | upi | card | split
  const [reference, setReference] = useState('');
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [splitCard, setSplitCard] = useState('');

  const loadRecent = async () => {
    try {
      setRecent((await listExchanges('completed')).slice(0, 8));
    } catch (e) {
      console.error('[Exchange] recent error', e);
    }
  };

  useEffect(() => {
    loadRecent();
  }, []);

  useEffect(() => {
    if (stage === 'draft') returnRef.current?.focus();
  }, [stage]);

  const run = async (fn) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      console.error('[Exchange] ERROR', err);
      if (err.code === 'quote_changed' && err.exchange) {
        setExchange(err.exchange);
        setNotice('Totals changed. Review the updated amounts and confirm again.');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setBusy(false);
    }
  };

  const resetAll = () => {
    setStage('start');
    setSearch('');
    setBills([]);
    setSearched(false);
    setSourceBill(null);
    setExchange(null);
    setReturnCode('');
    setReplCode('');
    setDiscountDrafts({});
    setMode('cash');
    setReference('');
    setSplitCash('');
    setSplitUpi('');
    setSplitCard('');
    setError('');
    setNotice('');
    loadRecent();
  };

  // ---------- start stage ----------

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    run(async () => {
      setBills(await searchSourceBills(search.trim()));
      setSearched(true);
      setSourceBill(null);
    });
  };

  const pickBill = (bill) =>
    run(async () => {
      setSourceBill(await getSourceBill(bill.id));
    });

  const startExchange = () =>
    run(async () => {
      const draft = await createExchange(sourceBill.id);
      setExchange(draft);
      setStage('draft');
    });

  // ---------- draft stage ----------

  const handleScanReturn = (e) => {
    e.preventDefault();
    const code = normalizeCode(returnCode);
    if (!code) return;
    setReturnCode('');
    run(async () => {
      setExchange(await scanReturn(exchange.id, code, 1));
    }).finally(() => returnRef.current?.focus());
  };

  const handleScanReplacement = (e) => {
    e.preventDefault();
    const code = normalizeCode(replCode);
    if (!code) return;
    setReplCode('');
    run(async () => {
      setExchange(await scanReplacement(exchange.id, code, 1));
    }).finally(() => replRef.current?.focus());
  };

  const changeReturnQty = (line, delta) => {
    const next = line.qty + delta;
    if (next < 1) return;
    run(async () => setExchange(await setReturnQty(exchange.id, line.id, next)));
  };

  const changeReplQty = (line, delta) => {
    const next = line.qty + delta;
    if (next < 1) return;
    run(async () =>
      setExchange(await updateReplacement(exchange.id, line.id, { qty: next }))
    );
  };

  const draftFor = (line) =>
    discountDrafts[line.id] !== undefined
      ? discountDrafts[line.id]
      : String(line.discount ?? 0);

  const saveDiscount = (line) =>
    run(async () => {
      setExchange(
        await updateReplacement(exchange.id, line.id, {
          discount: draftFor(line),
        })
      );
      setDiscountDrafts((p) => {
        const next = { ...p };
        delete next[line.id];
        return next;
      });
    });

  const handleCancelDraft = () =>
    run(async () => {
      await cancelExchange(exchange.id);
      resetAll();
    });

  // ---------- settlement ----------

  const diff = exchange ? exchange.difference : 0;
  const absDiff = Math.abs(diff);
  const splitSum =
    (Number(splitCash) || 0) + (Number(splitUpi) || 0) + (Number(splitCard) || 0);

  const buildSettlements = () => {
    if (absDiff === 0) return [];

    if (mode === 'split') {
      return [
        { method: 'cash', amount: splitCash },
        { method: 'upi', amount: splitUpi, reference },
        { method: 'card', amount: splitCard },
      ];
    }

    return [{ method: mode, amount: absDiff, reference }];
  };

  const handleComplete = () => {
    if (!exchange.returns.length) {
      setError('Scan at least one returned product');
      return;
    }
    if (!exchange.replacements.length) {
      setError('Scan at least one replacement product');
      return;
    }
    if (absDiff > 0 && mode === 'split' && Math.abs(splitSum - absDiff) > 0.004) {
      setError(`Split amounts must add up to ${money(absDiff)}`);
      return;
    }

    run(async () => {
      const done = await completeExchange(exchange.id, diff, buildSettlements());
      setExchange(done);
      setStage('done');
    });
  };

  const handleReceipt = (id) =>
    run(async () => {
      await downloadExchangeReceipt(id);
    });

  // ---------- render ----------

  return (
    <div className="exchange-page">
      <div className="page-head">
        <div className="card-title">Exchange</div>
        {stage === 'draft' && (
          <button
            className="btn btn-outline"
            type="button"
            onClick={handleCancelDraft}
            disabled={busy}
          >
            Cancel Exchange
          </button>
        )}
      </div>

      {error && <div className="error-text">{error}</div>}
      {notice && <div className="exchange-notice">{notice}</div>}

      {/* ================= START ================= */}
      {stage === 'start' && (
        <>
          <form className="form-panel" onSubmit={handleSearch}>
            <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div className="form-group">
                <label>Find Original Bill</label>
                <input
                  className="input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Receipt number, customer name or phone"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={busy}>
                  Search
                </button>
              </div>
            </div>
          </form>

          {searched && bills.length === 0 && (
            <div className="card" style={{ color: '#777' }}>No paid bills found.</div>
          )}

          {bills.length > 0 && !sourceBill && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Paid Bills</div>
              <div className="exchange-list">
                {bills.map((b) => (
                  <button key={b.id} type="button" className="exchange-row" onClick={() => pickBill(b)}>
                    <div>
                      <strong>{b.billNo}</strong>
                      <div className="exchange-sub">
                        {b.customerName || 'Walk In'} {b.customerPhone && `• ${b.customerPhone}`}
                      </div>
                    </div>
                    <strong>{money(b.total)}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sourceBill && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Bill {sourceBill.billNo}</div>
              <div className="exchange-sub" style={{ marginBottom: 12 }}>
                {sourceBill.customerName || 'Walk In'} {sourceBill.customerPhone && `• ${sourceBill.customerPhone}`}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Barcode</th>
                      <th>Bought</th>
                      <th>Returned</th>
                      <th>Returnable</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceBill.items.map((i) => (
                      <tr key={i.id}>
                        <td>{i.name}</td>
                        <td>{i.barcode}</td>
                        <td>{i.qty}</td>
                        <td>{i.returnedQty}</td>
                        <td>{i.returnableQty}</td>
                        <td>{money(i.returnableAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" style={{ width: 'auto' }} type="button" onClick={startExchange} disabled={busy}>
                  Start Exchange
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setSourceBill(null)}>
                  Back
                </button>
              </div>
            </div>
          )}

          {recent.length > 0 && !sourceBill && (
            <div className="card">
              <div className="card-title">Recent Exchanges</div>
              <div className="exchange-list">
                {recent.map((x) => (
                  <div key={x.id} className="exchange-row static">
                    <div>
                      <strong>{x.exchangeNo}</strong>
                      <div className="exchange-sub">
                        Bill {x.originalBillNo} • {x.difference >= 0 ? 'Collected' : 'Refunded'} {money(Math.abs(x.difference))}
                      </div>
                    </div>
                    <button className="btn btn-outline" type="button" style={{ fontSize: 12 }} onClick={() => handleReceipt(x.id)}>
                      Receipt
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= DRAFT ================= */}
      {stage === 'draft' && exchange && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="scanned-grid">
              <div>
                <span className="scan-label">Exchange No</span>
                <div className="scan-value">{exchange.exchangeNo}</div>
              </div>
              <div>
                <span className="scan-label">Original Bill</span>
                <div className="scan-value">{exchange.originalBillNo}</div>
              </div>
              <div>
                <span className="scan-label">Status</span>
                <div className="scan-value">{exchange.status}</div>
              </div>
            </div>
          </div>

          <div className="exchange-columns">
            {/* ---- RETURNS ---- */}
            <div className="card">
              <div className="card-title">Returned Products</div>
              <form onSubmit={handleScanReturn} className="exchange-scan">
                <input
                  ref={returnRef}
                  className="input"
                  value={returnCode}
                  onChange={(e) => setReturnCode(e.target.value)}
                  placeholder="Scan returned QR / barcode"
                />
                <button className="btn btn-outline" type="submit" disabled={busy}>Add</button>
              </form>

              {exchange.returns.length === 0 && <div className="exchange-empty">No returned items yet.</div>}

              {exchange.returns.map((l) => (
                <div className="exchange-line" key={l.id}>
                  <div className="exchange-line-main">
                    <strong>{l.name}</strong>
                    <div className="exchange-sub">
                      {l.barcode} • Credit {money(l.credited)}
                      {!l.isReturnable && <span className="exchange-bad"> • No longer returnable</span>}
                    </div>
                  </div>
                  <div className="exchange-qty">
                    <button type="button" className="btn btn-outline" disabled={busy || l.qty <= 1} onClick={() => changeReturnQty(l, -1)}>−</button>
                    <span>{l.qty}</span>
                    <button type="button" className="btn btn-outline" disabled={busy} onClick={() => changeReturnQty(l, 1)}>+</button>
                    <button
                      type="button"
                      className="btn btn-outline exchange-remove"
                      disabled={busy}
                      onClick={() => run(async () => setExchange(await removeReturn(exchange.id, l.id)))}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ---- REPLACEMENTS ---- */}
            <div className="card">
              <div className="card-title">Replacement Products</div>
              <form onSubmit={handleScanReplacement} className="exchange-scan">
                <input
                  ref={replRef}
                  className="input"
                  value={replCode}
                  onChange={(e) => setReplCode(e.target.value)}
                  placeholder="Scan replacement QR / barcode"
                />
                <button className="btn btn-outline" type="submit" disabled={busy}>Add</button>
              </form>

              {exchange.replacements.length === 0 && <div className="exchange-empty">No replacement items yet.</div>}

              {exchange.replacements.map((l) => (
                <div className="exchange-line" key={l.id}>
                  <div className="exchange-line-main">
                    <strong>{l.name}</strong>
                    <div className="exchange-sub">
                      {l.barcode} • {money(l.unitPrice)} each • Total {money(l.lineTotal)}
                    </div>
                    <div className="exchange-discount">
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={draftFor(l)}
                        onChange={(e) => setDiscountDrafts((p) => ({ ...p, [l.id]: e.target.value }))}
                        disabled={busy}
                      />
                      <button type="button" className="btn btn-outline" disabled={busy} onClick={() => saveDiscount(l)}>
                        Discount
                      </button>
                    </div>
                  </div>
                  <div className="exchange-qty">
                    <button type="button" className="btn btn-outline" disabled={busy || l.qty <= 1} onClick={() => changeReplQty(l, -1)}>−</button>
                    <span>{l.qty}</span>
                    <button type="button" className="btn btn-outline" disabled={busy} onClick={() => changeReplQty(l, 1)}>+</button>
                    <button
                      type="button"
                      className="btn btn-outline exchange-remove"
                      disabled={busy}
                      onClick={() => run(async () => setExchange(await removeReplacement(exchange.id, l.id)))}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- QUOTE + SETTLEMENT ---- */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">Summary</div>
            <div className="exchange-totals">
              <div><span>Returned total</span><strong>{money(exchange.returnedTotal)}</strong></div>
              <div><span>Replacement total</span><strong>{money(exchange.replacementTotal)}</strong></div>
              <div><span>Credit applied</span><strong>{money(exchange.creditApplied)}</strong></div>
              <div className={`exchange-diff ${diff > 0 ? 'collect' : diff < 0 ? 'refund' : ''}`}>
                <span>{diff > 0 ? 'Customer pays' : diff < 0 ? 'Refund to customer' : 'Equal exchange'}</span>
                <strong>{money(absDiff)}</strong>
              </div>
            </div>

            {absDiff > 0 && (
              <div className="form-panel" style={{ marginTop: 16, marginBottom: 0 }}>
                <div className="form-group">
                  <label>{diff > 0 ? 'Payment Type' : 'Refund Type'}</label>
                  <div className="radio-row">
                    {['cash', 'upi', 'card', 'split'].map((m) => (
                      <label className="radio-option" key={m}>
                        <input type="radio" name="settleMode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                        {m === 'split' ? 'Split' : m.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>

                {mode === 'split' && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Cash (₹)</label>
                      <input className="input" type="number" min="0" step="0.01" value={splitCash} onChange={(e) => setSplitCash(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>UPI (₹)</label>
                      <input className="input" type="number" min="0" step="0.01" value={splitUpi} onChange={(e) => setSplitUpi(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Card (₹)</label>
                      <input className="input" type="number" min="0" step="0.01" value={splitCard} onChange={(e) => setSplitCard(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Split Total</label>
                      <div
                        className="input"
                        style={{
                          background: '#F4F6FB',
                          color: Math.abs(splitSum - absDiff) < 0.005 ? undefined : '#E74C3C',
                        }}
                      >
                        {money(splitSum)} / {money(absDiff)}
                      </div>
                    </div>
                  </div>
                )}

                {(mode === 'upi' || mode === 'split') && (
                  <div className="form-group">
                    <label>UPI Reference (optional)</label>
                    <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UPI transaction id" />
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: 'auto', marginTop: 16 }}
              type="button"
              onClick={handleComplete}
              disabled={busy}
            >
              Complete Exchange
            </button>
          </div>
        </>
      )}

      {/* ================= DONE ================= */}
      {stage === 'done' && exchange && (
        <div className="card">
          <div className="success-banner">Exchange completed</div>
          <div className="scanned-grid">
            <div>
              <span className="scan-label">Exchange No</span>
              <div className="scan-value">{exchange.exchangeNo}</div>
            </div>
            <div>
              <span className="scan-label">{exchange.difference >= 0 ? 'Collected' : 'Refunded'}</span>
              <div className="scan-value">{money(Math.abs(exchange.difference))}</div>
            </div>
            <div>
              <span className="scan-label">Replacement Total</span>
              <div className="scan-value">{money(exchange.replacementTotal)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-scan" type="button" onClick={() => handleReceipt(exchange.id)}>
              Download Receipt
            </button>
            <button className="btn btn-primary" style={{ width: 'auto' }} type="button" onClick={resetAll}>
              New Exchange
            </button>
          </div>
        </div>
      )}
    </div>
  );
}