import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function SearchBar({ onSearch, className = '' }){
  const [query,setQuery]=useState('');

  /**
   @description while submitting the form if the query is not empty it will call the onSearch function 
   */

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (query.trim()) {
      await onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center ${className}`}>
      <div className="relative flex-grow">
        {/* AI Search bar */}
        <Input
          type="text"
          placeholder="Search projects with AI... (e.g., 'simple portfolio with HTML and CSS')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full"
        />
        <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>
      <Button type="submit" variant="outline" size="icon" className="ml-2">
        <Search className="h-4 w-4" />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  );
}

