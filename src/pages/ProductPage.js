import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const colorMapping = [
    { name: 'Red', colorCode: '#FF0000' },
    { name: 'Green', colorCode: '#00FF00' },
    { name: 'Blue', colorCode: '#0000FF' },
    { name: 'Yellow', colorCode: '#FFFF00' },
    { name: 'Black', colorCode: '#000000' },
    { name: 'White', colorCode: '#FFFFFF' },
    { name: 'Pink', colorCode: '#FFC0CB' },
    { name: 'Khaki', colorCode: '#C2B280'},
    { name: 'Navy', colorCode: '#000080'},
    { name: 'Grey', colorCode: '#808080'},
];

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`); 
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    fetchProduct();
  }, []);
  if (!product) return <div>Loading...</div>;

  const addItemToCart = (product) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find(item => item.product_id === product.product_id);
      let updatedCart;

      if (existingItem) {
        // Increase quantity if the item is already in the cart
        updatedCart = prevCart.map(item =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add new item to cart
        updatedCart = [...prevCart, { ...product, quantity: 1 }];
      }

      // Save updated cart to localStorage
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

  const foundColor = colorMapping.find(color => color.name.toLowerCase() === product.color.toLowerCase());

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/*Image Section */}
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

            {/*image navigation*/}
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
      {/* Name, brand, price */}
      <div className="flex flex-col">
        <br />
        <br />
        <br />
        <h1 className="text-3xl font-semibold mb-2">{product.product_name}</h1>
        <p className="text-gray-600 underline">Brand {product.brand}</p>
        <p className="text-gray-600 text-2xl mb-10">${product.price}</p>

        {/* Color and color box */}
        <div style={{ fontFamily: 'Arial, sans-serif', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Select Color: {product.color}</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: foundColor.colorCode,
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        marginBottom: '5px'
                    }}
                ></div>
            </div>
        </div>
        
        {/* size and size box */}
        <br />
        <div style={{ fontFamily: 'Arial, sans-serif', marginBottom: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Select Size:</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #000',
                    fontSize: '20px',
                }}>{product.size}</div>
            </div>
        </div>
        
        {/* Button and cart link*/}
        <br />
        <br />
        <div>
            <div className="mb-4"></div>
            <button 
                className="w-full py-3 bg-blue-500 text-white font-bold rounded mb-2 hover:bg-gray-800"
                onClick={() => addItemToCart(product)} 
            >
                Add to Cart
            </button>
        </div>
        
        {/* Shipping and Description */}
        <div className="mt-6">
          <h2 className="font-semibold text-lg">Shipping</h2>
          <p className="text-gray-600">You'll see our shipping options at checkout.</p>
          <p className="text-blue-600">Free shipping on orders over $50.</p>
        </div>

        <br />
        <div className="mt-6">
          <h2 className="font-semibold text-lg">Description</h2>
          <p className="text-gray-600">{product.description}</p>
        </div>

      </div>
    </div>
  );
};

export default ProductPage;