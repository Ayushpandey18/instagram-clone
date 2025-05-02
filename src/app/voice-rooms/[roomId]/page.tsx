'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneOff, Send, Mic, MicOff, Volume2, VolumeX, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { VoiceRoom } from '@/services/voice-room'; // Import type only
import { getVoiceRoom } from '@/services/voice-room';
import { Skeleton } from '@/components/ui/skeleton';

interface Participant {
  id: string;
  username: string;
  avatarUrl: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

export default function VoiceRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { toast } = useToast();

  const [roomDetails, setRoomDetails] = useState<VoiceRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // For password protected rooms
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const chatScrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch Room Details
   useEffect(() => {
    if (!roomId) return;
    const fetchRoomDetails = async () => {
      setIsLoading(true);
      try {
        const details = await getVoiceRoom(roomId);
        if (details) {
          setRoomDetails(details);
          // If room is not password protected, user is authenticated immediately
          if (!details.passwordProtected) {
            setIsAuthenticated(true);
          }
        } else {
          toast({ title: "Error", description: "Voice room not found.", variant: "destructive" });
          router.push('/voice-rooms'); // Redirect if room doesn't exist
        }
      } catch (error) {
        console.error("Failed to fetch room details:", error);
        toast({ title: "Error", description: "Failed to load room details.", variant: "destructive" });
        router.push('/voice-rooms'); // Redirect on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoomDetails();
  }, [roomId, router, toast]);

  // Fetch Participants and Messages (only if authenticated)
   useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    // --- MOCK DATA ---
    // TODO: Replace with real-time data fetching (e.g., WebSockets)
    const mockParticipants: Participant[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `user-${i+1}`,
      username: `user_${i + 1}`,
      avatarUrl: `https://picsum.photos/seed/vr_user${i + 1}/40/40`,
      isMuted: Math.random() > 0.7,
      isSpeaking: i === 0 || i === 2, // Simulate some speaking
    }));
    setParticipants(mockParticipants);

    const mockMessages: ChatMessage[] = [
        {id: 'm1', username: 'user_1', message: 'Hey everyone!', timestamp: '10:30 AM'},
        {id: 'm2', username: 'user_3', message: 'Welcome to the room!', timestamp: '10:31 AM'},
        {id: 'm3', username: 'user_2', message: 'What are we discussing today?', timestamp: '10:32 AM'},
    ];
    setChatMessages(mockMessages);
    // --- END MOCK DATA ---

    // Scroll chat to bottom on initial load/new message
    scrollToBottom();

    // Setup real-time listeners here
    // e.g., socket.on('participant_joined', ...)
    // e.g., socket.on('new_message', ...)

