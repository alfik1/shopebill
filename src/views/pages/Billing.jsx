import { useEffect, useRef, useState } from 'react';
import {
  createBill,
  scanItem,
  updateItemQty,
  updateItemDiscount,
  payBill,
  cancelBill,
  downloadReceipt,
  searchCustomers,
} from '../../controllers/billController';

const emptyCustomer = { name: '', phone: '' };

// QR can hold plain text or JSON with a sku, same as Add Product
const normalizeCode = (text) => {
  const value = String(text || '').trim();

  try {
    const parsed = JSON.parse(value);

    return parsed.sku || value;
  } catch {
    return value;
  }
};

export default function Billing() {
  const scanRef = useRef(null);

  const [customer, setCustomer] = useState(emptyCustomer);
  const [bill, setBill] = useState(null);
  const [paidBill, setPaidBill] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [mixedCashAmount, setMixedCashAmount] = useState('');
  const [mixedUpiAmount, setMixedUpiAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ========================================================
  // CUSTOMER SEARCH
  // ========================================================

  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    const query = customerQuery.trim();

    if (!query) {
      setCustomerResults([]);
      setSearchingCustomers(false);
      return undefined;
    }

    setSearchingCustomers(true);

    const timer = setTimeout(async () => {
      console.log('[Billing] CUSTOMER SEARCH:', query);

      try {
        const results = await searchCustomers(query);

        setCustomerResults(results);
      } catch (err) {
        console.error('[Billing] CUSTOMER SEARCH ERROR:', err);

        setCustomerResults([]);
      } finally {
        setSearchingCustomers(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [customerQuery]);

  const handlePickCustomer = (picked) => {
    console.log('[Billing] Customer picked:', picked);

    setCustomer({ ...customer, name: picked.name, phone: picked.phone });
    setCustomerQuery('');
    setCustomerResults([]);
    setShowCustomerDropdown(false);
  };

  // ========================================================
  // ITEM DISCOUNT (per line item)
  // ========================================================

  const [itemDiscountDrafts, setItemDiscountDrafts] = useState({});

  const getDiscountDraft = (item) =>
    itemDiscountDrafts[item.id] !== undefined
      ? itemDiscountDrafts[item.id]
      : String(item.discount ?? 0);

  const setDiscountDraft = (itemId, value) => {
    setItemDiscountDrafts((prev) => ({ ...prev, [itemId]: value }));
  };

  const saveItemDiscount = async (item) => {
    const value = getDiscountDraft(item);

    console.log('[Billing] SAVE ITEM DISCOUNT', item.id, value);

    setError('');
    setBusy(true);

    try {
      const updated = await updateItemDiscount(bill.id, item.id, value, item.qty);

      setBill(updated);

      setItemDiscountDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } catch (err) {
      console.error('[Billing] SAVE ITEM DISCOUNT ERROR:', err);

      setError(err?.message || 'Failed to update discount');
    } finally {
      setBusy(false);
    }
  };

  // Keep the amount in sync with the bill total
  useEffect(() => {
    if (bill) {
      setAmount(String(bill.total));
    }
  }, [bill?.total]);

  // Keep mixed cash/UPI split in sync with the bill total (default: all in cash)
  useEffect(() => {
    if (bill) {
      setMixedCashAmount(String(bill.total));
      setMixedUpiAmount('0');
    }
  }, [bill?.total]);

  // USB QR scanner: it types like a keyboard. While a bill is open, if nothing
  // is focused when the scan starts, send the typing to the scan field
  const hasBill = Boolean(bill);

  useEffect(() => {
    if (!hasBill) {
      return undefined;
    }

    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;

      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) {
        return;
      }

      console.log('[Billing] Scanner input detected, focusing scan field');

      scanRef.current?.focus();

      scanRef.current?.select();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [hasBill]);

  const resetAll = () => {
    setCustomer(emptyCustomer);
    setBill(null);
    setPaidBill(null);
    setBarcode('');
    setPaymentType('Cash');
    setReference('');
    setAmount('');
    setMixedCashAmount('');
    setMixedUpiAmount('');
    setError('');
    setCustomerQuery('');
    setCustomerResults([]);
    setShowCustomerDropdown(false);
    setItemDiscountDrafts({});
  };

  const focusScan = () => {
    console.log('[Billing] Ready for QR reader, scan field focused');

    scanRef.current?.focus();
    scanRef.current?.select();
  };

  // ========================================================
  // START BILL (create draft)
  // ========================================================

  const handleStart = async (e) => {
    e.preventDefault();

    console.log('########################################');
    console.log('[Billing] START BILL');

    setError('');
    setBusy(true);

    try {
      const created = await createBill({
        customerName: customer.name,
        customerPhone: customer.phone,
        discount: '0',
      });

      console.log('[Billing] Draft bill created:', created);

      setBill(created);
    } catch (err) {
      console.error('[Billing] START BILL ERROR:', err);

      setError(err?.message || 'Failed to create bill');
    } finally {
      setBusy(false);
    }
  };

  // ========================================================
  // ADD ITEM (scan)
  // ========================================================

  const handleAddItem = async (e) => {
    e.preventDefault();

    const code = normalizeCode(barcode);

    console.log('[Billing] ADD ITEM code:', code);

    if (!code) {
      return;
    }

    // Clear now so the next scan does not mix with this one
    setBarcode('');
    setError('');
    setBusy(true);

    try {
      const updated = await scanItem(bill.id, code, 1);

      console.log('[Billing] Bill after scan:', updated);

      setBill(updated);
    } catch (err) {
      console.error('[Billing] ADD ITEM ERROR:', err);

      setError(err?.message || 'No product found for this code');
    } finally {
      setBusy(false);

      scanRef.current?.focus();
    }
  };

  // ========================================================
  // CHANGE QTY
  // ========================================================

  const changeQty = async (item, delta) => {
    const next = item.qty + delta;

    if (next < 1) {
      return;
    }

    console.log('[Billing] CHANGE QTY item:', item.id, 'to', next);

    setError('');
    setBusy(true);

    try {
      const updated = await updateItemQty(bill.id, item.id, next);

      setBill(updated);
    } catch (err) {
      console.error('[Billing] CHANGE QTY ERROR:', err);

      setError(err?.message || 'Failed to update quantity');
    } finally {
      setBusy(false);
    }
  };

  // ========================================================
  // PAY
  // ========================================================

  const handlePay = async (e) => {
    e.preventDefault();

    console.log('########################################');
    console.log('[Billing] PAY START');

    setError('');

    if (!bill.items.length) {
      setError('Scan at least one product first');
      return;
    }

    if (paymentType === 'Mixed') {
      const cashAmt = Number(mixedCashAmount) || 0;
      const upiAmt = Number(mixedUpiAmount) || 0;

      if (cashAmt <= 0 && upiAmt <= 0) {
        setError('Enter at least one split amount for mixed payment');
        return;
      }
    }

    setBusy(true);

    try {
      const paid = await payBill(bill.id, {
        method: paymentType,
        amount,
        reference,
        mixedPayments:
          paymentType === 'Mixed'
            ? [
                { method: 'cash', amount: mixedCashAmount },
                { method: 'upi', amount: mixedUpiAmount },
              ]
            : null,
      });

      console.log('[Billing] Bill paid:', paid);

      setPaidBill(paid || { ...bill, status: 'paid' });
      setBill(null);
      setBarcode('');
      setReference('');
    } catch (err) {
      console.error('[Billing] PAY ERROR:', err);

      setError(err?.message || 'Payment failed');
    } finally {
      setBusy(false);

      console.log('[Billing] PAY END');
      console.log('########################################');
    }
  };

  // ========================================================
  // CANCEL
  // ========================================================

  const handleCancel = async () => {
    console.log('[Billing] CANCEL BILL:', bill.id);

    setError('');
    setBusy(true);

    try {
      await cancelBill(bill.id);

      resetAll();
    } catch (err) {
      console.error('[Billing] CANCEL ERROR:', err);

      setError(err?.message || 'Failed to cancel bill');
    } finally {
      setBusy(false);
    }
  };

  // ========================================================
  // RECEIPT
  // ========================================================

  const handleReceipt = async () => {
    setError('');

    try {
      await downloadReceipt(paidBill.id);
    } catch (err) {
      console.error('[Billing] RECEIPT ERROR:', err);

      setError(err?.message || 'Failed to download receipt');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div className="card-title">Create Bill</div>
        {bill && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-scan" type="button" onClick={focusScan}>
              📷 Scan Product QR
            </button>
            <button className="btn btn-outline" type="button" onClick={handleCancel} disabled={busy}>
              Cancel Bill
            </button>
          </div>
        )}
      </div>

      {error && <div className="error-text">{error}</div>}

      {/* ---------- PAID ---------- */}

      {paidBill && (
        <div className="card">
          <div className="success-banner">Bill paid successfully</div>
          <div className="scanned-grid">
            <div>
              <span className="scan-label">Bill No</span>
              <div className="scan-value">{paidBill.number}</div>
            </div>
            <div>
              <span className="scan-label">Customer</span>
              <div className="scan-value">{paidBill.customerName}</div>
            </div>
            <div>
              <span className="scan-label">Total</span>
              <div className="scan-value">₹{paidBill.total}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-scan" type="button" onClick={handleReceipt}>
              Download Receipt
            </button>
            <button className="btn btn-primary" style={{ width: 'auto' }} type="button" onClick={resetAll}>
              New Bill
            </button>
          </div>
        </div>
      )}

      {/* ---------- START BILL ---------- */}

      {!bill && !paidBill && (
        <>
          <div className="form-panel" style={{ marginBottom: 16, position: 'relative' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Search Existing Customer</label>
              <input
                className="input"
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                placeholder="Search by customer name or phone"
              />

              {showCustomerDropdown && customerQuery.trim() && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    marginTop: 6,
                    padding: 8,
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  {searchingCustomers && (
                    <div style={{ padding: 8, fontSize: 13, color: '#8A8A94' }}>Searching...</div>
                  )}

                  {!searchingCustomers && customerResults.length === 0 && (
                    <div style={{ padding: 8, fontSize: 13, color: '#8A8A94' }}>No matching customers</div>
                  )}

                  {!searchingCustomers &&
                    customerResults.map((c, index) => (
                      <div
                        key={`${c.name}-${c.phone}-${index}`}
                        onClick={() => handlePickCustomer(c)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          fontSize: 13,
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div style={{ fontWeight: 700 }}>{c.name || '(no name)'}</div>
                        {c.phone && <div style={{ color: '#8A8A94', fontSize: 12 }}>{c.phone}</div>}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <form className="form-panel" onSubmit={handleStart}>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  className="input"
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Customer Phone</label>
                <input
                  className="input"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: 'auto' }} type="submit" disabled={busy}>
              Start Bill
            </button>
          </form>
        </>
      )}

      {/* ---------- OPEN BILL ---------- */}

      {bill && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Bill Details</div>
            <div className="scanned-grid">
              <div>
                <span className="scan-label">Bill No</span>
                <div className="scan-value">{bill.number}</div>
              </div>
              <div>
                <span className="scan-label">Customer</span>
                <div className="scan-value">{bill.customerName}</div>
              </div>
              <div>
                <span className="scan-label">Phone</span>
                <div className="scan-value">{bill.customerPhone || '-'}</div>
              </div>
              <div>
                <span className="scan-label">Discount</span>
                <div className="scan-value">₹{bill.discount}</div>
              </div>
              <div>
                <span className="scan-label">Status</span>
                <div className="scan-value">{bill.status}</div>
              </div>
            </div>
          </div>

          <form className="form-panel" onSubmit={handleAddItem} style={{ marginBottom: 16 }}>
            <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div className="form-group">
                <label>SKU / QR Code</label>
                <input
                  ref={scanRef}
                  className="input"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan QR with reader or type code"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-outline" type="submit" style={{ width: '100%' }} disabled={busy}>
                  Add Item
                </button>
              </div>
            </div>
          </form>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Items</div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Discount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ color: '#777' }}>
                        No items yet. Scan a product QR.
                      </td>
                    </tr>
                  )}
                  {bill.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.sku}</td>
                      <td>₹{item.unitPrice}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            className="btn btn-outline"
                            style={{ fontSize: 12, padding: '4px 10px' }}
                            type="button"
                            disabled={busy || item.qty <= 1}
                            onClick={() => changeQty(item, -1)}
                          >
                            −
                          </button>
                          <span>{item.qty}</span>
                          <button
                            className="btn btn-outline"
                            style={{ fontSize: 12, padding: '4px 10px' }}
                            type="button"
                            disabled={busy}
                            onClick={() => changeQty(item, 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={getDiscountDraft(item)}
                            onChange={(e) => setDiscountDraft(item.id, e.target.value)}
                            style={{ width: 80, fontSize: 12, padding: '6px 8px' }}
                            disabled={busy}
                          />
                          <button
                            className="btn btn-outline"
                            style={{ fontSize: 12, padding: '4px 10px' }}
                            type="button"
                            disabled={busy}
                            onClick={() => saveItemDiscount(item)}
                          >
                            Save
                          </button>
                        </div>
                      </td>
                      <td>₹{item.lineTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, textAlign: 'right', fontSize: 13 }}>
              <div>Subtotal: ₹{bill.subtotal}</div>
              <div>Discount: ₹{bill.discount}</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>Total: ₹{bill.total}</div>
            </div>
          </div>

          <form className="form-panel" onSubmit={handlePay}>
            <div className="form-row">
              {paymentType !== 'Mixed' && (
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Payment Type</label>
                <div className="radio-row">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="paymentType"
                      value="Cash"
                      checked={paymentType === 'Cash'}
                      onChange={(e) => setPaymentType(e.target.value)}
                    />
                    Cash
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="paymentType"
                      value="UPI"
                      checked={paymentType === 'UPI'}
                      onChange={(e) => setPaymentType(e.target.value)}
                    />
                    UPI
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="paymentType"
                      value="Mixed"
                      checked={paymentType === 'Mixed'}
                      onChange={(e) => setPaymentType(e.target.value)}
                    />
                    Mixed
                  </label>
                </div>
              </div>
              {paymentType === 'UPI' && (
                <div className="form-group">
                  <label>Reference</label>
                  <input
                    className="input"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="UPI transaction id"
                  />
                </div>
              )}
            </div>

            {paymentType === 'Mixed' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Cash Amount (₹)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={mixedCashAmount}
                    onChange={(e) => setMixedCashAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>UPI Amount (₹)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={mixedUpiAmount}
                    onChange={(e) => setMixedUpiAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Combined Total</label>
                  <div
                    className="input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#F4F6FB',
                      color: (Number(mixedCashAmount) || 0) + (Number(mixedUpiAmount) || 0) === Number(bill.total)
                        ? undefined
                        : '#E74C3C',
                    }}
                  >
                    ₹{((Number(mixedCashAmount) || 0) + (Number(mixedUpiAmount) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: 'auto' }} type="submit" disabled={busy}>
              Pay Bill
            </button>
          </form>
        </>
      )}
    </div>
  );
}