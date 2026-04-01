import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import Peer from "simple-peer";
import { User, Loader2, VideoOff, MicOff } from "lucide-react";

interface VideoCallProps {
  socket: Socket | null;
  roomId: string;
  isVideoOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  onScreenShareStop: () => void;
  participants: any[];
}

export default function VideoCall({ socket, roomId, isVideoOn, isMicOn, isScreenSharing, onScreenShareStop, participants }: VideoCallProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState<any>();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  // Reactions state
  const [reactions, setReactions] = useState<{id: string, emoji: string, senderName: string}[]>([]);
  
  const myVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<any>(null);
  const socketRef = useRef(socket);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Update socket ref when it changes
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Request media devices on mount
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setMediaError(null);
        setStream(currentStream);
        originalVideoTrackRef.current = currentStream.getVideoTracks()[0];
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch(err => {
        console.error("Failed to get local stream", err);
        setMediaError("Camera or Microphone access was denied or not found. Please allow access in your browser site settings and refresh.");
      });

    return () => {
      // Cleanup media tracks on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
    };
    // Initialize stream only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up socket listeners
  useEffect(() => {
    if (!socket) return;

    const onUserConnected = (userId: string) => {
      console.log("User connected", userId);
      setIdToCall(userId);
    };

    const onSignal = (data: any) => {
      if (data.from !== socket.id && !callAccepted && !idToCall) {
        setReceivingCall(true);
        setCaller(data.from);
        setCallerSignal(data.signal);
      } else if (data.from === idToCall && connectionRef.current && !callAccepted) {
        // We initiated the call and are getting the answer back
        setCallAccepted(true);
        connectionRef.current.signal(data.signal);
      }
    };

    const onUserDisconnected = () => {
      setCallEnded(true);
      if (connectionRef.current) connectionRef.current.destroy();
      // Reset state so we can wait for another person
      setCallAccepted(false);
      setIdToCall("");
    };

    const onReaction = (data: {reaction: string, senderName: string}) => {
      const id = Math.random().toString(36).substr(2, 9);
      setReactions(prev => [...prev, { id, emoji: data.reaction, senderName: data.senderName }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 4000);
    };

    socket.on("user-connected", onUserConnected);
    socket.on("signal", onSignal);
    socket.on("user-disconnected", onUserDisconnected);
    socket.on("reaction", onReaction);

    return () => {
      socket.off("user-connected", onUserConnected);
      socket.off("signal", onSignal);
      socket.off("user-disconnected", onUserDisconnected);
      socket.off("reaction", onReaction);
    };
  }, [socket, callAccepted, idToCall]);

  // Audio/Video toggle effects
  useEffect(() => {
    if (stream && originalVideoTrackRef.current) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = isMicOn;
      
      // Only control the original video track (not screenshare)
      originalVideoTrackRef.current.enabled = isVideoOn;
    }
  }, [isMicOn, isVideoOn, stream]);

  // Handle Screen Sharing
  useEffect(() => {
    if (!stream || !connectionRef.current) return;

    if (isScreenSharing) {
      navigator.mediaDevices.getDisplayMedia({ cursor: "always" } as any).then(screenStream => {
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace track in peer connection
        connectionRef.current.replaceTrack(
          stream.getVideoTracks()[0],
          screenTrack,
          stream
        );

        // Update local video
        if (myVideo.current) {
          myVideo.current.srcObject = new MediaStream([screenTrack, stream.getAudioTracks()[0]]);
        }

        screenTrack.onended = () => {
          onScreenShareStop();
        };
      }).catch(err => {
        console.error("Error accessing display media.", err);
        onScreenShareStop();
      });
    } else {
      // Revert to original video track
      if (originalVideoTrackRef.current) {
        // Find current video track if any and replace back
        const currentVideoTrack = myVideo.current?.srcObject ? (myVideo.current.srcObject as MediaStream).getVideoTracks()[0] : stream.getVideoTracks()[0];
        
        if (currentVideoTrack && currentVideoTrack !== originalVideoTrackRef.current) {
          // It means we were screen sharing
          connectionRef.current.replaceTrack(
            currentVideoTrack,
            originalVideoTrackRef.current,
            stream
          );
          currentVideoTrack.stop(); // Stop the screen sharing track
        }
        
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      }
    }
  }, [isScreenSharing]);

  // Handle auto-calling and auto-answering
  useEffect(() => {
    if (!stream || !socket) return;

    if (idToCall && !callAccepted) {
      console.log("Calling user", idToCall);
      const peer = new Peer({
        initiator: true,
        trickle: true,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on("signal", (data) => {
        socket.emit("signal", {
          to: idToCall,
          signal: data
        });
      });

      peer.on("stream", (currentStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }
      });

      connectionRef.current = peer;
    }

    if (receivingCall && !callAccepted) {
      console.log("Answering call from", caller);
      setCallAccepted(true);
      const peer = new Peer({
        initiator: false,
        trickle: true,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      peer.on("signal", (data) => {
        socket.emit("signal", { to: caller, signal: data });
      });

      peer.on("stream", (currentStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }
      });

      peer.signal(callerSignal);
      connectionRef.current = peer;
    }
  }, [idToCall, receivingCall, stream, socket, callAccepted, caller, callerSignal]);


  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-4">
      
      {/* Remote Video Container - Main Screen */}
      <div className="w-full h-full max-w-6xl max-h-[85vh] relative rounded-2xl overflow-hidden bg-gray-900 shadow-2xl border border-gray-800/60 ring-1 ring-white/5 transition-all">
         {callAccepted && !callEnded ? (
           <video 
              playsInline 
              ref={userVideo} 
              autoPlay 
              className="w-full h-full object-cover" 
           />
         ) : (
           <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-b from-gray-900 to-black p-6 text-center">
             {mediaError ? (
               <>
                 <div className="bg-red-500/10 p-6 rounded-full border border-red-500/30 mb-6">
                   <VideoOff className="h-16 w-16 text-red-500" />
                 </div>
                 <p className="text-xl font-medium text-red-400 mb-2">Device Access Blocked</p>
                 <p className="text-sm text-gray-400 max-w-md">{mediaError}</p>
                 <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-gray-800 text-white rounded outline">Retry</button>
               </>
             ) : (
               <>
                 <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <div className="relative bg-gray-800 p-8 rounded-full border border-gray-700/50">
                      {stream ? <Loader2 className="h-16 w-16 text-primary animate-spin" /> : <User className="h-16 w-16" />}
                    </div>
                 </div>
                 <p className="text-xl font-medium text-gray-300">
                   {stream ? "Waiting for the other person to join..." : "Connecting camera..."}
                 </p>
                 {stream && <p className="text-sm mt-2 text-gray-500">Your connection is active. Waiting for their remote signal.</p>}
               </>
             )}
           </div>
         )}
         
         {/* Name Tag overlay for remote user */}
         {callAccepted && !callEnded && (
           <div className="absolute bottom-6 left-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white font-medium text-sm shadow-xl flex items-center gap-2 transition-all z-10">
             <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
             {participants?.find(p => p.socketId !== socket?.id)?.fullName || "Participant"}
           </div>
         )}

         {/* Reactions Overlay */}
         <div className="absolute inset-x-0 bottom-0 pointer-events-none z-50 overflow-visible h-full">
            {reactions.map((r) => (
              <div 
                key={r.id} 
                className="absolute text-5xl animate-float-up opacity-0"
                style={{
                  left: `${20 + Math.random() * 60}%`, // random position along bottom
                  bottom: '10%'
                }}
              >
                {r.emoji}
                <div className="text-xs bg-black/60 text-white px-2 py-0.5 mt-1 rounded text-center whitespace-nowrap shadow-md">
                   {r.senderName}
                </div>
              </div>
            ))}
         </div>
      </div>

      {/* Local Video - Picture in Picture style */}
      <div className={`absolute transition-all duration-500 rounded-xl overflow-hidden shadow-2xl border-2 border-primary/40 bg-gray-900 ring-4 ring-black/20 ${
          callAccepted && !callEnded 
            ? 'bottom-8 right-8 w-48 sm:w-64 aspect-video hover:scale-105 z-20' 
            : 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 aspect-video invisible opacity-0'
        }`}>
         <div className="relative w-full h-full">
            {!isVideoOn ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 backdrop-blur-md">
                   <div className="bg-gray-700 p-4 rounded-full">
                      <User className="h-8 w-8 text-gray-400" />
                   </div>
                   <div className="absolute bottom-2 left-2 inset-x-0 text-center text-xs font-medium text-white/50">Camera Off</div>
                </div>
             ) : (
                <video 
                  playsInline 
                  muted 
                  ref={myVideo} 
                  autoPlay 
                  className="w-full h-full object-cover transform scale-x-[-1]" 
                />
             )}
             {/* Name tag for local user */}
             <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur drop-shadow">
               You
             </div>
             {!isMicOn && (
               <div className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded text-xs font-bold text-white shadow-md animate-pulse">
                 Muted
               </div>
             )}
         </div>
      </div>
    </div>
  );
}
