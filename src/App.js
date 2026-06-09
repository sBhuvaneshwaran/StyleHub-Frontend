import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { AddressProvider } from "./context/AddressContext";
import { OrderProvider } from "./context/OrderContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ServerStatusBanner from "./components/ServerStatusBanner";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import FavoritesPage from "./pages/FavoritesPage";
import CheckoutPage from "./pages/CheckoutPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";

import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <AddressProvider>
              <OrderProvider>
                <Navbar />
                <ServerStatusBanner />

                {/* Remove this if you don't want auto redirect */}
                {/* <AutoRedirect /> */}

                <main>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                      path="/product/:id"
                      element={<ProductDetailPage />}
                    />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />

                    {/* Customer Protected Route */}
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute role="customer">
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Owner Protected Route */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute role="owner">
                          <OwnerDashboardPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Redirect old owner routes */}
                    <Route
                      path="/owner/dashboard"
                      element={<Navigate to="/dashboard" replace />}
                    />

                    <Route
                      path="/owner"
                      element={<Navigate to="/dashboard" replace />}
                    />

                    {/* Orders */}
                    <Route
                      path="/orders"
                      element={<OrderTrackingPage />}
                    />

                    <Route
                      path="/track/:orderId"
                      element={<OrderTrackingPage />}
                    />

                    {/* Catch-all */}
                    <Route
                      path="*"
                      element={<Navigate to="/" replace />}
                    />
                  </Routes>
                </main>

                <Footer />
              </OrderProvider>
            </AddressProvider>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

/* Optional Auto Redirect Component */
function AutoRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (
      process.env.REACT_APP_AUTO_OWNER_LOGIN === "true" &&
      user?.role === "owner"
    ) {
      if (window.location.pathname !== "/dashboard") {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

  return null;
}