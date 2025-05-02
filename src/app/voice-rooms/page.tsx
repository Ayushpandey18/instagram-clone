
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Lock, Users, MicVocal } from "lucide-react"; // Added MicVocal
import CreateVoiceRoomDialog from "@/components/voice-room/CreateVoiceRoomDialog";
import Link from 'next/link';
import type { VoiceRoom } from '@/services/voice-room'; // Import type only
import { getAllVoiceRooms } from '@/services/voice-room';
import { Skeleton } from '@/components/ui/skeleton';
import Sidebar from '@/components/layout/Sidebar'; // Import Sidebar

export default function VoiceRoomsPage() {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [voiceRooms, setVoiceRooms] = useState<VoiceRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const rooms = await getAllVoiceRooms();
        setVoiceRooms(rooms);
      } catch (err) {
        console.error("Failed to fetch voice rooms:", err);
        setError("Failed to load voice rooms. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
   }, []);

  const handleRoomCreated = (newRoom: VoiceRoom) => {
    // Refetch or update state optimistically
    setVoiceRooms(prevRooms => [newRoom, ...prevRooms]); // Add new room to the top
  };

  return (
     <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
            <div className="container mx-auto max-w-4xl py-8 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Voice Rooms</h1>
                    <Button onClick={() => setCreateDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Create Room
                    </Button>
                </div>

                {error && (
                    <Card className="mb-6 border-destructive bg-destructive/10">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                        <CardDescription className="text-destructive">{error}</CardDescription>
                    </CardHeader>
                    </Card>
                )}

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-full" /> {/* Adjusted height for button */}
                        </CardContent>
                        </Card>
                    ))}
                    </div>
                ) : voiceRooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {voiceRooms.map((room) => (
                        <Card key={room.id} className="hover:shadow-md transition-shadow flex flex-col"> {/* Added flex flex-col */}
                        <CardHeader className="flex-grow"> {/* Allow header to grow */}
                            <CardTitle className="flex items-center justify-between">
                            <span className="truncate mr-2">{room.name}</span>
                            {room.passwordProtected && <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                            </CardTitle>
                            <CardDescription className="flex items-center text-xs pt-1"> {/* Added padding top */}
                             {/* Placeholder for user count - replace with actual data */}
                            <Users className="h-3 w-3 mr-1"/> {Math.floor(Math.random() * 10) + 1} Live
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Link href={`/voice-rooms/${room.id}`} passHref legacyBehavior>
                            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                                Join Room
                            </Button>
                             </Link>
                        </CardContent>
                        </Card>
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-dashed border-border rounded-lg"> {/* Adjusted styling for empty state */}
                        <MicVocal className="mx-auto h-16 w-16 text-muted-foreground mb-4" /> {/* Made icon larger */}
                        <p className="text-lg font-medium text-muted-foreground mb-2">No active voice rooms</p>
                        <p className="text-sm text-muted-foreground mb-4">Be the first to start a conversation!</p>
                        <Button onClick={() => setCreateDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> Create Room
                        </Button>
                    </div>
                )}

                <CreateVoiceRoomDialog
                    isOpen={isCreateDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    onRoomCreated={handleRoomCreated}
                />
            </div>
        </main>
     </div>
  );
}
