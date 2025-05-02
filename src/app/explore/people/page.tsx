
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import Sidebar from '@/components/layout/Sidebar'; // Assuming Sidebar is needed for layout

const ExplorePeoplePage = () => {
    // Placeholder data for suggested users
    const suggestedUsers = Array.from({ length: 18 }).map((_, i) => ({
        id: `suggested_${i}`,
        username: `suggested_user_${i + 1}`,
        fullName: `Suggested User ${i + 1}`,
        avatarUrl: `https://picsum.photos/seed/suggest_exp${i + 1}/90/90`,
        reason: "Suggested for you",
        mutualFriends: Math.floor(Math.random() * 5), // Example detail
    }));

    return (
       <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
            <div className="container mx-auto max-w-5xl py-8 px-4">
                <h2 className="text-base font-semibold mb-4 text-muted-foreground">Suggested</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {suggestedUsers.map((user) => (
                        <Card key={user.id} className="text-center overflow-hidden">
                            <CardContent className="p-6 flex flex-col items-center">
                                <Avatar className="h-16 w-16 mb-3">
                                    <AvatarImage src={user.avatarUrl} alt={`${user.username}'s avatar`} data-ai-hint="person profile"/>
                                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <Link href={`/profile/${user.username}`} className="font-semibold text-sm hover:underline block truncate w-full">
                                    {user.username}
                                </Link>
                                <p className="text-xs text-muted-foreground truncate w-full">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground mt-1 mb-3 truncate w-full">
                                    {user.mutualFriends > 0 ? `Followed by ${user.mutualFriends} mutual friend${user.mutualFriends > 1 ? 's' : ''}` : user.reason}
                                </p>
                                <Button size="sm" className="w-full">Follow</Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
         </main>
       </div>
    );
};

export default ExplorePeoplePage;
