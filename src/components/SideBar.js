import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import api from '../utils/api';

const SideBar = ({ selectedCategories, setSelectedCategories, selectedGender, setSelectedGender }) => {
    const [categories, setCategories] = useState([]);
    const [expandedSections, setExpandedSections] = useState({
        'Categories': false,
        'Gender': false,
        'Shop by Price': false,
    });
    const [priceRanges, setPriceRanges] = useState({
        '0-50': false,
        '50+': false,
    });

    // Toggle section expansion
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Wrapper for section structure
    const SidebarSection = ({ title, children }) => (
        <div className="border-b border-gray-200">
            <button
                onClick={() => toggleSection(title)}
                className="flex justify-between items-center w-full py-3 px-4 text-left"
            >
                <span className="font-medium text-lg">{title}</span>
                {expandedSections[title] ? (
                    <ChevronUp className="w-4 h-4" />
                ) : (
                    <ChevronDown className="w-4 h-4" />
                )}
            </button>
            {expandedSections[title] && (
                <div className="px-4 pb-3">
                    {children}
                </div>
            )}
        </div>
    );

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

    return (
        <div className="flex min-h-screen bg-white">
            <nav className="sticky top-0">
                {/* Reset Filter Link */}
                <div className="py-3 px-4">
                    <button
                        onClick={() => {
                            setSelectedCategories([]);
                            setSelectedGender([]);
                        }}
                        className="block text-lg font-medium hover:text-gray-600"
                    >
                        Reset Filters
                    </button>
                </div>

                {/* Categories Section */}
                <SidebarSection title="Categories">
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
                </SidebarSection>

                {/* Gender Section */}
                <SidebarSection title="Gender">
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
                </SidebarSection>

                {/* Shop by Price Section */}
                <SidebarSection title="Shop by Price">
                    <div className="space-y-2">
                        <label className="flex items-center space-x-2 pl-6">
                            <input
                                type="checkbox"
                                checked={priceRanges['0-50']}
                                onChange={() => setPriceRanges(prev => ({
                                    ...prev,
                                    '0-50': !prev['0-50']
                                }))}
                                className="rounded"
                            />
                            <span>$0 - $50</span>
                        </label>
                        <label className="flex items-center space-x-2 pl-6">
                            <input
                                type="checkbox"
                                checked={priceRanges['50+']}
                                onChange={() => setPriceRanges(prev => ({
                                    ...prev,
                                    '50+': !prev['50+']
                                }))}
                                className="rounded"
                            />
                            <span>$50+</span>
                        </label>
                    </div>
                </SidebarSection>
            </nav>
        </div>
    );
};

export default SideBar;