import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Monitor, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import Whiteboard from "@/components/meeting/Whiteboard";
import { JitsiMeeting } from "@jitsi/react-sdk";

export default function Meeting() {
  const [, params] = useRoute("/meeting/:sessionId");
  const sessionId = params?.sessionId;
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<"video" | "whiteboard">("video");

  // Validate session access
  const { data: session, isLoading, error } = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-400">Loading session details...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
        <div className="bg-red-500/10 p-6 rounded-2xl max-w-md text-center border border-red-500/20">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-6">Could not join this session. It may have expired or you don't have access.</p>
          <Button onClick={() => window.location.href = '/'}>Return Home</Button>
        </div>
      </div>
    );
  }

  const sessionData = session as any;
  const isTutor = user?.role === 'instructor' || user?.role === 'tutor' || sessionData.tutorId === user?.id;

  // We extract the room name from the meetingLink if it exists, otherwise fallback to sessionId
  let roomName = `TeachUs-Session-${sessionId}`;
  if (sessionData.meetingLink && sessionData.meetingLink.includes('meet.jit.si/')) {
      roomName = sessionData.meetingLink.split('meet.jit.si/')[1];
  }

  return (
    <div className="flex h-screen w-full bg-[#111] text-white overflow-hidden font-sans relative">
      
      {/* Top Overlay Tabs */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-2 z-50 bg-black/60 shadow-xl border border-gray-700 p-2 rounded-full backdrop-blur-md">
         <Button 
            variant={activeTab === 'video' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveTab('video')} 
            className="rounded-full"
         >
           <Monitor className="h-4 w-4 mr-2" /> Video Call
         </Button>
         <Button 
            variant={activeTab === 'whiteboard' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setActiveTab('whiteboard')} 
            className="rounded-full"
         >
           <PenTool className="h-4 w-4 mr-2" /> Whiteboard
         </Button>
         <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => window.location.href = '/'} 
            className="rounded-full ml-4 font-bold tracking-tight"
         >
           Leave Session
         </Button>
      </div>

      {/* Main Content Render */}
      <div className="w-full h-full relative">
         
         {/* Jitsi Layer */}
         <div 
           className={`w-full h-full transition-all duration-500 ${
             activeTab === 'whiteboard' 
               ? 'absolute bottom-6 right-6 w-80 h-48 z-40 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 pointer-events-none' 
               : 'block z-20 absolute inset-0'
           }`}
         >
            <JitsiMeeting
               roomName={roomName}
               configOverwrite={{
                 startWithAudioMuted: false,
                 startWithVideoMuted: false,
                 disableModeratorIndicator: true,
                 enableEmailInStats: false
               }}
               interfaceConfigOverwrite={{
                 DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                 SHOW_PROMOTIONAL_CLOSE_PAGE: false,
               }}
               userInfo={{
                 displayName: user?.fullName || 'Guest User',
                 email: user?.email || ''
               }}
               getIFrameRef={ (iframeRef) => { 
                 iframeRef.style.height = '100%'; 
                 iframeRef.style.width = '100%'; 
               } }
            />
            {activeTab === 'whiteboard' && (
                <div className="absolute inset-0 z-50 pointer-events-none bg-transparent">
                   {/* Prevents click-through on PiP mode */}
                </div>
            )}
         </div>

         {/* Whiteboard Layer */}
         <div className={`w-full h-full absolute top-0 left-0 pt-20 z-10 ${activeTab === 'video' ? 'hidden' : 'block'}`}>
             <Whiteboard socket={socket} roomId={sessionId!} />
         </div>
         
      </div>
    </div>
  );
}
