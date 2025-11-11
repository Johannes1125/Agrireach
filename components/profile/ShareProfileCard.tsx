"use client";

import React from "react";
import Image from "next/image";

interface ShareProfileCardProps {
  name: string;
  avatar?: string;
  role?: string;
  location?: string;
  joinDate?: string;
  memberLevel?: string;
}

export default function ShareProfileCard({
  name,
  avatar,
  role,
  location,
  joinDate,
  memberLevel,
}: ShareProfileCardProps) {
  return (
    <div
      id="share-profile-card"
      className="w-full max-w-[680px] rounded-lg overflow-hidden shadow-lg border border-black dark:border-emerald-400 bg-gradient-to-b from-white to-[#f0e6b6] dark:from-slate-900 dark:to-slate-800"
      style={{
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      }}
    >
      <div className="flex items-center gap-6 p-6">
        <div className="flex-none">
          <div className="relative h-20 w-20 rounded-full overflow-hidden bg-transparent ring-2 ring-black-100 dark:ring-emerald-400">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-2xl font-semibold text-white bg-gray-400">
                {(name || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {name}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {memberLevel || role || "Member"}
          </p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
            {location && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Location:</span>
                <span>{location}</span>
              </div>
            )}

            {joinDate && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Joined:</span>
                <span>{joinDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />

      <div className="p-6 bg-[#f7f3e1] dark:bg-slate-950 text-slate-700 dark:text-slate-200">
        <p className="text-sm">
          Share this profile with your network — a trusted member of the
          Agrireach community.
        </p>
      </div>
    </div>
  );
}
