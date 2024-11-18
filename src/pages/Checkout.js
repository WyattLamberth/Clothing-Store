import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../utils/api';
import { FaCreditCard, FaShippingFast, FaMapMarkerAlt, FaShoppingCart, FaTag } from 'react-icons/fa';

const Checkout = () => {
  const location = useLocation();
  const cartItems = location.state?.cartItems || [];
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [useDefaultAddress, setUseDefaultAddress] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [isSaleActive, setIsSaleActive] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);

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
    general: '',
    delivery: {},
    payment: {},
  });
  const [cards, setCards] = useState([]);
  const [showCardForm, setShowCardForm] = useState(false);

  // Calculate total with discount
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = isSaleActive && discountPercentage
  ? (subtotal * discountPercentage) / 100
  : 0;  const tax = (subtotal - discountAmount) * 0.08; // Assuming 8% tax
  const shippingCost = 10.0;
  const total = subtotal - discountAmount + tax + shippingCost;

  // Fetch active sale events
  const [saleEventName, setSaleEventName] = useState('');

  const fetchSaleEvents = async () => {
    try {
      const response = await api.get('/sale-events/active');
      if (response.data.length > 0) {
        const event = response.data[0];
        setIsSaleActive(true);
        setDiscountPercentage(event.discount_percentage);
        setSaleEventName(event.event_name);
      } else {
        setIsSaleActive(false);
        setDiscountPercentage(0);
        setSaleEventName('');
      }
    } catch (error) {
      console.error('Error fetching sale events:', error);
      setIsSaleActive(false);
      setDiscountPercentage(0);
      setSaleEventName('');
    }
  };
  

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
    fetchSaleEvents(); // Fetch sale events in the same useEffect
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
    const { cardholder_name, card_number, expiration_date, cvv, billing_address } = paymentInfo.newCardDetails;
    const errors = {};
  
    // Validate cardholder name
    if (!cardholder_name) {
      errors.cardholder_name = 'Cardholder name is required.';
    }
  
    // Validate card number (must be 16 digits)
    if (!/^\d{15,16}$/.test(card_number)) {
      errors.card_number = 'Card number must be 15 or 16 digits.';
    }
  
    // Validate expiration date (MM/YY format)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration_date)) {
      errors.expiration_date = 'Expiration date must be in MM/YY format.';
    } else {
      // Check if the card is expired
      const [month, year] = expiration_date.split('/');
      const expirationDate = new Date(`20${year}`, month - 1); // Convert MM/YY to a Date object
      const currentDate = new Date();
      if (expirationDate < currentDate) {
        errors.expiration_date = 'This card has expired.';
      }
    }
    // Validate CVV (must be 3 digits)
    if (!/^\d{3,4}$/.test(cvv)) {
      errors.cvv = 'CVV must be 3-4 digits.';
    }
  
    // Validate billing address
    if (!billing_address.line_1) {
      errors.line_1 = 'Billing address line 1 is required.';
    }
    if (!billing_address.city) {
      errors.city = 'Billing city is required.';
    }
    if (!billing_address.state) {
      errors.state = 'Billing state is required.';
    }
    if (!billing_address.zip) {
      errors.zip = 'Billing ZIP code is required.';
    }
  
    setErrors((prevErrors) => ({ ...prevErrors, payment: errors }));
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
      setErrors((prevErrors) => ({ ...prevErrors, payment: '' }));
      setPaymentInfo((prev) => ({
        ...prev,
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
      }));
    } catch (error) {
      console.error('Error adding payment method:', error);
  
      const serverMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : 'This card number already exists. Please use a different card.';
  
      // Handle duplicate card error
      setErrors((prevErrors) => ({
        ...prevErrors,
        payment: {
          card_number: serverMessage.includes('Duplicate entry')
            ? 'This card number already exists. Please use a different card.'
            : serverMessage,
        },
      }));
    }
  };
  
  const handlePlaceOrder = async () => {
  // Validate delivery and payment information before proceeding
  const isDeliveryValid = validateDeliveryInfo();
  const isPaymentValid = paymentInfo.cardId || validatePaymentInfo();

  // Set specific error messages for each section
  setErrors((prevErrors) => ({
    ...prevErrors,
    deliveryMessage: isDeliveryValid ? '' : "Please complete all required fields in the Delivery section.",
    paymentMessage: isPaymentValid ? '' : "Please select a payment method.",
  }));

  // If either section is invalid, stop the order placement
  if (!isDeliveryValid || !isPaymentValid) {
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
      return orderItemData;  
    }));

    await Promise.all(cartItems.map(async (item) => {
      await api.delete('/cart-items', { data: { product_id: item.product_id } });
    }));

    setOrderData({ ...orderData, items: cartItems, order_id: orderId });
    setShowConfirmationModal(true); 

  } catch (error) {
    console.error('Error placing order:', error);
  }
};

