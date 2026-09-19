import { useEffect, useState } from 'react';
import { getEmployees } from '../../controllers/employeeController';
import {
  getDashboardSummary,
  getWeeklySales,
  getTopProducts,
} from '../../controllers/dashboardController';
import StatCard from '../components/StatCard';
import { COLORS } from '../../constants/colors';

const emptySummary = {
  totalSales: 0,
  totalProducts: 0,
  employees: null,
  todaysBills: 0,
};

export default function Home() {
  const [summary, setSummary] = useState(emptySummary);
  const [weekData, setWeekData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');

  // ========================================================
  // LOAD DASHBOARD (each request is independent)
  // ========================================================

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      console.log('########################################');
      console.log('[Home] LOAD DASHBOARD START');

      const results = await Promise.allSettled([
        getDashboardSummary(),
        getWeeklySales(),
        getTopProducts(),
        getEmployees(),
      ]);

      if (!active) {
        return;
      }

      const [summaryResult, weeklyResult, topResult, employeesResult] = results;

      const failed = [];

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        failed.push('summary');
      }

      if (weeklyResult.status === 'fulfilled') {
        setWeekData(weeklyResult.value);
      } else {
        failed.push('weekly sales');
      }

      if (topResult.status === 'fulfilled') {
        setTopProducts(topResult.value);
      } else {
        failed.push('top products');
      }

      if (employeesResult.status === 'fulfilled') {
        setEmployees(employeesResult.value);
      } else {
        failed.push('employees');
      }

      console.log('[Home] Load results:', results);

      setError(failed.length ? `Failed to load: ${failed.join(', ')}` : '');

      console.log('[Home] LOAD DASHBOARD END');
      console.log('########################################');
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  // Employee card: API value, or the active staff from the employee list
  const activeEmployees = employees.filter((e) => e.is_active !== false);

  const employeeCount =
    summary.employees !== null ? summary.employees : activeEmployees.length;

  return (
    <div>
      {error && <div className="error-text">{error}</div>}

      <div className="stat-grid">
        <StatCard label="Total Sales" value={`₹${summary.totalSales}`} sub="From billing history" color={COLORS.purpleCard} />
        <StatCard label="Total Products" value={summary.totalProducts} sub="Across all categories" color={COLORS.blueCard} />
        <StatCard label="Employees" value={employeeCount} sub="Active staff" color={COLORS.greenCard} />
        <StatCard label="Today's Bills" value={summary.todaysBills} sub="Generated today" color={COLORS.primary} />
      </div>

      <div className="content-grid">
        <div className="card">
          <div className="card-title">This Week's Sales</div>
          <div className="card-sub">Overview of daily performance</div>
          <div className="bar-chart">
            {weekData.length === 0 && (
              <div style={{ color: '#777', fontSize: 13 }}>No sales data yet.</div>
            )}
            {weekData.map((d, index) => (
              <div className="bar-col" key={`${d.day}-${index}`}>
                <div className="bar" style={{ height: `${d.percent}%` }} title={`₹${d.value}`} />
                <span>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Team Members</div>
          <div className="card-sub">Staff on duty</div>
          <div className="team-list">
            {activeEmployees.map((e) => (
              <div className="team-item" key={e.id}>
                <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                  {(e.name || '').split(' ').filter(Boolean).map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="name">{e.name}</div>
                  <div className="role">{e.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Top Products</div>
        <div className="card-sub">Best stocked items</div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.slice(0, 5).map((p, index) => (
                <tr key={p.id ?? index}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.stock}</td>
                  <td>₹{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}