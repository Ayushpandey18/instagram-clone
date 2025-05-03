
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
import { PhoneOff, Send, Mic, MicOff, Volume2, VolumeX, Lock, Loader2, ArrowLeft, Settings, AlertCircle, User, Users } from 'lucide-react'; // Added User, Users, AlertCircle
import { useToast } from "@/hooks/use-toast";
import type { VoiceRoom } from '@/services/voice-room'; // Import type only
import { getVoiceRoom } from '@/services/voice-room';
import { Skeleton } from '@/components/ui/skeleton';
import io, { Socket } from 'socket.io-client'; // Import socket.io-client and Socket type
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert components
import { getCurrentUser } from '@/services/user'; // Import function to get current user details
import type { UserProfile } from '@/services/user'; // Import UserProfile type

interface Participant {
  id: string; // Socket ID
  username: string;
  avatarUrl: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface ChatMessage {
  id: string;
  username: string;
  userAvatar: string; // Added user avatar
  message: string;
  timestamp: string;
}

// Get Socket.IO server URL from environment variable
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';


export default function VoiceRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [roomDetails, setRoomDetails] = useState<VoiceRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial room details fetch
  const [isAuthenticated, setIsAuthenticated] = useState(false); // For password protected rooms
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false); // Track socket connection state
  const [connectionError, setConnectionError] = useState<string | null>(null); // Specific connection error state


  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const chatScrollAreaRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null); // Ref to store socket instance, typed
  const prevMessagesCountRef = useRef(0); // Ref to track previous message count for scrolling logic

   // --- Check Environment Variable ---
  useEffect(() => {
    if (!SOCKET_SERVER_URL) {
      console.error("ERROR: NEXT_PUBLIC_SOCKET_URL environment variable is not set!");
      setConnectionError("Configuration error: Socket server URL is missing. Cannot connect to voice room.");
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'The voice room server URL is not configured. Please contact support.',
        duration: 15000,
      });
       setIsLoading(false); // Stop loading if URL is missing
    }
    // Log the URL being used
    console.log("Using Socket.IO Server URL:", SOCKET_SERVER_URL);
  }, [toast]); // Added toast dependency

   // --- Fetch Current User Details ---
   useEffect(() => {
       const fetchUser = async () => {
           try {
               const user = await getCurrentUser();
               setCurrentUser(user);
           } catch (err) {
               console.error("Failed to fetch current user:", err);
               toast({ title: "Error", description: "Could not load your user details.", variant: "destructive" });
               // Handle case where user isn't logged in? Redirect?
           }
       };
       fetchUser();
   }, [toast]);


  // --- Fetch Room Details ---
   useEffect(() => {
    if (!roomId) return;
    const fetchRoomDetails = async () => {
      setIsLoading(true);
      setConnectionError(null); // Clear connection error on fetch
      try {
        const details = await getVoiceRoom(roomId);
        if (details) {
          setRoomDetails(details);
          // If room is not password protected, consider user authenticated immediately
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
        router.push('/voice-rooms');
      } finally {
        setIsLoading(false); // Finish loading room details
      }
    };
    fetchRoomDetails();
   }, [roomId, router, toast]);


  // --- Socket.IO Connection and Data Handling ---
   useEffect(() => {
     // Conditions to establish connection:
     // 1. Socket URL must be defined
     // 2. Room details must be loaded
     // 3. User must be authenticated for the room (either not password protected or password entered)
     // 4. Current user details must be fetched
     // 5. Not already connecting or connected
    if (!SOCKET_SERVER_URL || !roomDetails || !isAuthenticated || !currentUser || socketRef.current || isConnecting) {
        // console.log("Socket connection prerequisites not met or already connected/connecting.");
        return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    console.log(`Attempting to connect to Socket.IO for room ${roomId} at ${SOCKET_SERVER_URL} using WebSockets only...`);

    // Standard Socket.IO client connection, explicitly use only WebSockets
     const socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket'], // Use ONLY WebSocket transport
        reconnectionAttempts: 3, // Limit reconnection attempts
        timeout: 10000, // Connection timeout
     });
     socketRef.current = socket;


    const handleConnect = () => {
        console.log('Connected to Socket.IO server:', socket.id, 'using transport:', socket.io.engine.transport.name);
        setIsConnecting(false);
        setConnectionError(null);
        toast({ title: 'Connected', description: `Joined voice room: ${roomDetails.name}` });

        // Join the specific voice room, sending current user details
        socket.emit('join_voice_room', {
            roomId,
            user: {
                username: currentUser.username,
                avatarUrl: currentUser.avatarUrl
            }
        });
    };

    const handleDisconnect = (reason: string) => {
        console.log('Disconnected from Socket.IO server:', reason);
        setIsConnecting(false);
        socketRef.current = null; // Clear the ref
         // Don't show error toast for intentional disconnects (e.g., leaving room)
        if (reason !== 'io client disconnect') {
             setConnectionError(`Disconnected: ${reason}. Check server and network.`);
             toast({ variant: 'destructive', title: 'Disconnected', description: 'Connection to the voice room lost.' });
        }
        setParticipants([]); // Clear participants on disconnect
        // Optionally redirect or show a reconnect button
    };

     const handleConnectError = (error: any) => { // Use 'any' to access potential transport details
        console.error('Socket.IO connection error (WebSocket):', error);
        setIsConnecting(false);
        socketRef.current = null; // Clear the ref

        let errorMessage = `Could not connect to the voice room server (${SOCKET_SERVER_URL}) via WebSocket. Error: ${error.message || 'Unknown error'}`;
        if (error && error.message && error.message.toLowerCase().includes('websocket error')) {
            errorMessage = `WebSocket connection failed. Ensure the server allows WebSocket upgrades and check network/firewall settings. Error: ${error.message}`;
        } else if (error instanceof Error) {
             errorMessage = `WebSocket Connection Error: ${error.message}. Please check server status and network.`;
        } else if (error && error.message && error.message.toLowerCase().includes('xhr poll error')) {
             errorMessage = `WebSocket connection failed, fallback to polling also failed. Please check CORS settings on the server and network connectivity. Error: ${error.message}`;
        }

        setConnectionError(errorMessage);
         toast({
             variant: 'destructive',
             title: 'Connection Error',
             description: errorMessage,
             duration: 10000,
        });
     };

    // --- Room State Listeners ---
    const handleRoomState = (data: { participants: Participant[], messages?: ChatMessage[] }) => {
        console.log('Received initial room state:', data);
        setParticipants(data.participants || []);
        setChatMessages(data.messages || []); // Initialize with existing messages
        prevMessagesCountRef.current = data.messages?.length || 0; // Initialize prev count
        // Scrolling is handled by useEffect watching chatMessages
    };

    const handleParticipantJoined = (participant: Participant) => {
        console.log('Participant joined:', participant);
        // Prevent adding self again if server echoes join event
        setParticipants(prev => prev.find(p => p.id === participant.id) ? prev : [...prev, participant]);
        if (participant.username !== currentUser.username) {
            toast({ description: `${participant.username} joined the room.` });
        }
    };

     const handleParticipantLeft = (userId: string) => {
        console.log('Participant left:', userId);
        let leftUsername = 'Someone';
        setParticipants(prev => {
            const user = prev.find(p => p.id === userId);
            if(user) leftUsername = user.username;
            return prev.filter(p => p.id !== userId);
        });
         if(leftUsername !== currentUser?.username) { // Don't toast self leaving
             toast({ description: `${leftUsername} left the room.` });
         }
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

    // --- Attach listeners ---
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('room_state', handleRoomState);
    socket.on('participant_joined', handleParticipantJoined);
    socket.on('participant_left', handleParticipantLeft);
    socket.on('new_message', handleNewMessage);
    socket.on('participant_update', handleParticipantUpdate);


    // --- Cleanup listeners and disconnect socket ---
    return () => {
      if (socketRef.current) {
         console.log('Disconnecting voice room socket...');
        // Remove specific listeners
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('connect_error', handleConnectError);
        socketRef.current.off('room_state', handleRoomState);
        socketRef.current.off('participant_joined', handleParticipantJoined);
        socketRef.current.off('participant_left', handleParticipantLeft);
        socketRef.current.off('new_message', handleNewMessage);
        socketRef.current.off('participant_update', handleParticipantUpdate);
        // Disconnect
        socketRef.current.disconnect();
        socketRef.current = null;
      }
       setIsConnecting(false);
       setParticipants([]); // Clear participants on unmount/disconnect
       setChatMessages([]); // Clear messages
    };
   // Removed toast from dependency array
   }, [SOCKET_SERVER_URL, roomId, roomDetails, isAuthenticated, currentUser, isConnecting]); // Dependencies, added isConnecting


  // --- Scroll chat to bottom ---
  const scrollToBottom = () => {
      const scrollArea = chatScrollAreaRef.current;
      if (scrollArea) {
        const viewport = scrollArea.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            // Use requestAnimationFrame for smoother scrolling after DOM updates
            requestAnimationFrame(() => {
                 viewport.scrollTop = viewport.scrollHeight;
            });
        }
      }
  };

  // Update scroll only when the number of messages increases
  useEffect(() => {
      if (chatMessages.length > prevMessagesCountRef.current) {
          scrollToBottom();
      }
      // Update the ref *after* potential scroll
      prevMessagesCountRef.current = chatMessages.length;
  }, [chatMessages]); // Trigger scroll only when messages change


  // --- Event Handlers ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !roomDetails) return;
    setIsAuthLoading(true);
    setAuthError(null);

    // TODO: Replace with actual password verification via socket or API
    console.log("Verifying password for room", roomDetails.id, ":", password);
    // Simulate verification (replace with real check)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const isCorrect = password === "password"; // **INSECURE MOCK** - Replace with real check

     if (isCorrect) { // Replace with actual check result
       setIsAuthenticated(true); // Grant access
       toast({ title: "Success", description: "Access granted." });
     } else {
       setAuthError("Incorrect password. Please try again.");
       setPassword(''); // Clear password field on error
       toast({ title: "Access Denied", description: "Incorrect password.", variant: "destructive" });
     }
    setIsAuthLoading(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !socketRef.current.connected || !currentUser) return;

    console.log("Sending message:", newMessage);
     socketRef.current.emit('send_message', {
         roomId,
         message: newMessage,
         // Sender info is implicitly known by the server via socket.id,
         // but good practice to potentially send username if needed server-side beyond lookup
         // username: currentUser.username
      });

    setNewMessage('');
    // Optimistic update is handled by the server broadcasting 'new_message' back
  };

  const handleLeaveRoom = () => {
    console.log("Leaving room...");
     if (socketRef.current) {
        // socketRef.current.emit('leave_voice_room', { roomId }); // Optionally notify server explicitly
        socketRef.current.disconnect(); // Disconnect socket triggers cleanup
        socketRef.current = null;
    }
    toast({ title: "Left Room", description: `You have left ${roomDetails?.name}.` });
    router.push('/voice-rooms'); // Navigate back to rooms list
  };

  const toggleMute = () => {
     const newMutedState = !isMuted;
     setIsMuted(newMutedState);
     if (socketRef.current?.connected) {
        socketRef.current.emit('update_participant', { roomId, updates: { isMuted: newMutedState } });
     }
     // TODO: Actually mute/unmute local audio track using WebRTC API if implementing voice
  };

  const toggleDeafen = () => {
     const newDeafenedState = !isDeafened;
     setIsDeafened(newDeafenedState);
     // TODO: Send deafen status update via socket (optional)
     // TODO: Actually mute/unmute incoming audio using WebRTC API or browser audio controls
     if (newDeafenedState && !isMuted) {
         toggleMute(); // Deafen usually implies mute as well
     } else if (!newDeafenedState && isMuted && !/* was explicitly muted before deafen */false) {
        // If undeafening, consider unmuting *unless* user explicitly muted themselves beforehand
        // This requires more state tracking
     }
  };


  // --- Render Logic ---

  // Loading state for initial room details
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4 flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If room details failed to load (and not due to config error handled earlier)
  if (!roomDetails && !SOCKET_SERVER_URL) { // Show config error if URL missing
     return (
         <div className="container mx-auto max-w-md py-20 px-4 flex flex-col items-center text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>{connectionError || "Socket server URL is missing."}</AlertDescription>
              </Alert>
         </div>
     );
  }
   if (!roomDetails) {
     // Fallback if redirection fails or room genuinely not found
     return (
         <div className="container mx-auto p-8 text-center">
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Room not found or failed to load.</AlertDescription>
             </Alert>
             <Button variant="link" onClick={() => router.push('/voice-rooms')} className="mt-4">Go back to Rooms</Button>
         </div>
     );
   }

  // --- Password Prompt ---
  if (roomDetails.passwordProtected && !isAuthenticated) {
    return (
        <div className="container mx-auto max-w-md py-20 px-4 flex flex-col items-center">
            <Lock className="h-16 w-16 text-primary mb-6" />
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Password Required</CardTitle>
                    <CardDescription>This room "{roomDetails.name}" is password protected. Enter the password to join.</CardDescription>
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
                         <Button variant="outline" className="w-full" onClick={() => router.push('/voice-rooms')} disabled={isAuthLoading}>
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
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Participants Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col bg-secondary/30 flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold truncate" title={roomDetails.name}>{roomDetails.name}</h2>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
             <Users className="h-4 w-4 mr-1.5"/> Participants ({participants.length})
          </div>
           {isConnecting && (
             <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Loader2 className="h-3 w-3 animate-spin mr-1" /> Connecting...
             </div>
           )}
           {connectionError && !isConnecting && (
             <Alert variant="destructive" className="mt-2 p-2 text-xs">
                <AlertCircle className="h-3 w-3"/>
                <AlertDescription>{connectionError}</AlertDescription>
             </Alert>
           )}
        </div>

        {/* Participant List */}
        <ScrollArea className="flex-grow p-4">
           {isConnecting && participants.length === 0 && (
               <div className="space-y-3">
                 {Array.from({length: 3}).map((_, i) => (
                    <div key={`skel-p-${i}`} className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full mr-3" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                 ))}
               </div>
           )}
          {!isConnecting && participants.length > 0 && (
            <ul className="space-y-3">
                {participants.map((p) => (
                <li key={p.id} className="flex items-center">
                    <Avatar className={`h-10 w-10 mr-3 border-2 flex-shrink-0 ${p.isSpeaking ? 'border-primary animate-pulse' : 'border-transparent'}`}>
                    <AvatarImage src={p.avatarUrl} alt={p.username} data-ai-hint="person avatar"/>
                    <AvatarFallback>{p.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="flex-grow truncate text-sm font-medium" title={p.username}>{p.username}</span>
                    {p.isMuted && <MicOff className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" title="Muted"/>}
                </li>
                ))}
            </ul>
           )}
            {!isConnecting && participants.length === 0 && !connectionError && (
                 <p className="text-sm text-muted-foreground text-center mt-4">Only you are here.</p>
             )}
             {/* Render connection error message inside list if needed */}
             {connectionError && participants.length === 0 && !isConnecting && (
                  <p className="text-sm text-destructive text-center mt-4">Could not load participants.</p>
             )}
        </ScrollArea>

        {/* User Controls Footer */}
         <div className="p-3 border-t border-border flex items-center justify-between bg-background/80 backdrop-blur-sm">
             <div className="flex items-center overflow-hidden mr-2 flex-grow min-w-0">
                {currentUser ? (
                    <>
                        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                            <AvatarImage src={currentUser.avatarUrl} data-ai-hint="person profile"/>
                            <AvatarFallback>{currentUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate" title={currentUser.username}>{currentUser.username}</span>
                    </>
                ) : (
                     <Skeleton className="h-8 w-8 rounded-full mr-2" />
                )}
             </div>
             <div className="flex items-center space-x-1 flex-shrink-0">
                 <Button variant={isMuted ? "destructive" : "secondary"} size="icon" className="h-8 w-8" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} disabled={isConnecting || !!connectionError}>
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                 </Button>
                 <Button variant={isDeafened ? "destructive" : "secondary"} size="icon" className="h-8 w-8" onClick={toggleDeafen} aria-label={isDeafened ? 'Undeafen' : 'Deafen'} disabled={isConnecting || !!connectionError}>
                    {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                 </Button>
                  {/* <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Settings</span>
                  </Button> */}
                 <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleLeaveRoom} aria-label="Leave Room">
                    <PhoneOff className="h-4 w-4" />
                 </Button>
             </div>
         </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-grow flex flex-col bg-background min-w-0"> {/* Ensure main area can shrink */}
        {/* Chat Header (Optional) */}
        {/* <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
             <h2 className="text-lg font-semibold">Chat</h2>
        </div> */}

        {/* Connection Error Alert */}
         {connectionError && (
            <div className="p-4 flex-shrink-0">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Issue</AlertTitle>
                    <AlertDescription>{connectionError}</AlertDescription>
                </Alert>
            </div>
         )}

        {/* Message List */}
        <ScrollArea className="flex-grow p-4" ref={chatScrollAreaRef}>
          <div className="space-y-4 mb-4"> {/* Add bottom margin */}
            {isConnecting && chatMessages.length === 0 && (
                <div className="flex justify-center items-center h-full text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading chat...
                </div>
            )}
             {!isConnecting && chatMessages.length === 0 && !connectionError && (
                <p className="text-sm text-muted-foreground text-center mt-4">No messages yet. Start the conversation!</p>
            )}
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start" data-chat-message>
                <Avatar className="h-8 w-8 mr-3 mt-1 flex-shrink-0">
                  <AvatarImage src={msg.userAvatar || `https://picsum.photos/seed/vr_guest/32/32`} alt={msg.username} data-ai-hint="person avatar"/>
                  <AvatarFallback>{msg.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow min-w-0"> {/* Allow text to wrap */}
                  <div className="flex items-baseline space-x-2">
                      <span className="font-semibold text-sm truncate" title={msg.username}>{msg.username}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message Input Area */}
        <div className="p-4 border-t border-border bg-secondary/30 flex-shrink-0">
          <form className="flex items-center space-x-2" onSubmit={handleSendMessage}>
            <Input
              type="text"
              placeholder={isDeafened ? "You are deafened" : (isConnecting || !!connectionError) ? "Connecting..." : "Type your message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow bg-background focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary"
              disabled={isDeafened || isConnecting || !!connectionError || !socketRef.current?.connected}
              aria-label="Chat Message Input"
              autoComplete="off"
            />
            <Button
               type="submit"
               size="icon"
               className="bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
               disabled={!newMessage.trim() || isDeafened || isConnecting || !!connectionError || !socketRef.current?.connected}
               aria-label="Send Message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
