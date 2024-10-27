import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

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

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Shop</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.product_id}
            product={product}
            onAddToCart={addItemToCart}
            isInCart={!!cartItems.find(item => item.product_id === product.product_id)} // Pass if product is in cart
          />
        ))}
      </div>
    </div>
  );
};

export default ShopPage;



/*
const PromotionBanner = ({ currentPromo, handlePrev, handleNext }) => (
  <div className="w-full overflow-hidden bg-slate-300 flex items-center justify-center py-2">
    <button onClick={handlePrev} className="text-black px-4">◀</button>
    <div className="whitespace-nowrap text-center text-lg text-black font-semibold px-4">{currentPromo}</div>
    <button onClick={handleNext} className="text-black px-4">▶</button>
  </div>
);
*/

/*
const CategoryDropdown = ({ categories, activeCategory, setActiveCategory }) => (
  <div className="flex justify-center w-full space-x-6 py-4 bg-gray-50">
    {Object.keys(categories).map((category) => (
      <div
        key={category}
        onMouseEnter={() => setActiveCategory(category)}
        onMouseLeave={() => setActiveCategory(null)}
        className="relative"
      >
        <button className="text-lg font-semibold">{category}</button>
        {activeCategory === category && (
          <div className="absolute top-full mt-2 w-48 bg-white shadow-lg rounded-md">
            {categories[category].map((subCategory) => (
              <a
                key={subCategory}
                href={`/shop/${category.toLowerCase()}/${subCategory.toLowerCase()}`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                {subCategory}
              </a>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
);

const FeaturedProducts = () => (
  <section className="container mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold text-center mb-12">Shop Products</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {productsData.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  </section>
);
*/


/*const ShopPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then(response => response.json())
      .then(data => setProducts(data))
      .catch(error => console.error('Error fetching products:', error));
  }, []);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6">Shop</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};*/














