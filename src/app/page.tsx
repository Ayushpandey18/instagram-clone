
import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Feed from '@/components/feed/Feed';
import Stories from '@/components/feed/Stories';
import Suggestions from '@/components/feed/Suggestions';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
        <div className="flex justify-center w-full pt-8 px-4">
          <div className="w-full max-w-[975px] flex justify-between"> {/* Max width container like Instagram */}
            {/* Main Feed Area */}
            <div className="w-full max-w-[630px] mr-auto"> {/* Feed column */}
              <div className="w-full max-w-[470px] mx-auto"> {/* Centered feed within its column */}
                <Stories />
                <Feed />
              </div>
            </div>
            {/* Sidebar / Suggestions */}
            <div className="hidden lg:block w-[293px] flex-shrink-0 ml-8"> {/* Fixed width suggestions */}
                <div className="fixed top-[100px] w-[293px]"> {/* Sticky suggestions */}
                    <Suggestions />
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
