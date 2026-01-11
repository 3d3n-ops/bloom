import { Button } from "@/components/ui/button"
import { DM_Sans } from "next/font/google"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { LandingCards } from "@/components/landing/landing-cards"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
})

export default async function LandingPage() {
  const { userId } = await auth()

  if (userId) {
    redirect("/app")
  }

  return (
    <div className="landing-page">
      {/* Decorative background elements */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />
      
      {/* Hero section */}
      <header className="landing-header">
        <div className="logo-container">
          <img src="/bloom-logo.svg" alt="Bloom" className="logo-flower" />
          <h1 className={`logo-text ${dmSans.className}`}>Bloom</h1>
        </div>
        
        <p className={`tagline ${dmSans.className}`}>
          AI-native notebook for students
        </p>
        
        <div className="cta-container">
          <Link href="/sign-up">
            <Button 
              size="lg" 
              className={`cta-button ${dmSans.className}`}
            >
              Sign-up
            </Button>
          </Link>
          
          <p className={`sign-in-link ${dmSans.className}`}>
            Already have an account?{" "}
            <Link href="/sign-in" className="link">
              Sign in
            </Link>
          </p>
        </div>
      </header>

      {/* Floating note cards */}
      <LandingCards />

      <style>{`
        .landing-page {
          min-height: 100vh;
          background: linear-gradient(
            180deg,
            #fff9fb 0%,
            #ffeef5 35%,
            #ffd6e7 70%,
            #ffc4dd 100%
          );
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 4rem 2rem 0;
          position: relative;
          overflow: hidden;
        }

        /* Animated orbs */
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.6;
          pointer-events: none;
          z-index: 0;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(255, 182, 212, 0.8) 0%, transparent 70%);
          top: -200px;
          left: -100px;
          animation: float-orb 20s ease-in-out infinite;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 121, 203, 0.5) 0%, transparent 70%);
          top: 30%;
          right: -150px;
          animation: float-orb 25s ease-in-out infinite reverse;
        }

        .orb-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%);
          bottom: 10%;
          left: 20%;
          animation: float-orb 18s ease-in-out infinite;
        }

        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        /* Header */
        .landing-header {
          text-align: center;
          z-index: 10;
          position: relative;
        }

        .logo-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .logo-flower {
          width: 4rem;
          height: 4rem;
          animation: gentle-bounce 3s ease-in-out infinite;
          filter: drop-shadow(0 4px 12px rgba(236, 72, 153, 0.3));
        }

        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }

        .logo-text {
          font-size: 4.5rem;
          font-weight: 700;
          color: #3D0026;
          letter-spacing: -0.02em;
        }

        .tagline {
          font-size: 1.375rem;
          font-weight: 500;
          color: #3D0026;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .cta-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .cta-button {
          background: linear-gradient(135deg, #FF79CB 0%, #FF5BBD 100%);
          color: white;
          font-size: 1.125rem;
          font-weight: 600;
          padding: 0.875rem 2.5rem;
          border-radius: 50px;
          border: none;
          box-shadow: 
            0 4px 20px rgba(255, 121, 203, 0.4),
            0 0 0 0 rgba(255, 121, 203, 0.4);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .cta-button:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 
            0 8px 30px rgba(255, 121, 203, 0.5),
            0 0 0 4px rgba(255, 121, 203, 0.15);
        }

        .sign-in-link {
          font-size: 0.9rem;
          color: #6b5058;
        }

        .sign-in-link .link {
          color: #d63384;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .sign-in-link .link:hover {
          color: #ad2970;
          text-decoration: underline;
        }

        /* Cards container */
        .cards-container {
          position: relative;
          width: 100%;
          max-width: 1200px;
          height: 550px;
          margin-top: 3rem;
          z-index: 5;
        }

        /* Mac Note Card Styles */
        .mac-note-card {
          position: absolute;
          width: 340px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          box-shadow: 
            0 25px 60px rgba(61, 0, 38, 0.15),
            0 10px 25px rgba(61, 0, 38, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.8) inset;
          overflow: hidden;
          backdrop-filter: blur(20px);
          transform: translateX(calc(-50% + var(--offset-x))) translateY(100px) rotate(var(--rotation)) scale(0.95);
          opacity: 0;
          transition: 
            transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 0.6s ease-out;
        }

        .mac-note-card.is-visible {
          transform: 
            translateX(calc(-50% + var(--offset-x))) 
            translateY(var(--offset-y)) 
            rotate(var(--rotation)) 
            scale(1);
          opacity: 1;
        }

        .mac-note-card:hover {
          transform: 
            translateX(calc(-50% + var(--offset-x))) 
            translateY(calc(var(--offset-y) - 8px)) 
            rotate(var(--rotation)) 
            scale(1.02);
          box-shadow: 
            0 35px 80px rgba(61, 0, 38, 0.2),
            0 15px 35px rgba(61, 0, 38, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.9) inset;
          z-index: 100 !important;
        }

        /* Mac window header */
        .mac-header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(180deg, #f8f8f8 0%, #e8e8e8 100%);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .traffic-lights {
          display: flex;
          gap: 8px;
        }

        .light {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: inset 0 -1px 2px rgba(0, 0, 0, 0.1);
        }

        .light.red {
          background: linear-gradient(180deg, #ff6058 0%, #e14640 100%);
          border: 1px solid #d94137;
        }

        .light.yellow {
          background: linear-gradient(180deg, #ffbd2e 0%, #dea123 100%);
          border: 1px solid #c79820;
        }

        .light.green {
          background: linear-gradient(180deg, #28c840 0%, #1fb934 100%);
          border: 1px solid #1ca82e;
        }

        .mac-title {
          flex: 1;
          text-align: center;
          font-size: 0.8rem;
          font-weight: 500;
          color: #555;
          margin: 0 12px;
        }

        .header-spacer {
          width: 52px;
        }

        /* Note content area */
        .note-content {
          padding: 20px;
          max-height: 280px;
          overflow: hidden;
          position: relative;
        }

        .note-content::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: linear-gradient(transparent, rgba(255, 255, 255, 0.95));
          pointer-events: none;
        }

        /* Prose preview styles */
        .prose-preview h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.75rem;
        }

        .prose-preview h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .prose-preview p {
          font-size: 0.875rem;
          line-height: 1.6;
          color: #4b5563;
          margin-bottom: 0.75rem;
        }

        .prose-preview ul {
          padding-left: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .prose-preview li {
          font-size: 0.8rem;
          color: #4b5563;
          margin-bottom: 0.35rem;
          line-height: 1.5;
        }

        .prose-preview blockquote {
          border-left: 3px solid #f472b6;
          padding-left: 1rem;
          font-style: italic;
          color: #6b7280;
          font-size: 0.85rem;
          margin: 0.75rem 0;
        }

        .prose-preview strong {
          color: #1f2937;
          font-weight: 600;
        }

        .prose-preview em {
          font-style: italic;
        }

        .prose-preview code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-family: 'SF Mono', Monaco, monospace;
        }

        .prose-preview .math-block {
          background: #fdf4ff;
          padding: 0.75rem;
          border-radius: 8px;
          margin: 0.75rem 0;
          text-align: center;
        }

        .prose-preview .formula-box {
          display: flex;
          justify-content: center;
          gap: 1rem;
          padding: 0.75rem;
          background: #f0fdf4;
          border-radius: 8px;
          margin: 0.75rem 0;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 0.9rem;
          color: #166534;
        }

        /* Highlight colors */
        .highlight-yellow {
          background: linear-gradient(180deg, transparent 60%, #fef08a 60%);
          padding: 0 2px;
        }

        .highlight-pink {
          background: linear-gradient(180deg, transparent 60%, #fbcfe8 60%);
          padding: 0 2px;
        }

        .highlight-green {
          background: linear-gradient(180deg, transparent 60%, #bbf7d0 60%);
          padding: 0 2px;
        }

        .highlight-purple {
          background: linear-gradient(180deg, transparent 60%, #e9d5ff 60%);
          padding: 0 2px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .mac-note-card {
            width: 300px;
          }
          .cards-container {
            height: 480px;
          }
        }

        @media (max-width: 768px) {
          .logo-text {
            font-size: 3.5rem;
          }
          .tagline {
            font-size: 1.125rem;
          }
          .cards-container {
            height: 400px;
            margin-top: 2rem;
          }
          .mac-note-card {
            width: 260px;
          }
          .note-content {
            padding: 14px;
            max-height: 200px;
          }
          .prose-preview h2 {
            font-size: 1rem;
          }
          .prose-preview p,
          .prose-preview li {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}
