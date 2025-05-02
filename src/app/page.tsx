import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Feed from '@/components/feed/Feed';
import Stories from '@/components/feed/Stories';
import Suggestions from '@/components/feed/Suggestions';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-grow md:pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
        <div className="container mx-auto max-w-screen-lg pt-4 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Feed Area */}
            <div className="md:col-span-2">
              <Stories />
              <Feed />
            </div>
            {/* Sidebar / Suggestions */}
            <div className="hidden md:block md:col-span-1">
              <Suggestions />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
