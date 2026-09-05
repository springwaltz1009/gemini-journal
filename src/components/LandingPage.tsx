import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Database, 
  Compass, 
  Lock, 
  ArrowRight,
  BrainCircuit,
  Loader2,
  Check
} from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface LandingPageProps {
  onSignInSuccess?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setErrorMessage(err?.message || 'Authentication was interrupted. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="landing-page" className="min-h-screen bg-[#F8F7FC] text-[#1F2937] flex flex-col justify-between">
      {/* Top Banner */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-16 sm:px-6 lg:px-8 w-full">
        {/* Header Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#F1EFF8] border border-[#E1DDF0] text-[#1F2937] text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>Powered by Gemini 3.6 Flash & Cloud Firestore</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#27234F] leading-[1.15]">
            A private space to reflect, converse, and grow.
          </h1>
          <p className="text-lg sm:text-xl text-[#6B647A] font-sans leading-relaxed max-w-2xl mx-auto">
            Write your thoughts in complete privacy. Explore fresh perspectives and actionable next steps with your Reflection Compass, or talk things through with your Wellbeing Companion whenever you need space to reflect.
          </p>

          {/* Action Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="landing-google-signin-btn"
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#27234F] hover:bg-[#1D193D] text-[#F8F7FC] rounded-lg font-medium text-base shadow-sm transition-all flex items-center justify-center space-x-3 cursor-pointer group disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#C5A46D]" />
                  <span>Connecting Securely...</span>
                </>
              ) : (
                <>
                  {/* Google G Logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div id="signin-error-msg" className="text-sm text-[#B34F6A] bg-[#FFF2F5] border border-[#E6B9C5] rounded-md p-3 max-w-md mx-auto">
              {errorMessage}
            </div>
          )}

          {/* Key Trust Signals */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-[#6B647A] font-mono">
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-[#8B83A3]" />
              <span>Zero passwords stored</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-[#8B83A3]" />
              <span>Isolated Firestore rules</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6B5B95]" />
              <span>Owner-bound data only</span>
            </span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl p-6 shadow-xs hover:border-[#C9C7EB] transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#F0EBFA] text-[#C5A46D] flex items-center justify-center mb-4">
              <BrainCircuit className="w-5 h-5 text-[#6B5B95]" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#27234F] mb-2">
              Multi-Turn Gemini Dialogue
            </h3>
            <p className="text-sm text-[#6B647A] leading-relaxed">
              Explore your thoughts in a deep back-and-forth dialogue. Gemini asks thoughtful questions and offers empathetic reflections without judging.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E1DDF0] flex items-center text-xs text-[#6B647A]">
              <Check className="w-3.5 h-3.5 text-[#6B5B95] mr-1.5" />
              <span>Resilient AI model fallback ladder</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl p-6 shadow-xs hover:border-[#C9C7EB] transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#EEEAF8] text-[#6B5B95] flex items-center justify-center mb-4">
              <Compass className="w-5 h-5 text-[#51467D]" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#27234F] mb-2">
              Reflection Compass
            </h3>
            <p className="text-sm text-[#6B647A] leading-relaxed">
              Transform open-ended journal entries into 5 structured dimensions: core explorations, key ideas, next actions, things to revisit, and a reflection question.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E1DDF0] flex items-center text-xs text-[#6B647A]">
              <Check className="w-3.5 h-3.5 text-[#6B5B95] mr-1.5" />
              <span>Structured JSON output engine</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl p-6 shadow-xs hover:border-[#C9C7EB] transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#F1EFF8] text-[#1F2937] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-[#6B5B95]" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#27234F] mb-2">
              User-Isolated Storage
            </h3>
            <p className="text-sm text-[#6B647A] leading-relaxed">
              Every entry and interaction is stored in Firestore under your authenticated user ID. Strict security rules ensure your private data is visible only to you.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E1DDF0] flex items-center text-xs text-[#6B647A]">
              <Check className="w-3.5 h-3.5 text-[#6B5B95] mr-1.5" />
              <span>Firebase Google Sign-In</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E1DDF0] bg-[#F8F7FC] py-6 text-center text-xs text-[#6B647A] font-mono">
        <p>Gemini Journal & Reflection Companion • Built with Google AI Studio</p>
      </footer>
    </div>
  );
};
