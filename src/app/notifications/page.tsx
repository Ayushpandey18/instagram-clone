
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Heart, UserPlus, MessageSquare, AtSign } from 'lucide-react'; // Added icons
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator'; // Import Separator
import type { Notification, NotificationType } from '@/services/notification'; // Import type only
import { getUserNotifications, markNotificationsAsRead } from '@/services/notification'; // Import service functions
import { formatDistanceToNowStrict } from 'date-fns'; // For relative timestamps
import Sidebar from '@/components/layout/Sidebar'; // Import Sidebar
import { cn } from '@/lib/utils';

// Helper to get icon based on notification type
const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case 'like': return <Heart className="h-4 w-4 text-red-500" fill="currentColor" />;
        case 'comment': return <MessageSquare className="h-4 w-4 text-blue-500" />;
        case 'follow': return <UserPlus className="h-4 w-4 text-green-500" />;
        case 'mention': return <AtSign className="h-4 w-4 text-purple-500" />;
        default: return <Heart className="h-4 w-4 text-muted-foreground" />; // Default icon
    }
};

// Helper function to group notifications by time periods
const groupNotifications = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {
        Today: [],
        Yesterday: [],
        'This Week': [],
        'This Month': [],
        Earlier: [],
    };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Assuming week starts on Sunday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    notifications.forEach(notif => {
        const notifDate = new Date(notif.timestamp);
        if (notifDate >= today) {
            groups.Today.push(notif);
        } else if (notifDate >= yesterday) {
            groups.Yesterday.push(notif);
        } else if (notifDate >= startOfWeek) {
            groups['This Week'].push(notif);
        } else if (notifDate >= startOfMonth) {
            groups['This Month'].push(notif);
        } else {
            groups.Earlier.push(notif);
        }
    });

    return groups;
};


export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedNotifications = await getUserNotifications(30); // Fetch recent notifications
                setNotifications(fetchedNotifications);
                // Optionally mark fetched notifications as read (or based on visibility)
                 // const unreadIds = fetchedNotifications.filter(n => !n.isRead).map(n => n.id);
                 // if (unreadIds.length > 0) {
                 //    await markNotificationsAsRead(unreadIds);
                 // }
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
                setError("Could not load notifications. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    // Group notifications after fetching
    const groupedNotifications = !isLoading && !error ? groupNotifications(notifications) : {};

    // TODO: Implement follow/unfollow logic based on notification action

    const renderNotificationText = (notification: Notification) => {
         const actorLink = (
             <Link href={`/profile/${notification.actorUsername}`} className="font-semibold hover:underline">
                 {notification.actorUsername}
             </Link>
         );
         const timeAgo = formatDistanceToNowStrict(new Date(notification.timestamp), { addSuffix: true });

        switch (notification.type) {
            case 'like':
                return <> {actorLink} liked your post. <span className="text-muted-foreground ml-1">{timeAgo}</span></>;
            case 'comment':
                return <> {actorLink} {notification.snippet || 'commented on your post.'} <span className="text-muted-foreground ml-1">{timeAgo}</span></>;
            case 'follow':
                 return <> {actorLink} started following you. <span className="text-muted-foreground ml-1">{timeAgo}</span></>;
            case 'mention':
                 return <> {actorLink} {notification.snippet || 'mentioned you in a comment.'} <span className="text-muted-foreground ml-1">{timeAgo}</span></>;
            default:
                 return <> Notification from {actorLink}. <span className="text-muted-foreground ml-1">{timeAgo}</span></>;
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
                <div className="container mx-auto max-w-2xl py-8 px-4">
                    <h1 className="text-2xl font-semibold mb-6">Notifications</h1>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {isLoading ? (
                        <div className="space-y-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={`skel-${i}`} className="flex items-center space-x-3 p-2">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-grow space-y-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                                <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" />
                            </div>
                        ))}
                        </div>
                    ) : notifications.length === 0 && !error ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Heart className="h-16 w-16 mx-auto mb-4" />
                            <p className="font-semibold">Activity On Your Posts</p>
                            <p className="text-sm">When someone likes or comments on one of your posts, you'll see it here.</p>
                        </div>
                    ) : (
                         <div className="space-y-6">
                             {Object.entries(groupedNotifications).map(([groupTitle, groupItems]) =>
                                groupItems.length > 0 && (
                                <div key={groupTitle}>
                                    <h2 className="text-base font-semibold mb-3 px-2">{groupTitle}</h2>
                                    <ul className="space-y-1">
                                        {groupItems.map((notification) => (
                                        <li
                                            key={notification.id}
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-md hover:bg-secondary transition-colors",
                                                !notification.isRead && "bg-primary/5" // Subtle background for unread
                                            )}
                                        >
                                            {/* Icon variant could go here instead of avatar */}
                                            {/* <div className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary">
                                                {getNotificationIcon(notification.type)}
                                            </div> */}
                                            <Link href={`/profile/${notification.actorUsername}`}>
                                                <Avatar className="h-10 w-10 flex-shrink-0">
                                                    <AvatarImage src={notification.actorAvatarUrl} alt={notification.actorUsername} data-ai-hint="person avatar"/>
                                                    <AvatarFallback>{notification.actorUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                            <p className="flex-grow text-sm">
                                            {renderNotificationText(notification)}
                                            </p>
                                             <div className="flex-shrink-0">
                                                {/* Action Button (e.g., Follow/Following) or Content Thumbnail */}
                                                {notification.type === 'follow' ? (
                                                    <Button size="sm" className="h-8 px-3 text-xs">Follow</Button> // Add following state
                                                ) : notification.contentThumbnailUrl ? (
                                                    <Link href={`/p/${notification.contentId || ''}`}>
                                                        <Image
                                                            src={notification.contentThumbnailUrl}
                                                            alt="Post thumbnail"
                                                            width={40}
                                                            height={40}
                                                            className="rounded-sm object-cover aspect-square"
                                                            data-ai-hint="post thumbnail"
                                                        />
                                                    </Link>
                                                ) : (
                                                     <div className="w-10 h-10"></div> // Placeholder for alignment
                                                )}
                                             </div>
                                        </li>
                                        ))}
                                    </ul>
                                    <Separator className="mt-4" />
                                </div>
                                )
                             )}
                         </div>
                    )}
                    {/* TODO: Add pagination/load more */}
                </div>
            </main>
        </div>
    );
}
