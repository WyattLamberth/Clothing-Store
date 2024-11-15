import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../utils/api';
import { FaCreditCard, FaShippingFast, FaMapMarkerAlt, FaShoppingCart } from 'react-icons/fa';

const Checkout = () => {
  const location = useLocation();
  const cartItems = location.state?.cartItems || [];
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [useDefaultAddress, setUseDefaultAddress] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    line_1: '',
    line_2: '',
    city: '',
    state: '',
    zip: '',
  });

  const [defaultAddress, setDefaultAddress] = useState({});
  const [paymentInfo, setPaymentInfo] = useState({
    cardId: null,
    newCardDetails: {
      cardholder_name: '',
      card_number: '',
      expiration_date: '',
      cvv: '',
      billing_address: {
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        zip: '',
      },
    },
  });
  const [errors, setErrors] = useState({
    delivery: {},
    payment: {},
  });
  const [cards, setCards] = useState([]);
  const [showCardForm, setShowCardForm] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // Assuming an 8% tax rate
  const shippingCost = 10.0;
  const total = subtotal + tax + shippingCost;

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userResponse = await api.get(`/users/${userId}`);
        const user = userResponse.data;
        const fetchedAddress = {
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone_number,
          line_1: user.address?.line_1 || '',
          line_2: user.address?.line_2 || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zip: user.address?.zip || '',
          address_id: user.address_id,
        };
        setDefaultAddress(fetchedAddress);
        if (useDefaultAddress) setDeliveryInfo(fetchedAddress);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    const fetchPaymentMethods = async () => {
      try {
        const response = await api.get(`/payment/user/${userId}`);
        setCards(response.data.length > 0 ? response.data : null);
      } catch (error) {
        console.error('No saved payment methods available.');
        setCards(null);
      }
    };

    fetchUserInfo();
    fetchPaymentMethods();
  }, [userId, useDefaultAddress]);

  const handleCheckboxChange = () => {
    setUseDefaultAddress(!useDefaultAddress);
    if (!useDefaultAddress && defaultAddress) setDeliveryInfo(defaultAddress);
    else setDeliveryInfo({
      firstName: '', lastName: '', email: '', phone: '', line_1: '', line_2: '', city: '', state: '', zip: ''
    });
  };

  const handleDeliveryChange = (e) => setDeliveryInfo({ ...deliveryInfo, [e.target.name]: e.target.value });

  const validateDeliveryInfo = () => {
    const newErrors = {};
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'line_1', 'city', 'state', 'zip'];

    requiredFields.forEach((field) => {
      if (!deliveryInfo[field]) {
        newErrors[field] = 'This field is required';
      }
    });

    setErrors((prevErrors) => ({ ...prevErrors, delivery: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentInfo = () => {
    const { card_number, expiration_date, cvv } = paymentInfo.newCardDetails;
    const errors = {};

    if (!/^\d{16}$/.test(card_number)) {
      errors.card_number = 'Card number must be 16 digits.';
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration_date)) {
      errors.expiration_date = 'Expiration date must be in MM/YY format.';
    }

    if (!/^\d{3}$/.test(cvv)) {
      errors.cvv = 'CVV must be 3 digits.';
    }

    setErrors({ payment: errors });
    return Object.keys(errors).length === 0;
  };

  const handleAddNewCard = async (e) => {
    e.preventDefault();
    if (!validatePaymentInfo()) return;

    try {
      const addressResponse = await api.post('/address', paymentInfo.newCardDetails.billing_address);
      const billing_address_id = addressResponse.data.address_id;

      await api.post('/payment', {
        ...paymentInfo.newCardDetails,
        user_id: userId,
        billing_address_id,
      });

      const updatedCards = await api.get(`/payment/user/${userId}`);
      setCards(updatedCards.data || []);
      setShowCardForm(false);
      setPaymentInfo((prev) => ({
        ...prev,
        newCardDetails: {
          cardholder_name: '',
          card_number: '',
          expiration_date: '',
          cvv: '',
          billing_address: {
            line_1: '',
            line_2: '',
            city: '',
            state: '',
            zip: '',
          },
        },
      }));
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  };

  const handlePlaceOrder = async () => {
        // Validate delivery information before proceeding
        if (!validateDeliveryInfo()) {
          return;
        }
    
    try {
      const shippingAddressId = useDefaultAddress && defaultAddress.address_id
        ? defaultAddress.address_id
        : (await api.post('/address', {
            line_1: deliveryInfo.line_1,
            line_2: deliveryInfo.line_2 || 'N/A',
            city: deliveryInfo.city,
            state: deliveryInfo.state,
            zip: deliveryInfo.zip,
          })).data.address_id;
  
      const orderData = {
        user_id: userId,
        shipping_address_id: shippingAddressId,
        order_status: 'Pending',
        order_date: new Date().toISOString().slice(0, 10),
        shipping_cost: shippingCost,
        payment_method: paymentInfo.cardId,
        total_amount: total,
      };
  
      const orderResponse = await api.post('/orders', orderData);
      const orderId = orderResponse.data.order_id;
  
      await Promise.all(cartItems.map(async (item) => {
        const orderItemData = {
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_item_price: item.price * item.quantity,
        };
        await api.post('/order_items', orderItemData);
      }));
  
      await Promise.all(cartItems.map(async (item) => {
        await api.delete('/cart-items', { data: { product_id: item.product_id } });
      }));
  
      navigate('/profile');
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Checkout</h1>
      {/* Delivery Information Section */}
      <section className="mt-8 p-6 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <FaMapMarkerAlt className="mr-2 text-blue-600" /> Delivery Information
        </h2>
        <label>
          <input type="checkbox" checked={useDefaultAddress} onChange={handleCheckboxChange} />
          {' '}Use Default Address
        </label>
        <form className="space-y-4 mt-4">
          <input type="text" name="firstName" placeholder="First Name" value={deliveryInfo.firstName} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
          {errors.delivery.firstName && <p className="text-red-500">{errors.delivery.firstName}</p>}
          <input type="text" name="lastName" placeholder="Last Name" value={deliveryInfo.lastName} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
          {errors.delivery.lastName && <p className="text-red-500">{errors.delivery.lastName}</p>}
          <input type="email" name="email" placeholder="Email" value={deliveryInfo.email} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
          {errors.delivery.email && <p className="text-red-500">{errors.delivery.email}</p>}
          <input type="tel" name="phone" placeholder="Phone" value={deliveryInfo.phone} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
          {errors.delivery.phone && <p className="text-red-500">{errors.delivery.phone}</p>}
          <input type="text" name="line_1" placeholder="Address Line 1" value={deliveryInfo.line_1} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
          {errors.delivery.line_1 && <p className="text-red-500">{errors.delivery.line_1}</p>}
          <input type="text" name="line_2" placeholder="Address Line 2 (Optional)" value={deliveryInfo.line_2} onChange={handleDeliveryChange} className="border rounded px-4 py-2 w-full" />
          <input type="text" name="city" placeholder="City" value={deliveryInfo.city} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
          {errors.delivery.city && <p className="text-red-500">{errors.delivery.city}</p>}
          <input type="text" name="state" placeholder="State" value={deliveryInfo.state} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
          {errors.delivery.state && <p className="text-red-500">{errors.delivery.state}</p>}
          <input type="text" name="zip" placeholder="ZIP Code" value={deliveryInfo.zip} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
          {errors.delivery.zip && <p className="text-red-500">{errors.delivery.zip}</p>}
        </form>
      </section>

      {/* Payment Method Section */}
      <section className="mt-8 p-6 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <FaCreditCard className="mr-2 text-blue-600" /> Payment Method
        </h2>
        <div className="space-y-4 mt-4">
          {cards ? (
            cards.length > 0 ? (
              <div>
                <label>Select a saved card</label>
                <select value={paymentInfo.cardId || ""} onChange={(e) => setPaymentInfo({ ...paymentInfo, cardId: e.target.value })} className="w-full p-2 border rounded">
                  <option value="">Select a card</option>
                  {cards.map((card) => (
                    <option key={card.preferred_payment_id} value={card.preferred_payment_id}>
                      {card.cardholder_name} •••• {card.card_number.slice(-4)} (Expires {card.expiration_date})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p>No saved payment methods. Please add a new payment method.</p>
            )
          ) : (
            <p>No saved payment methods.</p>
          )}
          <button onClick={() => setShowCardForm(!showCardForm)} className="text-blue-600 hover:text-blue-800 transition">
            {showCardForm ? 'Cancel' : 'Add New Payment Method'}
          </button>
          {showCardForm && (
            <form onSubmit={handleAddNewCard} className="space-y-4 mt-4">
              <input type="text" name="cardholder_name" placeholder="Cardholder Name" value={paymentInfo.newCardDetails.cardholder_name} onChange={(e) => setPaymentInfo({ ...paymentInfo, newCardDetails: { ...paymentInfo.newCardDetails, cardholder_name: e.target.value }})} required className="border rounded px-4 py-2 w-full" />
              <input type="text" name="card_number" placeholder="Card Number" value={paymentInfo.newCardDetails.card_number} onChange={(e) => setPaymentInfo({ ...paymentInfo, newCardDetails: { ...paymentInfo.newCardDetails, card_number: e.target.value }})} required className="border rounded px-4 py-2 w-full" />
              {errors.payment.card_number && <p className="text-red-500">{errors.payment.card_number}</p>}
              <input type="text" name="expiration_date" placeholder="Expiration Date (MM/YY)" value={paymentInfo.newCardDetails.expiration_date} onChange={(e) => setPaymentInfo({ ...paymentInfo, newCardDetails: { ...paymentInfo.newCardDetails, expiration_date: e.target.value }})} required className="border rounded px-4 py-2 w-full" />
              {errors.payment.expiration_date && <p className="text-red-500">{errors.payment.expiration_date}</p>}
              <input type="text" name="cvv" placeholder="CVV" value={paymentInfo.newCardDetails.cvv} onChange={(e) => setPaymentInfo({ ...paymentInfo, newCardDetails: { ...paymentInfo.newCardDetails, cvv: e.target.value }})} required className="border rounded px-4 py-2 w-full" />
              {errors.payment.cvv && <p className="text-red-500">{errors.payment.cvv}</p>}
              <h3>Billing Address</h3>
              <input type="text" name="line_1" placeholder="Street Address" value={paymentInfo.newCardDetails.billing_address.line_1} onChange={(e) => setPaymentInfo(prev => ({ ...prev, newCardDetails: { ...prev.newCardDetails, billing_address: { ...prev.newCardDetails.billing_address, line_1: e.target.value }}}))} required className="border rounded px-4 py-2 w-full" />
              <input type="text" name="line_2" placeholder="Apt, Suite, etc. (Optional)" value={paymentInfo.newCardDetails.billing_address.line_2} onChange={(e) => setPaymentInfo(prev => ({ ...prev, newCardDetails: { ...prev.newCardDetails, billing_address: { ...prev.newCardDetails.billing_address, line_2: e.target.value }}}))} className="border rounded px-4 py-2 w-full" />
              <input type="text" name="city" placeholder="City" value={paymentInfo.newCardDetails.billing_address.city} onChange={(e) => setPaymentInfo(prev => ({ ...prev, newCardDetails: { ...prev.newCardDetails, billing_address: { ...prev.newCardDetails.billing_address, city: e.target.value }}}))} required className="border rounded px-4 py-2 w-full" />
              <input type="text" name="state" placeholder="State" value={paymentInfo.newCardDetails.billing_address.state} onChange={(e) => setPaymentInfo(prev => ({ ...prev, newCardDetails: { ...prev.newCardDetails, billing_address: { ...prev.newCardDetails.billing_address, state: e.target.value }}}))} required className="border rounded px-4 py-2 w-full" />
              <input type="text" name="zip" placeholder="ZIP Code" value={paymentInfo.newCardDetails.billing_address.zip} onChange={(e) => setPaymentInfo(prev => ({ ...prev, newCardDetails: { ...prev.newCardDetails, billing_address: { ...prev.newCardDetails.billing_address, zip: e.target.value }}}))} required className="border rounded px-4 py-2 w-full" />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors">Add Payment Method</button>
            </form>
          )}
        </div>
      </section>

      {/* Order Summary Section */}
      <section className="mt-8 p-6 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <FaShippingFast className="mr-2 text-blue-600" /> Order Summary
        </h2>
        <ul>
          {cartItems.map((item) => (
            <li key={item.product_id} className="flex justify-between py-4 items-center border-b">
              <div className="flex items-center">
                <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
                  {item.image_path ? (
                    <img
                      src={require(`../images/${item.image_path}`)}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <FaShoppingCart className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{item.product_name}</h3>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="text-lg font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Tax: ${tax.toFixed(2)}</p>
        <p>Shipping: ${shippingCost.toFixed(2)}</p>
        <p className="text-xl font-bold">Total: ${total.toFixed(2)}</p>
      </section>

      <button onClick={handlePlaceOrder} className="w-full bg-blue-600 text-white py-2 rounded mt-4 hover:bg-blue-700 transition-colors">
        Place Order
      </button>
    </div>
  );
};

export default Checkout;
