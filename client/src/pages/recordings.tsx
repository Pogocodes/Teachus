import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Video, Download, Clock, Calendar, AlertCircle, Play, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Recordings() {
  const { user } = useAuth();
  const [playingId, setPlayingId] = useState<number | null>(null);

  const { data: recordings = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/recordings/my"],
    enabled: !!user,
  });

  if (!user) return null;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    recording: { label: "Recording", className: "bg-red-100 text-red-700 border-red-200" },
    completed: { label: "Processing", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    uploaded: { label: "Available", className: "bg-green-100 text-green-700 border-green-200" },
    failed: { label: "Failed", className: "bg-gray-100 text-gray-600 border-gray-200" },
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={user.role === "instructor" ? "/instructor/dashboard" : "/student/dashboard"}>
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-800">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Video className="h-8 w-8 text-primary" />
            Session Recordings
          </h1>
          <p className="text-slate-600 mt-2">View and play back your past tutoring session recordings.</p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-slate-600">Loading recordings...</p>
          </div>
        ) : recordings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Video className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No recordings yet</h3>
              <p className="text-slate-600">Session recordings will appear here after your tutoring sessions.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recordings.map((recording: any) => {
              const status = statusConfig[recording.status] || statusConfig.completed;

              return (
                <Card key={recording.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    {/* Inline Video Player */}
                    {playingId === recording.id && recording.status === "uploaded" && (
                      <div className="bg-black">
                        <video
                          controls
                          autoPlay
                          className="w-full max-h-[500px]"
                          src={`/api/recordings/${recording.id}/file`}
                          onError={() => setPlayingId(null)}
                        />
                      </div>
                    )}

                    {/* Recording Info Row */}
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Video className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            Session Recording #{recording.id}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {recording.startedAt
                                ? new Date(recording.startedAt).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDuration(recording.duration)}
                            </span>
                            {recording.fileSize && (
                              <span className="text-slate-400">{formatFileSize(recording.fileSize)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>

                        {recording.status === "uploaded" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={playingId === recording.id ? "secondary" : "default"}
                              onClick={() => setPlayingId(playingId === recording.id ? null : recording.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              {playingId === recording.id ? "Close" : "Play"}
                            </Button>
                            <a href={`/api/recordings/${recording.id}/file`} download>
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        )}

                        {recording.status === "failed" && (
                          <span className="flex items-center gap-1 text-sm text-red-500">
                            <AlertCircle className="h-4 w-4" />
                            {recording.errorMessage || "Recording failed"}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
