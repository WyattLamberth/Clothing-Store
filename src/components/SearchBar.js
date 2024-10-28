import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (event) => {
    setQuery(event.target.value);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center bg-white border border-gray-300 rounded-full shadow-md px-4 py-2">
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={handleInputChange}
        className="flex-grow outline-none px-2"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded-full hover:bg-blue-700 transition duration-200">
        Search
      </button>
    </form>
  );
};

export default SearchBar;