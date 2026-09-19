import { useEffect, useState } from 'react';
import { getEmployees, addEmployee, deleteEmployee } from '../../controllers/employeeController';

const emptyForm = {
  name: '',
  email: '',
  username: '',
  phone: '',
  role: 'staff',
  password: '',
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  // ========================================================
  // LOAD EMPLOYEES
  // ========================================================

  const loadEmployees = async () => {
    console.log('########################################');
    console.log('[Employees] LOAD EMPLOYEES START');

    try {
      const data = await getEmployees();

      console.log('[Employees] Employees loaded:', data);

      console.log('[Employees] Employees count:', data.length);

      setEmployees(data);
    } catch (err) {
      console.error('[Employees] LOAD EMPLOYEES ERROR:', err);

      setEmployees([]);

      setError(err?.message || 'Failed to load employees');
    } finally {
      console.log('[Employees] LOAD EMPLOYEES END');
      console.log('########################################');
    }
  };

  useEffect(() => {
    console.log('[Employees] Component mounted');

    loadEmployees();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ========================================================
  // ADD EMPLOYEE
  // ========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('########################################');
    console.log('[Employees] ADD EMPLOYEE START');

    setError('');

    try {
      const created = await addEmployee(form);

      console.log('[Employees] Employee created:', created);

      setForm(emptyForm);
      setShowForm(false);

      await loadEmployees();
    } catch (err) {
      console.error('[Employees] ADD EMPLOYEE ERROR:', err);

      setError(err?.message || 'Failed to add employee');
    } finally {
      console.log('[Employees] ADD EMPLOYEE END');
      console.log('########################################');
    }
  };

  // ========================================================
  // DEACTIVATE EMPLOYEE
  // ========================================================

  const handleDelete = async (id) => {
    console.log('########################################');
    console.log('[Employees] DEACTIVATE START, id:', id);

    setError('');

    try {
      await deleteEmployee(id);

      console.log('[Employees] Employee deactivated:', id);

      await loadEmployees();
    } catch (err) {
      console.error('[Employees] DEACTIVATE ERROR:', err);

      setError(err?.message || 'Failed to remove employee');
    } finally {
      console.log('[Employees] DEACTIVATE END');
      console.log('########################################');
    }
  };

  // Deactivated employees are hidden from the list
  const activeEmployees = employees.filter((e) => e.is_active !== false);

  return (
    <div>
      <div className="page-head">
        <div className="card-title">Employees</div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close' : '+ Add Employee'}
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      {showForm && (
        <form className="form-panel" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input className="input" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input className="input" name="username" value={form.username} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input className="input" name="role" value={form.role} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="input" name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input className="input" type="password" name="password" value={form.password} onChange={handleChange} required />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} type="submit">Save Employee</button>
        </form>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Phone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map((e) => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.role}</td>
                <td>{e.phone}</td>
                <td>
                  <button className="btn btn-outline" style={{ fontSize: 12 }} onClick={() => handleDelete(e.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}