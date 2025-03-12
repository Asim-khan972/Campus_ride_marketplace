"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Search,
  Plus,
  User2,
  Bell,
  MessageSquare,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch notifications and unread message counts
  useEffect(() => {
    if (!user) return;

    // Listen for notifications
    const notificationsRef = collection(db, "notifications");
    const notificationsQuery = query(
      notificationsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notificationsList = [];
        let unreadCount = 0;

        snapshot.forEach((doc) => {
          const notification = { id: doc.id, ...doc.data() };
          notificationsList.push(notification);
          if (!notification.read) {
            unreadCount++;
          }
        });

        setNotifications(notificationsList);
        setUnreadNotifications(unreadCount);
      }
    );

    const fetchUnreadMessages = async () => {
      try {
        // Get all chats where the user is a participant
        const chatsRef = collection(db, "chats");
        const chatsQuery = query(
          chatsRef,
          where("participants", "array-contains", user.uid)
        );
        const chatsSnapshot = await getDocs(chatsQuery);

        let totalUnread = 0;

        chatsSnapshot.forEach((chatDoc) => {
          const chatData = chatDoc.data();
          // Add unread count for this user from the chat document
          totalUnread += chatData.unreadCount?.[user.uid] || 0;
        });

        setUnreadMessages(totalUnread);
      } catch (error) {
        console.error("Error counting unread messages:", error);
      }
    };

    // Initial fetch
    fetchUnreadMessages();

    // Set up interval to periodically check for unread messages
    const interval = setInterval(fetchUnreadMessages, 30000); // Check every 30 seconds

    return () => {
      unsubscribeNotifications();
      clearInterval(interval);
    };
  }, [user]);

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen) {
      markAllNotificationsAsRead();
    }
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter((n) => !n.read);

      const updatePromises = unreadNotifications.map((notification) =>
        updateDoc(doc(db, "notifications", notification.id), {
          read: true,
          readAt: serverTimestamp(),
        })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Update the handleNotificationClick function to properly handle different notification types
  const handleNotificationClick = async (notification) => {
    try {
      // Mark notification as read
      await updateDoc(doc(db, "notifications", notification.id), {
        read: true,
        readAt: serverTimestamp(),
      });

      // Navigate based on notification type
      if (notification.type === "chat" && notification.chatId) {
        router.push(`/chat/${notification.chatId}`);
      } else if (notification.rideId) {
        if (notification.type === "booking") {
          // For booking notifications, check if user is owner or rider
          if (notification.title.includes("New Booking")) {
            // Owner notification - go to ride details
            router.push(`/my-rides/${notification.rideId}`);
          } else {
            // Rider notification - go to bookings
            router.push(`/bookings`);
          }
        } else {
          // For ride status updates, go to ride details
          router.push(`/rides/${notification.rideId}`);
        }
      } else if (notification.bookingId) {
        router.push(`/bookings`);
      }

      setNotificationsOpen(false);
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  // Format the timestamp to a readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Just now";

    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();

    // If less than a minute ago
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60) {
      return "Just now";
    }

    // If less than an hour ago
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // If this week, show day name
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }

    // Otherwise show date
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={user ? "/home" : "/"}
              className="text-2xl font-bold text-[#8163e9]"
            >
              Campus Rides
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!authLoading && user ? (
              <>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  About
                </Link>

                {/* Messages with badge */}
                <Link
                  href="/owner/chats"
                  className="relative p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <MessageSquare className="h-5 w-5 text-black" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px] h-[18px]">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Notifications with badge */}
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Bell className="h-5 w-5 text-black" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px] h-[18px]">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </button>

                <Link href="/publish-ride">
                  <button className="flex items-center gap-2 bg-[#8163e9] text-white px-4 py-2 rounded-md hover:bg-[#8163e9]/90 transition-colors">
                    <Plus className="h-4 w-4" />
                    Publish a ride
                  </button>
                </Link>
                <Link href="/my-profile">
                  <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                    <User2 className="h-5 w-5 text-black" />
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            {!authLoading && user && (
              <>
                {/* Messages with badge (mobile) */}
                <Link
                  href="/chats"
                  className="relative p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <MessageSquare className="h-5 w-5 text-black" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px] h-[18px]">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Notifications with badge (mobile) */}
                <button
                  onClick={toggleNotifications}
                  className="relative p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Bell className="h-5 w-5 text-black" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px] h-[18px]">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </button>
              </>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-black" />
              ) : (
                <Menu className="h-6 w-6 text-black" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              {!authLoading && user ? (
                <>
                  <Link
                    href="/about"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    About
                  </Link>
                  <Link href="/publish-ride">
                    <button className="flex items-center gap-2 bg-[#8163e9] text-white px-4 py-2 rounded-md hover:bg-[#8163e9]/90 transition-colors w-full justify-center">
                      <Plus className="h-4 w-4" />
                      Publish a ride
                    </button>
                  </Link>
                  <Link href="/my-profile">
                    <button className="flex items-center gap-2 border text-black border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors w-full justify-center">
                      <User2 className="h-4 w-4 text-black" />
                      My Profile
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}

        {/* Notifications dropdown */}
        {notificationsOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto border border-gray-200 sm:right-4">
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-sm font-semibold text-gray-700">
                  Notifications
                </h3>
                {unreadNotifications > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-[#8163e9] hover:underline flex items-center"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        <Bell className="h-5 w-5 text-[#8163e9]" />
                      </div>
                      <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.createdAt
                            ? formatTimestamp(notification.createdAt)
                            : "Just now"}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="ml-3 flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-[#8163e9]"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
