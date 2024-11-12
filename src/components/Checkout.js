import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../utils/api';

const Checkout = () => {
  const location = useLocation();
  const cartItems = location.state?.cartItems || [];
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryInfo, setDeliveryInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await api.get(`/users/${userId}`);
        const user = response.data;
        if (user) {
          setDeliveryInfo({
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone_number,
            line_1: user.address?.line_1 || '',
            line_2: user.address?.line_2 || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            zip: user.address?.zip || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, [userId]);

  const handleEditAddress = () => setIsEditingAddress(true);

  const handleSaveAddress = async () => {
    try {
      await api.put(`/address/${userId}`, {
        line_1: deliveryInfo.line_1,
        line_2: deliveryInfo.line_2,
        city: deliveryInfo.city,
        state: deliveryInfo.state,
        zip: deliveryInfo.zip,
      });
      setIsEditingAddress(false);
    } catch (error) {
      console.error('Error updating address:', error);
    }
  };



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
    const { firstName, lastName, email, phone, line_1 } = deliveryInfo;
    const newErrors = {};
    if (!firstName) newErrors.firstName = "First name is required.";
    if (!lastName) newErrors.lastName = "Last name is required.";
    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email address is invalid.";
    }
    if (!phone) newErrors.phone = "Phone number is required.";
    if (!line_1) newErrors.address = "Address Line 1 is required.";
    setErrors((prev) => ({ ...prev, delivery: newErrors }));
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
      // Check if delivery info has default values and skip validation if so
      const isDefaultAddress = deliveryInfo.firstName && deliveryInfo.lastName && deliveryInfo.line_1;
      if (isDefaultAddress || validateDeliveryInfo()) {
        setCurrentStep(currentStep + 1);
      }
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
          <h2 className="text-2xl font-bold mb-4">Delivery Information</h2>
          <div className="flex items-center space-x-4 mb-4">
            <button className="px-6 py-2 border border-gray-400 rounded flex items-center space-x-2">
              <span role="img" aria-label="Truck">🚚</span>
              <span>Ship</span>
            </button>
          </div>

          <div className="border border-gray-300 p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Shipping Address</h3>
              {!isEditingAddress ? (
                <button
                  onClick={handleEditAddress}
                  className="text-blue-600 underline"
                >
                  Edit
                </button>
              ) : (
                <button
                  onClick={handleSaveAddress}
                  className="text-green-600 underline"
                >
                  Save
                </button>
              )}
            </div>

            {!isEditingAddress ? (
              <div className="text-gray-700">
                <p>{deliveryInfo.firstName} {deliveryInfo.lastName}</p>
                <p>{deliveryInfo.line_1}{deliveryInfo.line_2 && `, ${deliveryInfo.line_2}`}</p>
                <p>{deliveryInfo.city}, {deliveryInfo.state} {deliveryInfo.zip}</p>
                <p>{deliveryInfo.phone}</p>
              </div>
            ) : (
              <form className="space-y-4">
                <input
                  type="text" name="firstName" placeholder="First Name" value={deliveryInfo.firstName}
                  onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full"
                />
                <input
                  type="text" name="lastName" placeholder="Last Name" value={deliveryInfo.lastName}
                  onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full"
                />
                <input
                  type="tel" name="phone" placeholder="Phone Number" value={deliveryInfo.phone}
                  onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full"
                />
                <input
                  type="text" name="line_1" placeholder="Address Line 1" value={deliveryInfo.line_1}
                  onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full"
                />
                <input
                  type="text" name="line_2" placeholder="Address Line 2" value={deliveryInfo.line_2}
                  onChange={handleDeliveryChange} className="border rounded px-4 py-2 w-full"
                />
                <input
                  type="text" name="city" placeholder="City" value={deliveryInfo.city}
                  onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full"
                />
                <input
                  type="text" name="state" placeholder="State" value={deliveryInfo.state}
                  onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full"
                />
                <input
                  type="text" name="zip" placeholder="ZIP Code" value={deliveryInfo.zip}
                  onChange={handleDeliveryChange} required className="border rounded px-4 py-2 w-full"
                />
              </form>
            )}
          </div>

          <button
            type="button"
            className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            onClick={handleNextStep}
          >
            Next: Payment Method
          </button>
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
                <h2 className="text-xl font-bold">Billing Address</h2>
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

            <div className="flex justify-between mt-4">
              <button
                type="button"
                className="w-full mr-2 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
                onClick={() => setCurrentStep(1)} // Back to Delivery Information
              >
                Back
              </button>
              <button
                type="button"
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                onClick={handleNextStep}
              >
                Next: Order Review
              </button>
            </div>
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






