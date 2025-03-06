"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Send, ChevronLeft, UserCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { sendChatNotification } from "@/utils/action";

export default function ChatPage() {
  const router = useRouter();
  const { chatId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatDetails, setChatDetails] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const processedMessageIds = useRef(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch chat and user details
  useEffect(() => {
    if (!chatId || !user) return;

    const fetchChatAndUserDetails = async () => {
      try {
        // Get chat details
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (!chatDoc.exists()) {
          setError("Chat not found");
          setLoading(false);
          return;
        }

        const chatData = { id: chatDoc.id, ...chatDoc.data() };
        setChatDetails(chatData);

        // Find the other participant
        const otherParticipantId = chatData.participants.find(
          (id) => id !== user.uid
        );
        if (otherParticipantId) {
          // Get other user's details
          const userDoc = await getDoc(doc(db, "users", otherParticipantId));
          if (userDoc.exists()) {
            setOtherUser({ id: userDoc.id, ...userDoc.data() });
          } else {
            setOtherUser({ id: otherParticipantId, fullName: "Unknown User" });
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching chat details:", err);
        setError("Failed to load chat details");
        setLoading(false);
      }
    };

    fetchChatAndUserDetails();
  }, [chatId, user]);

  // Handle sending notification for new messages
  const handleNewMessageNotification = async (message) => {
    if (!message || !otherUser || !user) {
      console.log("Missing required data for notification:", {
        message,
        otherUser,
        user,
      });
      return;
    }

    // Skip if we've already processed this message
    if (processedMessageIds.current.has(message.id)) {
      return;
    }

    // Mark this message as processed
    processedMessageIds.current.add(message.id);

    try {
      console.log("Preparing to send notification for message:", message.text);

      // Only send notification if the message is from the other user
      if (message.senderId !== user.uid) {
        console.log("Sending notification to:", user.email);

        await sendChatNotification({
          to: user.email,
          senderName: otherUser.fullName || "Someone",
          message: message.text,
          chatId: chatId,
        });

        console.log("Notification sent successfully");
      } else {
        console.log("Skipping notification for own message");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  // Fetch messages and handle notifications
  useEffect(() => {
    if (!chatId || !user || !otherUser) return;

    console.log("Setting up message listener");

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];

      // Process new messages
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const msgData = { id: change.doc.id, ...change.doc.data() };

          // Check if this is a new message not sent by the current user
          if (
            msgData.senderId !== user.uid &&
            msgData.createdAt &&
            Date.now() - msgData.createdAt.toMillis() < 30000 && // Increased time window to 30 seconds
            !processedMessageIds.current.has(msgData.id)
          ) {
            console.log("New message detected:", msgData.text);
            // Process notification in the next tick to ensure we have the full message data
            setTimeout(() => handleNewMessageNotification(msgData), 0);
          }
        }
      });

      // Update messages state
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => {
      console.log("Cleaning up message listener");
      unsubscribe();
    };
  }, [chatId, user, otherUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    try {
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8163e9]" />
        <p className="text-gray-600 mt-2">Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/chats")}
            className="inline-flex items-center text-[#8163e9] hover:underline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          {/* Profile Picture */}
          {otherUser?.profilePicURL ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={otherUser.profilePicURL || "/placeholder.svg"}
                alt={otherUser.fullName || "User"}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-gray-400" />
            </div>
          )}
          {/* User Details */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {otherUser?.fullName || "Unknown User"}
            </h1>
            <p className="text-sm text-gray-500">
              {otherUser?.email || `ID: ${otherUser?.id.slice(0, 8)}...`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.senderId === user.uid ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] md:max-w-[60%] ${
                msg.senderId === user.uid
                  ? "bg-[#8163e9] text-white"
                  : "bg-white text-gray-900"
              } rounded-2xl px-4 py-2 shadow-sm`}
            >
              <p className="break-words">{msg.text}</p>
              <span
                className={`text-xs ${
                  msg.senderId === user.uid ? "text-white/70" : "text-gray-500"
                } block mt-1`}
              >
                {formatTime(msg.createdAt)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none   focus:ring-[#8163e9] focus:border-transparent text-gray-900 bg-gray-50"
            required
          />
          <button
            type="submit"
            className="bg-[#8163e9] hover:bg-[#8163e9]/90 text-white p-3 rounded-full transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
