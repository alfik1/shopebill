import { useEffect, useRef, useState } from 'react';
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deactivateExpenseCategory,
  getExpenses,
  getExpenseSummary,
  addExpense,
  updateExpense,
  deleteExpense,
} from '../../controllers/expenseController';

// ==========================================================
// HELPERS
// ==========================================================

const pad = (n) => String(n).padStart(2, '0');

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const thisMonth = () => todayIso().slice(0, 7);

const money = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// 'YYYY-MM-DD...' -> '8 Nov 2026' (no timezone shift)
const formatDay = (value) => {

  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return value || '-';

  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
};

// Page numbers with ellipsis: 1 ... 4 5 6 ... 12
const buildPageList = (current, total) => {

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [1];

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('...');

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (end < total - 1) pages.push('...');

  pages.push(total);

  return pages;
};

const PAGE_SIZES = [10, 20, 50];

const CARD_COLORS = ['#C9BFFF', '#B7D1F7', '#BFEBD0', '#C6F135'];


export default function Expenses() {

  // ---------- filter ----------
  const [period, setPeriod] = useState('month');
  const [month, setMonth] = useState(thisMonth());
  const [date, setDate] = useState(todayIso());
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());

  // ---------- data ----------
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---------- pagination ----------
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const listRef = useRef(null);

  // ---------- expense form ----------
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: null,
    categoryId: '',
    amount: '',
    note: '',
    date: todayIso(),
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ---------- category manager ----------
  const [showCategories, setShowCategories] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);

  // Ignores old responses when the filter changes quickly
  const requestId = useRef(0);


  // ========================================================
  // LOAD CATEGORIES
  // ========================================================

  const loadCategories = async () => {

    console.log('########################################');
    console.log('[Expenses] LOAD CATEGORIES START');

    try {

      const result = await getExpenseCategories();

      setCategories(result.items);

    } catch (err) {

      console.error('[Expenses] LOAD CATEGORIES ERROR:', err);

      setCategories([]);

    } finally {

      console.log('[Expenses] LOAD CATEGORIES END');
      console.log('########################################');
    }
  };


  // ========================================================
  // LOAD EXPENSES + SUMMARY
  // ========================================================

  const loadExpenses = async () => {

    const currentRequest = ++requestId.current;

    const filter = { period, month, date, startDate, endDate };

    console.log('########################################');
    console.log('[Expenses] LOAD EXPENSES START', filter);

    setLoading(true);
    setError('');

    try {

      const [list, sum] = await Promise.all([
        getExpenses(filter),
        getExpenseSummary(filter).catch((err) => {
          // summary failing should not hide the list
          console.warn('[Expenses] Summary failed, using list totals:', err);
          return null;
        }),
      ]);

      if (currentRequest !== requestId.current) return;

      setExpenses(list.rows);

      setSummary(sum);

    } catch (err) {

      if (currentRequest !== requestId.current) return;

      console.error('[Expenses] LOAD EXPENSES ERROR:', err);

      setExpenses([]);
      setSummary(null);

      setError(err.message || 'Could not load expenses');

    } finally {

      if (currentRequest === requestId.current) {
        setLoading(false);
      }

      console.log('[Expenses] LOAD EXPENSES END');
      console.log('########################################');
    }
  };


  useEffect(() => {
    loadCategories();
  }, []);


  useEffect(() => {

    if (period === 'month' && !month) return;
    if (period === 'date' && !date) return;

    if (period === 'range') {

      if (!startDate || !endDate) return;

      if (startDate > endDate) {
        setError('Start date must be before end date');
        return;
      }
    }

    // new filter -> back to the first page
    setPage(1);

    loadExpenses();

  }, [period, month, date, startDate, endDate]);


  // ========================================================
  // DERIVED VALUES
  // ========================================================

  const activeCategories = categories.filter((c) => c.active);

  const categoryNameFor = (expense) =>
    expense.categoryName ||
    categories.find((c) => String(c.id) === String(expense.categoryId))?.name ||
    'Uncategorized';

  const sortedExpenses = [...expenses].sort((a, b) => {

    if (a.date !== b.date) return a.date < b.date ? 1 : -1;

    return Number(b.id) - Number(a.id);
  });

  const rowsTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const totalAmount = summary?.total ?? rowsTotal;

  const entryCount = summary?.count ?? expenses.length;

  // Breakdown by category: from the summary API if present, else from ALL rows
  const breakdown = (() => {

    if (summary?.byCategory?.length) {
      return summary.byCategory;
    }

    const grouped = {};

    expenses.forEach((e) => {

      const name = categoryNameFor(e);

      grouped[name] = grouped[name] || { name, amount: 0, count: 0 };

      grouped[name].amount += e.amount;

      grouped[name].count += 1;
    });

    return Object.values(grouped).sort((a, b) => b.amount - a.amount);
  })();

  const topCategory = [...breakdown].sort((a, b) => b.amount - a.amount)[0];

  const filterLabel =
    period === 'month'
      ? month
      : period === 'date'
        ? formatDay(date)
        : `${formatDay(startDate)} - ${formatDay(endDate)}`;


  // ---------- pagination values ----------
  const totalRows = sortedExpenses.length;

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const safePage = Math.min(page, totalPages);

  const pageStartIndex = (safePage - 1) * pageSize;

  const pageRows = sortedExpenses.slice(
    pageStartIndex,
    pageStartIndex + pageSize
  );

  const rangeStart = totalRows === 0 ? 0 : pageStartIndex + 1;

  const rangeEnd = pageStartIndex + pageRows.length;

  const pageList = buildPageList(safePage, totalPages);

  const goToPage = (next) => {

    const target = Math.min(Math.max(next, 1), totalPages);

    console.log('[Expenses] Go to page:', target, 'of', totalPages);

    setPage(target);

    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  // ========================================================
  // EXPENSE FORM
  // ========================================================

  const openAdd = () => {

    setFormError('');

    setForm({
      id: null,
      categoryId: activeCategories[0]?.id ?? '',
      amount: '',
      note: '',
      date: period === 'date' ? date : todayIso(),
    });

    setShowForm(true);
  };

  const openEdit = (expense) => {

    setFormError('');

    setForm({
      id: expense.id,
      categoryId: expense.categoryId,
      amount: String(expense.amount),
      note: expense.note,
      date: String(expense.date).slice(0, 10),
    });

    setShowForm(true);
  };

  const saveExpense = async () => {

    if (!form.categoryId) {
      setFormError('Choose a category');
      return;
    }

    if (!(Number(form.amount) > 0)) {
      setFormError('Enter an amount greater than 0');
      return;
    }

    if (!form.date) {
      setFormError('Choose a date');
      return;
    }

    console.log('########################################');
    console.log('[Expenses] SAVE EXPENSE START', form);

    setSaving(true);
    setFormError('');

    try {

      if (form.id) {
        await updateExpense(form.id, form);
      } else {
        await addExpense(form);
      }

      setShowForm(false);

      await loadExpenses();

    } catch (err) {

      console.error('[Expenses] SAVE EXPENSE ERROR:', err);

      setFormError(err.message || 'Could not save expense');

    } finally {

      setSaving(false);

      console.log('[Expenses] SAVE EXPENSE END');
      console.log('########################################');
    }
  };

  const removeExpense = async (expense) => {

    if (!window.confirm(`Delete this expense (${money(expense.amount)})?`)) {
      return;
    }

    console.log('[Expenses] DELETE EXPENSE', expense.id);

    try {

      await deleteExpense(expense.id);

      await loadExpenses();

    } catch (err) {

      console.error('[Expenses] DELETE EXPENSE ERROR:', err);

      setError(err.message || 'Could not delete expense');
    }
  };


  // ========================================================
  // CATEGORY MANAGER
  // ========================================================

  const runCategoryAction = async (action) => {

    setCategoryBusy(true);
    setCategoryError('');

    try {

      await action();

      await loadCategories();

    } catch (err) {

      console.error('[Expenses] CATEGORY ACTION ERROR:', err);

      setCategoryError(err.message || 'Something went wrong');

    } finally {

      setCategoryBusy(false);
    }
  };

  const handleCreateCategory = () => {

    const name = newCategory.trim();

    if (!name) {
      setCategoryError('Enter a category name');
      return;
    }

    runCategoryAction(async () => {
      await createExpenseCategory(name);
      setNewCategory('');
    });
  };

  const handleRenameCategory = (id) => {

    const name = editingName.trim();

    if (!name) {
      setCategoryError('Enter a category name');
      return;
    }

    runCategoryAction(async () => {
      await updateExpenseCategory(id, name);
      setEditingId(null);
      setEditingName('');
    });
  };

  const handleDeactivateCategory = (category) => {

    if (!window.confirm(`Deactivate "${category.name}"?`)) return;

    runCategoryAction(() => deactivateExpenseCategory(category.id));
  };


  // ========================================================
  // UI
  // ========================================================

  return (
    <div style={{ width: '100%', minWidth: 0 }}>

      <style>{`
        .ex-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .ex-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ex-filter {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ex-filter .input {
          width: 170px;
          height: 42px;
          border-radius: 12px;
        }

        .ex-btn {
          height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
        }

        .ex-btn-lime {
          background: var(--primary);
          color: var(--dark);
        }

        .ex-btn-lime:hover {
          background: var(--primary-dark);
        }

        .ex-btn-light {
          background: var(--white);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .ex-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ex-error {
          color: var(--danger);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .ex-content {
          transition: opacity 0.15s ease;
        }

        .ex-content.dim {
          opacity: 0.55;
          pointer-events: none;
        }

        .ex-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 24px 0 14px;
          font-size: 16px;
          font-weight: 800;
          scroll-margin-top: 90px;
        }

        .ex-section small {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
        }

        .ex-empty {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 40px 16px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--muted);
        }

        .ex-empty span {
          display: block;
          font-size: 28px;
          margin-bottom: 8px;
        }

        /* ---------- breakdown ---------- */
        .ex-break-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
        }

        .ex-break {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
        }

        .ex-break .b-name {
          font-size: 12px;
          font-weight: 800;
          color: var(--muted);
          word-break: break-word;
        }

        .ex-break .b-amount {
          font-size: 20px;
          font-weight: 800;
          margin-top: 6px;
        }

        .ex-break .b-count {
          font-size: 11px;
          color: var(--muted);
          margin-top: 2px;
        }

        /* ---------- list ---------- */
        .ex-chip {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          background: var(--bg);
          color: var(--text);
        }

        .ex-amount {
          font-weight: 800;
        }

        .ex-actions {
          display: flex;
          gap: 8px;
        }

        .ex-mini {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          background: var(--white);
          border: 1px solid var(--border);
          color: var(--text);
        }

        .ex-mini.danger {
          color: var(--danger);
        }

        .ex-tiles {
          display: none;
        }

        .ex-tile {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px;
          margin-bottom: 10px;
        }

        .ex-tile-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .ex-tile-title {
          font-size: 14px;
          font-weight: 700;
          word-break: break-word;
        }

        .ex-tile-sub {
          font-size: 11px;
          color: var(--muted);
          margin-top: 6px;
          word-break: break-word;
        }

        .ex-tile-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        /* ---------- pagination ---------- */
        .ex-pager {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 16px;
        }

        .ex-pager-info {
          font-size: 13px;
          font-weight: 600;
          color: var(--muted);
        }

        .ex-pager-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ex-size {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
        }

        .ex-size select {
          height: 36px;
          padding: 0 10px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--white);
          font-size: 13px;
          font-weight: 700;
          outline: none;
          cursor: pointer;
        }

        .ex-pages {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ex-page-btn {
          min-width: 36px;
          height: 36px;
          padding: 0 12px;
          border-radius: 10px;
          background: var(--white);
          border: 1px solid var(--border);
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
        }

        .ex-page-btn:hover:not(:disabled):not(.active) {
          background: var(--bg);
        }

        .ex-page-btn.active {
          background: var(--dark);
          border-color: var(--dark);
          color: var(--white);
        }

        .ex-page-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .ex-dots {
          padding: 0 4px;
          color: var(--muted);
          font-weight: 700;
        }

        .ex-page-label {
          display: none;
          font-size: 13px;
          font-weight: 700;
          padding: 0 6px;
        }

        /* ---------- modal ---------- */
        .ex-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 16px;
        }

        .ex-modal {
          background: var(--white);
          border-radius: var(--radius);
          padding: 22px;
          width: 440px;
          max-width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .ex-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          font-size: 17px;
          font-weight: 800;
        }

        .ex-close {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: var(--bg);
          font-size: 14px;
        }

        .ex-modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .ex-modal-actions .ex-btn {
          flex: 1;
        }

        .ex-cat-add {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }

        .ex-cat-add .input {
          flex: 1;
          height: 42px;
          border-radius: 12px;
        }

        .ex-cat-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
        }

        .ex-cat-row:last-child {
          border-bottom: none;
        }

        .ex-cat-name {
          flex: 1;
          min-width: 0;
          font-size: 14px;
          font-weight: 700;
          word-break: break-word;
        }

        .ex-cat-row .input {
          flex: 1;
          height: 38px;
          border-radius: 10px;
        }

        .ex-inactive {
          font-size: 11px;
          color: var(--muted);
          font-weight: 600;
        }

        @media (max-width: 768px) {

          .ex-filter {
            width: 100%;
          }

          .ex-filter .input {
            flex: 1;
            width: auto;
            min-width: 130px;
          }

          .ex-table-card {
            display: none;
          }

          .ex-tiles {
            display: block;
          }

          .ex-break-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .ex-pager {
            flex-direction: column;
            align-items: stretch;
          }

          .ex-pager-info {
            text-align: center;
          }

          .ex-pager-right {
            justify-content: space-between;
          }

          /* mobile: Prev, "Page 2 / 5", Next */
          .ex-num {
            display: none;
          }

          .ex-page-label {
            display: block;
          }
        }
      `}</style>

      {/* ---------- FILTERS ---------- */}
      <div className="ex-toolbar">

        <div className="ex-tabs">
          {[
            { key: 'month', label: 'Month' },
            { key: 'date', label: 'Date' },
            { key: 'range', label: 'Date Range' },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tab${period === t.key ? ' active' : ''}`}
              onClick={() => {
                setError('');
                setPeriod(t.key);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ex-filter">

          {period === 'month' && (
            <input
              type="month"
              className="input"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          )}

          {period === 'date' && (
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}

          {period === 'range' && (
            <>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}

          <button
            type="button"
            className="ex-btn ex-btn-light"
            onClick={() => {
              setCategoryError('');
              setShowCategories(true);
            }}
          >
            🗂️ Categories
          </button>

          <button
            type="button"
            className="ex-btn ex-btn-lime"
            onClick={openAdd}
          >
            + Add Expense
          </button>

        </div>
      </div>

      {error && <p className="ex-error">{error}</p>}

      {loading && expenses.length === 0 && !error && (
        <div className="ex-empty">Loading expenses...</div>
      )}

      {(!loading || expenses.length > 0 || summary) && (
        <div className={`ex-content${loading ? ' dim' : ''}`}>

          {/* ---------- SUMMARY ---------- */}
          <div className="stat-grid">

            <div className="stat-card" style={{ background: CARD_COLORS[0] }}>
              <div className="label">Total Expense</div>
              <div className="value">{money(totalAmount)}</div>
              <div className="sub">{filterLabel}</div>
            </div>

            <div className="stat-card" style={{ background: CARD_COLORS[1] }}>
              <div className="label">Entries</div>
              <div className="value">{entryCount}</div>
              <div className="sub">Expenses added</div>
            </div>

            <div className="stat-card" style={{ background: CARD_COLORS[2] }}>
              <div className="label">Average</div>
              <div className="value">
                {money(entryCount ? totalAmount / entryCount : 0)}
              </div>
              <div className="sub">Per expense</div>
            </div>

            <div className="stat-card" style={{ background: CARD_COLORS[3] }}>
              <div className="label">Top Category</div>
              <div className="value" style={{ fontSize: 20 }}>
                {topCategory ? topCategory.name : '-'}
              </div>
              <div className="sub">
                {topCategory ? money(topCategory.amount) : 'No expenses'}
              </div>
            </div>

          </div>

          {/* ---------- BY CATEGORY ---------- */}
          <div className="ex-section">
            <span>By Category</span>
          </div>

          {breakdown.length === 0 ? (
            <div className="ex-empty">
              <span>💸</span>
              No expenses for this period
            </div>
          ) : (
            <div className="ex-break-grid">
              {breakdown.map((b, i) => (
                <div className="ex-break" key={`${b.name}-${i}`}>
                  <div className="b-name">{b.name || 'Uncategorized'}</div>
                  <div className="b-amount">{money(b.amount)}</div>
                  {b.count > 0 && (
                    <div className="b-count">{b.count} entries</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ---------- EXPENSE LIST ---------- */}
          <div className="ex-section" ref={listRef}>
            <span>Expenses</span>
            <small>{totalRows} records</small>
          </div>

          {totalRows === 0 ? (
            <div className="ex-empty">
              <span>🧾</span>
              No expenses found
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="card ex-table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Note</th>
                      <th>Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((e) => (
                      <tr key={e.id}>
                        <td>{formatDay(e.date)}</td>
                        <td>
                          <span className="ex-chip">{categoryNameFor(e)}</span>
                        </td>
                        <td>{e.note || '-'}</td>
                        <td className="ex-amount">{money(e.amount)}</td>
                        <td>
                          <div className="ex-actions">
                            <button
                              type="button"
                              className="ex-mini"
                              onClick={() => openEdit(e)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="ex-mini danger"
                              onClick={() => removeExpense(e)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile tiles */}
              <div className="ex-tiles">
                {pageRows.map((e) => (
                  <div className="ex-tile" key={e.id}>
                    <div className="ex-tile-top">
                      <div className="ex-tile-title">{categoryNameFor(e)}</div>
                      <div className="ex-amount">{money(e.amount)}</div>
                    </div>
                    <div className="ex-tile-sub">
                      {formatDay(e.date)}
                      {e.note ? ` • ${e.note}` : ''}
                    </div>
                    <div className="ex-tile-actions">
                      <button
                        type="button"
                        className="ex-mini"
                        onClick={() => openEdit(e)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ex-mini danger"
                        onClick={() => removeExpense(e)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ---------- PAGE NAVIGATION ---------- */}
              {totalRows > PAGE_SIZES[0] && (
                <div className="ex-pager">

                  <div className="ex-pager-info">
                    Showing {rangeStart}-{rangeEnd} of {totalRows}
                  </div>

                  <div className="ex-pager-right">

                    <label className="ex-size">
                      Rows per page
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                      >
                        {PAGE_SIZES.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </label>

                    <div className="ex-pages">

                      <button
                        type="button"
                        className="ex-page-btn"
                        onClick={() => goToPage(safePage - 1)}
                        disabled={safePage <= 1}
                      >
                        ‹ Prev
                      </button>

                      {pageList.map((p, i) =>
                        p === '...' ? (
                          <span className="ex-dots ex-num" key={`dots-${i}`}>
                            ...
                          </span>
                        ) : (
                          <button
                            type="button"
                            key={p}
                            className={`ex-page-btn ex-num${p === safePage ? ' active' : ''}`}
                            onClick={() => goToPage(p)}
                          >
                            {p}
                          </button>
                        )
                      )}

                      <span className="ex-page-label">
                        Page {safePage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        className="ex-page-btn"
                        onClick={() => goToPage(safePage + 1)}
                        disabled={safePage >= totalPages}
                      >
                        Next ›
                      </button>

                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* ---------- ADD / EDIT EXPENSE MODAL ---------- */}
      {showForm && (
        <div className="ex-overlay" onClick={() => !saving && setShowForm(false)}>
          <div className="ex-modal" onClick={(e) => e.stopPropagation()}>

            <div className="ex-modal-head">
              <span>{form.id ? 'Edit Expense' : 'Add Expense'}</span>
              <button
                type="button"
                className="ex-close"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                ✕
              </button>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                className="select"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                <option value="">Select category</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {activeCategories.length === 0 && (
                <p className="card-sub" style={{ marginTop: 6, marginBottom: 0 }}>
                  No categories yet. Use the Categories button to create one.
                </p>
              )}
            </div>

            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Note</label>
              <input
                type="text"
                className="input"
                placeholder="Optional note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>

            {formError && <p className="error-text">{formError}</p>}

            <div className="ex-modal-actions">
              <button
                type="button"
                className="ex-btn ex-btn-light"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ex-btn ex-btn-lime"
                onClick={saveExpense}
                disabled={saving}
              >
                {saving ? 'Saving...' : form.id ? 'Update' : 'Add Expense'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ---------- CATEGORY MANAGER MODAL ---------- */}
      {showCategories && (
        <div className="ex-overlay" onClick={() => setShowCategories(false)}>
          <div className="ex-modal" onClick={(e) => e.stopPropagation()}>

            <div className="ex-modal-head">
              <span>Expense Categories</span>
              <button
                type="button"
                className="ex-close"
                onClick={() => setShowCategories(false)}
              >
                ✕
              </button>
            </div>

            <div className="ex-cat-add">
              <input
                type="text"
                className="input"
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCategory();
                }}
              />
              <button
                type="button"
                className="ex-btn ex-btn-lime"
                onClick={handleCreateCategory}
                disabled={categoryBusy}
              >
                Add
              </button>
            </div>

            {categoryError && <p className="error-text">{categoryError}</p>}

            {categories.length === 0 ? (
              <p className="card-sub">No categories yet</p>
            ) : (
              categories.map((c) => (
                <div className="ex-cat-row" key={c.id}>

                  {editingId === c.id ? (
                    <>
                      <input
                        type="text"
                        className="input"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameCategory(c.id);
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="ex-mini"
                        onClick={() => handleRenameCategory(c.id)}
                        disabled={categoryBusy}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="ex-mini"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="ex-cat-name">
                        {c.name}
                        {!c.active && (
                          <span className="ex-inactive"> (inactive)</span>
                        )}
                      </span>
                      <button
                        type="button"
                        className="ex-mini"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditingName(c.name);
                          setCategoryError('');
                        }}
                      >
                        Rename
                      </button>
                      {c.active && (
                        <button
                          type="button"
                          className="ex-mini danger"
                          onClick={() => handleDeactivateCategory(c)}
                          disabled={categoryBusy}
                        >
                          Deactivate
                        </button>
                      )}
                    </>
                  )}

                </div>
              ))
            )}

          </div>
        </div>
      )}
    </div>
  );
}