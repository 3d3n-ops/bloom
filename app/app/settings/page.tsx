"use client"

import { Sidebar } from "@/components/sidebar"
import { useTheme, themeConfig, ThemeMode } from "@/contexts/theme-context"
import { Check, Sparkles, Crown, Zap, Star, ArrowRight } from "lucide-react"
import { useState } from "react"

function ThemeCard({ 
  mode, 
  isSelected, 
  onClick 
}: { 
  mode: ThemeMode
  isSelected: boolean
  onClick: () => void 
}) {
  const config = themeConfig[mode]
  
  return (
    <button
      onClick={onClick}
      className={`
        relative group p-4 rounded-2xl border-2 transition-all duration-300
        ${isSelected 
          ? "border-pink-400 ring-2 ring-pink-200 shadow-lg shadow-pink-100" 
          : "border-gray-200 hover:border-pink-300 hover:shadow-md"
        }
        ${mode === "dark" ? "bg-gray-900" : "bg-white"}
      `}
    >
      {/* Preview Gradient */}
      <div 
        className="w-full h-24 rounded-xl mb-3 overflow-hidden relative"
        style={{ background: config.previewGradient }}
      >
        {/* Mini UI Preview */}
        <div className="absolute inset-2 flex gap-2">
          <div 
            className={`w-8 h-full rounded-lg ${mode === "dark" ? "bg-gray-800/80" : "bg-white/60"}`}
          />
          <div className="flex-1 flex flex-col gap-1.5 p-2">
            <div 
              className={`h-2 w-3/4 rounded-full ${mode === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
            />
            <div 
              className={`h-2 w-1/2 rounded-full ${mode === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
            />
            <div className="flex-1" />
            <div 
              className={`h-6 w-full rounded-lg ${mode === "dark" ? "bg-pink-900/40" : "bg-pink-100"}`}
            />
          </div>
        </div>
      </div>
      
      {/* Theme Info */}
      <div className="text-left">
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold ${mode === "dark" ? "text-white" : "text-gray-900"}`}>
            {config.name}
          </h3>
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <p className={`text-sm mt-1 ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>
          {config.description}
        </p>
      </div>
      
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 animate-pulse" />
      )}
    </button>
  )
}

function SubscriptionCard() {
  const [isHovered, setIsHovered] = useState(false)
  
  const features = [
    { icon: Zap, text: "Unlimited AI transcriptions" },
    { icon: Star, text: "Advanced study tools" },
    { icon: Sparkles, text: "Priority support" },
  ]
  
  const handleUpgrade = () => {
    // TODO: Integrate with Stripe checkout
    window.open("https://buy.stripe.com/test", "_blank")
  }
  
  return (
    <div 
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-[2px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated border gradient */}
      <div className={`
        absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 
        transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-0"}
      `} />
      
      <div className="relative bg-white rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-6 h-6 text-amber-500" />
              <span className="text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                Bloom Plus
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Unlock the full potential of your learning
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">$9.99</div>
            <div className="text-xs text-gray-500">per month</div>
          </div>
        </div>
        
        {/* Features */}
        <div className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <feature.icon className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-gray-700 text-sm font-medium">{feature.text}</span>
            </div>
          ))}
        </div>
        
        {/* CTA Button */}
        <button
          onClick={handleUpgrade}
          className="
            w-full py-3 px-4 rounded-xl font-semibold text-white
            bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500
            hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600
            transition-all duration-300 shadow-lg shadow-purple-200
            hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5
            flex items-center justify-center gap-2 group
          "
        >
          Upgrade to Plus
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
        
        {/* Current Plan Badge */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <span className="text-xs text-gray-400">
            Currently on <span className="font-medium text-gray-600">Free Plan</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-8">
          <h1 className={`text-4xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Settings
          </h1>
          <p className={`mb-8 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Customize your Bloom experience
          </p>
          
          {/* Appearance Section */}
          <section className="mb-12">
            <h2 className={`text-xl font-semibold mb-4 ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
              Appearance
            </h2>
            <div className={`
              rounded-2xl border p-6
              ${theme === "dark" 
                ? "bg-gray-800/50 border-gray-700" 
                : "bg-white border-gray-200"
              }
            `}>
              <div className="mb-4">
                <h3 className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                  Background Theme
                </h3>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  Choose a background style that suits you
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(themeConfig) as ThemeMode[]).map((mode) => (
                  <ThemeCard
                    key={mode}
                    mode={mode}
                    isSelected={theme === mode}
                    onClick={() => setTheme(mode)}
                  />
                ))}
              </div>
            </div>
          </section>
          
          {/* Subscription Section */}
          <section className="mb-12">
            <h2 className={`text-xl font-semibold mb-4 ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
              Subscription
            </h2>
            <div className="max-w-md">
              <SubscriptionCard />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
