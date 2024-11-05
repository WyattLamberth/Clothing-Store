import React, { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import SideBar from '../components/SideBar';

const ShopPage = () => {
  const [categoriesName, setCategoriesName] = useState([]);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Set Default
  const priceMin = 0;
  const priceMax = 20000;
  const [categories_gender, setCategoriesGender] = useState(['M', 'F', 'K']);

  // Initialize selectedCategories and selectedGender as empty arrays
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedGender, setSelectedGender] = useState([]);

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const categoryName = selectedCategories.length > 0 ? selectedCategories.join(',') : categories_name.join(',');
        const sex = selectedGender.length > 0 ? selectedGender.join(',') : categories_gender.join(',');

        console.log('Selected Categories:', selectedCategories);
        console.log('Selected Genders:', selectedGender);

        const response = await api.get(`/filter/${categoryName}/${sex}/${priceMin}/${priceMax}/products`);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    if (categories_name.length > 0) {
      fetchProducts();
    }
  }, [categories_name, selectedCategories, selectedGender, categories_gender, priceMin, priceMax]);

  const addItemToCart = async (product) => {
    setCartItems((prevCart) => {
      const existingItem = prevCart.find(item => item.product_id === product.product_id);
      let updatedCart;

      if (existingItem) {
        updatedCart = prevCart.map(item =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updatedCart = [...prevCart, { ...product, quantity: 1 }];
      }

      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });

    try {
      await api.post('/cart-items/add', {
        product_id: product.product_id,
        quantity: 1,
      });
      console.log('Item added to cart in database');
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Recommended For You</h1>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-1/4 pr-4">
          <SideBar
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedGender={selectedGender}
            setSelectedGender={setSelectedGender}
          />
        </div>
        
        {/* Product Grid */}
        <div className="flex-1 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
              <ProductCard
                key={product.product_id}
                product={product}
                onAddToCart={addItemToCart}
                isInCart={!!cartItems.find(item => item.product_id === product.product_id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
