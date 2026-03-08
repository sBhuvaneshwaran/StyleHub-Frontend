import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { AddressProvider } from "./context/AddressContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import FavoritesPage from "./pages/FavoritesPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import Footer from "./components/Footer";
import { OrderProvider } from "./context/OrderContext";
import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <AddressProvider>
              <Navbar />
              <main>
                <OrderProvider>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute role="customer">
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute role="owner">
                          <OwnerDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/orders" element={<OrderTrackingPage />} />
                    <Route path="/track/:orderId" element={<OrderTrackingPage />} />
                  </Routes>
                </OrderProvider>
              </main>
              <Footer />
            </AddressProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
