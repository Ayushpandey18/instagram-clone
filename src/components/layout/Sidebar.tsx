
'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Search, Compass, Clapperboard, MessageCircle, Heart, PlusSquare, UserCircle, MicVocal, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import InstagramLogo from './InstagramLogo'; // Import the new logo component

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/explore', icon: Compass, label: 'Explore' },
    { href: '/reels', icon: Clapperboard, label: 'Reels' },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/notifications', icon: Heart, label: 'Notifications' },
    { href: '/create', icon: PlusSquare, label: 'Create' },
    { href: '/profile', icon: UserCircle, label: 'Profile' },
    { href: '/voice-rooms', icon: MicVocal, label: 'Voice Rooms' }, // Added Voice Rooms
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 h-screen w-[72px] lg:w-[244px] border-r bg-background flex flex-col justify-between py-6 px-3 z-40 transition-all duration-300 ease-in-out">
        <div>
          {/* Logo */}
          <div className="mb-8 px-1 lg:px-3">
             <Link href="/" className="block h-8 flex items-center" aria-label="Instagram logo">
               {/* Text Logo for expanded state */}
               <h1 className="text-2xl font-semibold hidden lg:block">Instagram</h1>
                {/* Icon Logo for collapsed state */}
               <div className="block lg:hidden">
                  <InstagramLogo />
               </div>
             </Link>
           </div>

          {/* Navigation */}
          <nav>
            <ul>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href === '/profile' && pathname.startsWith('/profile'));
                return (
                <li key={item.label} className="mb-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.href} legacyBehavior passHref>
                        <a
                          className={cn(
                            "flex items-center p-3 rounded-md hover:bg-secondary transition-colors",
                            isActive ? 'font-semibold' : 'font-normal', // Use font-semibold for active
                          )}
                          aria-current={isActive ? 'page' : undefined}
                        >
                           <item.icon className="h-6 w-6 shrink-0" strokeWidth={isActive ? 2.5 : 2}/>
                           <span className="ml-4 hidden lg:block text-base">{item.label}</span>
                        </a>
                      </Link>
                    </TooltipTrigger>
                     <TooltipContent side="right" className="lg:hidden">
                        <p>{item.label}</p>
                     </TooltipContent>
                  </Tooltip>
                </li>
              )})}
            </ul>
          </nav>
        </div>

        {/* Settings/More */}
        <div className="mt-auto">
          <Tooltip>
              <TooltipTrigger asChild>
                 <Link href="/settings" legacyBehavior passHref>
                    <Button variant="ghost" className="w-full justify-start p-3">
                        <Settings className="h-6 w-6 shrink-0" />
                        <span className="ml-4 hidden lg:block text-base">Settings</span>
                    </Button>
                 </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                <p>Settings</p>
              </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
