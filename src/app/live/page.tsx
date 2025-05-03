
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Mic, MicOff, VideoOff, Radio, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import io, { Socket } from 'socket.io-client'; // Import socket.io-client and Socket type
import { cn } from '@/lib/utils';

// Get Socket.IO server URL from environment variable
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

export default function LivePage() {
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For 'Go Live' button state
  const [isConnecting, setIsConnecting] = useState(false); // For socket connection state
  const [connectionError, setConnectionError] = useState<string | null>(null); // Specific connection error
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null); // Ref to store socket instance, typed

  // --- Check Environment Variable ---
  useEffect(() => {
    if (!SOCKET_SERVER_URL) {
      console.error("ERROR: NEXT_PUBLIC_SOCKET_URL environment variable is not set!");
      setConnectionError("Configuration error: Socket server URL is missing. Cannot connect to live services.");
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'The live server URL is not configured. Please contact support.',
        duration: 15000,
      });
    }
     // Log the URL being used
     console.log("Using Socket.IO Server URL:", SOCKET_SERVER_URL);
  }, [toast]); // Added toast dependency


  // --- Request Camera and Microphone Permissions ---
  useEffect(() => {
    const getPermissions = async () => {
      // Only request if permissions haven't been determined yet
      if (hasCameraPermission !== null && hasMicPermission !== null) return;

      let cameraAllowed = false;
      let micAllowed = false;
      try {
        console.log("Requesting media permissions...");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("Media permissions granted.");
        cameraAllowed = true;
        micAllowed = true;
        setHasCameraPermission(true);
        setHasMicPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // If permissions are granted, clear any previous permission-related error
        if(connectionError?.includes('permission')) {
            setConnectionError(null);
        }
      } catch (error: any) {
        console.error('Error accessing media devices:', error.name, error.message);
        const permissionError = "Camera and microphone access are required to go live. Please enable them in your browser settings and refresh the page.";
        const deviceNotFoundError = "No camera or microphone found. Please connect your devices.";
        const genericError = "Could not access camera or microphone.";

        let description = genericError;
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
           description = permissionError;
           setHasCameraPermission(false);
           setHasMicPermission(false);
           setConnectionError("Permission denied for camera/microphone."); // Set specific error
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            description = deviceNotFoundError;
            setHasCameraPermission(false);
            setHasMicPermission(false);
            setConnectionError("Required devices (camera/microphone) not found."); // Set specific error
        } else {
           setHasCameraPermission(false); // Assume false on other errors
           setHasMicPermission(false);
           setConnectionError("Error accessing media devices."); // Set specific error
        }
         toast({
             variant: 'destructive',
             title: 'Device Access Error',
             description: description,
             duration: 10000,
         });
      }
    };

    getPermissions();

    // Cleanup: Stop tracks when component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null; // Release the stream
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


  // --- Initialize Socket.IO connection ---
   useEffect(() => {
    // Conditions to establish connection:
    // 1. URL must be defined
    // 2. Permissions must be checked (not null) and ideally granted (true) - though connection might be allowed even if denied
    // 3. Not already connecting or connected
    if (!SOCKET_SERVER_URL || hasCameraPermission === null || hasMicPermission === null || socketRef.current || isConnecting) {
       // If permissions are explicitly denied, ensure no connection attempt happens if one was pending
       if(hasCameraPermission === false || hasMicPermission === false) {
            setIsConnecting(false); // Prevent trying to connect if permissions denied
       }
        return;
    }

    setIsConnecting(true);
    setConnectionError(null); // Clear previous errors
    console.log(`Attempting to connect to Socket.IO server at ${SOCKET_SERVER_URL} using WebSockets only...`);

    // Standard Socket.IO client connection, explicitly use only WebSockets
    const socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket'], // Use only WebSocket transport
        reconnectionAttempts: 3, // Limit reconnection attempts
        timeout: 10000, // Connection timeout
    });
    socketRef.current = socket;

    const handleConnect = () => {
        console.log('Connected to Socket.IO server:', socket.id, 'using transport:', socket.io.engine.transport.name);
        setIsConnecting(false);
        setConnectionError(null); // Clear error on successful connect
        toast({ title: 'Connected', description: 'Ready for live stream.' });
        // You might join a default room or wait for user action
    };

    const handleDisconnect = (reason: string) => {
        console.log('Disconnected from Socket.IO server:', reason);
        setIsConnecting(false);
        socketRef.current = null; // Clear the ref on disconnect

        if (isLive) {
            setIsLive(false); // Update state if disconnected during live
            toast({ variant: 'destructive', title: 'Disconnected', description: 'Live stream connection lost.' });
        } else if (reason !== 'io client disconnect') { // Don't show error for manual disconnect
            setConnectionError(`Disconnected: ${reason}. Check server and network.`);
            toast({ variant: 'destructive', title: 'Connection Lost', description: `Reason: ${reason}` });
        }
    };

    const handleConnectError = (error: any) => { // Use 'any' to access potential transport details
        console.error('Socket.IO connection error (WebSocket):', error);
        setIsConnecting(false);
        socketRef.current = null; // Clear the ref on error

        // Provide more specific feedback based on the error type if possible
        let detailedMessage = `Failed to connect to the live server (${SOCKET_SERVER_URL}) via WebSocket. Error: ${error.message || 'Unknown error'}.`;
         if (error && error.message && error.message.toLowerCase().includes('websocket error')) {
             detailedMessage += ` Ensure the server allows WebSocket upgrades and check network/firewall settings.`;
        } else if (error instanceof Error) {
            // Generic error message
            detailedMessage = `WebSocket Connection Error: ${error.message}. Please check server status and network.`;
        } else {
             detailedMessage = `An unknown WebSocket connection error occurred. Please check server status and network.`;
        }

        setConnectionError(detailedMessage);
        toast({
            variant: 'destructive',
            title: 'Connection Error',
            description: detailedMessage + " Please try refreshing.",
            duration: 15000 // Show longer duration for connection errors
        });
    };

    // Attach listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // --- Add other relevant socket event listeners here ---
    // e.g., receiving stream data, chat messages, viewer counts etc.
    // socket.on('live_started', (data) => console.log('Live started event:', data));
    // socket.on('viewer_joined', (userId) => console.log('Viewer joined:', userId));

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket...');
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('connect_error', handleConnectError);
        // Remove other listeners
        socketRef.current.disconnect();
        socketRef.current = null;
      }
       setIsConnecting(false); // Ensure connecting state is reset
    };
  // Only reconnect if URL, permissions status change, or connection state requires it
  }, [SOCKET_SERVER_URL, hasCameraPermission, hasMicPermission, toast, isLive, isConnecting]); // Added isConnecting to dependencies


  const handleGoLive = () => {
    // Check permissions first
    if (hasCameraPermission === false || hasMicPermission === false) {
       toast({ variant: 'destructive', title: 'Permissions Required', description: 'Cannot go live without camera and microphone access.' });
       return;
    }
     // Check connection status
     if (!socketRef.current || !socketRef.current.connected) {
        toast({ variant: 'destructive', title: 'Not Connected', description: 'Cannot go live. Not connected to the live server. Please check the connection.' });
        return;
    }

    setIsLoading(true); // Disable Go Live button
    console.log("Going live...");
    // --- TODO: Implement WebRTC setup and signaling via Socket.IO ---
    // 1. Get local media stream (already done in useEffect)
    // 2. Create Peer Connections for viewers (when they join)
    // 3. Send Offer/Answer SDP via Socket.IO
    // 4. Exchange ICE candidates via Socket.IO
    // 5. Emit a 'start_live' event to the server
     socketRef.current.emit('start_live', { userId: 'current_user_id', /* other details */ });

    // Simulate delay for setup
    setTimeout(() => {
        setIsLive(true);
        setIsLoading(false); // Re-enable Go Live button (now Stop Live)
        toast({ title: 'You are now live!', description: 'Your stream has started.' });
    }, 1500);
  };

  const handleStopLive = () => {
    console.log("Stopping live stream...");
     if (socketRef.current) {
        socketRef.current.emit('stop_live', { userId: 'current_user_id' }); // Notify server
        // TODO: Close all Peer Connections
    }
    setIsLive(false);
    setIsLoading(false); // Ensure loading state is reset
    toast({ title: 'Live Stream Ended' });
  };

  const toggleMute = () => {
     const stream = videoRef.current?.srcObject as MediaStream;
     if (stream) {
         const audioTracks = stream.getAudioTracks();
         if(audioTracks.length > 0) {
            const newState = !audioTracks[0].enabled;
            audioTracks[0].enabled = newState;
            setIsMuted(!newState); // isMuted is true if track is NOT enabled
             // Emit mute status change via Socket.IO if connected
             if (socketRef.current?.connected) {
                socketRef.current.emit('mute_status', { muted: !newState });
             }
             console.log("Audio track enabled:", newState);
         } else {
            console.warn("No audio track found to toggle mute.");
         }
     } else {
         console.warn("No media stream available to toggle mute.");
     }
  };

  const toggleVideo = () => {
      const stream = videoRef.current?.srcObject as MediaStream;
     if (stream) {
         const videoTracks = stream.getVideoTracks();
          if(videoTracks.length > 0) {
             const newState = !videoTracks[0].enabled;
             videoTracks[0].enabled = newState;
             setIsVideoOff(!newState); // isVideoOff is true if track is NOT enabled
              // Emit video status change via Socket.IO if connected
             if (socketRef.current?.connected) {
                socketRef.current.emit('video_status', { videoOff: !newState });
             }
             console.log("Video track enabled:", newState);
          } else {
            console.warn("No video track found to toggle video.");
          }
     } else {
          console.warn("No media stream available to toggle video.");
     }
  };

  // --- Permission and Connection Status Rendering ---
   let statusContent = null;
   if (hasCameraPermission === null || hasMicPermission === null) {
     // Still checking permissions
     statusContent = (
       <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-secondary/80 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p>Checking camera & microphone permissions...</p>
        </div>
     );
   } else if (hasCameraPermission === false || hasMicPermission === false) {
       // Permissions denied
       statusContent = (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-secondary/80">
               <Alert variant="destructive" className="w-full max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Permissions Required</AlertTitle>
                    <AlertDescription>
                    Camera and Microphone access denied. Please grant permissions in your browser settings and refresh the page to use the live feature.
                    </AlertDescription>
                </Alert>
           </div>
       );
   } else if (isConnecting) {
      // Connecting to socket server
       statusContent = (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-secondary/80 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p>Connecting to live server...</p>
          </div>
       );
   } else if (connectionError) {
        // Connection error occurred
        statusContent = (
             <div className="absolute inset-0 flex items-center justify-center p-4 bg-secondary/80">
                <Alert variant="destructive" className="w-full max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>{connectionError}</AlertDescription>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-3">Refresh Page</Button>
                </Alert>
            </div>
        );
   } else if (isVideoOff) {
       // Video is off (but connected and permissions granted)
        statusContent = (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/50 text-white">
                <VideoOff className="h-16 w-16 mb-2" />
                <p>Video is off</p>
            </div>
        );
   }
   // If none of the above, the video stream should be visible (or blank if no stream yet)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-grow pl-[72px] lg:pl-[244px] transition-all duration-300 ease-in-out">
        <div className="container mx-auto max-w-4xl py-12 px-4 flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-6">Live Video</h1>

          <Card className="w-full max-w-2xl">
             <CardHeader>
                <CardTitle>{isLive ? "You are Live" : "Preview"}</CardTitle>
                 <CardDescription>
                    {isLive ? "Broadcasting to your followers." : "Prepare to start your live stream."}
                 </CardDescription>
             </CardHeader>
            <CardContent>
              <div className="aspect-video bg-secondary rounded-md mb-4 flex items-center justify-center text-muted-foreground relative overflow-hidden">
                {/* Video element */}
                 <video
                     ref={videoRef}
                     className={cn("w-full h-full object-cover", (isVideoOff || statusContent) ? 'invisible' : 'visible')} // Hide if video off or status shown
                     autoPlay
                     muted // Mute preview video element itself, control tracks separately
                     playsInline
                 />
                 {/* Status/Error Overlay */}
                 {statusContent}
              </div>

              {/* Controls are shown only if permissions are granted */}
              {hasCameraPermission === true && hasMicPermission === true && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  {!isLive ? (
                    <Button
                      size="lg"
                      onClick={handleGoLive}
                      // Disable if loading, connecting, connection error, or socket not ready
                      disabled={isLoading || isConnecting || !!connectionError || !socketRef.current?.connected}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Radio className="mr-2 h-5 w-5" />}
                      Go Live
                    </Button>
                  ) : (
                    <Button size="lg" onClick={handleStopLive} variant="destructive" disabled={isLoading}>
                       {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                      Stop Live
                    </Button>
                  )}

                  {/* Mute/Video Controls - disable if connecting or error */}
                  <div className="flex gap-2">
                     <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                        disabled={isConnecting || !!connectionError}
                     >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleVideo}
                        aria-label={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                        disabled={isConnecting || !!connectionError}
                    >
                        {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>
                    {/* Add more controls like flip camera, effects etc. here */}
                  </div>
                </div>
               )}
               {/* Display connection error below controls if permissions were granted */}
               {connectionError && hasCameraPermission === true && hasMicPermission === true && !isConnecting && (
                   <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Connection Issue</AlertTitle>
                        <AlertDescription>{connectionError}</AlertDescription>
                   </Alert>
               )}
               {/* Display permission error if needed and permissions not granted */}
               {(hasCameraPermission === false || hasMicPermission === false) && (
                   <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Permissions Required</AlertTitle>
                        <AlertDescription>
                        Camera and Microphone access are needed. Please grant permissions in your browser settings and refresh.
                        </AlertDescription>
                    </Alert>
               )}

            </CardContent>
          </Card>

           {/* Placeholder for incoming streams/chat - only show if live */}
          {isLive && (
             <div className="w-full max-w-2xl mt-8">
                 <h2 className="text-xl font-semibold mb-4">Live Chat & Viewers</h2>
                 {/* TODO: Add chat component and viewer list here */}
                 <div className="h-64 bg-secondary rounded-md p-4 text-muted-foreground flex items-center justify-center">
                    Chat and viewer list will appear here. (Implementation needed)
                 </div>
             </div>
           )}

        </div>
      </main>
    </div>
  );
}
