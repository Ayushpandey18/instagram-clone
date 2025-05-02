

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Mic, MicOff, VideoOff, Radio, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import io from 'socket.io-client'; // Import socket.io-client
import { cn } from '@/lib/utils';

// Placeholder for Socket.IO connection - replace with your server URL
// In a real app, this URL should come from configuration
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'; // Example URL

export default function LivePage() {
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const socketRef = useRef<any>(null); // Ref to store socket instance

  // Request Camera and Microphone Permissions
  useEffect(() => {
    const getPermissions = async () => {
      let cameraAllowed = false;
      let micAllowed = false;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        cameraAllowed = true;
        micAllowed = true;
        setHasCameraPermission(true);
        setHasMicPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error: any) {
        console.error('Error accessing media devices:', error);
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
           toast({
             variant: 'destructive',
             title: 'Permissions Denied',
             description: 'Camera and microphone access are required to go live. Please enable them in your browser settings.',
           });
           setHasCameraPermission(false);
           setHasMicPermission(false);
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            toast({
             variant: 'destructive',
             title: 'Devices Not Found',
             description: 'No camera or microphone found. Please connect your devices.',
           });
           setHasCameraPermission(false); // Assume false if not found
           setHasMicPermission(false);
        } else {
           toast({
             variant: 'destructive',
             title: 'Error Accessing Devices',
             description: 'Could not access camera or microphone.',
           });
           setHasCameraPermission(false);
           setHasMicPermission(false);
        }
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
       if (socketRef.current) {
          socketRef.current.disconnect(); // Disconnect socket on unmount
        }
    };
  }, [toast]);

  // Initialize Socket.IO connection
   useEffect(() => {
    // Connect only if permissions are granted (or potentially allow joining without streaming)
    if (hasCameraPermission === true && hasMicPermission === true) {
        console.log(`Attempting to connect to Socket.IO server at ${SOCKET_SERVER_URL} using polling...`);
        // Explicitly define transports, FORCING polling for Vercel/Serverless compatibility
        socketRef.current = io(SOCKET_SERVER_URL, {
            transports: ['polling'], // FORCE POLLING ONLY
            reconnectionAttempts: 3, // Limit reconnection attempts
            timeout: 10000, // Connection timeout
         });


        socketRef.current.on('connect', () => {
            console.log('Connected to Socket.IO server:', socketRef.current.id);
            // You might join a default room or wait for user action
        });

        socketRef.current.on('disconnect', (reason: string) => {
            console.log('Disconnected from Socket.IO server:', reason);
            if (isLive) {
                toast({ variant: 'destructive', title: 'Disconnected', description: 'Live stream connection lost.' });
                setIsLive(false); // Update state if disconnected during live
            }
        });

        socketRef.current.on('connect_error', (error: Error) => {
            console.error('Socket.IO connection error:', error.message, error.name);
             toast({
                variant: 'destructive',
                title: 'Connection Error',
                description: `Failed to connect to the live server (${error.message}). Please check if the server is running at ${SOCKET_SERVER_URL}, ensure CORS is configured correctly on the server, and verify network connectivity. Try refreshing the page.`,
                duration: 15000 // Show longer duration for connection errors
            });
        });

        // --- Add other socket event listeners here ---
        // e.g., socketRef.current.on('user_joined', (userId) => { ... });
        // e.g., socketRef.current.on('user_left', (userId) => { ... });
        // e.g., socketRef.current.on('stream_data', (data) => { ... }); // For receiving others' streams

        return () => {
          if (socketRef.current) {
            console.log('Disconnecting socket...');
            socketRef.current.disconnect();
          }
        };
    } else {
        // Ensure socket is disconnected if permissions are revoked or not initially granted
         if (socketRef.current) {
            console.log('Disconnecting socket due to missing permissions...');
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [hasCameraPermission, hasMicPermission]); // Removed toast from dependencies to avoid reconnect loops


  const handleGoLive = () => {
    if (!hasCameraPermission || !hasMicPermission) {
       toast({ variant: 'destructive', title: 'Permissions Required', description: 'Cannot go live without camera and microphone access.' });
       return;
    }
     if (!socketRef.current || !socketRef.current.connected) {
        toast({ variant: 'destructive', title: 'Not Connected', description: 'Cannot go live. Not connected to the live server. Please check the connection.' });
        // Attempt to reconnect? Or guide user?
        // if (socketRef.current) socketRef.current.connect(); // Be careful with auto-reconnect logic
        return;
    }

    setIsLoading(true);
    console.log("Going live...");
    // --- TODO: Implement WebRTC setup and signaling via Socket.IO ---
    // 1. Get local media stream (already done in useEffect)
    // 2. Create Peer Connections for viewers (when they join)
    // 3. Send Offer/Answer SDP via Socket.IO
    // 4. Exchange ICE candidates via Socket.IO
    // 5. Emit a 'start_live' event to the server
     socketRef.current.emit('start_live', { /* user details, room id etc. */ });

    // Simulate delay for setup
    setTimeout(() => {
        setIsLive(true);
        setIsLoading(false);
        toast({ title: 'You are now live!', description: 'Your stream has started.' });
    }, 1500);
  };

  const handleStopLive = () => {
    console.log("Stopping live stream...");
     if (socketRef.current) {
        socketRef.current.emit('stop_live'); // Notify server
        // TODO: Close all Peer Connections
    }
    setIsLive(false);
    toast({ title: 'Live Stream Ended' });
  };

  const toggleMute = () => {
     const stream = videoRef.current?.srcObject as MediaStream;
     if (stream) {
         stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
         setIsMuted(!isMuted);
         // TODO: Emit mute status change via Socket.IO if needed
         if (socketRef.current?.connected) {
            socketRef.current.emit('mute_status', { muted: !isMuted });
         }
     }
  };

  const toggleVideo = () => {
      const stream = videoRef.current?.srcObject as MediaStream;
     if (stream) {
         stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
         setIsVideoOff(!isVideoOff);
          // TODO: Emit video status change via Socket.IO if needed
         if (socketRef.current?.connected) {
            socketRef.current.emit('video_status', { videoOff: !isVideoOff });
         }
     }
  };

  // Display loading or error states based on permission checks
   let permissionContent = null;
   if (hasCameraPermission === null || hasMicPermission === null) {
     permissionContent = (
       <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-2">Checking permissions...</p>
        </div>
     );
   } else if (hasCameraPermission === false || hasMicPermission === false) {
       permissionContent = (
           <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Permissions Required</AlertTitle>
                <AlertDescription>
                 Camera and Microphone access are needed to use the live feature. Please grant permissions in your browser settings and refresh the page.
                </AlertDescription>
            </Alert>
       );
   }

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
                {/* Always render video tag to avoid race conditions with stream assignment */}
                 <video ref={videoRef} className={cn("w-full h-full object-cover", isVideoOff ? 'hidden' : 'block')} autoPlay muted playsInline />
                 {isVideoOff && <VideoOff className="h-16 w-16 text-muted-foreground" />}
                 {permissionContent && !videoRef.current?.srcObject && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-secondary/80">
                        {permissionContent}
                    </div>
                 )}
              </div>

              {hasCameraPermission === true && hasMicPermission === true && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  {!isLive ? (
                    <Button
                      size="lg"
                      onClick={handleGoLive}
                      disabled={isLoading || !socketRef.current?.connected} // Also disable if not connected
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Radio className="mr-2 h-5 w-5" />}
                      Go Live
                    </Button>
                  ) : (
                    <Button size="lg" onClick={handleStopLive} variant="destructive">
                      Stop Live
                    </Button>
                  )}

                  <div className="flex gap-2">
                     <Button variant="outline" size="icon" onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={toggleVideo} aria-label={isVideoOff ? "Turn Video On" : "Turn Video Off"}>
                        {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>
                    {/* Add more controls like flip camera, effects etc. here */}
                  </div>
                </div>
               )}
                {/* Render permission request message if needed and stream not ready */}
               {permissionContent && hasCameraPermission !== true && hasMicPermission !== true && (
                   <div className="mt-4">{permissionContent}</div>
               )}

            </CardContent>
          </Card>

           {/* Placeholder for incoming streams/chat - only show if live */}
          {isLive && (
             <div className="w-full max-w-2xl mt-8">
                 <h2 className="text-xl font-semibold mb-4">Live Chat & Viewers</h2>
                 {/* Add chat component and viewer list here */}
                 <div className="h-64 bg-secondary rounded-md p-4 text-muted-foreground flex items-center justify-center">
                    Chat and viewer list will appear here.
                 </div>
             </div>
           )}

        </div>
      </main>
    </div>
  );
}

