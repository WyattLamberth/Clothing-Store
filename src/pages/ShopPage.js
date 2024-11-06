import React, { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import SideBar from '../components/SideBar';
import CartOverlay from '../components/CartOverlay';
import { useAuth } from '../AuthContext';
import SideBar from '../components/SideBar';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  // Get cartItems without the setter since we only need it for checking isInCart
  const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

  // Set Default
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


  const handleProductAdded = (product) => {
    console.log('Product added to cart:', product);
    setSelectedProduct(product);
    setShowOverlay(true);
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
        
        {/* Product Grid */}
        <div className="flex-1 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
              <ProductCard
                key={product.product_id}
                product={product}
                onProductAdded={handleProductAdded}
                isInCart={!!cartItems.find(item => item.product_id === product.product_id)}
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
    </div>
  );
};

export default ShopPage;
