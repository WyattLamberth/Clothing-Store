import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Checkout = () => {
  const location = useLocation();
  const cartItems = location.state?.cartItems || [];
  const navigate = useNavigate();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryInfo, setDeliveryInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expDate: '',
    cvv: '',
  });

  const [errors, setErrors] = useState({
    delivery: {},
    payment: {},
  });

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  const validatePaymentInfo = () => {
    const { cardNumber, expDate, cvv } = paymentInfo;
    const newErrors = {};
    if (!cardNumber) newErrors.cardNumber = "Card number is required.";
    if (!/^\d{16}$/.test(cardNumber)) newErrors.cardNumber = "Card number must be 16 digits.";
    if (!expDate) {
      newErrors.expDate = "Expiration date is required.";
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expDate)) {
      newErrors.expDate = "Expiration date must be in MM/YY format.";
    }
    if (!cvv) newErrors.cvv = "CVV is required.";
    if (!/^\d{3}$/.test(cvv)) newErrors.cvv = "CVV must be 3 digits.";
    setErrors(prev => ({ ...prev, payment: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateDeliveryInfo()) {
        setCurrentStep(currentStep + 1);
      }
    } else if (currentStep === 2) {
      if (validatePaymentInfo()) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBackStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleDeliveryChange = (e) => {
    setDeliveryInfo({ ...deliveryInfo, [e.target.name]: e.target.value });
    setErrors(prev => ({ ...prev, delivery: { ...prev.delivery, [e.target.name]: '' } }));
  };

  const handlePaymentChange = (e) => {
    setPaymentInfo({ ...paymentInfo, [e.target.name]: e.target.value });
    setErrors(prev => ({ ...prev, payment: { ...prev.payment, [e.target.name]: '' } }));
  };

  const handlePlaceOrder = () => {
    // Handle order placement logic here
    console.log('Order placed!', { deliveryInfo, paymentInfo, cartItems });
    
    // Navigate to the profile page or dashboard after placing the order
    navigate('/profile'); // Adjust the path as needed
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
          <form className="space-y-4 mt-4">
            <input type="text" name="cardNumber" placeholder="Card Number" value={paymentInfo.cardNumber} onChange={handlePaymentChange} required className="border rounded px-4 py-2 w-full" />
            {errors.payment.cardNumber && <span className="text-red-500">{errors.payment.cardNumber}</span>}
            <input type="text" name="expDate" placeholder="Expiration Date (MM/YY)" value={paymentInfo.expDate} onChange={handlePaymentChange} required className="border rounded px-4 py-2 w-full" />
            {errors.payment.expDate && <span className="text-red-500">{errors.payment.expDate}</span>}
            <input type="text" name="cvv" placeholder="CVV" value={paymentInfo.cvv} onChange={handlePaymentChange} required className="border rounded px-4 py-2 w-full" />
            {errors.payment.cvv && <span className="text-red-500">{errors.payment.cvv}</span>}
            <div className="flex justify-between">
              <button type="button" className="mt-4 w-full mr-2 bg-gray-400 text-white py-2 rounded hover:bg-gray-500" onClick={handleBackStep}>
                Back
              </button>
              <button type="button" className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700" onClick={handleNextStep}>
                Next: Order Review
              </button>
            </div>
          </form>
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
            <button type="button" className="mt-4 w-full mr-2 bg-gray-400 text-white py-2 rounded hover:bg-gray-500" onClick={handleBackStep}>
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


