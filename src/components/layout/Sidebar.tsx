'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Search, Compass, Clapperboard, MessageCircle, Heart, PlusSquare, UserCircle, MicVocal, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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
          <div className="mb-8 px-2 lg:px-3">
            <Link href="/" className="block">
              {/* Simple Text Logo for now */}
              <h1 className="text-2xl font-semibold hidden lg:block">InstaVoice</h1>
               {/* Icon Logo for collapsed state */}
               <svg className="w-6 h-6 block lg:hidden" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6zm-1.5-9a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm3 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>

            </Link>
          </div>

          {/* Navigation */}
          <nav>
            <ul>
              {navItems.map((item) => (
                <li key={item.label} className="mb-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.href} legacyBehavior passHref>
                        <a
                          className={cn(
                            "flex items-center p-3 rounded-md hover:bg-secondary transition-colors",
                            pathname === item.href ? 'font-semibold' : '',
                          )}
                        >
                          <item.icon className="h-6 w-6 shrink-0" strokeWidth={pathname === item.href ? 2.5 : 2}/>
                          <span className="ml-4 hidden lg:block text-base">{item.label}</span>
                        </a>
                      </Link>
                    </TooltipTrigger>
                     <TooltipContent side="right" className="lg:hidden">
                        <p>{item.label}</p>
                     </TooltipContent>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Settings/More */}
        <div className="mt-auto">
          <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-3">
                    <Settings className="h-6 w-6 shrink-0" />
                    <span className="ml-4 hidden lg:block text-base">Settings</span>
                </Button>
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
