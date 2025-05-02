
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import Sidebar from '@/components/layout/Sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SuggestedUser } from '@/services/user'; // Import type only
import { getExplorePeople } from '@/services/user';

const ExplorePeoplePage = () => {
    const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const users = await getExplorePeople(18); // Fetch 18 users for this page
                setSuggestedUsers(users);
            } catch (err) {
                console.error("Failed to fetch suggested users:", err);
                setError("Could not load suggestions. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestions();
    }, []);

    // TODO: Implement follow/unfollow logic using the user service

    return (
       <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
            <div className="container mx-auto max-w-5xl py-8 px-4">
                <h2 className="text-base font-semibold mb-4 text-muted-foreground">Suggested</h2>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {isLoading
                        ? Array.from({ length: 10 }).map((_, i) => (
                            <Card key={`skel-${i}`} className="overflow-hidden">
                                <CardContent className="p-6 flex flex-col items-center">
                                    <Skeleton className="h-16 w-16 rounded-full mb-3" />
                                    <Skeleton className="h-4 w-3/4 mb-1" />
                                    <Skeleton className="h-3 w-1/2 mb-3" />
                                    <Skeleton className="h-9 w-full rounded-md" />
                                </CardContent>
                            </Card>
                          ))
                        : suggestedUsers.map((user) => (
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
                                        {user.mutualFriends && user.mutualFriends > 0 ? `Followed by ${user.mutualFriends} mutual friend${user.mutualFriends > 1 ? 's' : ''}` : user.reason}
                                    </p>
                                    {/* TODO: Add onClick handler for follow button */}
                                    <Button size="sm" className="w-full">Follow</Button>
                                </CardContent>
                            </Card>
                        ))}
                    {!isLoading && suggestedUsers.length === 0 && !error && (
                        <p className="col-span-full text-center text-muted-foreground py-10">No suggestions found right now.</p>
                    )}
                </div>
                 {/* TODO: Add pagination or infinite scroll */}
            </div>
         </main>
       </div>
    );
};

export default ExplorePeoplePage;
