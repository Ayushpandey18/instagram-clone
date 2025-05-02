

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Feed from '@/components/feed/Feed';
import Stories from '@/components/feed/Stories';
import Suggestions from '@/components/feed/Suggestions';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out overflow-y-auto"> {/* Added overflow-y-auto */}
        <div className="flex justify-center w-full pt-8 px-4">
          {/* Max width container like Instagram */}
          <div className="w-full max-w-[975px] flex flex-col lg:flex-row justify-center lg:justify-between items-start gap-x-8">

             {/* Left Column: Stories and Feed */}
             <div className="w-full lg:max-w-[630px] flex-shrink-0 mb-8 lg:mb-0">
                 {/* Centered within its column on larger screens, full width on smaller */}
                 <div className="w-full max-w-[470px] mx-auto">
                    <Stories />
                    <Feed />
                 </div>
            </div>

            {/* Right Column: Suggestions (Sidebar) */}
            {/* Hide on smaller screens, fixed position on larger screens */}
            <div className="hidden lg:block w-full lg:w-[293px] flex-shrink-0 relative lg:sticky lg:top-8"> {/* Adjusted positioning */}
                {/* Apply fixed positioning within the relative parent for the sticky effect */}
                 <div className="lg:fixed lg:w-[293px] lg:top-[calc(2rem+60px)]"> {/* Adjust top offset based on header/nav height */}
                    <Suggestions />
                 </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
