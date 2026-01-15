import { Suspense } from "react";
import SharedHeader from "@/components/SharedHeader";
import LoginPageContent from "@/components/auth/LoginPageContent";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SharedHeader variant="auth" showFeedback={false} />
      
      <Suspense fallback={
        <main className="flex-1 flex justify-center items-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-400 mt-4">Đang tải...</p>
            </div>
          </div>
        </main>
      }>
        <LoginPageContent />
      </Suspense>
    </div>
  );
} 