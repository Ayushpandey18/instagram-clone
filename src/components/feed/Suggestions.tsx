
'use client'; // Required for state and effects

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile, SuggestedUser } from '@/services/user'; // Import types only
import { getCurrentUser, getSuggestedUsers } from '@/services/user';

const Suggestions = () => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch Current User
    useEffect(() => {
        const fetchUser = async () => {
            setIsLoadingUser(true);
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
            } catch (err) {
                console.error("Failed to fetch current user:", err);
                // Don't set global error for this, maybe just log or show placeholder
            } finally {
                setIsLoadingUser(false);
            }
        };
        fetchUser();
    }, []);

    // Fetch Suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            setIsLoadingSuggestions(true);
            setError(null); // Clear previous errors
            try {
                const suggested = await getSuggestedUsers(5); // Fetch 5 suggestions
                setSuggestions(suggested);
            } catch (err) {
                console.error("Failed to fetch suggestions:", err);
                setError("Could not load suggestions.");
            } finally {
                setIsLoadingSuggestions(false);
            }
        };
        fetchSuggestions();
    }, []);

    // TODO: Implement Follow/Unfollow logic
    // TODO: Implement Switch Account logic (if needed)

    const renderCurrentUser = () => {
        if (isLoadingUser) {
            return (
                 <div className="flex items-center mb-5">
                    <Skeleton className="h-14 w-14 rounded-full mr-4" />
                    <div className="flex-grow space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                     <Skeleton className="h-4 w-12" />
                </div>
            );
        }
        if (!currentUser) {
             return <div className="mb-5 text-sm text-muted-foreground">Could not load user info.</div>; // Or login prompt
        }
        return (
            <div className="flex items-center mb-5">
                <Avatar className="h-14 w-14 mr-4">
                    <AvatarImage src={currentUser.avatarUrl} alt="Your avatar" data-ai-hint="person profile"/>
                    <AvatarFallback>{currentUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <Link href={`/profile/${currentUser.username}`} className="font-semibold text-sm block hover:underline">
                        {currentUser.username}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">{currentUser.fullName}</p>
                </div>
                 {/* TODO: Add Switch Account functionality */}
                <Button variant="link" size="sm" className="text-xs font-semibold text-primary p-0 h-auto">Switch</Button>
            </div>
        );
    };

     const renderSuggestions = () => {
        if (isLoadingSuggestions) {
            return (
                 <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={`skel-suggest-${i}`} className="flex items-center">
                            <Skeleton className="h-8 w-8 rounded-full mr-3" />
                            <div className="flex-grow space-y-1">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-4 w-10" />
                        </div>
                    ))}
                </div>
            );
        }
        if (error) {
             return <p className="text-xs text-destructive">{error}</p>;
        }
         if (suggestions.length === 0) {
             return <p className="text-xs text-muted-foreground">No suggestions right now.</p>;
         }
        return (
            <div className="space-y-3">
                {suggestions.map((user) => (
                    <div key={user.id} className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={user.avatarUrl} alt={`${user.username}'s avatar`} data-ai-hint="person profile"/>
                            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <Link href={`/profile/${user.username}`} className="font-semibold text-sm block hover:underline">
                                {user.username}
                            </Link>
                            <p className="text-xs text-muted-foreground truncate">{user.reason}</p>
                        </div>
                         {/* TODO: Add Follow/Unfollow state and handler */}
                        <Button variant="link" size="sm" className="text-xs font-semibold text-primary p-0 h-auto">Follow</Button>
                    </div>
                ))}
            </div>
        );
    };


    return (
        <div className="mt-0">
            {renderCurrentUser()}

            {/* Suggestions Header */}
            <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-sm text-muted-foreground">Suggested for you</p>
                 <Link href="/explore/people" className="text-xs font-semibold text-foreground hover:text-muted-foreground p-0 h-auto">
                   See All
                 </Link>
            </div>

            {/* Suggestion List */}
            {renderSuggestions()}

             {/* Footer Links */}
            <div className="mt-8 text-xs text-muted-foreground">
                <nav className="flex flex-wrap gap-x-1.5 gap-y-0.5"> {/* Reduced gap */}
                    {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language', 'Meta Verified'].map(link => (
                        <React.Fragment key={link}>
                            <Link href="#" className="hover:underline">
                                {link}
                            </Link>
                             <span className="last:hidden">·</span> {/* Use span for dot */}
                        </React.Fragment>
                    ))}
                </nav>
                <p className="mt-4 uppercase">&copy; {new Date().getFullYear()} Instagram from Meta</p>
            </div>

        </div>
    );
};

export default Suggestions;
