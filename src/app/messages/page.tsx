import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="container mx-auto max-w-4xl h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center py-8 px-4">
        <MessageCircle className="h-24 w-24 text-muted-foreground mb-6" />
       <h1 className="text-3xl font-bold mb-4">Messages</h1>
       <p className="text-muted-foreground">Direct messaging functionality will be implemented here.</p>
       {/* Placeholder for chat list and active chat */}
    </div>
  );
}
