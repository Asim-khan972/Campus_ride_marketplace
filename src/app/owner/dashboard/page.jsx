"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Car,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  PlusCircle,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfile({ id: userDoc.id, ...userDoc.data() });
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile");
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#8163e9] mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center">
          <AlertCircle className="h-12 w-12 text-[#8163e9] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in as an owner to view your dashboard.
          </p>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-gray-900">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block bg-[#8163e9] text-white px-6 py-2 rounded-lg hover:bg-[#8163e9]/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Dashboard action cards
  const actionCards = [
    {
      title: "My Rides",
      description: "Manage your published rides",
      icon: Car,
      href: "/driver/dashboard",
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Publish Ride",
      description: "Create a new ride listing",
      icon: PlusCircle,
      href: "/publish-ride",
      color: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "My Cars",
      description: "Manage your vehicles",
      icon: Car,
      href: "/my-cars",
      color: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Messages",
      description: "View your conversations",
      icon: MessageSquare,
      href: "/chats",
      color: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Calendar",
      description: "View your upcoming rides",
      icon: Calendar,
      href: "/calendar",
      color: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      title: "Settings",
      description: "Update your preferences",
      icon: Settings,
      href: "/settings",
      color: "bg-gray-100",
      iconColor: "text-gray-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-[#8163e9] rounded-2xl p-6 md:p-8 mb-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome, {profile?.fullName || user.email || "Owner"}
              </h1>
              <p className="text-white/80">
                Manage your rides and track your driver activity
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/publish-ride"
                className="inline-flex items-center bg-white text-[#8163e9] px-4 py-2 rounded-lg hover:bg-white/90 transition-colors font-medium"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Publish New Ride
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Active Rides
              </h3>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">3</p>
            <p className="text-sm text-green-600 flex items-center mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Up 10% from last week</span>
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Total Passengers
              </h3>
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">24</p>
            <p className="text-sm text-green-600 flex items-center mt-2">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Up 24% from last month</span>
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Upcoming Rides
              </h3>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">5</p>
            <p className="text-sm text-gray-500 mt-2">Next ride in 2 days</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Unread Messages
              </h3>
              <div className="bg-yellow-100 p-2 rounded-lg">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">7</p>
            <Link
              href="/chats"
              className="text-sm text-[#8163e9] hover:underline mt-2 inline-block"
            >
              View messages
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {actionCards.map((card) => (
            <Link key={card.title} href={card.href} className="block group">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:border-[#8163e9] hover:shadow-lg transition-all duration-200">
                <div className="flex items-start gap-4">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#8163e9] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-gray-500 text-sm">{card.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Link
              href="/activity"
              className="text-sm text-[#8163e9] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-full">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">New ride published</p>
                <p className="text-sm text-gray-500">New York to Boston</p>
                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  New passenger booking
                </p>
                <p className="text-sm text-gray-500">John D. booked 2 seats</p>
                <p className="text-xs text-gray-400 mt-1">Yesterday</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="bg-purple-100 p-2 rounded-full">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  New message received
                </p>
                <p className="text-sm text-gray-500">From: Sarah M.</p>
                <p className="text-xs text-gray-400 mt-1">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
