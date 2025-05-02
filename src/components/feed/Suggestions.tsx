
import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const Suggestions = () => {
    // Placeholder data
    const currentUser = {
        username: "current_user",
        fullName: "Current User Name",
        avatarUrl: "https://picsum.photos/seed/currentuser/56/56",
    };

    const suggestions = Array.from({ length: 5 }).map((_, i) => ({
        id: i + 1,
        username: `suggested_user_${i + 1}`,
        avatarUrl: `https://picsum.photos/seed/suggest${i + 1}/32/32`,
        reason: "Suggested for you", // Or "Followed by user_x"
    }));

    return (
        <div className="mt-0"> {/* Removed top margin */}
            {/* Current User Info */}
            <div className="flex items-center mb-5">
                <Avatar className="h-14 w-14 mr-4">
                    <AvatarImage src={currentUser.avatarUrl} alt="Your avatar" data-ai-hint="person profile"/>
                    <AvatarFallback>{currentUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <Link href={`/profile/${currentUser.username}`} className="font-semibold text-sm block hover:underline">
                        {currentUser.username}
                    </Link>
                    <p className="text-sm text-muted-foreground">{currentUser.fullName}</p>
                </div>
                <Button variant="link" size="sm" className="text-xs font-semibold text-primary p-0 h-auto">Switch</Button>
            </div>

            {/* Suggestions Header */}
            <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-sm text-muted-foreground">Suggested for you</p>
                 <Link href="/explore/people" className="text-xs font-semibold text-foreground hover:text-muted-foreground p-0 h-auto">
                   See All
                 </Link>
            </div>

            {/* Suggestion List */}
            <div className="space-y-3"> {/* Added space between suggestions */}
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
                            <p className="text-xs text-muted-foreground">{user.reason}</p>
                        </div>
                        <Button variant="link" size="sm" className="text-xs font-semibold text-primary p-0 h-auto">Follow</Button>
                    </div>
                ))}
            </div>

             {/* Footer Links */}
            <div className="mt-8 text-xs text-muted-foreground"> {/* Increased top margin */}
                <nav className="flex flex-wrap gap-x-2 gap-y-0.5"> {/* Added gap-y */}
                    {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms', 'Locations', 'Language', 'Meta Verified'].map(link => (
                        <Link href="#" key={link} className="hover:underline after:content-['·'] after:ml-1.5 last:after:content-none">
                            {link}
                        </Link>
                    ))}
                </nav>
                <p className="mt-4 uppercase">&copy; {new Date().getFullYear()} InstaVoice from Meta</p>
            </div>

        </div>
    );
};

export default Suggestions;
