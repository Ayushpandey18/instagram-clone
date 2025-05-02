import React from 'react';
import { Clapperboard } from 'lucide-react';

export default function ReelsPage() {
  return (
    <div className="container mx-auto max-w-lg h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center py-8 px-4">
        <Clapperboard className="h-24 w-24 text-muted-foreground mb-6" />
       <h1 className="text-3xl font-bold mb-4">Reels</h1>
       <p className="text-muted-foreground">Full-screen video experience coming soon!</p>
       {/* Placeholder for the reel viewer */}
    </div>
  );
}
