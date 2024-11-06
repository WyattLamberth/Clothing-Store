import React, { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import CartOverlay from '../components/CartOverlay';
import { useAuth } from '../AuthContext';
import SideBar from '../components/SideBar';

const ShopPage = () => {
  const [categoriesName, setCategoriesName] = useState([]);
  const [products, setProducts] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const { isAuthenticated, userId } = useAuth();

  // Set default
  const priceMin = 0;
  const priceMax = 200;
  const [categories_gender, setCategoriesGender] = useState(['M', 'F', 'K']);
  const [sortOption, setSortOption] = useState('default');
  // Initialize selectedCategories and selectedGender as empty arrays
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedGender, setSelectedGender] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: priceMin, max: priceMax });
  useEffect(() => {
    const fetchCategoriesName = async () => {
      try {
        const response = await api.get('/categories/name/unique');
        setCategoriesName(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategoriesName();
  }, []);

  

  const categories_name = useMemo(
    () => categoriesName.map(category => category.name),
    [categoriesName]
  );

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let categoryName;
        let sex;
        categoryName = selectedCategories.length > 0 ? selectedCategories.join(',') : categories_name.join(',');
        sex = selectedGender.length > 0 ? selectedGender.join(',') : categories_gender.join(',');
        let response;
        if (sortOption === "highToLow"){
          response = await api.get(`/filter/${categoryName}/${sex}/${priceRange.min}/${priceRange.max}/products/HightoLow`);
        } else if (sortOption === "lowToHigh"){
          response = await api.get(`/filter/${categoryName}/${sex}/${priceRange.min}/${priceRange.max}/products/LowtoHigh`);
        } else{
          response = await api.get(`/filter/${categoryName}/${sex}/${priceRange.min}/${priceRange.max}/products`);
        }
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    if (categories_name.length > 0) {
      fetchProducts();
    }
  }, [categories_name, selectedCategories, selectedGender, categories_gender, priceRange, sortOption]);

  // Fetch or initialize cart
  useEffect(() => {
    const initializeCart = async () => {
      if (isAuthenticated) {
        // Fetch user's cart from database
        try {
          const response = await api.get('/shopping_cart');
          if (response.data.cartItems) {
            setCart(response.data.cartItems);
            // Also update localStorage to keep them in sync
            localStorage.setItem('cart', JSON.stringify(response.data.cartItems));
          }
        } catch (error) {
          if (error.response?.status === 404) {
            // If no cart exists, create one
            try {
              await api.post('/shopping_cart/create');
            } catch (createError) {
              console.error('Error creating cart:', createError);
            }
          }
        }
      } else {
        // For guest users, get cart from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      }
    };

    initializeCart();
  }, [isAuthenticated]);

  const addToCart = async (product) => {
    try {
      let updatedCart = [...cart];
      const existingItem = updatedCart.find(item => item.product_id === product.product_id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        updatedCart.push({ ...product, quantity: 1 });
      }

      // Update local state
      setCart(updatedCart);
      
      // Always update localStorage as a backup
      localStorage.setItem('cart', JSON.stringify(updatedCart));

      if (isAuthenticated) {
        // Update database if user is logged in
        await api.post('/cart-items/add', {
          product_id: product.product_id,
          quantity: 1,
        });
      }

      // Show overlay
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

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6"></h1>
            {/* Sort Bar */}
        <div className="flex items-center justify-end">
          <label htmlFor="sort" className="font-medium mr-2">Sort by:</label>
          <select
            id="sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1"
          >
            <option value="default">Default</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
          </select>
        </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-1/4 pr-4">
          <SideBar
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedGender={selectedGender}
            setSelectedGender={setSelectedGender}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
        </div>
      
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product.product_id}
              product={product}
              onAddToCart={() => addToCart(product)}
              isInCart={!!cart.find(item => item.product_id === product.product_id)}
            />
          ))}
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

export default ShopPage;