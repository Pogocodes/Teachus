import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface Notification {
  id: number;
  type: "booking" | "message" | "course" | "payment";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "booking",
      title: "New Booking Confirmed",
      message: "Your session with Krutika Bhere is confirmed for tomorrow at 2 PM",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 2,
      type: "message",
      title: "New Message",
      message: "Sarthak Avhad sent you a message about the React course",
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: 3,
      type: "course",
      title: "Course Completed",
      message: "Congratulations! You've completed the JavaScript Fundamentals course",
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking": return "fas fa-calendar-check";
      case "message": return "fas fa-envelope";
      case "course": return "fas fa-graduation-cap";
      case "payment": return "fas fa-credit-card";
      default: return "fas fa-bell";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "booking": return "text-blue-600";
      case "message": return "text-green-600";
      case "course": return "text-purple-600";
      case "payment": return "text-orange-600";
      default: return "text-slate-600";
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <i className="fas fa-bell"></i>
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <i className="fas fa-bell-slash text-4xl mb-4 block"></i>
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !notification.isRead ? "bg-blue-50/50 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                          <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${!notification.isRead ? "text-slate-900" : "text-slate-700"}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            {format(notification.createdAt, "MMM dd, HH:mm")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t">
                <Button variant="ghost" size="sm" className="w-full text-center">
                  View all notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}