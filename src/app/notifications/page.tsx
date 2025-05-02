import React from 'react';
import { Heart } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
       <h1 className="text-2xl font-semibold mb-6">Notifications</h1>
        {/* Placeholder for notification items */}
       <div className="text-center py-20 text-muted-foreground">
            <Heart className="h-16 w-16 mx-auto mb-4" />
            <p>Activity On Your Posts</p>
            <p className="text-sm">When someone likes or comments on one of your posts, you'll see it here.</p>
       </div>
    </div>
  );
}
