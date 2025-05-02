
'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar'; // Assuming Sidebar is needed for layout
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { UserCog, BellRing, Lock, ShieldCheck, HelpCircle, SunMoon, Palette } from 'lucide-react'; // Example icons

const settingsSections = [
  { id: 'edit-profile', title: 'Edit profile', description: 'Manage your account details.', icon: UserCog, href: '/settings/edit-profile' },
  { id: 'notifications', title: 'Notifications', description: 'Control push, email, and SMS notifications.', icon: BellRing, href: '/settings/notifications' },
  { id: 'privacy', title: 'Privacy and security', description: 'Manage account privacy, security checks.', icon: Lock, href: '/settings/privacy' },
  { id: 'login-activity', title: 'Login activity', description: 'See where you\'re logged in.', icon: ShieldCheck, href: '/settings/login-activity' },
  { id: 'help', title: 'Help', description: 'Get support or report a problem.', icon: HelpCircle, href: '/settings/help' },
  { id: 'appearance', title: 'Appearance', description: 'Customize theme and display.', icon: Palette, href: '/settings/appearance' },
];

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
        <div className="container mx-auto max-w-3xl py-12 px-4">
          <h1 className="text-2xl font-semibold mb-8">Settings</h1>

          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {settingsSections.map((section, index) => (
                  <li key={section.id}>
                    <Link href={section.href} legacyBehavior passHref>
                       <a className="flex items-center p-4 hover:bg-secondary transition-colors">
                          <section.icon className="h-6 w-6 mr-4 text-muted-foreground" />
                           <div className="flex-grow">
                              <p className="font-medium">{section.title}</p>
                              <p className="text-sm text-muted-foreground">{section.description}</p>
                           </div>
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground"><path d="m9 18 6-6-6-6"/></svg>
                       </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Add section for Meta Accounts Center */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
             <p>Meta Accounts Center</p>
             <p>Manage your connected experiences and account settings across Meta technologies.</p>
             {/* Add link to actual Accounts Center if applicable */}
             <Link href="#" className="text-primary hover:underline">Learn more</Link>
           </div>

        </div>
      </main>
    </div>
  );
}
