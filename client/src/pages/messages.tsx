import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Message, User } from "@shared/schema";
import { format } from "date-fns";

export default function Messages() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const queryClient = useQueryClient();
  
  // Mock current user - in real app this would come from auth context
  const currentUserId = 1;

  // Get conversations (list of users who have exchanged messages)
  const { data: conversations = [] } = useQuery<Array<{ user: User; lastMessage?: Message; unreadCount: number }>>({
    queryKey: ["/api/messages/conversations", currentUserId],
  });

  // Get messages between current user and selected user
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", currentUserId, selectedUserId],
    enabled: !!selectedUserId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { receiverId: number; content: string }) =>
      apiRequest("/api/messages", "POST", {
        senderId: currentUserId,
        receiverId: data.receiverId,
        content: data.content,
      }),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", currentUserId, selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations", currentUserId] });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedUserId,
      content: newMessage.trim(),
    });
  };

  const selectedUser = conversations.find(conv => conv.user.id === selectedUserId)?.user;

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">Messages</h1>
          <p className="text-xl text-slate-600">Connect with instructors and students</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-slate-600">
                    <i className="fas fa-comments text-4xl mb-4 block"></i>
                    <p>No conversations yet</p>
                    <p className="text-sm">Start a conversation with an instructor!</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.user.id}
                      onClick={() => setSelectedUserId(conv.user.id)}
                      className={`p-4 cursor-pointer hover:bg-slate-50 border-b transition-colors ${
                        selectedUserId === conv.user.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={conv.user.avatar || ""} alt={conv.user.fullName} />
                          <AvatarFallback>
                            {conv.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-800 truncate">
                              {conv.user.fullName}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 capitalize">
                            {conv.user.role}
                          </p>
                          {conv.lastMessage && (
                            <p className="text-xs text-slate-500 truncate mt-1">
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="lg:col-span-2">
            {selectedUserId ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={selectedUser?.avatar || ""} alt={selectedUser?.fullName} />
                      <AvatarFallback>
                        {selectedUser?.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedUser?.fullName}</CardTitle>
                      <p className="text-sm text-slate-600 capitalize">{selectedUser?.role}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-[450px]">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto space-y-4 p-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-slate-600 py-12">
                        <i className="fas fa-paper-plane text-4xl mb-4 block"></i>
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === currentUserId
                                ? "bg-primary text-white"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.senderId === currentUserId ? "text-blue-100" : "text-slate-500"
                              }`}
                            >
                              {message.sentAt ? format(new Date(message.sentAt), "MMM dd, HH:mm") : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="border-t pt-4">
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="bg-primary hover:bg-blue-700"
                      >
                        <i className="fas fa-paper-plane"></i>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-slate-600">
                  <i className="fas fa-comment-dots text-6xl mb-4 block"></i>
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the left to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}