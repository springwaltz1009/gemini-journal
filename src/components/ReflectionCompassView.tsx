import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Lightbulb, 
  CheckCircle, 
  Bookmark, 
  HelpCircle, 
  Loader2, 
  Copy, 
  Check, 
  ArrowRight,
  BookOpen,
  AlertCircle,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { JournalEntry, ReflectionCompassData } from '../types';

interface ReflectionCompassViewProps {
  selectedEntry: JournalEntry | null;
  entries: JournalEntry[];
  onGenerateCompass: (entry: JournalEntry) => Promise<void>;
  isGenerating: boolean;
  onSelectEntry: (entry: JournalEntry) => void;
  compassError?: string | null;
  onClearError?: () => void;
}

export const ReflectionCompassView: React.FC<ReflectionCompassViewProps> = ({
  selectedEntry,
  entries,
  onGenerateCompass,
  isGenerating,
  onSelectEntry,
  compassError,
  onClearError,
}) => {
  const [copied, setCopied] = useState(false);
  const compass: ReflectionCompassData | undefined = selectedEntry?.compass;

  const entriesWithCompass = entries.filter((e) => e.compass);

  const handleCopy = () => {
    if (!compass) return;
    const text = `Reflection Compass for "${selectedEntry?.title || 'Journal Entry'}"
--------------------------------------------------
WHAT I EXPLORED:
${compass.whatExplored}

KEY IDEAS:
${compass.keyIdeas.map((i) => `• ${i}`).join('\n')}

THINGS I MAY WANT TO REVISIT:
${compass.thingsToRevisit.map((r) => `• ${r}`).join('\n')}

POSSIBLE NEXT ACTIONS:
${compass.possibleNextActions.map((a) => `• ${a}`).join('\n')}

ONE REFLECTION QUESTION:
${compass.reflectionQuestion}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div id="reflection-compass-view" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E1DDF0]">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-6 h-6 text-[#6B5B95]" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#27234F]">
              Reflection Compass
            </h1>
          </div>
          <p className="text-sm text-[#6B647A] mt-1">
            Transform a single selected journal entry into structured insights across 5 clear reflection dimensions.
          </p>
        </div>

        {selectedEntry && (
          <div className="flex items-center space-x-3">
            {compass && (
              <button
                id="copy-compass-btn"
                onClick={handleCopy}
                className="px-3 py-2 border border-[#E1DDF0] hover:bg-[#F1EFF8] rounded-lg text-xs font-medium text-[#1F2937] flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#6B5B95]" />
                    <span className="text-[#51467D]">Copied Compass</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#6B647A]" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            )}

            <button
              id="generate-compass-btn"
              onClick={() => {
                if (onClearError) onClearError();
                onGenerateCompass(selectedEntry);
              }}
              disabled={isGenerating || !selectedEntry.content.trim()}
              className="px-4 py-2 bg-[#6B5B95] hover:bg-[#585D4B] text-[#F8F7FC] rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A46D]" />
                  <span>{compass ? 'Re-chart Compass' : 'Generate Reflection'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Non-Clinical / Data Minimization Privacy Badge */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#F5F3FA] border border-[#E1DDF0] rounded-lg px-3.5 py-2.5 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-[#6B5B95] shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B647A] leading-relaxed">
            <strong className="text-[#27234F] font-medium">Data Minimization:</strong> Only the explicitly selected journal entry is analyzed. Your full journal history is never sent to Gemini.
          </p>
        </div>
        <div className="bg-[#F5F3FA] border border-[#E1DDF0] rounded-lg px-3.5 py-2.5 flex items-start space-x-2.5">
          <HelpCircle className="w-4 h-4 text-[#C5A46D] shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B647A] leading-relaxed">
            <strong className="text-[#27234F] font-medium">Non-Clinical Tool:</strong> Reflection Compass synthesizes reflective themes and does not provide medical, clinical, or psychological diagnosis.
          </p>
        </div>
      </div>

      {/* Error Alert Banner */}
      {compassError && (
        <div id="compass-error-banner" className="mt-4 p-4 bg-[#FBEBE8] border border-[#E7C1B9] rounded-xl flex items-start justify-between gap-3">
          <div className="flex items-start space-x-2.5">
            <AlertCircle className="w-5 h-5 text-[#6B5B95] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-[#8C3A1E] uppercase tracking-wider font-mono">Compass Synthesis Notice</h4>
              <p className="text-sm text-[#8C3A1E] mt-0.5">{compassError}</p>
            </div>
          </div>
          {selectedEntry && (
            <button
              id="retry-compass-btn"
              onClick={() => {
                if (onClearError) onClearError();
                onGenerateCompass(selectedEntry);
              }}
              className="px-3 py-1.5 bg-[#8C3A1E] text-white rounded-md text-xs font-medium shrink-0 flex items-center space-x-1 hover:bg-[#722F18] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Explicit Entry Selector */}
      {entries.length > 0 && (
        <div className="mt-6 bg-[#F1EFF8] border border-[#E1DDF0] rounded-xl p-4">
          <label htmlFor="select-entry-dropdown" className="block text-xs font-mono uppercase tracking-wider text-[#6B647A] mb-2 font-semibold">
            Select Journal Entry to Analyze:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              id="select-entry-dropdown"
              value={selectedEntry?.id || ''}
              onChange={(e) => {
                const found = entries.find((item) => item.id === e.target.value);
                if (found) {
                  onSelectEntry(found);
                }
              }}
              className="flex-1 bg-[#FFFFFF] border border-[#E1DDF0] text-[#27234F] rounded-lg px-3 py-2 text-sm focus:outline-hidden focus:ring-1 focus:ring-[#6B5B95] focus:border-[#6B5B95]"
            >
              {entries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title || 'Untitled Entry'} ({new Date(item.createdAt).toLocaleDateString()} — {item.wordCount} words){item.compass ? ' ✓ Compass Charted' : ''}
                </option>
              ))}
            </select>

            <span className="text-xs text-[#6B647A] font-mono shrink-0">
              {entries.length} total saved {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>
      )}

      {/* Main Compass Content */}
      <div className="mt-6 space-y-8">
        {selectedEntry ? (
          <div>
            {/* Active Entry Context Header */}
            <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-lg p-3.5 mb-6 flex items-center justify-between shadow-2xs">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#6B647A]" />
                <span className="text-xs text-[#6B647A] uppercase tracking-wider font-mono">Selected Entry:</span>
                <span className="text-sm font-semibold text-[#27234F]">{selectedEntry.title || 'Untitled Reflection'}</span>
              </div>
              <span className="text-xs text-[#6B647A] font-mono">
                {selectedEntry.wordCount} words
              </span>
            </div>

            {compass ? (
              <div id="compass-cards-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. What I explored */}
                <div className="md:col-span-2 bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl p-6 shadow-xs">
                  <div className="flex items-center space-x-2 text-[#27234F] font-semibold mb-2">
                    <div className="w-7 h-7 rounded-md bg-[#EEEAF8] flex items-center justify-center text-[#51467D]">
                      <Compass className="w-4 h-4 text-[#6B5B95]" />
                    </div>
                    <h2 className="text-base font-serif font-bold">1. What I Explored</h2>
                  </div>
                  <p className="text-sm text-[#1F2937] leading-relaxed pl-9">
                    {compass.whatExplored}
                  </p>
                </div>

                {/* 2. Key ideas */}
                <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl p-6 shadow-xs">
                  <div className="flex items-center space-x-2 text-[#27234F] font-semibold mb-3">
                    <div className="w-7 h-7 rounded-md bg-[#F0EBFA] flex items-center justify-center text-[#C5A46D]">
                      <Lightbulb className="w-4 h-4 text-[#6B5B95]" />
                    </div>
                    <h2 className="text-base font-serif font-bold">2. Key Ideas</h2>
                  </div>
                  <ul className="space-y-2.5 pl-2">
                    {compass.keyIdeas.map((idea, index) => (
                      <li key={index} className="flex items-start text-sm text-[#1F2937]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C5A46D] mt-2 mr-2.5 shrink-0" />
                        <span>{idea}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Things I may want to revisit */}
                <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl p-6 shadow-xs">
                  <div className="flex items-center space-x-2 text-[#27234F] font-semibold mb-3">
                    <div className="w-7 h-7 rounded-md bg-[#EEEAF8] flex items-center justify-center text-[#6B647A]">
                      <Bookmark className="w-4 h-4 text-[#6B647A]" />
                    </div>
                    <h2 className="text-base font-serif font-bold">3. Things I May Want to Revisit</h2>
                  </div>
                  <ul className="space-y-2.5 pl-2">
                    {compass.thingsToRevisit.map((item, index) => (
                      <li key={index} className="flex items-start text-sm text-[#1F2937]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A5A58D] mt-2 mr-2.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Possible next actions */}
                <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl p-6 shadow-xs">
                  <div className="flex items-center space-x-2 text-[#27234F] font-semibold mb-3">
                    <div className="w-7 h-7 rounded-md bg-[#EEEAF8] flex items-center justify-center text-[#51467D]">
                      <CheckCircle className="w-4 h-4 text-[#6B5B95]" />
                    </div>
                    <h2 className="text-base font-serif font-bold">4. Possible Next Actions</h2>
                  </div>
                  <ul className="space-y-2.5 pl-2">
                    {compass.possibleNextActions.map((action, index) => (
                      <li key={index} className="flex items-start text-sm text-[#1F2937]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6B5B95] mt-2 mr-2.5 shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 5. One reflection question */}
                <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl p-6 shadow-xs">
                  <div className="flex items-center space-x-2 text-[#27234F] font-semibold mb-3">
                    <div className="w-7 h-7 rounded-md bg-[#F0EBFA] flex items-center justify-center text-[#6B5B95]">
                      <HelpCircle className="w-4 h-4 text-[#6B5B95]" />
                    </div>
                    <h2 className="text-base font-serif font-bold">5. One Reflection Question</h2>
                  </div>
                  <div className="p-3.5 bg-[#F5F3FA] rounded-lg border border-[#E1DDF0]">
                    <p className="text-sm italic text-[#27234F] font-serif leading-relaxed">
                      &ldquo;{compass.reflectionQuestion}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#FFFFFF] border border-dashed border-[#C9C7EB] rounded-xl p-12 text-center">
                <Compass className="w-12 h-12 text-[#8B83A3] mx-auto mb-4" />
                <h3 className="font-serif text-lg font-bold text-[#27234F] mb-1">
                  No Compass Charted Yet for This Entry
                </h3>
                <p className="text-sm text-[#6B647A] max-w-md mx-auto mb-6">
                  Click the button below to synthesize this selected journal entry into 5 structured dimensions of clarity and action.
                </p>
                <button
                  id="chart-compass-empty-state-btn"
                  onClick={() => {
                    if (onClearError) onClearError();
                    onGenerateCompass(selectedEntry);
                  }}
                  disabled={isGenerating || !selectedEntry.content.trim()}
                  className="px-6 py-2.5 bg-[#6B5B95] hover:bg-[#585D4B] text-[#F8F7FC] rounded-lg text-sm font-medium inline-flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Compass...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#C5A46D]" />
                      <span>Generate Reflection</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl p-8 text-center">
            <Compass className="w-10 h-10 text-[#8B83A3] mx-auto mb-3" />
            <p className="text-[#6B647A] text-sm">Please select or write a journal entry to view or chart its Reflection Compass.</p>
          </div>
        )}

        {/* Historic Compasses Carousel / List */}
        {entriesWithCompass.length > 0 && (
          <div className="pt-8 border-t border-[#E1DDF0]">
            <h3 className="font-serif text-lg font-bold text-[#27234F] mb-4 flex items-center space-x-2">
              <span>Saved Reflection Compasses</span>
              <span className="text-xs font-mono bg-[#F1EFF8] px-2 py-0.5 rounded-full text-[#1F2937] border border-[#E1DDF0]">
                {entriesWithCompass.length}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entriesWithCompass.map((entry) => (
                <div
                  key={entry.id}
                  id={`compass-history-card-${entry.id}`}
                  onClick={() => onSelectEntry(entry)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedEntry?.id === entry.id
                      ? 'border-[#6B5B95] bg-[#EEEAF8]/50 shadow-xs'
                      : 'border-[#E1DDF0] bg-[#FFFFFF] hover:border-[#C9C7EB] hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#6B647A] font-mono mb-2">
                    <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    <span className="text-[#51467D] font-medium flex items-center">
                      Compass <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                  <h4 className="font-serif font-semibold text-[#27234F] text-sm line-clamp-1 mb-1.5">
                    {entry.title || 'Untitled Entry'}
                  </h4>
                  <p className="text-xs text-[#6B647A] line-clamp-2">
                    {entry.compass?.whatExplored}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
