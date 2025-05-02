import React from 'react';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="relative mb-6">
         <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search"
          className="pl-10 w-full bg-secondary focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary"
        />
      </div>

        {/* Placeholder for search results or explore grid */}
       <div className="text-center py-20 text-muted-foreground">
            <p>Search for users, tags, or places.</p>
            <p>Or explore content below.</p>
            {/* Explore grid would go here */}
       </div>

    </div>
  );
}
