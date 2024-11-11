import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../utils/api';

const Checkout = () => {
  const location = useLocation();
  const cartItems = location.state?.cartItems || [];
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryInfo, setDeliveryInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
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

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      if (!userId) return;

      try {
        const response = await api.get(`/payment/user/${userId}`);
        setCards(response.data || []);
      } catch (err) {
        console.error('Error fetching payment methods:', err);
      }
    };

    fetchPaymentMethods();
  }, [userId]);

  const validateDeliveryInfo = () => {
    const { firstName, lastName, email, phone, address } = deliveryInfo;
    const newErrors = {};
    if (!firstName) newErrors.firstName = "First name is required.";
    if (!lastName) newErrors.lastName = "Last name is required.";
    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email address is invalid.";
    }
    if (!phone) newErrors.phone = "Phone number is required.";
    if (!address) newErrors.address = "Address is required.";
    setErrors(prev => ({ ...prev, delivery: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleDeliveryChange = (e) => {
    setDeliveryInfo({ ...deliveryInfo, [e.target.name]: e.target.value });
    setErrors(prev => ({ ...prev, delivery: { ...prev.delivery, [e.target.name]: '' } }));
  };

  const handleNewCardInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('billing_address.')) {
      const field = name.split('.')[1];
      setPaymentInfo(prev => ({
        ...prev,
        newCardDetails: {
          ...prev.newCardDetails,
          billing_address: {
            ...prev.newCardDetails.billing_address,
            [field]: value,
          },
        },
      }));
    } else {
      setPaymentInfo(prev => ({
        ...prev,
        newCardDetails: { ...prev.newCardDetails, [name]: value },
      }));
    }
  };

  const handleAddNewCard = async (e) => {
    e.preventDefault(); // Prevent default form submission
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

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateDeliveryInfo()) setCurrentStep(currentStep + 1);
    } else if (currentStep === 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePlaceOrder = () => {
    console.log('Order placed!', { deliveryInfo, paymentInfo, cartItems });
    navigate('/profile');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      {currentStep === 1 && (
        <div>
          <h2 className="text-2xl font-bold">Delivery Information</h2>
          <form className="space-y-4 mt-4">
            <input type="text" name="firstName" placeholder="First Name" value={deliveryInfo.firstName} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
            {errors.delivery.firstName && <span className="text-red-500">{errors.delivery.firstName}</span>}
            <input type="text" name="lastName" placeholder="Last Name" value={deliveryInfo.lastName} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
            {errors.delivery.lastName && <span className="text-red-500">{errors.delivery.lastName}</span>}
            <input type="email" name="email" placeholder="Email" value={deliveryInfo.email} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
            {errors.delivery.email && <span className="text-red-500">{errors.delivery.email}</span>}
            <input type="tel" name="phone" placeholder="Phone Number" value={deliveryInfo.phone} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
            {errors.delivery.phone && <span className="text-red-500">{errors.delivery.phone}</span>}
            <input type="text" name="address" placeholder="Address" value={deliveryInfo.address} onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full" />
            {errors.delivery.address && <span className="text-red-500">{errors.delivery.address}</span>}
            <button type="button" className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700" onClick={handleNextStep}>
              Next: Payment Method
            </button>
          </form>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <h2 className="text-2xl font-bold">Payment Method</h2>
          <div className="space-y-4 mt-4">
            {cards.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Select a saved card</label>
                <select
                  value={paymentInfo.cardId || ""} // Default to empty string if cardId is null or undefined
                  onChange={(e) => setPaymentInfo({ ...paymentInfo, cardId: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a card</option>
                  {cards.map((card) => (
                    <option key={card.preferred_payment_id} value={card.preferred_payment_id}>
                      {card.cardholder_name} •••• {card.card_number.slice(-4)} (Expires {card.expiration_date})
                    </option>
                  ))}
                </select>

              </div>
            )}

            <button
              type="button" 
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              onClick={() => setShowCardForm(!showCardForm)}
            >
              {showCardForm ? 'Cancel' : 'Add New Payment Method'}
            </button>

            {showCardForm && (
              <form onSubmit={handleAddNewCard} className="space-y-4 mt-4">
                <input type="text" name="cardholder_name" placeholder="Cardholder Name" value={paymentInfo.newCardDetails.cardholder_name} onChange={handleNewCardInputChange} required className="border rounded px-4 py-2 w-full" />
                <input type="text" name="card_number" placeholder="Card Number" value={paymentInfo.newCardDetails.card_number} onChange={handleNewCardInputChange} required className="border rounded px-4 py-2 w-full" />
                <input type="text" name="expiration_date" placeholder="Expiration Date (MM/YY)" value={paymentInfo.newCardDetails.expiration_date} onChange={handleNewCardInputChange} required className="border rounded px-4 py-2 w-full" />
                <input type="text" name="cvv" placeholder="CVV" value={paymentInfo.newCardDetails.cvv} onChange={handleNewCardInputChange} required className="border rounded px-4 py-2 w-full" />
                <input type="text" name="billing_address.line_1" placeholder="Street Address" value={paymentInfo.newCardDetails.billing_address.line_1} onChange={handleNewCardInputChange} required className="border rounded px-4 py-2 w-full" />
                <input type="text" name="billing_address.line_2" placeholder="Apt, Suite, etc. (optional)" value={paymentInfo.newCardDetails.billing_address.line_2} onChange={handleNewCardInputChange} className="border rounded px-4 py-2 w-full" />
                <input type="text" name="billing_address.city" placeholder="City" value={paymentInfo.newCardDetails.billing_address.city} onChange={handleNewCardInputChange} required className="border rounded px-4 py-2 w-full" />
                <input type="text" name="billing_address.state" placeholder="State" value={paymentInfo.newCardDetails.billing_address.state} onChange={handleNewCardInputChange} required className="border rounded px-4 py-2 w-full" />
                <input type="text" name="billing_address.zip" placeholder="ZIP Code" value={paymentInfo.newCardDetails.billing_address.zip} onChange={handleNewCardInputChange} required className="border rounded px-4 py-2 w-full" />

                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Add Payment Method
                </button>
              </form>
            )}

            <button
              type="button"
              className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              onClick={handleNextStep}
            >
              Next: Order Review
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div>
          <h2 className="text-2xl font-bold">Order Review</h2>
          <ul className="border-t mt-4">
            {cartItems.map((item) => (
              <li key={item.product_id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-4">
                  <img src={item.image} alt={item.product_name} className="w-16 h-16 object-cover" />
                  <span>{item.product_name} x {item.quantity}</span>
                </div>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xl font-bold mt-4">Total: ${total.toFixed(2)}</p>
          <div className="flex justify-between">
            <button type="button" className="mt-4 w-full mr-2 bg-gray-400 text-white py-2 rounded hover:bg-gray-500" onClick={() => setCurrentStep(2)}>
              Back
            </button>
            <button type="button" className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700" onClick={handlePlaceOrder}>
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;






