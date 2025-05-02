import React from 'react';
import { PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreatePage() {
  return (
    <div className="container mx-auto max-w-xl h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center py-8 px-4">
       <PlusSquare className="h-24 w-24 text-muted-foreground mb-6" />
       <h1 className="text-3xl font-bold mb-4">Create New Post</h1>
       <p className="text-muted-foreground mb-6">Drag photos and videos here</p>
       <Button>Select From Computer</Button>
       {/* Placeholder for the post creation flow */}
    </div>
  );
}
