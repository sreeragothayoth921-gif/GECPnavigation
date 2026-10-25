"use client";

import dynamic from "next/dynamic";

const AIChatPanel = dynamic(
  () => import("@/components/ai/AIChatPanel").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Loading AI Assistant...</p>
        </div>
      </div>
    ),
  }
);

export default function AIPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <AIChatPanel />
    </div>
  );
}
