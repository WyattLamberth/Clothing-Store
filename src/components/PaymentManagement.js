import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import api from '../utils/api';

const PaymentManagement = () => {
    const { userId } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCardForm, setShowCardForm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [paymentError, setPaymentError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [cardDetails, setCardDetails] = useState({
        cardholder_name: '',
        card_number: '',
        expiration_date: '',
        cvv: '',
        billing_address: {
            line_1: '',
            line_2: '',
            city: '',
            state: '',
            zip: ''
        }
    });

    useEffect(() => {
        fetchPaymentMethods();
    }, [userId]);

    const handleCardInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('billing_address.')) {
            const field = name.split('.')[1];
            setCardDetails(prev => ({
                ...prev,
                billing_address: {
                    ...prev.billing_address,
                    [field]: value
                }
            }));
        } else {
            // Format expiration date
            if (name === 'expiration_date') {
                const formatted = value
                    .replace(/[^\d]/g, '')
                    .slice(0, 4)
                    .replace(/(\d{2})(\d)/, '$1/$2');
                setCardDetails(prev => ({ ...prev, [name]: formatted }));
            } else {
                setCardDetails(prev => ({ ...prev, [name]: value }));
            }
        }
    };

    const showSuccessMessage = (message) => {
        setSuccessMessage(message);
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    };

    const formatCardData = (cardDetails, userId, billingAddressId) => {
        // Make sure all required fields are present and properly formatted
        return {
            cardholder_name: cardDetails.cardholder_name,
            card_number: cardDetails.card_number.replace(/\s+/g, ''), // Remove any spaces
            expiration_date: cardDetails.expiration_date,
            cvv: cardDetails.cvv,
            user_id: userId,        // Changed from customer_id to user_id to match your schema
            billing_address_id: billingAddressId
        };
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        try {
            setPaymentError(null);

            // 1. First create billing address
            console.log('Creating billing address...', cardDetails.billing_address);
            const addressResponse = await api.post('/address', {
                line_1: cardDetails.billing_address.line_1,
                line_2: cardDetails.billing_address.line_2 || '',
                city: cardDetails.billing_address.city,
                state: cardDetails.billing_address.state,
                zip: cardDetails.billing_address.zip
            });

            if (!addressResponse.data.address_id) {
                throw new Error('No address ID returned from server');
            }

            const billing_address_id = addressResponse.data.address_id;
            console.log('Billing address created with ID:', billing_address_id);

            // 2. Create payment with proper formatted data
            const paymentData = formatCardData(cardDetails, userId, billing_address_id);
            console.log('Creating payment with data:', {
                ...paymentData,
                card_number: '****' // Mask card number in logs
            });

            const paymentResponse = await api.post('/payment', paymentData);
            console.log('Payment created:', paymentResponse.data);

            // Only reset form and show success if we get here
            setCardDetails({
                cardholder_name: '',
                card_number: '',
                expiration_date: '',
                cvv: '',
                billing_address: {
                    line_1: '',
                    line_2: '',
                    city: '',
                    state: '',
                    zip: ''
                }
            });

            showSuccessMessage('Payment method added successfully');
            setShowCardForm(false);
            fetchPaymentMethods(); // Refresh the list
        } catch (error) {
            console.error('Error in handleAddCard:', error.response?.data || error.message);

            let errorMessage = 'Failed to add payment method. ';
            if (error.response?.data?.error) {
                errorMessage += error.response.data.error;
            } else if (error.message) {
                errorMessage += error.message;
            }

            setPaymentError(errorMessage);
        }
    };

    // In your fetch payments function, let's also add better error handling
    const fetchPaymentMethods = async () => {
        if (!userId) {
          setPaymentError('No user ID available');
          return;
        }
      
        try {
          setLoading(true);
          const response = await api.get(`/payment/user/${userId}`); // Changed endpoint to get by user ID
          
          if (!response.data) {
            setCards([]);
            return;
          }
      
          // Response data should now be an array directly
          setCards(Array.isArray(response.data) ? response.data : []);
          setPaymentError(null);
        } catch (err) {
          console.error('Error in fetchPaymentMethods:', err.response?.data || err.message);
          setPaymentError('Failed to load payment methods: ' + (err.response?.data?.error || err.message));
          setCards([]); // Set empty array on error
        } finally {
          setLoading(false);
        }
      };

    const handleDeleteCard = async (cardId) => {
        try {
            await api.delete(`/payment/${cardId}`);
            showSuccessMessage('Payment method deleted successfully');
            setCards(cards.filter(card => card.preferred_payment_id !== cardId));
            setShowDeleteConfirm(false);
            setSelectedCardId(null);
        } catch (error) {
            console.error('Error deleting payment method:', error);
            setPaymentError('Failed to delete payment method');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Payment Methods</h2>
                <button
                    onClick={() => setShowCardForm(true)}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Payment Method</span>
                </button>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded">
                    {successMessage}
                </div>
            )}

            {/* Error Message */}
            {paymentError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
                    {paymentError}
                </div>
            )}

            {/* Cards List */}
            <div className="space-y-4">
                {cards.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No payment methods found</p>
                ) : (
                    cards.map(card => (
                        <div
                            key={card.preferred_payment_id}
                            className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center"
                        >
                            <div className="flex items-center space-x-4">
                                <CreditCard className="h-6 w-6 text-gray-400" />
                                <div>
                                    <p className="font-medium">{card.cardholder_name}</p>
                                    <p className="text-sm text-gray-500">
                                        •••• •••• •••• {card.card_number.slice(-4)}
                                    </p>
                                    <p className="text-sm text-gray-500">Expires: {card.expiration_date}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedCardId(card.preferred_payment_id);
                                    setShowDeleteConfirm(true);
                                }}
                                className="text-red-500 hover:text-red-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add Card Modal */}
            {showCardForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium">Add New Payment Method</h3>
                            <button onClick={() => setShowCardForm(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddCard} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cardholder Name
                                </label>
                                <input
                                    type="text"
                                    name="cardholder_name"
                                    value={cardDetails.cardholder_name}
                                    onChange={handleCardInputChange}
                                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Card Number
                                </label>
                                <input
                                    type="text"
                                    name="card_number"
                                    value={cardDetails.card_number}
                                    onChange={handleCardInputChange}
                                    pattern="\d{16}"
                                    maxLength="16"
                                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Expiration Date
                                    </label>
                                    <input
                                        type="text"
                                        name="expiration_date"
                                        placeholder="MM/YY"
                                        value={cardDetails.expiration_date}
                                        onChange={handleCardInputChange}
                                        maxLength="5"
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CVV
                                    </label>
                                    <input
                                        type="text"
                                        name="cvv"
                                        value={cardDetails.cvv}
                                        onChange={handleCardInputChange}
                                        pattern="\d{3}"
                                        maxLength="3"
                                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="font-medium mb-2">Billing Address</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address Line 1
                                        </label>
                                        <input
                                            type="text"
                                            name="billing_address.line_1"
                                            value={cardDetails.billing_address.line_1}
                                            onChange={handleCardInputChange}
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address Line 2 (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="billing_address.line_2"
                                            value={cardDetails.billing_address.line_2}
                                            onChange={handleCardInputChange}
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                name="billing_address.city"
                                                value={cardDetails.billing_address.city}
                                                onChange={handleCardInputChange}
                                                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                name="billing_address.state"
                                                value={cardDetails.billing_address.state}
                                                onChange={handleCardInputChange}
                                                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ZIP Code
                                        </label>
                                        <input
                                            type="text"
                                            name="billing_address.zip"
                                            value={cardDetails.billing_address.zip}
                                            onChange={handleCardInputChange}
                                            pattern="\d{5}"
                                            maxLength="5"
                                            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
                                >
                                    Add Payment Method
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
                        <h3 className="text-lg font-medium mb-4">Delete Payment Method</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this payment method? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setSelectedCardId(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteCard(selectedCardId)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManagement;