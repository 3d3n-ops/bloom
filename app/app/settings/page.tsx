"use client"

import { Sidebar } from "@/components/sidebar"

export default function SettingsPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Settings</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-600">Settings coming soon...</p>
          </div>
        </main>
      </div>
    </div>
  )
}

