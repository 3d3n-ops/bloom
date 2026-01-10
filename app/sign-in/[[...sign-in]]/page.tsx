import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-100 flex items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "rounded-2xl shadow-xl",
            headerTitle: "text-2xl font-bold",
            headerSubtitle: "text-gray-500",
            socialButtonsBlockButton: "rounded-xl",
            formButtonPrimary: "bg-pink-500 hover:bg-pink-600 rounded-xl",
            footerActionLink: "text-pink-500 hover:text-pink-600",
          },
          variables: {
            colorPrimary: "#FF79CB",
            borderRadius: "0.75rem",
          },
        }}
        signUpUrl="/sign-up"
        forceRedirectUrl="/app"
      />
    </div>
  )
}

