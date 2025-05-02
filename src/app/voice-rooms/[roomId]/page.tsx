

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneOff, Send, Mic, MicOff, Volume2, VolumeX, Lock, Loader2, ArrowLeft, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { VoiceRoom } from '@/services/voice-room'; // Import type only
import { getVoiceRoom } from '@/services/voice-room';
import { Skeleton } from '@/components/ui/skeleton';
import io from 'socket.io-client'; // Import socket.io-client

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

// Placeholder for Socket.IO connection - replace with your server URL
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'; // Example URL

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
  const socketRef = useRef<any>(null); // Ref to store socket instance

  // --- Fetch Room Details ---
   useEffect(() => {
    if (!roomId) return;
    const fetchRoomDetails = async () => {
      setIsLoading(true);
      try {
        const details = await getVoiceRoom(roomId);
        if (details) {
          setRoomDetails(details);
          if (!details.passwordProtected) {
            setIsAuthenticated(true);
          }
        } else {
          toast({ title: "Error", description: "Voice room not found.", variant: "destructive" });
          router.push('/voice-rooms');
        }
      } catch (error) {
        console.error("Failed to fetch room details:", error);
        toast({ title: "Error", description: "Failed to load room details.", variant: "destructive" });
        router.push('/voice-rooms');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoomDetails();
   }, [roomId, router, toast]);

  // --- Socket.IO Connection and Data Handling ---
   useEffect(() => {
    if (!isAuthenticated || !roomId || !roomDetails) return;

    console.log(`Attempting to connect to Socket.IO for room ${roomId} at ${SOCKET_SERVER_URL}...`);
    // Explicitly define transports
    socketRef.current = io(SOCKET_SERVER_URL, { transports: ['websocket', 'polling'] });


    const handleConnect = () => {
        console.log('Connected to Socket.IO server:', socketRef.current.id);
        // Join the specific voice room
        socketRef.current.emit('join_voice_room', { roomId, /* send user details */ });

        // --- MOCK DATA (Remove when real-time is implemented) ---
        const mockParticipants: Participant[] = Array.from({ length: 5 }).map((_, i) => ({
          id: `user-${i+1}`, username: `user_${i + 1}`, avatarUrl: `https://picsum.photos/seed/vr_user${i + 1}/40/40`, isMuted: Math.random() > 0.7, isSpeaking: i === 0 || i === 2,
        }));
        setParticipants(mockParticipants);
        const mockMessages: ChatMessage[] = [
            {id: 'm1', username: 'user_1', message: 'Hey everyone!', timestamp: '10:30 AM'},
            {id: 'm2', username: 'user_3', message: 'Welcome!', timestamp: '10:31 AM'},
        ];
        setChatMessages(mockMessages);
         scrollToBottom();
        // --- END MOCK DATA ---
    };

    const handleDisconnect = (reason: string) => {
        console.log('Disconnected from Socket.IO server:', reason);
        toast({ variant: 'destructive', title: 'Disconnected', description: 'Connection to the voice room lost.' });
        // Optionally redirect or show a reconnect button
    };

     const handleConnectError = (error: Error) => {
        console.error('Socket.IO connection error:', error);
         toast({
             variant: 'destructive',
             title: 'Connection Error',
             description: `Could not connect to the voice room server at ${SOCKET_SERVER_URL}. Check server status and CORS settings. Error: ${error.message}`,
             duration: 10000, // Show longer duration for connection errors
        });
     };

    const handleRoomState = (data: { participants: Participant[], messages: ChatMessage[] }) => {
        console.log('Received initial room state:', data);
        setParticipants(data.participants || []);
        setChatMessages(data.messages || []);
        scrollToBottom(); // Scroll after setting initial messages
    };

    const handleParticipantJoined = (participant: Participant) => {
        console.log('Participant joined:', participant);
        setParticipants(prev => [...prev, participant]);
        toast({ description: `${participant.username} joined the room.` });
    };

     const handleParticipantLeft = (userId: string) => {
        console.log('Participant left:', userId);
        let leftUsername = 'Someone';
        setParticipants(prev => {
            const user = prev.find(p => p.id === userId);
            if(user) leftUsername = user.username;
            return prev.filter(p => p.id !== userId);
        });
         toast({ description: `${leftUsername} left the room.` });
    };

     const handleNewMessage = (message: ChatMessage) => {
        console.log('New message received:', message);
        setChatMessages(prev => [...prev, message]);
        // Scrolling is handled by useEffect watching chatMessages
    };

    const handleParticipantUpdate = (update: Partial<Participant> & { id: string }) => {
        console.log('Participant update:', update);
         setParticipants(prev => prev.map(p => p.id === update.id ? { ...p, ...update } : p));
    };

    // Attach listeners
    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('connect_error', handleConnectError);
    socketRef.current.on('room_state', handleRoomState); // For initial state
    socketRef.current.on('participant_joined', handleParticipantJoined);
    socketRef.current.on('participant_left', handleParticipantLeft);
    socketRef.current.on('new_message', handleNewMessage);
    socketRef.current.on('participant_update', handleParticipantUpdate); // For mute/speak status etc.


    // Cleanup listeners and disconnect socket
    return () => {
      if (socketRef.current) {
         console.log('Disconnecting voice room socket...');
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('connect_error', handleConnectError);
        socketRef.current.off('room_state', handleRoomState);
        socketRef.current.off('participant_joined', handleParticipantJoined);
        socketRef.current.off('participant_left', handleParticipantLeft);
        socketRef.current.off('new_message', handleNewMessage);
        socketRef.current.off('participant_update', handleParticipantUpdate);
        socketRef.current.disconnect();
      }
    };
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isAuthenticated, roomId, roomDetails]); // Removed toast from deps

  // Scroll chat to bottom
  const scrollToBottom = () => {
      const scrollArea = chatScrollAreaRef.current;
      if (scrollArea) {
        const viewport = scrollArea.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
      }
  };

  // Update scroll on new messages
  useEffect(() => {
      // Delay slightly to allow DOM update
      const timer = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timer);
  }, [chatMessages]);


  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !roomDetails) return;
    setIsAuthLoading(true);
    setAuthError(null);

    // TODO: Replace with actual password verification via socket or API
    console.log("Verifying password for room", roomDetails.id, ":", password);
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1000));
     // Example: Emit to socket and wait for response
    // socketRef.current.emit('verify_password', { roomId: roomDetails.id, password }, (response) => {
    //    if (response.success) {
    //      setIsAuthenticated(true);
    //      toast({ title: "Success", description: "Access granted." });
    //    } else {
    //      setAuthError(response.message || "Incorrect password.");
    //      setPassword('');
    //    }
    //    setIsAuthLoading(false);
    // });

     // Mock success for now
     if (password === "password") { // Replace with actual check result
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
    if (!newMessage.trim() || !socketRef.current || !socketRef.current.connected) return;

    console.log("Sending message:", newMessage);
     // Send message via WebSocket
     socketRef.current.emit('send_message', { roomId, message: newMessage });

    // // Optimistic update (optional, server should broadcast back)
    // const newMsg: ChatMessage = {
    //     id: `temp-${Date.now()}`, // Temporary ID
    //     username: 'current_user', // Replace with actual username
    //     message: newMessage,
    //     timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    // };
    // setChatMessages(prev => [...prev, newMsg]);

    setNewMessage('');
  };

  const handleLeaveRoom = () => {
    console.log("Leaving room...");
     if (socketRef.current) {
        socketRef.current.emit('leave_voice_room', { roomId });
        socketRef.current.disconnect(); // Disconnect socket
    }
    toast({ title: "Left Room", description: `You have left ${roomDetails?.name}.` });
    router.push('/voice-rooms');
  };

  const toggleMute = () => {
     const newMutedState = !isMuted;
     setIsMuted(newMutedState);
     // TODO: Send mute status update via socket
     if (socketRef.current?.connected) {
        socketRef.current.emit('update_participant', { roomId, isMuted: newMutedState });
     }
     // TODO: Actually mute/unmute local audio track using WebRTC API
  };

  const toggleDeafen = () => {
     const newDeafenedState = !isDeafened;
     setIsDeafened(newDeafenedState);
     // TODO: Send deafen status update via socket (optional)
     // TODO: Actually mute/unmute incoming audio using WebRTC API or browser audio controls
     if (newDeafenedState && !isMuted) {
         toggleMute(); // Deafen usually implies mute
     }
  };


  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4 flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!roomDetails) {
    // Fallback if redirection fails
    return <div className="container mx-auto p-8 text-center text-destructive">Room not found or failed to load.</div>;
  }

  // --- Password Prompt ---
  if (roomDetails.passwordProtected && !isAuthenticated) {
    return (
        <div className="container mx-auto max-w-md py-20 px-4 flex flex-col items-center">
            <Lock className="h-16 w-16 text-primary mb-6" />
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
                            aria-label="Room Password"
                        />
                        {authError && <p className="text-sm text-destructive">{authError}</p>}
                        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isAuthLoading || !password}>
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


  // --- Authenticated Room View ---
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Participants Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col bg-secondary/30">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold truncate">{roomDetails.name}</h2>
          <p className="text-sm text-muted-foreground">Participants ({participants.length})</p>
        </div>
        <ScrollArea className="flex-grow p-4">
          {participants.length > 0 ? (
            <ul>
                {participants.map((p) => (
                <li key={p.id} className="flex items-center mb-3">
                    <Avatar className={`h-10 w-10 mr-3 border-2 ${p.isSpeaking ? 'border-primary animate-pulse' : 'border-transparent'}`}>
                    <AvatarImage src={p.avatarUrl} alt={p.username} data-ai-hint="person avatar"/>
                    <AvatarFallback>{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="flex-grow truncate text-sm font-medium">{p.username}</span>
                    {p.isMuted && <MicOff className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />}
                </li>
                ))}
            </ul>
           ) : (
                <p className="text-sm text-muted-foreground text-center mt-4">Only you are here.</p>
           )}
        </ScrollArea>
        {/* User Controls */}
         <div className="p-3 border-t border-border flex items-center justify-between bg-background">
             <div className="flex items-center overflow-hidden mr-2">
                <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                    {/* Replace with actual current user avatar */}
                    <AvatarImage src={`https://picsum.photos/seed/current_user_vr/32/32`} data-ai-hint="person avatar"/>
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
                {/* Replace with actual current username */}
                <span className="text-sm font-medium truncate">current_user</span>
             </div>
             <div className="flex items-center space-x-1 flex-shrink-0">
                 <Button variant={isMuted ? "destructive" : "secondary"} size="icon" className="h-8 w-8" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                 </Button>
                 <Button variant={isDeafened ? "destructive" : "secondary"} size="icon" className="h-8 w-8" onClick={toggleDeafen} aria-label={isDeafened ? 'Undeafen' : 'Deafen'}>
                    {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                 </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings</span>
                  </Button>
                 <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleLeaveRoom} aria-label="Leave Room">
                    <PhoneOff className="h-4 w-4" />
                 </Button>
             </div>
         </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-grow flex flex-col bg-background">
        <div className="p-4 border-b border-border flex items-center justify-between">
             <h2 className="text-lg font-semibold">Chat</h2>
             {/* Potential room controls (e.g., invite) could go here */}
        </div>
        <ScrollArea className="flex-grow p-4" ref={chatScrollAreaRef}>
          <div className="space-y-4">
             {chatMessages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center mt-4">No messages yet. Start the conversation!</p>
            )}
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start" data-chat-message>
                <Avatar className="h-8 w-8 mr-3 mt-1 flex-shrink-0">
                   {/* Use consistent avatar generation */}
                  <AvatarImage src={`https://picsum.photos/seed/vr_${msg.username}/32/32`} alt={msg.username} data-ai-hint="person avatar"/>
                  <AvatarFallback>{msg.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <div className="flex items-baseline space-x-2">
                      <span className="font-semibold text-sm">{msg.username}</span>
                      <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm break-words">{msg.message}</p> {/* Allow long words to break */}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border bg-secondary/30">
          <form className="flex items-center space-x-2" onSubmit={handleSendMessage}>
            <Input
              type="text"
              placeholder={isDeafened ? "You are deafened" : "Type your message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow bg-background focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary"
              disabled={isDeafened}
              aria-label="Chat Message Input"
            />
            <Button type="submit" size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={!newMessage.trim() || isDeafened} aria-label="Send Message">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
