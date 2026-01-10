import { ProfileSync } from "@/components/profile-sync"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-100">
      <ProfileSync />
      {children}
    </div>
  )
}

