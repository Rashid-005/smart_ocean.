"use client";

import { useEffect, useState } from "react";

type UserProfile = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  island: string;
  language: string;
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      setProfile(data.user ?? null);
    };

    loadProfile();
  }, []);

  const handleUpdate = async () => {
    if (!profile) return;

    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        island: profile.island,
        language: profile.language,
      }),
    });

    const data = await response.json();
    setStatus(response.ok ? "Profile updated" : data.error || "Update failed");
  };

  if (!profile) {
    return <div className="text-blue-900">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-blue-900">Profile</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 text-2xl font-bold">
            {profile.fullName?.slice(0, 2).toUpperCase() ?? "JD"}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.fullName}</h2>
            <p className="text-gray-500">Fisherman • {profile.island}</p>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-gray-100">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>

          {status && <p className="text-sm text-green-700">{status}</p>}

          <button onClick={handleUpdate} className="px-6 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
}
