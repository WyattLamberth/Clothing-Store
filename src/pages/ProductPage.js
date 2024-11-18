import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import CartOverlay from '../components/CartOverlay';
import { useAuth } from '../AuthContext';

const colorMapping = [
  { name: 'Red', colorCode: '#FF0000' },
  { name: 'Green', colorCode: '#00FF00' },
  { name: 'Blue', colorCode: '#0000FF' },
  { name: 'Yellow', colorCode: '#FFFF00' },
  { name: 'Black', colorCode: '#000000' },
  { name: 'White', colorCode: '#FFFFFF' },
  { name: 'Pink', colorCode: '#FFC0CB' },
  { name: 'Khaki', colorCode: '#C2B280' },
  { name: 'Navy', colorCode: '#000080' },
  { name: 'Grey', colorCode: '#808080' },
  { name: 'Cyan', colorCode: '#00FFFF' },
  { name: 'Magenta', colorCode: '#FF00FF' },
  { name: 'Orange', colorCode: '#FFA500' },
  { name: 'Purple', colorCode: '#800080' },
  { name: 'Teal', colorCode: '#008080' },
  { name: 'Lime', colorCode: '#00FF00' },
  { name: 'Maroon', colorCode: '#800000' },
  { name: 'Olive', colorCode: '#808000' },
  { name: 'Coral', colorCode: '#FF7F50' },
  { name: 'Turquoise', colorCode: '#40E0D0' },
  { name: 'Gold', colorCode: '#FFD700' },
  { name: 'Silver', colorCode: '#C0C0C0' },
  { name: 'Brown', colorCode: '#A52A2A' },
  { name: 'Beige', colorCode: '#F5F5DC' },
  { name: 'Lavender', colorCode: '#E6E6FA' },
  { name: 'Indigo', colorCode: '#4B0082' },
  { name: 'Mint', colorCode: '#98FF98' },
  { name: 'Peach', colorCode: '#FFDAB9' },
  { name: 'Salmon', colorCode: '#FA8072' },
  { name: 'Chocolate', colorCode: '#D2691E' },
  { name: 'Crimson', colorCode: '#DC143C' },
  { name: 'Aqua', colorCode: '#00FFFF' },
  { name: 'Plum', colorCode: '#DDA0DD' },
  { name: 'Orchid', colorCode: '#DA70D6' },
  { name: 'Sky Blue', colorCode: '#87CEEB' },
  { name: 'Ivory', colorCode: '#FFFFF0' },
  { name: 'Slate Grey', colorCode: '#708090' },
  { name: 'Forest Green', colorCode: '#228B22' },
  { name: 'Sea Green', colorCode: '#2E8B57' },
  { name: 'Deep Pink', colorCode: '#FF1493' },
  { name: 'Hot Pink', colorCode: '#FF69B4' },
  { name: 'Midnight Blue', colorCode: '#191970' },
  { name: 'Rosy Brown', colorCode: '#BC8F8F' },
  { name: 'Snow', colorCode: '#FFFAFA' },
  { name: 'Slate Blue', colorCode: '#6A5ACD' },
];


const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const { isAuthenticated, userId } = useAuth();
  const [isLoading, setIsLoading] = useState(true); // Loading state for stock
  const [stock, setStock] = useState(null); // Stock state

  // Fetch or initialize cart
  useEffect(() => {
    const initializeCart = async () => {
      if (isAuthenticated) {
        try {
          const response = await api.get('/shopping_cart');
          if (response.data.cartItems) {
            setCart(response.data.cartItems);
            localStorage.setItem('cart', JSON.stringify(response.data.cartItems));
          }
        } catch (error) {
          if (error.response?.status === 404) {
            try {
              await api.post('/shopping_cart/create');
            } catch (createError) {
              console.error('Error creating cart:', createError);
            }
          }
        }
      } else {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      }
    };

    initializeCart();
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
        setStock(response.data.stock_quantity); // Set stock quantity
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setIsLoading(false); // Stop loading once the product is fetched
      }
    };

    fetchProduct();
  }, [id]);

  const addToCart = async (product) => {
    try {
      if (stock <= 0) {
        alert('Sorry, this product is out of stock.');
        return;
      }

      let updatedCart = [...cart];
      const existingItem = updatedCart.find(item => item.product_id === product.product_id);

      if (existingItem) {
        if (existingItem.quantity >= stock) {
          alert('Sorry, you cannot add more than the available stock.');
          return;
        }
        existingItem.quantity += 1;
      } else {
        updatedCart.push({ ...product, quantity: 1 });
      }

      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      if (isAuthenticated) {
        await api.post('/cart-items/add', {
          product_id: product.product_id,
          quantity: 1,
        });
      }

      setSelectedProduct(product);
      setShowOverlay(true);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setSelectedProduct(null);
  };

  if (!product) return <div>Loading...</div>;

  const foundColor = colorMapping.find(color => color.name.toLowerCase() === product.color.toLowerCase());

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Image Section */}
      <div className="flex flex-col items-center">
        {product.image_path ? (
          <img
            src={require(`../images/${product.image_path}`)}
            alt={product.product_name}
            className="w-full h-auto object-cover rounded-lg mb-4"
          />
        ) : (
          <div className="w-full h-auto object-cover rounded-lg mb-4">
            <p className="text-gray-500">Image not available</p>
          </div>
        )}

        {/* Image Navigation */}
        <div className="flex space-x-2">
          {product.images?.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${product.name} ${index + 1}`}
              className="w-16 h-16 object-cover rounded cursor-pointer"
              onClick={() => setProduct((prev) => ({ ...prev, image_path: img }))}
            />
          ))}
        </div>
      </div>

      {/* Product Details Section */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-semibold mb-2">{product.product_name}</h1>
        <p className="text-gray-600 underline">Brand {product.brand}</p>
        <p className="text-gray-600 text-2xl mb-10">${product.price}</p>

        {/* Color and Color Box */}
        <div style={{ fontFamily: 'Arial, sans-serif', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
            Select Color: {product.color}
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: foundColor?.colorCode,
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginBottom: '5px',
              }}
            ></div>
          </div>
        </div>

        {/* Size and Size Box */}
        <div style={{ fontFamily: 'Arial, sans-serif', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Select Size:</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #000',
                fontSize: '20px',
              }}
            >
              {product.size}
            </div>
          </div>
        </div>

        {/* Button and Cart Link */}
        <button
          className={`w-full py-3 font-bold rounded mb-2 mt-5 ${stock <= 0 || isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-gray-800'} text-white`}
          onClick={() => addToCart(product)}
          disabled={stock <= 0 || isLoading}
        >
          {stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
        
        {/* Stock left information */}
        {stock > 0 && !isLoading && (
          <p className="text-gray-500">In Stock: {stock}</p>
        )}

        {stock <= 0 && (
          <p className="text-red-500">Sorry, this product is out of stock.</p>
        )}

        {/* Shipping and Description */}
        <div className="mt-6">
          <h2 className="font-semibold text-lg">Shipping</h2>
          <p className="text-gray-600">You'll see our shipping options at checkout.</p>
          <p className="text-blue-600">Free shipping on orders over $50.</p>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-lg">Description</h2>
          <p className="text-gray-600">{product.description}</p>
        </div>

        {showOverlay && selectedProduct && (
          <CartOverlay
            product={selectedProduct}
            onClose={handleCloseOverlay}
          />
        )}
      </div>
    </div>
  );
};

export default ProductPage;
