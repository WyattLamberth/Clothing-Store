// SearchBar.js
import React, { useState } from 'react';

const SearchBar = ({onSearch}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault(); // Prevent default form submission
    onSearch(query); // Call the parent-provided search handler
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center bg-white border border-gray-300 rounded-full shadow-md px-4 py-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for products..."
        className="w-full border-none p-3 text-lg rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button type="submit" className="bg-blue-500 text-white p-2 rounded-md">
        Search
      </button>
    </form>
  );
};

export default SearchBar;
