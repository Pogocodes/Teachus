import { useEffect, useState, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Monitor, Video, VideoOff, Mic, MicOff, MessageSquare, PenTool, Share2, Smile, Users, Settings, UserPlus, PhoneOff } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/use-socket";
import VideoCall from "@/components/meeting/VideoCall";
import ChatPanel from "@/components/meeting/ChatPanel";
import Whiteboard from "@/components/meeting/Whiteboard";
import { useAuth } from "@/hooks/use-auth";

function PreJoinScreen({ session, sessionId, user, isMicOn, setIsMicOn, isVideoOn, setIsVideoOn, onJoin }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;
    
    const initStream = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(currentStream);
        if (videoRef.current) videoRef.current.srcObject = currentStream;
        
        currentStream.getAudioTracks().forEach(t => t.enabled = isMicOn);
        currentStream.getVideoTracks().forEach(t => t.enabled = isVideoOn);
      } catch (err) {
        console.error("Error accessing media", err);
      }
    };
    
    initStream();
    
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []); // Only run once to get the stream

  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = isMicOn);
      stream.getVideoTracks().forEach(t => t.enabled = isVideoOn);
    }
  }, [stream, isMicOn, isVideoOn]);

  const handleJoin = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    onJoin();
  };

  const courseTitle = session?.course?.title || "1-on-1 Session";

  return (
    <div className="flex h-screen w-full bg-[#0a0f1d] text-white overflow-hidden font-sans">
      {/* Top Header Mock Area */}
      <div className="absolute top-4 left-4 z-50 flex gap-4">
        <div className="bg-[#1c2237] border border-gray-700 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs font-bold tracking-widest text-gray-300">LIVE</span>
          <span className="text-xs font-mono ml-2 border-l border-gray-600 pl-2">00:00</span>
        </div>
        <div className="bg-[#1c2237] border border-gray-700 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-bold text-gray-300">2 Participants</span>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg">
          <i className="fas fa-signal text-orange-400 text-[10px]"></i>
          <span className="text-[10px] font-bold tracking-widest text-orange-400">GOOD CONNECTION</span>
        </div>
      </div>

      <div className="flex w-full h-full relative z-10 p-8 pt-24 pb-20 justify-center">
        <div className="w-full max-w-7xl flex gap-12 items-center">
          
          {/* Left Panel - Join Info */}
          <div className="w-[380px] shrink-0 p-8 rounded-2xl flex flex-col items-center">
            <div className="mb-12 self-start flex gap-3 items-center">
               <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-primary-foreground/20 text-white font-bold text-xl">T</div>
               <span className="text-xl font-bold tracking-tight">TeachUs</span>
            </div>

            <h1 className="text-4xl font-bold mb-4">Join meeting</h1>
            <p className="text-lg font-medium text-gray-300 mb-8 truncate w-full text-center">Teach Us Session {sessionId?.split("-")[0]}</p>

            <div className="space-y-4 w-full">
              <input 
                type="text" 
                readOnly
                value={user?.fullName || "Guest"} 
                className="w-full bg-[#252b41] border border-[#374151] rounded shadow-inner px-4 py-3.5 text-sm text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button 
                onClick={handleJoin}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded py-6 font-bold text-[15px] shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2"
              >
                Join meeting <i className="fas fa-chevron-down text-xs ml-1 opacity-70"></i>
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <Button 
                onClick={() => setIsMicOn(!isMicOn)}
                variant="ghost" 
                size="icon" 
                className={`w-11 h-11 rounded ${!isMicOn ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#252b41] text-gray-300 border border-gray-700 hover:bg-[#343b56]'}`}
              >
                {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {!isMicOn && <div className="absolute w-[2px] h-6 bg-white rotate-45 rounded-sm"></div>}
              </Button>
              <Button 
                onClick={() => setIsVideoOn(!isVideoOn)}
                variant="ghost" 
                size="icon" 
                className={`w-11 h-11 rounded ${!isVideoOn ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#252b41] text-gray-300 border border-gray-700 hover:bg-[#343b56]'}`}
              >
                {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                {!isVideoOn && <div className="absolute w-[2px] h-6 bg-white rotate-45 rounded-sm"></div>}
              </Button>
              <Button variant="ghost" size="icon" className="w-11 h-11 rounded bg-[#252b41] text-gray-300 border border-gray-700 hover:bg-[#343b56]">
                <UserPlus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-11 h-11 rounded bg-[#252b41] text-gray-300 border border-gray-700 hover:bg-[#343b56]">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="destructive" 
                size="icon" 
                className="w-11 h-11 rounded bg-red-600 hover:bg-red-700 ml-1 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Panel - Video Preview */}
          <div className="flex-1 w-full bg-black relative flex items-center justify-center rounded-[32px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-gray-800/80 aspect-video max-h-[70vh]">
             {!isVideoOn ? (
                <div className="w-40 h-40 rounded-full bg-[#1c2237] flex items-center justify-center">
                   <UserPlus className="h-20 w-20 text-gray-500 opacity-50" />
                   {/* Fallback to simple icon since we can't easily draw the jitsi default avatar */}
                   <div className="flex flex-col items-center ml-2 absolute">
                      <div className="w-12 h-12 rounded-full border-2 border-gray-400 mb-2"></div>
                      <div className="w-20 h-8 rounded-full border-2 border-gray-400 rounded-b-none border-b-0"></div>
                   </div>
                </div>
             ) : (
                <video 
                   ref={videoRef} 
                   autoPlay 
                   muted 
                   playsInline 
                   className="w-full h-full object-cover transform scale-x-[-1]" 
                />
             )}
             
             {/* Small preview overlay like Jitsi mock */}
             <div className="absolute bottom-6 right-6 bg-[#161b2c]/90 border border-[#2a3045] rounded-2xl w-48 h-32 flex flex-col items-center justify-center gap-3 shadow-2xl transition-all">
                <Video className="h-7 w-7 text-[#5e81f4]" />
                <span className="text-[10px] font-bold text-[#5e81f4] tracking-[0.15em] uppercase opacity-80">Live view active</span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Bottom control bar (Mock) */}
      <div className="absolute bottom-0 inset-x-0 h-20 bg-[#0f1423] border-t border-[#1a2035] flex items-center justify-center gap-4 z-50">
         <div className="w-12 h-12 rounded-full bg-[#252b41] flex items-center justify-center opacity-70">
           <Mic className="h-5 w-5 text-gray-400" />
         </div>
         <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center opacity-70">
           <VideoOff className="h-5 w-5 text-red-400" />
         </div>
         <div className="w-10 h-10 ml-6 flex items-center justify-center opacity-70">
           <Share2 className="h-5 w-5 text-gray-500" />
         </div>
         <div className="w-10 h-10 flex items-center justify-center opacity-70">
           <i className="fas fa-hand-paper text-gray-500"></i>
         </div>
         <div className="w-10 h-10 flex items-center justify-center opacity-70">
           <Smile className="h-5 w-5 text-gray-500" />
         </div>
         <div className="w-10 h-10 flex items-center justify-center opacity-70">
           <i className="fas fa-th text-gray-500"></i>
         </div>
         <div className="ml-8 px-6 py-3 bg-red-600 rounded-full flex items-center gap-2 opacity-50 cursor-not-allowed">
           <PhoneOff className="h-4 w-4 text-white" />
           <span className="text-sm font-bold text-white">End Call</span>
         </div>
      </div>
    </div>
  );
}

export default function Meeting() {
  const [, params] = useRoute("/meeting/:sessionId");
  const sessionId = params?.sessionId;
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState<"video" | "whiteboard">("video");
  const [showChat, setShowChat] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"chat" | "people">("chat");
  const [participants, setParticipants] = useState<any[]>([]);
  
  const [hasJoined, setHasJoined] = useState(false);
  
  // Audio/Video state for UI toggles
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const sendReaction = (emoji: string) => {
    if (socket && sessionId && user) {
       socket.emit("reaction", { roomId: sessionId, reaction: emoji, senderName: user.fullName });
    }
  };

  // Validate session access
  const { data: session, isLoading, error } = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (isConnected && socket && sessionId && user && hasJoined) {
      socket.emit("join-room", { 
        roomId: sessionId, 
        user: { id: user.id, fullName: user.fullName, role: user.role, avatar: user.avatar } 
      });

      const onParticipants = (p: any[]) => setParticipants(p);
      socket.on("participants-updated", onParticipants);
      
      return () => {
        socket.off("participants-updated", onParticipants);
      }
    }
  }, [isConnected, socket, sessionId, user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-400">Joining session...</p>
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

  if (!hasJoined) {
    return (
      <PreJoinScreen 
        session={session} 
        sessionId={sessionId}
        user={user} 
        isMicOn={isMicOn} 
        setIsMicOn={setIsMicOn} 
        isVideoOn={isVideoOn} 
        setIsVideoOn={setIsVideoOn} 
        onJoin={() => setHasJoined(true)} 
      />
    );
  }

  // Instructor check might need defensive logic depending on how session relation is deeply loaded
  // Fix: Extract instructor from session mapping consistently
  const sessionData = session as any;
  const isTutor = user?.role === 'instructor' || user?.role === 'tutor' || sessionData.tutorId === user?.id;

  return (
    <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden font-sans">
      {/* Main Content Area */}
      <div className={`flex flex-col relative transition-all duration-300 ${showChat ? 'w-full md:w-[calc(100%-320px)]' : 'w-full'}`}>
        
        {/* Top Header overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <h1 className="text-xl font-medium tracking-tight text-white drop-shadow-md">SkillSpark Call</h1>
            <p className="text-sm text-gray-200 mt-1 drop-shadow-sm">
              {isTutor ? `Tutoring session` : `Class session`}
            </p>
          </div>
          <div className="flex gap-2 pointer-events-auto">
             <Button variant={activeTab === 'video' ? 'secondary' : 'outline'} size="sm" onClick={() => setActiveTab('video')} className="bg-black/40 border-gray-600 backdrop-blur-sm">
               <Monitor className="h-4 w-4 mr-2" /> Video
             </Button>
             <Button variant={activeTab === 'whiteboard' ? 'secondary' : 'outline'} size="sm" onClick={() => setActiveTab('whiteboard')} className="bg-black/40 border-gray-600 backdrop-blur-sm">
               <PenTool className="h-4 w-4 mr-2" /> Whiteboard
             </Button>
          </div>
        </div>

        {/* Viewport content */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-[#111]">
          {/* Always render VideoCall so connection persists */}
          <div className={`w-full h-full transition-all duration-500 ease-in-out ${activeTab === 'whiteboard' ? 'absolute top-20 right-6 w-72 h-48 z-40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border border-gray-700 opacity-90 hover:opacity-100 group' : ''}`}>
             <VideoCall 
               socket={socket} 
               roomId={sessionId!} 
               isVideoOn={isVideoOn} 
               isMicOn={isMicOn} 
               isScreenSharing={isScreenSharing}
               onScreenShareStop={() => setIsScreenSharing(false)}
               participants={participants}
             />
             {activeTab === 'whiteboard' && (
               <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-xs text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                 Video Call (Picture-in-Picture)
               </div>
             )}
          </div>
          
          {/* Render Whiteboard conditionally but preserve layout space */}
          <div className={`w-full h-full ${activeTab === 'video' ? 'hidden' : 'block'}`}>
             {activeTab === "whiteboard" && <Whiteboard socket={socket} roomId={sessionId!} />}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="h-24 pb-4 bg-gradient-to-t from-black to-gray-900 border-t border-gray-800 flex items-center justify-between px-6 shrink-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
           <div className="flex items-center gap-4 hidden md:flex">
             <div className="text-sm text-gray-400">
               {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} | {sessionId?.split('-')[0]}
             </div>
             <div className="flex items-center gap-2 bg-gray-800/80 px-4 py-2 border border-gray-700/50 rounded-full text-white tracking-widest font-mono shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-md ml-2 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></span>
               {formatTime(sessionTime)}
             </div>
           </div>
           
           <div className="flex gap-4 items-center">
              <Button 
                variant={isMicOn ? "secondary" : "destructive"} 
                size="icon" 
                className={`h-14 w-14 rounded-full transition-all duration-300 ease-spring hover:scale-105 ${!isMicOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                onClick={() => setIsMicOn(!isMicOn)}
              >
                {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6 text-white" />}
              </Button>
              <Button 
                variant={isVideoOn ? "secondary" : "destructive"} 
                size="icon" 
                className={`h-14 w-14 rounded-full transition-all duration-300 ease-spring hover:scale-105 ${!isVideoOn ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6 text-white" />}
              </Button>
              <Button 
                variant={isScreenSharing ? "secondary" : "ghost"} 
                size="icon" 
                className={`h-14 w-14 rounded-full transition-all duration-300 ${isScreenSharing ? 'bg-blue-500 hover:bg-blue-600 border border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                title="Screen Share"
              >
                <Share2 className="h-6 w-6" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-14 w-14 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all hidden md:flex"
                    title="Send Reaction"
                  >
                    <Smile className="h-6 w-6 text-yellow-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-auto p-2 border-gray-800 bg-gray-900 shadow-xl flex gap-1 rounded-full mb-4">
                  {['👍', '❤️', '😂', '🎉', '🌟'].map(emoji => (
                    <Button key={emoji} variant="ghost" size="icon" className="h-10 w-10 text-2xl hover:bg-gray-800 hover:scale-125 transition-all" onClick={() => sendReaction(emoji)}>
                      {emoji}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
              <Button variant="destructive" className="h-14 rounded-full px-8 font-medium text-base ml-4 bg-red-600 hover:bg-red-700 hover:scale-105 transition-all shadow-lg shadow-red-900/50" onClick={() => window.location.href = '/'}>
                Leave Call
              </Button>
           </div>
           
           <div className="flex gap-2 items-center">
             <Button 
               variant={showChat && sidebarTab === "people" ? "secondary" : "ghost"} 
               size="icon" 
               className={`h-14 w-14 rounded-full transition-all duration-300 ${showChat && sidebarTab === "people" ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30' : 'text-gray-300 hover:bg-gray-800'}`}
               onClick={() => {
                 if (showChat && sidebarTab === "people") setShowChat(false);
                 else { setShowChat(true); setSidebarTab("people"); }
               }}
               title="Show Participants"
             >
               <Users className="h-6 w-6" />
             </Button>
             <Button 
               variant={showChat && sidebarTab === "chat" ? "secondary" : "ghost"} 
               size="icon" 
               className={`h-14 w-14 rounded-full transition-all duration-300 ${showChat && sidebarTab === "chat" ? 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30' : 'text-gray-300 hover:bg-gray-800'}`}
               onClick={() => {
                 if (showChat && sidebarTab === "chat") setShowChat(false);
                 else { setShowChat(true); setSidebarTab("chat"); }
               }}
               title="Show Chat"
             >
               <MessageSquare className="h-6 w-6" />
             </Button>
           </div>
        </div>
      </div>

      {/* Sidebar */}
      {showChat && (
        <div className="w-full md:w-[320px] shrink-0 border-l border-gray-800 bg-gray-900 h-full flex flex-col shadow-2xl z-30 animate-in slide-in-from-right-8 duration-300 ease-out absolute right-0 md:relative">
           <div className="h-16 border-b border-gray-800 flex items-center justify-between px-2 shrink-0 bg-gray-900/90 backdrop-blur">
             <div className="flex gap-1">
               <Button 
                variant={sidebarTab === "chat" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setSidebarTab("chat")}
                className="text-sm rounded-full px-4"
               >
                 Chat
               </Button>
               <Button 
                variant={sidebarTab === "people" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setSidebarTab("people")}
                className="text-sm rounded-full px-4"
               >
                 People ({participants.length})
               </Button>
             </div>
             <Button variant="ghost" size="sm" className="md:hidden text-gray-400" onClick={() => setShowChat(false)}>Close</Button>
           </div>
           
           <div className="flex-1 overflow-hidden">
             {sidebarTab === "chat" ? (
                <ChatPanel socket={socket} roomId={sessionId!} />
             ) : (
                <div className="p-4 space-y-4 overflow-y-auto h-full custom-scrollbar">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">In this meeting</h3>
                  {participants.map(p => (
                    <div key={p.socketId} className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-xl border border-gray-700/50 hover:bg-gray-800 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {p.avatar ? <img src={p.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" /> : p.fullName.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-200 truncate">{p.fullName} {p.userId === user?.id ? "(You)" : ""}</span>
                        <span className="text-xs text-gray-400 capitalize">{p.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
}
