import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Tag, 
  Save, 
  Compass, 
  Smile, 
  Loader2, 
  X, 
  AlertCircle,
  Maximize2,
  Minimize2,
  Plus,
  HeartHandshake,
  BookOpen
} from 'lucide-react';
import { JournalEntry, MoodType, LocationTag } from '../types';

interface JournalEditorProps {
  entry: JournalEntry;
  isExistingSavedEntry: boolean;
  onUpdateEntry: (updated: Partial<JournalEntry>) => void;
  onSave: () => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onNavigateToCompass: () => void;
  onNavigateToCompanion: () => void;
  saveErrorMessage?: string | null;
  onNewEntry: () => void;
}

const MOODS: { id: MoodType; label: string; icon: string }[] = [
  { id: 'peaceful', label: 'Peaceful', icon: '🌿' },
  { id: 'thoughtful', label: 'Thoughtful', icon: '🤔' },
  { id: 'grateful', label: 'Grateful', icon: '🙏' },
  { id: 'energized', label: 'Energized', icon: '⚡' },
  { id: 'anxious', label: 'Anxious', icon: '🌊' },
  { id: 'neutral', label: 'Neutral', icon: '☕' },
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  isExistingSavedEntry,
  onUpdateEntry,
  onSave,
  saveStatus,
  onNavigateToCompass,
  onNavigateToCompanion,
  saveErrorMessage,
  onNewEntry,
}) => {
  const [tagInput, setTagInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Reset local temporary input states whenever switching entries or starting a fresh draft
  useEffect(() => {
    setTagInput('');
    setLocationInput('');
    setShowLocationDialog(false);
    setLocationError(null);
    setIsLocating(false);
  }, [entry.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateEntry({ title: e.target.value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    onUpdateEntry({ content: text, wordCount: words });
  };

  const handleMoodSelect = (mood: MoodType) => {
    onUpdateEntry({ mood: entry.mood === mood ? undefined : mood });
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (cleanTag && !entry.tags.includes(cleanTag)) {
      onUpdateEntry({ tags: [...entry.tags, cleanTag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateEntry({ tags: entry.tags.filter((t) => t !== tagToRemove) });
  };

  const handleSetLocationLabel = () => {
    if (locationInput.trim()) {
      onUpdateEntry({ location: { label: locationInput.trim() } });
      setShowLocationDialog(false);
      setLocationInput('');
      setLocationError(null);
    }
  };

  const handleFetchCurrentLocation = () => {
    setLocationError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    try {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsLocating(false);
          setLocationError(null);
          // Human-readable generic place label without displaying or logging raw coordinates
          onUpdateEntry({ location: { label: 'Current Location' } });
          setShowLocationDialog(false);
          setLocationInput('');
        },
        (err) => {
          setIsLocating(false);
          let message = 'Could not retrieve GPS location. Please enter a place name manually.';
          if (err.code === 1) {
            message = 'Location permission was denied. You can enter a place name manually above.';
          } else if (err.code === 2) {
            message = 'GPS location is currently unavailable. You can enter a place name manually above.';
          } else if (err.code === 3) {
            message = 'Location request timed out. Please try again or type a place name above.';
          }
          setLocationError(message);
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    } catch {
      setIsLocating(false);
      setLocationError('Location access is restricted. You can enter a place name manually above.');
    }
  };

  const handleRemoveLocation = () => {
    onUpdateEntry({ location: undefined });
  };

  return (
    <div 
      id="journal-editor-container" 
      className={`mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 transition-all duration-300 ${
        isFocusMode ? 'max-w-3xl' : 'max-w-4xl'
      }`}
    >
      {/* Top Action Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E1DDF0]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#F5F3FA] text-[#27234F] flex items-center justify-center border border-[#E1DDF0]">
            <BookOpen className="w-4 h-4 text-[#6B5B95]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#6B647A] block">
                Journal Canvas
              </span>
              {isExistingSavedEntry ? (
                <span className="px-2 py-0.2 text-[10px] font-mono bg-[#EEEAF8] text-[#51467D] rounded border border-[#C9C7EB]">
                  Cloud Synced
                </span>
              ) : (
                <span className="px-2 py-0.2 text-[10px] font-mono bg-[#F5F3FA] text-[#8A817C] rounded border border-[#E1DDF0]">
                  Local Draft (Unsaved)
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#8B83A3]">
              {entry.wordCount || 0} words • {entry.content.length} chars
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* + New Entry Button */}
          <button
            id="editor-new-entry-btn"
            onClick={onNewEntry}
            className="px-3 py-1.5 bg-[#F5F3FA] hover:bg-[#EDE8DE] text-[#27234F] border border-[#C9C7EB] hover:border-[#C9C7EB] rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Start a fresh blank reflection"
          >
            <Plus className="w-3.5 h-3.5 text-[#6B5B95]" />
            <span>New Entry</span>
          </button>

          {/* Focus Mode Toggle */}
          <button
            id="editor-toggle-focus-btn"
            onClick={() => setIsFocusMode(!isFocusMode)}
            title="Toggle Focus View"
            className="p-1.5 text-[#6B647A] hover:text-[#27234F] border border-[#E1DDF0] rounded-md hover:bg-[#F1EFF8] transition-colors cursor-pointer"
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Manual Save Button */}
          <button
            id="editor-save-btn"
            onClick={() => onSave()}
            disabled={saveStatus === 'saving'}
            className="px-3.5 py-1.5 bg-[#27234F] hover:bg-[#1D193D] text-[#F8F7FC] rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-75"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A46D]" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save to Cloud</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Error Notice */}
      {saveStatus === 'error' && (
        <div id="editor-save-error-banner" className="mb-6 p-3 bg-[#FFF2F5] border border-[#E6B9C5] rounded-lg flex items-center justify-between text-[#B34F6A] text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#B34F6A] shrink-0" />
            <span>{saveErrorMessage || 'Could not save entry to Firestore. Please check connection and click Save.'}</span>
          </div>
          <button
            onClick={() => onSave()}
            className="px-2.5 py-1 bg-[#B34F6A] text-white rounded font-medium hover:bg-[#A84540] transition-colors cursor-pointer"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Main Journal Canvas Area */}
      <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Title Input */}
        <div>
          <input
            id="journal-title-input"
            type="text"
            placeholder="Title your reflection..."
            value={entry.title}
            onChange={handleTitleChange}
            className="w-full text-2xl sm:text-3xl font-serif font-bold text-[#27234F] placeholder:text-[#8B83A3] focus:outline-none border-b border-transparent focus:border-[#C9C7EB] pb-2 transition-colors"
          />
        </div>

        {/* Mood Selector Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F1EFF8]">
          <span className="text-xs text-[#6B647A] flex items-center mr-1 font-mono">
            <Smile className="w-3.5 h-3.5 mr-1 text-[#6B5B95]" /> Mood:
          </span>
          {MOODS.map((m) => (
            <button
              key={m.id}
              id={`mood-chip-${m.id}`}
              onClick={() => handleMoodSelect(m.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                entry.mood === m.id
                  ? 'bg-[#27234F] text-[#F8F7FC] shadow-xs'
                  : 'bg-[#F1EFF8] text-[#1F2937] hover:bg-[#EEEAF8]'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Tags & Optional Location Area */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Tag Badges */}
          {entry.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#F1EFF8] text-[#1F2937] font-mono border border-[#E1DDF0]"
            >
              #{t}
              <button
                onClick={() => handleRemoveTag(t)}
                className="ml-1.5 hover:text-[#27234F] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Tag Input */}
          <div className="inline-flex items-center space-x-1 bg-[#F5F3FA] px-2 py-0.5 rounded-md border border-[#E1DDF0]">
            <Tag className="w-3 h-3 text-[#8B83A3]" />
            <input
              id="tag-input-field"
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="bg-transparent text-xs text-[#1F2937] placeholder:text-[#8B83A3] focus:outline-none w-24"
            />
          </div>

          {/* Location Tag */}
          {entry.location ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#EEEAF8] border border-[#C9C7EB] text-[#51467D] font-mono">
              <MapPin className="w-3 h-3 mr-1 text-[#6B5B95]" />
              {entry.location.label}
              <button
                onClick={handleRemoveLocation}
                className="ml-1.5 hover:text-[#2A3125] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ) : (
            <div className="relative">
              <button
                id="add-location-btn"
                onClick={() => setShowLocationDialog(!showLocationDialog)}
                className="inline-flex items-center space-x-1 text-[#6B647A] hover:text-[#27234F] px-2.5 py-0.5 rounded border border-dashed border-[#C9C7EB] hover:border-[#C9C7EB] cursor-pointer bg-[#F5F3FA]"
              >
                <MapPin className="w-3 h-3 text-[#6B5B95]" />
                <span>+ Place Tag (Optional)</span>
              </button>

              {/* Location Selection Popup */}
              {showLocationDialog && (
                <div className="absolute left-0 mt-1.5 w-72 bg-[#FFFFFF] border border-[#E1DDF0] rounded-lg shadow-lg p-3 z-20 space-y-2">
                  <p className="text-[11px] text-[#6B647A] font-medium">
                    Attach optional place label (user-controlled):
                  </p>
                  <input
                    id="manual-place-input"
                    type="text"
                    placeholder="e.g. Kyoto Tea Garden, Quiet Cafe"
                    value={locationInput}
                    onChange={(e) => {
                      setLocationInput(e.target.value);
                      if (locationError) setLocationError(null);
                    }}
                    className="w-full text-xs p-1.5 border border-[#E1DDF0] rounded focus:outline-none focus:border-[#C9C7EB] bg-[#F5F3FA]"
                  />
                  {locationError && (
                    <div id="location-error-banner" className="p-2 text-[11px] text-[#A8423F] bg-[#FDF2F2] border border-[#F5C2C0] rounded leading-tight">
                      {locationError}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <button
                      id="gps-location-btn"
                      onClick={handleFetchCurrentLocation}
                      disabled={isLocating}
                      className="px-2.5 py-1 text-[10px] bg-[#F1EFF8] hover:bg-[#EEEAF8] text-[#1F2937] rounded flex items-center space-x-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLocating ? <Loader2 className="w-3 h-3 animate-spin text-[#6B5B95]" /> : <MapPin className="w-3 h-3 text-[#6B5B95]" />}
                      <span>{isLocating ? 'Getting location...' : 'Use GPS Tag'}</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      <button
                        id="cancel-location-btn"
                        onClick={() => {
                          setShowLocationDialog(false);
                          setLocationError(null);
                        }}
                        className="px-2 py-1 text-[10px] text-[#6B647A] hover:text-[#27234F] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="apply-location-btn"
                        onClick={handleSetLocationLabel}
                        disabled={!locationInput.trim() || isLocating}
                        className="px-2.5 py-1 text-[10px] bg-[#27234F] text-[#F8F7FC] rounded hover:bg-[#1D193D] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Journal Content Textarea */}
        <div className="relative">
          <textarea
            id="journal-content-textarea"
            placeholder="Pour out your thoughts, questions, reflections, or moments of gratitude..."
            value={entry.content}
            onChange={handleContentChange}
            rows={16}
            className="w-full p-4 bg-[#F5F3FA]/60 border border-[#E1DDF0] rounded-xl text-[#1F2937] placeholder:text-[#8B83A3] focus:outline-none focus:border-[#C9C7EB] leading-relaxed font-sans text-base shadow-2xs resize-y transition-colors"
          />
        </div>

        {/* Footer Navigation & Shortcuts */}
        <div className="pt-4 border-t border-[#E1DDF0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B647A]">
          <div className="flex items-center space-x-2">
            <span>Last updated: {new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateToCompass}
              className="text-[#6B5B95] hover:text-[#51467D] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Deepen in Reflection Compass →</span>
            </button>
            <span className="text-[#C9C7EB]">•</span>
            <button
              onClick={onNavigateToCompanion}
              className="text-[#C5A46D] hover:text-[#6B5B95] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Talk with Companion →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
