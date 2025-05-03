'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PhoneOff, Send, Mic, MicOff, Volume2, VolumeX, Lock, Loader2, ArrowLeft, Settings, AlertCircle, User, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { VoiceRoom } from '@/services/voice-room';
import { getVoiceRoom, verifyRoomPassword } from '@/services/voice-room';
import { Skeleton } from '@/components/ui/skeleton';
import io, { Socket } from 'socket.io-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getCurrentUser } from '@/services/user';
import type { UserProfile } from '@/services/user';

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
  userAvatar: string;
  message: string;
  timestamp: string;
}

// Get Socket.IO server URL from environment variable
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

// --- WebRTC Configuration ---
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN server URLs here if needed for NAT traversal
    ],
};

export default function VoiceRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [roomDetails, setRoomDetails] = useState<VoiceRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCount, setParticipantCount] = useState(0); // State for count
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false); // Local mute state
  const [isDeafened, setIsDeafened] = useState(false); // Local deafen state

  const chatScrollAreaViewportRef = useRef<HTMLDivElement>(null); // Ref for the viewport div
  const socketRef = useRef<Socket | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const prevMessagesCountRef = useRef(0);

   // --- Check Environment Variable ---
   useEffect(() => {
    if (!SOCKET_SERVER_URL) {
        const errorMsg = "FATAL ERROR: NEXT_PUBLIC_SOCKET_URL environment variable is not set!";
        console.error(errorMsg); // Log critical error
        setConfigError(errorMsg);
        toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: 'The voice room server URL is not configured. Please contact support.',
            duration: 15000,
        });
        setIsLoading(false);
    } else {
        console.log("Using Socket URL:", SOCKET_SERVER_URL); // Log the URL being used
        setConfigError(null);
    }
  }, [toast]);


   // --- Fetch Current User Details ---
   useEffect(() => {
       const fetchUser = async () => {
           try {
               const user = await getCurrentUser();
               if (user) {
                    setCurrentUser(user);
               } else {
                   toast({ title: "Authentication Error", description: "Could not load user details. Please log in.", variant: "destructive" });
                   router.push('/');
               }
           } catch (err) {
               console.error("Failed to fetch current user:", err);
               toast({ title: "Error", description: "Could not load your user details.", variant: "destructive" });
               router.push('/');
           }
       };
       if (!configError) {
           fetchUser();
       }
   }, [toast, router, configError]);


  // --- Fetch Room Details ---
   useEffect(() => {
    if (!roomId || !currentUser || configError) return;

    const fetchRoomDetails = async () => {
      setIsLoading(true);
      setConnectionError(null);
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
      } catch (error: any) {
        console.error("Failed to fetch room details:", error);
        if (error.message?.includes("Backend API URL is not configured")) {
             setConfigError(error.message);
             toast({ title: "Configuration Error", description: error.message, variant: "destructive", duration: 15000 });
        } else {
            toast({ title: "Error Loading Room", description: error.message || "Failed to load room details.", variant: "destructive" });
            router.push('/voice-rooms');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoomDetails();
   }, [roomId, router, toast, currentUser, configError]);


    // --- Initialize Local Media Stream ---
    useEffect(() => {
        // Attempt to get stream only if authenticated, no config error, and user details loaded
        if (!isAuthenticated || configError || !currentUser) return;
        if (localStreamRef.current) return; // Don't re-request if stream already exists

        console.log("Attempting to get local media stream...");
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                console.log("Local audio stream obtained successfully.");
                localStreamRef.current = stream;
                 // Apply initial mute state to the tracks
                 stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
                 console.log(`Local audio tracks initially ${!isMuted ? 'enabled' : 'disabled'} based on mute state.`);
                 // If socket is already connected, potentially update peer connections? (handled by later logic)
            })
            .catch(err => {
                console.error("Error getting user media:", err);
                // Inform user, but don't block joining the room
                toast({
                    variant: 'warning',
                    title: 'Microphone Access Issue',
                    description: `Could not access microphone: ${err.message}. You can listen but not speak.`,
                    duration: 7000
                });
            });

        // Cleanup stream on unmount or if authentication changes
        return () => {
            if (localStreamRef.current) {
                 console.log("Stopping local media tracks on cleanup.");
                 localStreamRef.current.getTracks().forEach(track => track.stop());
                 localStreamRef.current = null;
            }
        };
    }, [isAuthenticated, configError, currentUser, toast, isMuted]); // Added isMuted


    const closePeerConnection = useCallback((targetSocketId: string) => {
        const pc = peerConnections.current[targetSocketId];
        if (pc) {
            console.log(`Closing peer connection with ${targetSocketId}`);
            pc.ontrack = null;
            pc.onicecandidate = null;
            pc.oniceconnectionstatechange = null;
            pc.onconnectionstatechange = null;
            // Stop transceivers associated with the connection
            pc.getTransceivers().forEach(transceiver => {
                if (transceiver.stop) {
                    transceiver.stop();
                }
            });
            pc.close();
            delete peerConnections.current[targetSocketId];
            console.log(`Peer connection state for ${targetSocketId}: ${pc.connectionState}`);
        }
        const audioEl = remoteAudioRefs.current[targetSocketId];
        if (audioEl) {
             console.log(`Removing audio element for ${targetSocketId}`);
            audioEl.srcObject = null;
            audioEl.remove();
            delete remoteAudioRefs.current[targetSocketId];
        }
    }, []);

    // --- WebRTC Peer Connection Management ---
    const createPeerConnection = useCallback((targetSocketId: string) => {
        if (peerConnections.current[targetSocketId]) {
             console.warn(`Peer connection already exists for ${targetSocketId}, closing old one.`);
             closePeerConnection(targetSocketId); // Ensure old one is cleaned up
        }
        // Socket must be connected to proceed with signaling
        if (!socketRef.current?.connected) {
             console.warn(`Cannot create peer connection to ${targetSocketId}: Socket not connected.`);
             return;
        }

        console.log(`Creating peer connection to ${targetSocketId}`);

        try {
            const pc = new RTCPeerConnection(iceServers);
            peerConnections.current[targetSocketId] = pc;

            // Add local tracks ONLY if the stream exists
            if (localStreamRef.current) {
                console.log(`Adding local audio tracks to connection with ${targetSocketId}`);
                localStreamRef.current.getTracks().forEach(track => {
                    try {
                        pc.addTrack(track, localStreamRef.current!);
                        console.log(`Successfully added track [${track.id}, kind=${track.kind}] to PC for ${targetSocketId}`);
                    } catch (addTrackError) {
                        console.error(`Error adding track ${track.id} to pc for ${targetSocketId}:`, addTrackError);
                    }
                });
                 // Ensure tracks are enabled/disabled based on current mute state
                 localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !isMuted);
            } else {
                console.log(`Peer connection to ${targetSocketId} created without local audio tracks (stream not ready yet).`);
            }

            pc.onicecandidate = (event) => {
                if (event.candidate && socketRef.current?.connected) {
                    // console.log(`Sending ICE candidate from ${socketRef.current.id} to ${targetSocketId}`); // Can be noisy
                    socketRef.current.emit('webrtc_ice_candidate', {
                        targetSocketId,
                        candidate: event.candidate,
                    });
                }
            };

            pc.ontrack = (event) => {
                console.log(`Received remote track event from ${targetSocketId}. Kind: ${event.track.kind}, Stream count: ${event.streams.length}`);
                 if (event.track.kind === 'audio' && event.streams && event.streams[0]) {
                    const stream = event.streams[0];
                    console.log(`Attaching remote audio stream [${stream.id}] from ${targetSocketId}`);
                    let audioEl = remoteAudioRefs.current[targetSocketId];
                    if (!audioEl) {
                        console.log(`Creating audio element for remote stream from ${targetSocketId}`);
                        audioEl = new Audio();
                        audioEl.autoplay = true;
                         // audioEl.controls = true; // DEBUG: Add controls for testing
                        remoteAudioRefs.current[targetSocketId] = audioEl;
                        // Find or create a hidden container for audio elements
                        let container = document.getElementById('remote-audio-container');
                        if (!container) {
                            console.log("Creating remote-audio-container div");
                            container = document.createElement('div');
                            container.id = 'remote-audio-container';
                            container.style.display = 'none'; // Keep it hidden
                            document.body.appendChild(container);
                        }
                        container.appendChild(audioEl);
                    }
                     audioEl.srcObject = stream;
                     audioEl.muted = isDeafened; // Apply initial deafen state
                     console.log(`Audio element for ${targetSocketId} configured. Muted: ${isDeafened}`);
                     audioEl.play().catch(e => console.warn(`Audio play failed for ${targetSocketId}:`, e)); // Try playing explicitly
                 } else {
                     console.warn(`Received track event from ${targetSocketId} without audio stream or kind is not audio.`);
                 }
            };

            pc.oniceconnectionstatechange = () => {
                // console.log(`ICE connection state for ${targetSocketId}: ${pc.iceConnectionState}`);
                if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
                    console.warn(`ICE connection state change to ${pc.iceConnectionState} for ${targetSocketId}. Cleaning up.`);
                    closePeerConnection(targetSocketId); // Clean up on failure/closure
                }
            };

             pc.onconnectionstatechange = () => {
               console.log(`Peer connection state for ${targetSocketId}: ${pc.connectionState}`);
                if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
                   console.warn(`Peer connection state changed to ${pc.connectionState} for ${targetSocketId}. Cleaning up.`);
                    closePeerConnection(targetSocketId);
                }
             };
             console.log(`Peer connection setup complete for ${targetSocketId}`);
         } catch (pcError) {
             console.error(`Error creating RTCPeerConnection for ${targetSocketId}:`, pcError);
         }

    }, [isDeafened, closePeerConnection, isMuted]); // Added isMuted dependency


    // --- Socket.IO Connection and Data Handling ---
    useEffect(() => {
        if (configError || !roomDetails || !isAuthenticated || !currentUser) {
            return;
        }
        if (socketRef.current || isConnecting) {
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);
        console.log(`Attempting to connect socket for room ${roomId} at ${SOCKET_SERVER_URL}...`);

        const socket = io(SOCKET_SERVER_URL!, {
            transports: ['websocket'], // Explicitly use WebSockets ONLY
            reconnectionAttempts: 3,
            timeout: 10000,
        });
        socketRef.current = socket;

        const handleConnect = () => {
            console.log('Socket connected:', socket.id);
            setIsConnecting(false);
            setConnectionError(null);
            toast({ title: 'Connected', description: `Joined voice room: ${roomDetails.name}` });

            socket.emit('join_voice_room', {
                roomId,
                user: { username: currentUser.username, avatarUrl: currentUser.avatarUrl }
            });
            // Attempt to get local stream again if it failed initially
             if (!localStreamRef.current) {
                 console.log("Socket connected, re-attempting to get local stream.");
                 navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                    .then(stream => {
                        console.log("Local audio stream obtained after socket connect.");
                        localStreamRef.current = stream;
                         stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
                         // Now we need to update existing peer connections to add the track
                         Object.values(peerConnections.current).forEach(pc => {
                            stream.getTracks().forEach(track => {
                                if (!pc.getSenders().find(s => s.track === track)) {
                                    try {
                                        pc.addTrack(track, stream);
                                        console.log(`Added track ${track.id} to existing PC post-connection.`);
                                    } catch (addTrackError) {
                                         console.error(`Error adding track ${track.id} to existing PC post-connection:`, addTrackError);
                                    }
                                }
                            });
                         });
                    })
                    .catch(err => {
                        console.error("Error getting user media after connect:", err);
                         toast({
                            variant: 'warning',
                            title: 'Microphone Access Issue',
                            description: `Could not access microphone: ${err.message}. You can listen but not speak.`,
                            duration: 7000
                        });
                    });
             }
        };

        const handleDisconnect = (reason: string) => {
            console.log('Socket disconnected:', reason);
            setIsConnecting(false);
            socketRef.current = null;
            if (reason !== 'io client disconnect') { // Don't show error for manual leave
                setConnectionError(`Disconnected: ${reason}. Check server and network.`);
                toast({ variant: 'destructive', title: 'Disconnected', description: 'Connection to the voice room lost.' });
            }
            setParticipants([]);
            setParticipantCount(0); // Reset count on disconnect
            setChatMessages([]);
             console.log("Cleaning up all peer connections on disconnect.");
            Object.keys(peerConnections.current).forEach(closePeerConnection);
        };

        const handleConnectError = (error: any) => {
            console.error('Socket.IO connection error (WebSocket):', error);
            setIsConnecting(false);
            socketRef.current = null; // Clear the ref on error

            let detailedMessage = `Failed to connect to the live server (${SOCKET_SERVER_URL}) via WebSocket. Error: ${error.message || 'Unknown error'}.`;
            if (error.message?.includes('websocket error')) {
                 detailedMessage += ` Ensure the server allows WebSocket upgrades and check network/firewall settings.`;
            } else {
                detailedMessage = `WebSocket Connection Error: ${error.message}. Please check server status and network.`;
            }

            setConnectionError(detailedMessage + " Please try refreshing.");
            toast({
                variant: 'destructive',
                title: 'Connection Error',
                description: detailedMessage + " Please try refreshing.",
                duration: 15000 // Show longer duration for connection errors
            });
        };

         const handleRoomState = async (data: { participants: Participant[], messages?: ChatMessage[], existingParticipantIds?: string[] }) => {
            console.log('Received room state:', data);
            const currentParticipants = data.participants || [];
            setParticipants(currentParticipants);
            setParticipantCount(currentParticipants.length); // Set initial count from full state
            setChatMessages(data.messages || []);
            prevMessagesCountRef.current = data.messages?.length || 0;

             if (data.existingParticipantIds) {
                console.log('Initiating connections to existing participants:', data.existingParticipantIds);
                for (const targetSocketId of data.existingParticipantIds) {
                    if (targetSocketId !== socket.id) {
                         try {
                            createPeerConnection(targetSocketId);
                            const pc = peerConnections.current[targetSocketId];
                            if (!pc) {
                                console.warn(`Failed to create PC for existing participant ${targetSocketId}, skipping offer.`);
                                continue;
                            }

                            // Only send offer if we have a local stream
                            if (localStreamRef.current) {
                                console.log(`Creating offer for existing participant ${targetSocketId}`);
                                const offer = await pc.createOffer();
                                await pc.setLocalDescription(offer);
                                console.log(`Sending offer to ${targetSocketId}`);
                                socketRef.current?.emit('webrtc_offer', { targetSocketId, offer });
                            } else {
                                 console.log(`Not sending offer to ${targetSocketId} yet (no local stream).`);
                            }
                         } catch (err) {
                            console.error(`Error creating/sending offer for existing participant ${targetSocketId}:`, err);
                         }
                    }
                }
             }
        };

        const handleParticipantJoined = (participant: Participant) => {
            if (!participant || !participant.id) {
                console.warn("Received invalid participant_joined event:", participant);
                return;
            }
            console.log('Participant joined:', participant.username, participant.id);
            setParticipants(prev => prev.find(p => p.id === participant.id) ? prev : [...prev, participant]);
            if (participant.id !== socket.id) {
                if (currentUser && participant.username !== currentUser.username) {
                   toast({ description: `${participant.username} joined the room.` });
                }
                // Important: Initiate connection *to* the new participant
                 console.log(`Creating peer connection FOR new participant: ${participant.id}`);
                createPeerConnection(participant.id);
                // Offer will be sent when createPeerConnection runs and finds local stream,
                // or when local stream becomes available later.
            }
        };

        const handleParticipantLeft = (targetSocketId: string) => {
            console.log('Participant left:', targetSocketId);
            let leftUsername = 'Someone';
            setParticipants(prev => {
                const user = prev.find(p => p.id === targetSocketId);
                if(user) leftUsername = user.username;
                return prev.filter(p => p.id !== targetSocketId);
            });
            if(currentUser && leftUsername !== currentUser.username && leftUsername !== 'Someone') {
                toast({ description: `${leftUsername} left the room.` });
            }
             closePeerConnection(targetSocketId);
        };

        const handleNewMessage = (message: ChatMessage) => {
             // Ensure message object is valid
            if (!message || !message.id) {
                console.warn("Received invalid new_message event:", message);
                return;
            }
            console.log(`Received message from ${message.username}: ${message.message}`);
            setChatMessages(prev => [...prev, message]);
        };

        const handleParticipantUpdate = (update: Partial<Participant> & { id: string }) => {
            // Ensure update object and id exist
            if (!update || !update.id) {
                console.warn("Received invalid participant_update event:", update);
                return;
            }
            // console.log(`Received participant update for ${update.id}:`, update); // Can be noisy
            setParticipants(prev => prev.map(p => p.id === update.id ? { ...p, ...update } : p));
        };

        // --- Handle Participant Count Updates ---
        const handleParticipantCountUpdate = ({ count }: { count: number }) => {
             console.log(`Received participant count update: ${count}`);
             setParticipantCount(count);
        };

        // --- WebRTC Signaling Handlers ---
        const handleWebRTCOffer = async ({ senderSocketId, offer }: { senderSocketId: string, offer: RTCSessionDescriptionInit }) => {
            console.log(`Received offer from ${senderSocketId}`);

            // Ensure we have a peer connection instance for this sender. If not, create one.
             if (!peerConnections.current[senderSocketId]) {
                 console.log(`No existing PC found for offer sender ${senderSocketId}, creating one.`);
                createPeerConnection(senderSocketId);
            }

            const pc = peerConnections.current[senderSocketId];
             if (!pc) {
                 console.error(`Failed to create peer connection for offer from ${senderSocketId}. Cannot proceed.`);
                 return;
             }

            try {
                if (pc.signalingState !== "stable") {
                  console.warn(`Received offer from ${senderSocketId} but signaling state is ${pc.signalingState}. Handling might require rollback.`);
                  // Potentially handle rollback: create new PC or set remote description with specific options
                }

                console.log(`Setting remote description (offer) from ${senderSocketId}`);
                await pc.setRemoteDescription(new RTCSessionDescription(offer));

                 // Only create/send answer if local stream is available
                 if (localStreamRef.current) {
                     console.log(`Creating answer for ${senderSocketId}`);
                     const answer = await pc.createAnswer();
                     console.log(`Setting local description (answer) for ${senderSocketId}`);
                     await pc.setLocalDescription(answer);
                     console.log(`Sending answer to ${senderSocketId}`);
                     socketRef.current?.emit('webrtc_answer', { targetSocketId: senderSocketId, answer });
                 } else {
                     console.log(`Offer from ${senderSocketId} accepted, but not sending answer yet (no local stream).`);
                      // Need to handle sending the answer later when the stream becomes available
                 }
            } catch (err) {
                 console.error(`Error handling offer from ${senderSocketId}:`, err);
            }
        };

        const handleWebRTCAnswer = async ({ senderSocketId, answer }: { senderSocketId: string, answer: RTCSessionDescriptionInit }) => {
            console.log(`Received answer from ${senderSocketId}`);
            const pc = peerConnections.current[senderSocketId];
            if (pc && pc.signalingState === 'have-local-offer') { // Only set answer if we sent an offer
                 try {
                     console.log(`Setting remote description (answer) from ${senderSocketId}`);
                     await pc.setRemoteDescription(new RTCSessionDescription(answer));
                     console.log(`Peer connection established/updated with ${senderSocketId} after receiving answer.`);
                 } catch (err) {
                      console.error(`Error setting remote description (answer) from ${senderSocketId}:`, err);
                 }
            } else {
                console.warn(`Received unexpected answer from ${senderSocketId} (PC not found or state is ${pc?.signalingState}).`);
            }
        };

        const handleWebRTCIceCandidate = async ({ senderSocketId, candidate }: { senderSocketId: string, candidate: RTCIceCandidateInit }) => {
            // console.log(`Received ICE candidate from ${senderSocketId}`); // Noisy
            const pc = peerConnections.current[senderSocketId];
            if (pc && candidate) {
                try {
                     // Check if remote description is set before adding candidate
                     if (pc.remoteDescription) {
                          // console.log(`Adding ICE candidate from ${senderSocketId}`); // Noisy
                         await pc.addIceCandidate(new RTCIceCandidate(candidate));
                     } else {
                         console.warn(`Queueing ICE candidate from ${senderSocketId} as remote description is not set yet.`);
                         // TODO: Implement queuing mechanism if necessary, though often handled by the browser/WebRTC stack
                     }
                } catch (err: any) {
                    // Ignore benign errors like candidate added before remote description set
                     // console.error(`Error adding ICE candidate from ${senderSocketId}:`, err); // Noisy
                }
            } else if (!pc) {
                 // console.warn(`Received ICE candidate from ${senderSocketId} but no peer connection found.`); // Noisy
            }
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
        socket.on('participant_count_update', handleParticipantCountUpdate); // Listen for count updates
        // WebRTC Listeners
        socket.on('webrtc_offer', handleWebRTCOffer);
        socket.on('webrtc_answer', handleWebRTCAnswer);
        socket.on('webrtc_ice_candidate', handleWebRTCIceCandidate);


        // --- Cleanup listeners and disconnect socket ---
        return () => {
          if (socketRef.current) {
             console.log('Disconnecting voice room socket on cleanup...');
             socketRef.current.off(); // Remove all listeners
             socketRef.current.disconnect();
             socketRef.current = null;
          }
           setIsConnecting(false);
           setParticipants([]);
           setChatMessages([]);
            console.log("Cleaning up all peer connections on component unmount.");
            Object.keys(peerConnections.current).forEach(closePeerConnection);
            peerConnections.current = {}; // Clear peer connections ref
            remoteAudioRefs.current = {}; // Clear audio refs
        };
    }, [SOCKET_SERVER_URL, roomId, roomDetails, isAuthenticated, currentUser, toast, configError, createPeerConnection, closePeerConnection, isMuted]); // Added isMuted


    // --- Scroll chat to bottom ---
    const scrollToBottom = useCallback(() => {
        const viewport = chatScrollAreaViewportRef.current;
        if (viewport) {
            requestAnimationFrame(() => {
                viewport.scrollTop = viewport.scrollHeight;
            });
        }
    }, []);

    useEffect(() => {
        if (chatMessages.length > prevMessagesCountRef.current) {
            scrollToBottom();
        }
        prevMessagesCountRef.current = chatMessages.length;
    }, [chatMessages, scrollToBottom]);


  // --- Event Handlers ---
  const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !roomDetails) return;
    setIsAuthLoading(true);
    setAuthError(null);
    try {
        const isCorrect = await verifyRoomPassword(roomDetails.id, password);
        if (isCorrect) {
            setIsAuthenticated(true);
            toast({ title: "Success", description: "Access granted." });
        } else {
            setAuthError("Incorrect password. Please try again.");
            setPassword('');
            toast({ title: "Access Denied", description: "Incorrect password.", variant: "destructive" });
        }
    } catch (error: any) {
         console.error("Password verification failed:", error);
         if (error.message?.includes("Backend API URL is not configured")) {
             setConfigError(error.message);
             toast({ title: "Configuration Error", description: error.message, variant: "destructive", duration: 15000 });
         } else {
             setAuthError("Failed to verify password. Please try again later.");
             toast({ title: "Error", description: "Could not verify password.", variant: "destructive" });
         }
    } finally {
         setIsAuthLoading(false);
    }
  }, [password, roomDetails, toast]);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current?.connected || !currentUser) return;
    console.log(`Sending message: "${newMessage}" to room ${roomId}`);
    socketRef.current.emit('send_message', { roomId, message: newMessage });
    setNewMessage('');
  }, [newMessage, roomId, currentUser]);

  const handleLeaveRoom = useCallback(() => {
    console.log("User initiated leave room...");
    // No need to manually close connections here, disconnect handler will do it
    if (socketRef.current) {
        socketRef.current.disconnect(); // This triggers the disconnect handler
    }
    // Stop local media stream explicitly before navigating away
     if (localStreamRef.current) {
         console.log("Stopping local media tracks on leave.");
         localStreamRef.current.getTracks().forEach(track => track.stop());
         localStreamRef.current = null;
     }
    toast({ title: "Left Room", description: `You have left ${roomDetails?.name}.` });
    router.push('/voice-rooms');
  }, [router, roomDetails?.name, toast]); // Removed closePeerConnection dependency

    const toggleMute = useCallback(() => {
        const newMutedState = !isMuted;
        console.log(`Toggling mute. New state: ${newMutedState ? 'Muted' : 'Unmuted'}`);
        setIsMuted(newMutedState);

        // Enable/disable local audio tracks
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newMutedState;
                console.log(`Local audio track ${track.id} enabled: ${!newMutedState}`);
            });
        } else {
            console.warn("Cannot toggle mute: Local audio stream not available.");
             // Optionally try to get the stream again if user clicks unmute
             if (!newMutedState) {
                 navigator.mediaDevices.getUserMedia({ audio: true, video: false })
                    .then(stream => {
                        console.log("Mic access granted after attempting unmute.");
                        localStreamRef.current = stream;
                        stream.getAudioTracks().forEach(track => track.enabled = true); // Ensure enabled
                        // Need to add tracks to existing connections
                         Object.values(peerConnections.current).forEach(pc => {
                             stream.getTracks().forEach(track => {
                                 if (!pc.getSenders().find(s => s.track === track)) {
                                    try {
                                        pc.addTrack(track, stream);
                                        console.log(`Added track ${track.id} to existing PC after unmute attempt.`);
                                    } catch (addTrackError) {
                                        console.error(`Error adding track ${track.id} to PC after unmute attempt:`, addTrackError);
                                    }
                                 }
                             });
                         });
                    })
                    .catch(err => {
                        console.error("Error getting mic access on unmute attempt:", err);
                        toast({ variant: "destructive", title: "Unmute Failed", description: "Could not access microphone. Please grant permission." });
                        setIsMuted(true); // Revert state if permission fails
                    });
             }
            return; // Exit if no stream
        }

        // Emit update to server
        if (socketRef.current?.connected) {
            socketRef.current.emit('update_participant', { roomId, updates: { isMuted: newMutedState } });
        }
    }, [isMuted, roomId, toast]);


    const toggleDeafen = useCallback(() => {
         const newDeafenedState = !isDeafened;
         console.log(`Toggling deafen. New state: ${newDeafenedState ? 'Deafened' : 'Undeafened'}`);
         setIsDeafened(newDeafenedState);

         // Mute/unmute all remote audio elements
        Object.values(remoteAudioRefs.current).forEach(audioEl => {
            audioEl.muted = newDeafenedState;
             console.log(`Remote audio element muted state set to: ${newDeafenedState}`);
        });

        // Automatically mute self if deafening and not already muted
        if (newDeafenedState && !isMuted) {
             console.log("Auto-muting because deafen was enabled.");
             toggleMute(); // Call the toggleMute function to handle logic consistently
        }
    }, [isDeafened, isMuted, toggleMute]);


  // --- Render Logic ---

   if (configError) {
     return (
         <div className="container mx-auto max-w-md py-20 px-4 flex flex-col items-center text-center h-screen justify-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>{configError}</AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground mt-4">Please ensure the NEXT_PUBLIC_SOCKET_URL environment variable is set correctly and try again.</p>
              <Button variant="link" onClick={() => router.push('/voice-rooms')} className="mt-4">Go back to Rooms</Button>
         </div>
     );
   }

  if (isLoading || !currentUser) {
    return (
      <div className="container mx-auto max-w-6xl py-8 px-4 flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

   if (!roomDetails) {
     return (
         <div className="container mx-auto p-8 text-center h-screen flex flex-col justify-center items-center">
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Room not found or failed to load.</AlertDescription>
             </Alert>
             <Button variant="link" onClick={() => router.push('/voice-rooms')} className="mt-4">Go back to Rooms</Button>
         </div>
     );
   }

  if (roomDetails.passwordProtected && !isAuthenticated) {
    return (
        <div className="container mx-auto max-w-md py-20 px-4 flex flex-col items-center h-screen justify-center">
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
             <Users className="h-4 w-4 mr-1.5"/> Participants ({participantCount}) {/* Use state for count */}
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
                    <Avatar className={`h-10 w-10 mr-3 border-2 flex-shrink-0 ${p.isSpeaking ? 'border-green-500 animate-pulse' : 'border-transparent'}`}>
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
                 <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleLeaveRoom} aria-label="Leave Room">
                    <PhoneOff className="h-4 w-4" />
                 </Button>
             </div>
         </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-grow flex flex-col bg-background min-w-0">
        {/* Connection Error Alert */}
         {connectionError && !isConnecting && (
            <div className="p-4 flex-shrink-0">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Issue</AlertTitle>
                    <AlertDescription>{connectionError}</AlertDescription>
                </Alert>
            </div>
         )}

        {/* Message List */}
        <ScrollArea className="flex-grow" viewportRef={chatScrollAreaViewportRef}>
          <div className="space-y-4 p-4 mb-4"> {/* Added padding */}
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
                <div className="flex-grow min-w-0">
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
              placeholder={isConnecting ? "Connecting..." : (!!connectionError || !socketRef.current?.connected ? "Connection error..." : (isDeafened ? "You are deafened" : "Type your message..."))}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow bg-background focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary"
              // Disable only if actively connecting, error exists, socket not connected, or deafened
              disabled={isConnecting || !!connectionError || !socketRef.current?.connected || isDeafened}
              aria-label="Chat Message Input"
              autoComplete="off"
            />
            <Button
               type="submit"
               size="icon"
               className="bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
               disabled={!newMessage.trim() || isConnecting || !!connectionError || !socketRef.current?.connected || isDeafened}
               aria-label="Send Message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
       {/* Container for remote audio elements (hidden) */}
       <div id="remote-audio-container" style={{ display: 'none' }}></div>
    </div>
  );
}
