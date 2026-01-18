import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";
import { useCart } from "../context/CartContext";
import { cashfreeAPI } from "../services/apiService";

export default function Checkout() {
  const { items, totalPrice, refresh } = useCart();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const placeCashfreeCheckout = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await cashfreeAPI.createOrder();
      
      if (res.payment_redirect_url) {
        // Redirect to Cashfree payment page
        window.location.href = res.payment_redirect_url;
      } else if (res.payment_session_id) {
        // Alternative: Open Cashfree modal (if implemented)
        setError('Payment session created but no redirect URL returned');
        console.warn('Cashfree response:', res);
      } else {
        setError('Payment setup failed - missing session info');
      }
    } catch (e) {
      if (e?.status === 401) {
        navigate('/login');
        return;
      }
      setError(e?.data?.error || e?.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  const enrichedItems = useMemo(() => items || [], [items]);

  if (enrichedItems.length === 0 && !paymentStatus) {
    return (
      <div className="container checkout-page">
        <h1>Checkout</h1>
        <div className="empty-checkout">
          <p>Your cart is empty</p>
          <button onClick={() => navigate('/products')} className="btn-primary">
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <h1>Checkout</h1>

      {error && <div className="alert error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="checkout-content">
        <div className="checkout-main">
          <div className="checkout-section">
            <h2>Order Summary</h2>
            <div className="order-items">
              {paymentStatus === "success" ? (
                <div className="payment-success">
                  <h3>🎉 Payment Successful</h3>
                  <p>Receipt: <strong>{receipt}</strong></p>
                  <p>Your order is confirmed. We will notify you about your delivery soon.</p>
                </div>
              ) : (
                enrichedItems.map((item) => {
                  const price = parseFloat(item.discount_price || item.price || 0);
                  const quantity = item.quantity || 1;
                  const itemTotal = price * quantity;
                  const imageUrl = item.image
                    ? (item.image.startsWith('http')
                        ? item.image
                        : `${window.location.origin}${item.image}`)
                    : null;

                  return (
                    <div key={item.id} className="order-item">
                      <div className="order-item-image">
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.name} loading="lazy" onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/300x300?text=Product";
                          }} />
                        ) : (
                          <div className="no-image">📦</div>
                        )}
                      </div>
                      <div className="order-item-details">
                        <h4>{item.name}</h4>
                        <p>Quantity: {quantity}</p>
                      </div>
                      <div className="order-item-price">
                        ₹{itemTotal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="checkout-section prebooking-info">
            <h2>💳 Secure Payment</h2>
            <div className="info-box">
              <p><strong>Payment Gateway:</strong> Cashfree Secure</p>
              <p><strong>Currency:</strong> Indian Rupees (INR)</p>
              <p><strong>Status:</strong> Ready to checkout</p>
            </div>
            <div className="info-notice">
              <p>Your payment information is encrypted and secure.</p>
              <p>You will be redirected to Cashfree to complete payment.</p>
            </div>
          </div>
        </div>

        <div className="checkout-sidebar">
          <div className="price-summary">
            <h3>Price Details</h3>
            <div className="price-row">
              <span>Subtotal</span>
              <span>₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="price-row">
              <span>Delivery Charges</span>
              <span className="free">FREE</span>
            </div>
            <div className="price-row total">
              <span>Total Amount</span>
              <span>₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {paymentStatus === "success" ? (
            <button className="btn-place-order disabled" disabled>
              Payment Completed
            </button>
          ) : (
            <button 
              className="btn-place-order"
              onClick={placeCashfreeCheckout}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Proceed to Payment'}
            </button>
          )}

          <div className="secure-payment">
            <p>🔒 256-bit SSL Encrypted</p>
            <p>💳 Trusted by Cashfree</p>
            <p>📦 Free Delivery Across India</p>
          </div>
        </div>
      </div>
    </div>
  );
}
