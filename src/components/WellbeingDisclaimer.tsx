import React, { useState } from 'react';
import { ShieldCheck, HeartHandshake, PhoneCall, ChevronDown, ChevronUp } from 'lucide-react';

export const WellbeingDisclaimer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      id="wellbeing-safety-banner"
      className="bg-[#F5F2EA] border-b border-[#E5E0D5] text-[#4A433F] text-xs px-4 py-2.5 transition-all"
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <HeartHandshake className="w-4 h-4 text-[#6B705C] shrink-0" />
          <span className="font-medium text-[#3D3631]">
            Reflection & Wellbeing Companion
          </span>
          <span className="text-[#7A726D] hidden sm:inline">
            — Designed for self-reflection and personal insight, not clinical diagnosis or medical therapy.
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            id="toggle-safety-guidelines-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#6B705C] hover:text-[#3F4739] font-medium flex items-center space-x-1 underline cursor-pointer"
          >
            <span>{isExpanded ? 'Hide Resources' : 'Crisis Support & Safety Info'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div 
          id="wellbeing-expanded-resources" 
          className="max-w-6xl mx-auto mt-2 pt-2 border-t border-[#E5E0D5] grid grid-cols-1 md:grid-cols-2 gap-3 text-[#4A433F]"
        >
          <div className="space-y-1">
            <p className="font-semibold text-[#3D3631] flex items-center space-x-1">
              <PhoneCall className="w-3.5 h-3.5 text-[#C85A54]" />
              <span>Immediate Support & Safety Resources</span>
            </p>
            <p className="text-[#7A726D]">If you or someone you know is in immediate crisis or emotional distress:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[#4A433F]">
              <li><strong>Local Emergency Services:</strong> Contact local emergency responders in your area or reach out to a trusted person.</li>
              <li><strong>Global Crisis Directory:</strong> Find verified, free crisis support services in your country at <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="text-[#6B705C] underline font-medium">findahelpline.com</a> or <a href="https://befrienders.org" target="_blank" rel="noreferrer" className="text-[#6B705C] underline font-medium">befrienders.org</a>.</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-[#3D3631] flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6B705C]" />
              <span>Safety & Privacy Commitment</span>
            </p>
            <p className="text-[#7A726D]">Your journal entries and reflections are strictly confidential and isolated to your authenticated account in Cloud Firestore. We never sell your data or share your reflections.</p>
          </div>
        </div>
      )}
    </div>
  );
};
