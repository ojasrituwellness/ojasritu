import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Footer from "./Footer";
import "./Navbar.css";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { items, totalCount, totalPrice, loading: cartLoading } = useCart();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showDeliveryNotice, setShowDeliveryNotice] = useState(false);
  const cartRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    setIsCartOpen(false);
  };

  const closeMobileMenu = (alsoCloseCart = true) => {
    setMobileMenuOpen(false);
    if (alsoCloseCart) setIsCartOpen(false);
  };

  useEffect(() => {
    if (!isCartOpen) return;
    const handleClickOutside = (e) => {
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setIsCartOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsCartOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCartOpen]);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("deliveryNoticeSeen");
      if (!seen) {
        sessionStorage.setItem("deliveryNoticeSeen", "true");
        setShowDeliveryNotice(true);
      }
    } catch (_) {
      // Fallback to showing the notice if storage is unavailable
      setShowDeliveryNotice(true);
    }
  }, []);

  const toggleCart = () => {
    if (!user) {
      closeMobileMenu();
      navigate("/login");
      return;
    }
    setIsCartOpen((prev) => !prev);
  };

  const dismissDeliveryNotice = () => {
    try { sessionStorage.setItem("deliveryNoticeSeen", "true"); } catch (_) { /* ignore */ }
    setShowDeliveryNotice(false);
  };

  return (
    <>
      <nav className="site-navbar">
        <div className="site-nav-left">
          <Link to="/" className="site-logo" onClick={closeMobileMenu}>Ojasritu Wellness</Link>
          <button 
            className="hamburger-menu" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className={`site-nav-right ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/products" onClick={closeMobileMenu}>Products</Link>
          <Link to="/about" onClick={closeMobileMenu}>About</Link>
          <Link to="/blog" onClick={closeMobileMenu}>Blog</Link>
          <Link to="/wellness" onClick={closeMobileMenu}>Wellness</Link>
          <Link to="/ojas-gurukul" onClick={closeMobileMenu}>Ojas Gurukul</Link>
          <Link to="/acharyas" onClick={closeMobileMenu}>Acharyas</Link>
          <Link to="/contact" onClick={closeMobileMenu}>Contact</Link>
          
          {user && (
            <div className="cart-flyout-wrapper" ref={cartRef}>
              <button
                type="button"
                className="site-cart-link"
                onClick={() => { closeMobileMenu(false); toggleCart(); }}
                aria-label="Cart"
                aria-expanded={isCartOpen}
                aria-controls="cart-flyout"
              >
                🛒 Cart
                {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
              </button>

              {isCartOpen && (
                <div id="cart-flyout" className="cart-flyout" role="dialog" aria-label="Cart preview" onClick={(e) => e.stopPropagation()}>
                  <div className="cart-flyout-header">
                    <span className="cart-flyout-title">Your Cart</span>
                    <button className="cart-flyout-close" onClick={() => setIsCartOpen(false)} aria-label="Close cart preview">×</button>
                  </div>

                  {cartLoading ? (
                    <p className="cart-flyout-text">Loading your items...</p>
                  ) : items?.length ? (
                    <>
                      <ul className="cart-flyout-list">
                        {items.slice(0, 3).map((item) => (
                          <li key={item.id} className="cart-flyout-item">
                            <span className="cart-flyout-name">{item.name}</span>
                            <span className="cart-flyout-qty">× {item.quantity || 1}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="cart-flyout-footer">
                        <span className="cart-flyout-total">Total: ₹{Number(totalPrice || 0).toLocaleString("en-IN")}</span>
                        <div className="cart-flyout-actions">
                          <button className="cart-flyout-link" onClick={() => { setIsCartOpen(false); navigate('/cart'); }}>
                            View Cart
                          </button>
                          <button className="cart-flyout-link primary" onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}>
                            Checkout
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="cart-flyout-text">Your cart is empty.</p>
                  )}
                </div>
              )}
            </div>
          )}
          {user ? (
            <>
              <Link to="/profile" className="profile-btn" onClick={closeMobileMenu}>{user.first_name || 'Profile'}</Link>
              <button className="logout-btn" onClick={() => { handleLogout(); closeMobileMenu(); }} disabled={loggingOut} aria-label="Logout">
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </>
          ) : (
            <Link to="/login" className="login-btn" onClick={closeMobileMenu}>Login</Link>
          )}
        </div>
      </nav>

      <main>{children}</main>

      {showDeliveryNotice && (
        <div className="delivery-toast" role="status" aria-live="polite">
          <div className="delivery-toast-text">
            <strong>Product delivery will begin from 1st March.</strong>
            <span>Orders will be fulfilled in priority for customers who have already booked.</span>
          </div>
          <button className="delivery-toast-close" onClick={dismissDeliveryNotice} aria-label="Close delivery update">×</button>
        </div>
      )}

      <Footer />
    </>
  );
}