const closeModal = () => {
  setShowConfirmationModal(false);
  navigate('/shop'); 
};

  
  
return (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold mb-6 text-center">Checkout</h1>
    
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Delivery Information Section */}
      <section className="flex-1 p-6 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <FaMapMarkerAlt className="mr-2 text-blue-600" /> Delivery Information
        </h2>
        
        {/* Delivery Error Message */}
        {errors.deliveryMessage && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 rounded">
            {errors.deliveryMessage}
          </div>
        )}
        
        <label>
          <input type="checkbox" checked={useDefaultAddress} onChange={handleCheckboxChange} />
          {' '}Use Default Address
        </label>
        <form className="space-y-4 mt-4 grid grid-cols-2 gap-4">
          <input type="text" name="firstName" placeholder="First Name" value={deliveryInfo.firstName} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 col-span-2" />
          <input type="text" name="lastName" placeholder="Last Name" value={deliveryInfo.lastName} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 col-span-2" />
          <input type="email" name="email" placeholder="Email" value={deliveryInfo.email} onChange={handleDeliveryChange} required className="border rounded px-4 py-2" />
          <input type="tel" name="phone" placeholder="Phone" value={deliveryInfo.phone} onChange={handleDeliveryChange} required className="border rounded px-4 py-2" />
          <input type="text" name="line_1" placeholder="Address Line 1" value={deliveryInfo.line_1} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 col-span-2" />
          <input type="text" name="line_2" placeholder="Address Line 2 (Optional)" value={deliveryInfo.line_2} onChange={handleDeliveryChange} className="border rounded px-4 py-2 col-span-2" />
          <input type="text" name="city" placeholder="City" value={deliveryInfo.city} onChange={handleDeliveryChange} required className="border rounded px-4 py-2" />
          <input type="text" name="state" placeholder="State" value={deliveryInfo.state} onChange={handleDeliveryChange} required className="border rounded px-4 py-2" />
          <input type="text" name="zip" placeholder="ZIP Code" value={deliveryInfo.zip} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 col-span-2" />
        </form>
      </section>

      {/* Payment Method Section */}
      <section className="flex-1 p-6 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <FaCreditCard className="mr-2 text-blue-600" /> Payment Method
        </h2>
        
        {/* Payment Error Message */}
        {errors.paymentMessage && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 rounded">
            {errors.paymentMessage}
          </div>
        )}
        
        <div className="space-y-4 mt-4">
          {cards ? (
            cards.length > 0 ? (
              <div>
                <label>Select a saved card</label>
                <select
                  value={paymentInfo.cardId || ""}
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, cardId: e.target.value })}
                  className={`w-full p-2 border rounded ${!paymentInfo.cardId && errors.payment?.cardId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select a card</option>
                  {cards.map((card) => (
                    <option key={card.preferred_payment_id} value={card.preferred_payment_id}>
                      {card.cardholder_name} •••• {card.card_number.slice(-4)} (Expires {card.expiration_date})
                    </option>
                  ))}
                </select>
                {!paymentInfo.cardId && errors.payment?.cardId && (
                  <p className="text-red-500">{errors.payment.cardId}</p>
                )}
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
              <input type="text" name="cvv" placeholder="CVV" maxLength={4} value={paymentInfo.newCardDetails.cvv} onChange={(e) => setPaymentInfo({ ...paymentInfo, newCardDetails: { ...paymentInfo.newCardDetails, cvv: e.target.value }})} required className="border rounded px-4 py-2 w-full" />
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
    </div>

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
  <p className="mt-4">Subtotal: ${subtotal.toFixed(2)}</p>
  {isSaleActive && (
    <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
      <p className="text-red-600 font-bold flex items-center">
        <FaTag className="mr-2 text-yellow-500" />
        Savings: -${discountAmount.toFixed(2)} ({discountPercentage}% - {saleEventName})
      </p>
    </div>
  )}
  <p className="mt-2">Tax: ${tax.toFixed(2)}</p>
  <p className="mt-2">Shipping: ${shippingCost.toFixed(2)}</p>
  <p className="text-xl font-bold mt-4">Total: ${total.toFixed(2)}</p>
</section>



      <button
        onClick={handlePlaceOrder}
        className="w-full bg-blue-600 text-white py-2 rounded mt-4 hover:bg-blue-700 transition-colors"
      >
        Place Order
      </button>

     {/* Order Confirmation Modal */}
     {showConfirmationModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">Order Confirmation</h2>
            <p className="text-center mb-4">Thank you for your purchase! Here are your order details:</p>

            <div className="border rounded p-4 mb-4">
              <p><strong>Order Date:</strong> {orderData?.order_date}</p>
              <p><strong>Total Amount:</strong> ${orderData?.total_amount.toFixed(2)}</p>
              <p><strong>Status:</strong> {orderData?.order_status}</p>
            </div>

           

            <button onClick={closeModal} className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
