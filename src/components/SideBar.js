import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Range } from 'react-range';
import api from '../utils/api';

const SideBar = ({ selectedCategories, setSelectedCategories, selectedGender, setSelectedGender, priceRange, setPriceRange, sortOption, setSortOption }) => {
    const [categories, setCategories] = useState([]);
    const [expandedSections, setExpandedSections] = useState({
        'Categories': false,
        'Gender': false,
        'Shop by Price': false,
    });

    const STEP = 1; // Step value for the slider
    const MIN = 0;  // Minimum price
    const MAX = 200; // Maximum price

    // Toggle section expansion
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories/name/unique');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Handler for gender selection
    const handleGenderChange = (genderCode) => {
        setSelectedGender(prev => 
            prev.includes(genderCode)
                ? prev.filter(gender => gender !== genderCode)
                : [...prev, genderCode]
        );
    };

    // Handler for category selection
    const handleCategoryChange = (name) => {
        setSelectedCategories(prev => 
            prev.includes(name)
                ? prev.filter(selected => selected !== name)
                : [...prev, name]
        );
    };

    return (
        <div className="flex min-h-screen bg-white">
            <nav className="sticky top-0">
                {/* Reset Filter Link */}
                <div className="py-3 px-4">
                    <button
                        onClick={() => {
                            setSelectedCategories([]);
                            setSelectedGender([]);
                            setPriceRange({ min: 0, max: 200 });
                            setSortOption('default');
                        }}
                        className="block text-lg font-medium hover:text-gray-600"
                    >
                        Reset Filters
                    </button>
                </div>

                {/* Categories Section */}
                <div className="border-b border-gray-200">
                    <button
                        onClick={() => toggleSection('Categories')}
                        className="flex justify-between items-center w-full py-3 px-4 text-left"
                    >
                        <span className="font-medium text-lg mr-10">Categories</span>
                        {expandedSections['Categories'] ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                    {expandedSections['Categories'] && (
                        <div className="px-4 pb-3">
                            <div className="space-y-2">
                                {categories.map(category => (
                                    <label key={category.name} className="flex items-center space-x-2 pl-6">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category.name)}
                                            onChange={() => handleCategoryChange(category.name)}
                                            className="rounded"
                                        />
                                        <span>{category.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Gender Section */}
                <div className="border-b border-gray-200">
                    <button
                        onClick={() => toggleSection('Gender')}
                        className="flex justify-between items-center w-full py-3 px-4 text-left"
                    >
                        <span className="font-medium text-lg mr-10">Gender</span>
                        {expandedSections['Gender'] ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                    {expandedSections['Gender'] && (
                        <div className="px-4 pb-3">
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 pl-6">
                                    <input
                                        type="checkbox"
                                        checked={selectedGender.includes('M')}
                                        onChange={() => handleGenderChange('M')}
                                        className="rounded"
                                    />
                                    <span>Men</span>
                                </label>
                                <label className="flex items-center space-x-2 pl-6">
                                    <input
                                        type="checkbox"
                                        checked={selectedGender.includes('F')}
                                        onChange={() => handleGenderChange('F')}
                                        className="rounded"
                                    />
                                    <span>Women</span>
                                </label>
                                <label className="flex items-center space-x-2 pl-6">
                                    <input
                                        type="checkbox"
                                        checked={selectedGender.includes('K')}
                                        onChange={() => handleGenderChange('K')}
                                        className="rounded"
                                    />
                                    <span>Kids</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Shop by Price Section */}
                <div className="border-b border-gray-200">
                    <button
                        onClick={() => toggleSection('Shop by Price')}
                        className="flex justify-between items-center w-full py-3 px-4 text-left"
                    >
                        <span className="font-medium text-lg mr-10">By Price</span>
                        {expandedSections['Shop by Price'] ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                    {expandedSections['Shop by Price'] && (
                        <div className="px-4 pb-3">
                            {/* Min Price Slider */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Min Price</label>
                                <Range
                                    step={STEP}
                                    min={MIN}
                                    max={MAX}
                                    values={[priceRange.min]}
                                    onChange={(values) =>
                                        setPriceRange({ ...priceRange, min: values[0] })
                                    }
                                    renderTrack={({ props, children }) => {
                                        const percentage = ((priceRange.min - MIN) / (MAX - MIN)) * 100;

                                        return (
                                            <div
                                                {...props}
                                                className="h-2 bg-gray-200 rounded-full relative"
                                            >
                                                {/* Blue portion up to the left cursor */}
                                                <div
                                                    className="absolute h-2 bg-blue-500 rounded-full"
                                                    style={{
                                                        width: `${percentage}%`,
                                                    }}
                                                />
                                                {children}
                                            </div>
                                        );
                                    }}
                                    renderThumb={({ props, isDragged }) => (
                                        <div
                                            {...props}
                                            className={`w-4 h-4 bg-blue-500 border border-blue-700 rounded-full ${isDragged ? 'shadow-lg' : ''}`}
                                        />
                                    )}
                                />

                                <span className="text-sm">${priceRange.min}</span>
                            </div>

                            {/* Max Price Slider */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Max Price</label>
                                <Range
                                    step={STEP}
                                    min={MIN}
                                    max={MAX}
                                    values={[priceRange.max]}
                                    onChange={(values) =>
                                        setPriceRange({ ...priceRange, max: values[0] })
                                    }
                                    renderTrack={({ props, children }) => {
                                        const percentage = ((priceRange.max - MIN) / (MAX - MIN)) * 100;

                                        return (
                                            <div
                                                {...props}
                                                className="h-2 bg-gray-200 rounded-full relative"
                                            >
                                                {/* Blue portion up to the max cursor */}
                                                <div
                                                    className="absolute h-2 bg-blue-500 rounded-full"
                                                    style={{
                                                        width: `${percentage}%`,
                                                    }}
                                                />
                                                {/* Gray portion from max cursor to end */}
                                                <div
                                                    className="absolute h-2 bg-gray-200 rounded-full"
                                                    style={{
                                                        left: `${percentage}%`,
                                                        right: 0,
                                                    }}
                                                />
                                                {children}
                                            </div>
                                        );
                                    }}
                                    renderThumb={({ props, isDragged }) => (
                                        <div
                                            {...props}
                                            className={`w-4 h-4 bg-blue-500 border border-blue-700 rounded-full ${isDragged ? 'shadow-lg' : ''}`}
                                        />
                                    )}
                                />

                                <span className="text-sm">${priceRange.max}</span>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default SideBar;
