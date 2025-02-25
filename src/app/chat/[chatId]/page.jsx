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
} from "firebase/firestore";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Send, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chatId]);

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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center sticky top-0 z-10">
        <Link
          href="/chats"
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
          <p className="text-sm text-gray-500">Your ride conversation</p>
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
                  msg.senderId === user.uid ? "text-blue-100" : "text-gray-500"
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
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00AFF5] focus:border-transparent text-gray-900 bg-gray-50"
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
