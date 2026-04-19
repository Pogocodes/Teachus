import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Monitor, PenTool, Circle, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import Whiteboard from "@/components/meeting/Whiteboard";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useToast } from "@/hooks/use-toast";

export default function Meeting() {
  const [, params] = useRoute("/meeting/:sessionId");
  const sessionId = params?.sessionId;
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"video" | "whiteboard">("video");

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const recordingIdRef = useRef<number | null>(null);
  const hasAutoStarted = useRef(false);

  // Issue reporting state
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // Validate session access
  const { data: session, isLoading, error } = useQuery({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  const sessionData = session as any;
  const isTutor = !!(sessionData && user && (user.role === "instructor" || sessionData.instructor?.userId === user.id));

  // Join socket room to properly receive tracking events
  useEffect(() => {
    if (!socket || !sessionId || !user) return;
    socket.emit("join-room", sessionId, {
      userId: user.id,
      fullName: user.fullName,
      role: user.role,
      avatar: user.avatar
    });
  }, [socket, sessionId, user]);

  // Socket listeners for recording status (student receives broadcast)
  useEffect(() => {
    if (!socket || !sessionId) return;

    const onRecordingStarted = () => {
      if (!isTutor) setIsRecording(true);
    };
    const onRecordingStopped = () => {
      if (!isTutor) setIsRecording(false);
    };

    socket.on("recording-started", onRecordingStarted);
    socket.on("recording-stopped", onRecordingStopped);

    return () => {
      socket.off("recording-started", onRecordingStarted);
      socket.off("recording-stopped", onRecordingStopped);
    };
  }, [socket, sessionId, isTutor]);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!sessionData || !isTutor) return;

    let displayStream: MediaStream | null = null;
    let micStream: MediaStream | null = null;

    try {
      setRecordingError(null);

      // 1. Capture screen
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });

      // 2. Try microphone (optional)
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        // Mic unavailable, proceed without
      }

      // 3. Create recording metadata first
      const metaRes = await fetch("/api/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          tutorId: sessionData.tutorId,
          studentId: sessionData.studentId,
          bookingId: sessionData.bookingId,
        }),
      });

      if (!metaRes.ok) throw new Error("Failed to create recording metadata");

      const metaData = await metaRes.json();
      setRecordingId(metaData.id);
      recordingIdRef.current = metaData.id;

      // 4. Combine streams and start recorder
      const tracks = [...displayStream.getTracks()];
      if (micStream) tracks.push(...micStream.getAudioTracks());
      const combinedStream = new MediaStream(tracks);
      streamRef.current = combinedStream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
        const rid = recordingIdRef.current;

        if (rid && blob.size > 0) {
          setIsUploading(true);
          try {
            const formData = new FormData();
            formData.append("recording", blob, `recording-${sessionId}.webm`);
            formData.append("duration", duration.toString());
            await fetch(`/api/recordings/${rid}/upload`, { method: "POST", body: formData });
            toast({ title: "Recording saved ✅", description: "Session recording has been uploaded successfully." });
          } catch {
            toast({ title: "Upload failed", description: "Could not save recording.", variant: "destructive" });
          } finally {
            setIsUploading(false);
          }
        }

        combinedStream.getTracks().forEach((t) => t.stop());
        socket?.emit("recording-stopped", { roomId: sessionId });
        setIsRecording(false);
      };

      recorder.onerror = () => {
        setRecordingError("Recording failed unexpectedly");
        setIsRecording(false);
        socket?.emit("recording-stopped", { roomId: sessionId });
      };

      // Handle user stopping screen share via browser controls
      displayStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== "inactive") recorder.stop();
      };

      // Start
      recorder.start(1000);
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
      socket?.emit("recording-started", { roomId: sessionId });
      toast({ title: "Recording started 🔴", description: "Session is now being recorded." });
    } catch (err: any) {
      // Cleanup acquired streams on failure
      if (displayStream) displayStream.getTracks().forEach((t) => t.stop());
      if (micStream) micStream.getTracks().forEach((t) => t.stop());

      if (err.name === "NotAllowedError") {
        setRecordingError("Screen sharing permission denied");
        toast({ title: "Recording denied", description: "Screen sharing permission was denied. You can start manually.", variant: "destructive" });
      } else {
        setRecordingError(err.message || "Failed to start recording");
        toast({ title: "Recording failed", description: "Failed to start screen recording.", variant: "destructive" });
      }
    }
  }, [sessionData, isTutor, sessionId, socket, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Auto-start recording for tutors (with 2s delay to let UI settle)
  useEffect(() => {
    if (isTutor && sessionData && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      const timer = setTimeout(() => startRecording(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isTutor, sessionData, startRecording]);

  // Issue submission
  const submitIssue = async () => {
    if (!issueType || !issueDescription.trim()) return;
    setIsSubmittingIssue(true);
    try {
      await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          issueType,
          description: issueDescription.trim(),
        }),
      });
      toast({ title: "Issue reported ✅", description: "Your issue has been submitted. We'll look into it." });
      setShowIssueDialog(false);
      setIssueType("");
      setIssueDescription("");
    } catch {
      toast({ title: "Report failed", description: "Could not submit your issue. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-400">Loading session details...</p>
      </div>
    );
  }

  // Error / access denied
  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
        <div className="bg-red-500/10 p-6 rounded-2xl max-w-md text-center border border-red-500/20">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
          <p className="text-gray-300 mb-6">Could not join this session. It may have expired or you don't have access.</p>
          <Button onClick={() => (window.location.href = "/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  let roomName = `TeachUs-Session-${sessionId}`;
  if (sessionData.meetingLink && sessionData.meetingLink.includes("meet.jit.si/")) {
    roomName = sessionData.meetingLink.split("meet.jit.si/")[1];
  }

  return (
    <div className="flex h-screen w-full bg-[#111] text-white overflow-hidden font-sans relative">
      {/* ── Top Overlay Bar ── */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-2 z-50 bg-black/60 shadow-xl border border-gray-700 p-2 rounded-full backdrop-blur-md">
        {/* Recording Indicator */}
        {isRecording && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full mr-1 animate-pulse">
            <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">REC</span>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full mr-1">
            <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
            <span className="text-xs font-semibold text-blue-400">Saving...</span>
          </div>
        )}

        <Button variant={activeTab === "video" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTab("video")} className="rounded-full">
          <Monitor className="h-4 w-4 mr-2" /> Video Call
        </Button>
        <Button variant={activeTab === "whiteboard" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTab("whiteboard")} className="rounded-full">
          <PenTool className="h-4 w-4 mr-2" /> Whiteboard
        </Button>

        {/* Tutor Recording Controls */}
        {isTutor &&
          (isRecording ? (
            <Button variant="outline" size="sm" onClick={stopRecording} className="rounded-full border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300">
              <Circle className="h-3 w-3 fill-red-500 text-red-500 mr-1.5" /> Stop Rec
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={startRecording} className="rounded-full border-gray-600 text-gray-300 hover:bg-gray-700">
              <Circle className="h-3 w-3 mr-1.5" /> Start Rec
            </Button>
          ))}

        {/* Report Issue */}
        <Button variant="ghost" size="sm" onClick={() => setShowIssueDialog(true)} className="rounded-full text-yellow-400 hover:bg-yellow-500/20" title="Report an issue">
          <AlertTriangle className="h-4 w-4" />
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            stopRecording();
            window.location.href = "/";
          }}
          className="rounded-full ml-2 font-bold tracking-tight"
        >
          Leave Session
        </Button>
      </div>

      {/* Recording Error Banner (tutor only) */}
      {recordingError && isTutor && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2 backdrop-blur-md">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{recordingError}</span>
          <Button variant="ghost" size="sm" onClick={startRecording} className="text-yellow-200 hover:text-white ml-2 h-7 px-2">
            Retry
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRecordingError(null)} className="text-yellow-200 hover:text-white h-7 px-1">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* ── Issue Report Dialog ── */}
      {showIssueDialog && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Report an Issue</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowIssueDialog(false)} className="text-gray-400 hover:text-white h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Issue Type</label>
                <select
                  id="issue-type-select"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary"
                >
                  <option value="">Select issue type...</option>
                  <option value="tutor_absent">Tutor Absent</option>
                  <option value="technical_issue">Technical Issue</option>
                  <option value="misconduct">Misconduct</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                <textarea
                  id="issue-description"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 border-gray-600 text-gray-300" onClick={() => setShowIssueDialog(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" disabled={!issueType || !issueDescription.trim() || isSubmittingIssue} onClick={submitIssue}>
                  {isSubmittingIssue ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="w-full h-full relative">
        {/* Jitsi Layer */}
        <div
          className={`w-full h-full transition-all duration-500 ${
            activeTab === "whiteboard"
              ? "absolute bottom-6 right-6 w-80 h-48 z-40 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 pointer-events-none"
              : "block z-20 absolute inset-0"
          }`}
        >
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              disableModeratorIndicator: true,
              prejoinPageEnabled: false,
              enableEmailInStats: false,
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
              SHOW_PROMOTIONAL_CLOSE_PAGE: false,
            }}
            userInfo={{
              displayName: user?.fullName || "Guest User",
              email: user?.email || "",
            }}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = "100%";
              iframeRef.style.width = "100%";
            }}
          />
          {activeTab === "whiteboard" && <div className="absolute inset-0 z-50 pointer-events-none bg-transparent" />}
        </div>

        {/* Whiteboard Layer */}
        <div className={`w-full h-full absolute top-0 left-0 pt-20 z-10 ${activeTab === "video" ? "hidden" : "block"}`}>
          <Whiteboard socket={socket} roomId={sessionId!} />
        </div>
      </div>
    </div>
  );
}
