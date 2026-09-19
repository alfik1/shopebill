import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './views/layout/Layout';
import Login from './views/pages/Login';
import Home from './views/pages/Home';
import Products from './views/pages/Products';
import AddProduct from './views/pages/AddProduct';
import Billing from './views/pages/Billing';
import Employees from './views/pages/Employees';
import History from './views/pages/History';
import Collection from './views/pages/Collection';
import Profile from './views/pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="billing" element={<Billing />} />
          <Route path="employees" element={<Employees />} />
          <Route path="history" element={<History />} />
          <Route path="collection" element={<Collection />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}