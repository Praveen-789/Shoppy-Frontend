import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import Products from './components/Products'
import VendorDashboard from './components/VendorDashboard'
import VendorOrders from './components/VendorOrders'
import VendorSales from './components/VendorSales'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Orders from './components/Orders'
import ProtectedRoute from './auth/ProtectedRoute'

function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/shop" replace />} />
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/shop" element={<Products />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/orders" element={<Orders />} />
    </Route>
    <Route element={<ProtectedRoute vendorOnly />}>
      <Route path="/vendor" element={<VendorDashboard />} />
      <Route path="/vendor/orders" element={<VendorOrders />} />
      <Route path="/vendor/sales" element={<VendorSales />} />
    </Route>
    <Route path="*" element={<main className="shop-state"><h1>Page not found</h1><a href="/shop">Back to shop</a></main>} />
  </Routes>
}
export default App
