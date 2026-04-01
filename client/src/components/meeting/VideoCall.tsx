import { JitsiMeeting } from '@jitsi/react-sdk';
import { Socket } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";

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
  const { user } = useAuth();
  
  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-0 m-0 bg-black rounded-lg">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={`TeachUs_Session_${roomId}`}
        configOverwrite={{
          startWithAudioMuted: !isMicOn,
          startWithVideoMuted: !isVideoOn,
          disableModeratorIndicator: true,
          prejoinPageEnabled: false,
          enableEmailInStats: false
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
        }}
        userInfo={{
          displayName: user?.fullName || "Guest"
        }}
        onApiReady={(externalApi) => {
          // Jitsi API is ready
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
          iframeRef.style.borderRadius = '0.5rem';
        }}
      />
    </div>
  );
}
