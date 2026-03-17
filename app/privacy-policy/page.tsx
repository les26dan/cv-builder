import { Suspense } from "react";
import SharedHeader from "@/components/SharedHeader";
import PrivacyContent from "./PrivacyContent";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SharedHeader 
        variant="auth" 
        showBackButton={true}
        backButtonTitle="Quay lại trang trước"
      />
      
      <Suspense fallback={
        <main className="flex-1 flex justify-center items-center px-4 py-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        </main>
      }>
        <PrivacyContent />
      </Suspense>
    </div>
  );
}