    return () => {
      // Cleanup listeners
      // e.g., socket.off(...)
    };
  }, [isAuthenticated, roomId]);


    // Scroll chat to bottom
    const scrollToBottom = () => {
        const scrollArea = chatScrollAreaRef.current;
        if (scrollArea) {
        // Use `lastElementChild` to get the most recent message element
        const lastMessage = scrollArea.querySelector('[data-chat-message]:last-child');
        if (lastMessage) {
            lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        }
    };

    // Update scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);


  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsAuthLoading(true);
    setAuthError(null);
    // TODO: Implement actual password verification API call
    console.log("Verifying password:", password);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    if (password === "password") { // Replace with actual check
      setIsAuthenticated(true);
      toast({ title: "Success", description: "Access granted." });
    } else {
      setAuthError("Incorrect password. Please try again.");
      setPassword(''); // Clear password field on error
    }
    setIsAuthLoading(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // TODO: Send message via WebSocket or API
    console.log("Sending message:", newMessage);

     // Add message optimistically (or wait for confirmation)
    const newMsg: ChatMessage = {
        id: `temp-${Date.now()}`, // Temporary ID
        username: 'current_user', // Replace with actual username
        message: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, newMsg]);

    setNewMessage('');
    // scrollToBottom(); // Let the useEffect handle scrolling
  };

  const handleLeaveRoom = () => {
    // TODO: Implement leave room logic (disconnect WebSocket, API call)
    console.log("Leaving room...");
    toast({ title: "Left Room", description: `You have left ${roomDetails?.name}.` });
    router.push('/voice-rooms');
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleDeafen = () => setIsDeafened(!isDeafened);


  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4 flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-[#A29BFE]" />
      </div>
    );
  }

  if (!roomDetails) {
    // Should have been redirected, but as a fallback
    return <div className="container mx-auto p-8 text-center text-red-600">Room not found or failed to load.</div>;
  }

  if (roomDetails.passwordProtected && !isAuthenticated) {
    return (
        <div className="container mx-auto max-w-md py-20 px-4 flex flex-col items-center">
            <Lock className="h-16 w-16 text-[#A29BFE] mb-6" />
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Password Required</CardTitle>
                    <p className="text-sm text-muted-foreground">This room ({roomDetails.name}) is password protected.</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Enter room password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isAuthLoading}
                        />
                        {authError && <p className="text-sm text-destructive">{authError}</p>}
                        <Button type="submit" className="w-full voice-room-accent-bg hover:opacity-90 text-white" disabled={isAuthLoading || !password}>
                            {isAuthLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Enter Room
                        </Button>
                         <Button variant="outline" className="w-full" onClick={() => router.back()} disabled={isAuthLoading}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Rooms
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
  }


  // Authenticated View
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Participants Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold truncate">{roomDetails.name}</h2>
          <p className="text-sm text-muted-foreground">Participants ({participants.length})</p>
        </div>
        <ScrollArea className="flex-grow p-4">
          <ul>
            {participants.map((p) => (
              <li key={p.id} className="flex items-center mb-3">
                <Avatar className={`h-10 w-10 mr-3 border-2 ${p.isSpeaking ? 'border-[#A29BFE]' : 'border-transparent'}`}>
                  <AvatarImage src={p.avatarUrl} alt={p.username} data-ai-hint="person avatar"/>
                  <AvatarFallback>{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="flex-grow truncate text-sm">{p.username}</span>
                {p.isMuted && <MicOff className="h-4 w-4 text-muted-foreground ml-2" />}
              </li>
            ))}
             {participants.length === 0 && (
                <p className="text-sm text-muted-foreground text-center mt-4">Only you are here.</p>
            )}
          </ul>
        </ScrollArea>
        {/* User Controls */}
         <div className="p-3 border-t border-border flex items-center justify-between bg-secondary/50">
             <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={`https://picsum.photos/seed/current_user/32/32`} data-ai-hint="person avatar"/>
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">current_user</span>
             </div>
             <div className="flex items-center space-x-1">
                 <Button variant={isMuted ? "destructive" : "secondary"} size="icon" className="h-8 w-8" onClick={toggleMute}>
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                 </Button>
                 <Button variant={isDeafened ? "destructive" : "secondary"} size="icon" className="h-8 w-8" onClick={toggleDeafen}>
                    {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                 </Button>
                 <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleLeaveRoom}>
                    <PhoneOff className="h-4 w-4" />
                 </Button>
             </div>
         </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-grow flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
             <h2 className="text-lg font-semibold">Chat</h2>
             {/* Maybe add other controls here */}
        </div>
        <ScrollArea className="flex-grow p-4" ref={chatScrollAreaRef}>
          <div className="space-y-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start" data-chat-message>
                <Avatar className="h-8 w-8 mr-3 mt-1">
                  <AvatarImage src={`https://picsum.photos/seed/${msg.username}/32/32`} alt={msg.username} data-ai-hint="person avatar"/>
                  <AvatarFallback>{msg.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-semibold text-sm mr-2">{msg.username}</span>
                  <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))}
             {chatMessages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center mt-4">No messages yet. Start the conversation!</p>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border">
          <form className="flex items-center space-x-2" onSubmit={handleSendMessage}>
            <Input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow bg-secondary focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-[#A29BFE]"
              disabled={isDeafened} // Can't send messages if deafened
            />
            <Button type="submit" size="icon" className="voice-room-accent-bg hover:opacity-90 text-white" disabled={!newMessage.trim() || isDeafened}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
