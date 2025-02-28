"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import Image from "next/image";

export default function OwnerChatInbox() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        // Fetch all chats
        const fetchedChats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch user details for all participants
        const chatsWithUsers = await Promise.all(
          fetchedChats.map(async (chat) => {
            const userDetails = await Promise.all(
              chat.participants.map(async (participantId) => {
                const userDoc = await getDoc(doc(db, "users", participantId));
                if (userDoc.exists()) {
                  return {
                    id: userDoc.id,
                    ...userDoc.data(),
                  };
                }
                return {
                  id: participantId,
                  fullName: "Unknown User",
                };
              })
            );

            // Find the other user in the chat (not the current user)
            const otherUser =
              userDetails.find((u) => u.id !== user.uid) || null;

            return {
              ...chat,
              userDetails,
              otherUser,
            };
          })
        );

        setChats(chatsWithUsers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-black">
            Authentication Required
          </h2>
          <p className="text-black mb-4">Please log in to view your chats.</p>
          <Link
            href="/login"
            className="inline-block bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8163e9] mx-auto mb-4" />
          <p className="text-black">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              Your Chats
            </h1>
            <p className="text-gray-500 mt-1">
              {chats.length}{" "}
              {chats.length === 1 ? "conversation" : "conversations"}
            </p>
          </div>
        </div>

        {/* Chat List */}
        {chats.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              No Conversations Yet
            </h3>
            <p className="text-gray-500">
              When you start chatting with other users, your conversations will
              appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <Link key={chat.id} href={`/chat/${chat.id}`} className="block">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {chat.otherUser?.profilePicURL ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={chat.otherUser.profilePicURL}
                            alt={chat.otherUser.fullName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserCircle className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Chat Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-black truncate">
                            {chat.otherUser?.fullName || "Unknown User"}
                          </span>
                          {chat.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[#8163e9] rounded-full">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {chat.updatedAt
                            ? new Date(
                                chat.updatedAt.seconds * 1000
                              ).toLocaleDateString()
                            : "No messages yet"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage || "No messages yet"}
                        </p>
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
