import { Suspense } from "react";
import Header from "@/components/auth/Header";
import TermsContent from "./TermsContent";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <Suspense fallback={
        <main className="flex-1 flex justify-center items-center px-4 py-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        </main>
      }>
        <TermsContent />
      </Suspense>
    </div>
  );
}