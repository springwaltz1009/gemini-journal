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
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5E0D5]">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#FAF8F2] text-[#3D3631] flex items-center justify-center border border-[#E5E0D5]">
            <BookOpen className="w-4 h-4 text-[#6B705C]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#7A726D] block">
                Journal Canvas
              </span>
              {isExistingSavedEntry ? (
                <span className="px-2 py-0.2 text-[10px] font-mono bg-[#ECEFE6] text-[#3F4739] rounded border border-[#B7BCA9]">
                  Cloud Synced
                </span>
              ) : (
                <span className="px-2 py-0.2 text-[10px] font-mono bg-[#FAF8F2] text-[#8A817C] rounded border border-[#E5E0D5]">
                  Local Draft (Unsaved)
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#A39B94]">
              {entry.wordCount || 0} words • {entry.content.length} chars
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* + New Entry Button */}
          <button
            id="editor-new-entry-btn"
            onClick={onNewEntry}
            className="px-3 py-1.5 bg-[#FAF8F2] hover:bg-[#EDE8DE] text-[#3D3631] border border-[#D5CEBF] hover:border-[#B7BCA9] rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Start a fresh blank reflection"
          >
            <Plus className="w-3.5 h-3.5 text-[#6B705C]" />
            <span>New Entry</span>
          </button>

          {/* Focus Mode Toggle */}
          <button
            id="editor-toggle-focus-btn"
            onClick={() => setIsFocusMode(!isFocusMode)}
            title="Toggle Focus View"
            className="p-1.5 text-[#7A726D] hover:text-[#3D3631] border border-[#E5E0D5] rounded-md hover:bg-[#F5F2EA] transition-colors cursor-pointer"
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Manual Save Button */}
          <button
            id="editor-save-btn"
            onClick={() => onSave()}
            disabled={saveStatus === 'saving'}
            className="px-3.5 py-1.5 bg-[#3D3631] hover:bg-[#2B2521] text-[#FDFCF0] rounded-md text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-75"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#DDBEA9]" />
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
        <div id="editor-save-error-banner" className="mb-6 p-3 bg-[#FDF0EE] border border-[#E9BEB9] rounded-lg flex items-center justify-between text-[#C85A54] text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#C85A54] shrink-0" />
            <span>{saveErrorMessage || 'Could not save entry to Firestore. Please check connection and click Save.'}</span>
          </div>
          <button
            onClick={() => onSave()}
            className="px-2.5 py-1 bg-[#C85A54] text-white rounded font-medium hover:bg-[#A84540] transition-colors cursor-pointer"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Main Journal Canvas Area */}
      <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Title Input */}
        <div>
          <input
            id="journal-title-input"
            type="text"
            placeholder="Title your reflection..."
            value={entry.title}
            onChange={handleTitleChange}
            className="w-full text-2xl sm:text-3xl font-serif font-bold text-[#3D3631] placeholder:text-[#A39B94] focus:outline-none border-b border-transparent focus:border-[#D5CEBF] pb-2 transition-colors"
          />
        </div>

        {/* Mood Selector Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F5F2EA]">
          <span className="text-xs text-[#7A726D] flex items-center mr-1 font-mono">
            <Smile className="w-3.5 h-3.5 mr-1 text-[#6B705C]" /> Mood:
          </span>
          {MOODS.map((m) => (
            <button
              key={m.id}
              id={`mood-chip-${m.id}`}
              onClick={() => handleMoodSelect(m.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
                entry.mood === m.id
                  ? 'bg-[#3D3631] text-[#FDFCF0] shadow-xs'
                  : 'bg-[#F5F2EA] text-[#4A433F] hover:bg-[#EAE5D9]'
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
              className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#F5F2EA] text-[#4A433F] font-mono border border-[#E5E0D5]"
            >
              #{t}
              <button
                onClick={() => handleRemoveTag(t)}
                className="ml-1.5 hover:text-[#3D3631] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Tag Input */}
          <div className="inline-flex items-center space-x-1 bg-[#FAF8F2] px-2 py-0.5 rounded-md border border-[#E5E0D5]">
            <Tag className="w-3 h-3 text-[#A39B94]" />
            <input
              id="tag-input-field"
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="bg-transparent text-xs text-[#4A433F] placeholder:text-[#A39B94] focus:outline-none w-24"
            />
          </div>

          {/* Location Tag */}
          {entry.location ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#ECEFE6] border border-[#B7BCA9] text-[#3F4739] font-mono">
              <MapPin className="w-3 h-3 mr-1 text-[#6B705C]" />
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
                className="inline-flex items-center space-x-1 text-[#7A726D] hover:text-[#3D3631] px-2.5 py-0.5 rounded border border-dashed border-[#D5CEBF] hover:border-[#B7BCA9] cursor-pointer bg-[#FAF8F2]"
              >
                <MapPin className="w-3 h-3 text-[#6B705C]" />
                <span>+ Place Tag (Optional)</span>
              </button>

              {/* Location Selection Popup */}
              {showLocationDialog && (
                <div className="absolute left-0 mt-1.5 w-72 bg-[#FFFFFF] border border-[#E5E0D5] rounded-lg shadow-lg p-3 z-20 space-y-2">
                  <p className="text-[11px] text-[#7A726D] font-medium">
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
                    className="w-full text-xs p-1.5 border border-[#E5E0D5] rounded focus:outline-none focus:border-[#B7BCA9] bg-[#FAF8F2]"
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
                      className="px-2.5 py-1 text-[10px] bg-[#F5F2EA] hover:bg-[#EAE5D9] text-[#4A433F] rounded flex items-center space-x-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLocating ? <Loader2 className="w-3 h-3 animate-spin text-[#6B705C]" /> : <MapPin className="w-3 h-3 text-[#6B705C]" />}
                      <span>{isLocating ? 'Getting location...' : 'Use GPS Tag'}</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      <button
                        id="cancel-location-btn"
                        onClick={() => {
                          setShowLocationDialog(false);
                          setLocationError(null);
                        }}
                        className="px-2 py-1 text-[10px] text-[#7A726D] hover:text-[#3D3631] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="apply-location-btn"
                        onClick={handleSetLocationLabel}
                        disabled={!locationInput.trim() || isLocating}
                        className="px-2.5 py-1 text-[10px] bg-[#3D3631] text-[#FDFCF0] rounded hover:bg-[#2B2521] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full p-4 bg-[#FAF8F2]/60 border border-[#E5E0D5] rounded-xl text-[#4A433F] placeholder:text-[#A39B94] focus:outline-none focus:border-[#B7BCA9] leading-relaxed font-sans text-base shadow-2xs resize-y transition-colors"
          />
        </div>

        {/* Footer Navigation & Shortcuts */}
        <div className="pt-4 border-t border-[#E5E0D5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7A726D]">
          <div className="flex items-center space-x-2">
            <span>Last updated: {new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateToCompass}
              className="text-[#6B705C] hover:text-[#3F4739] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Deepen in Reflection Compass →</span>
            </button>
            <span className="text-[#D5CEBF]">•</span>
            <button
              onClick={onNavigateToCompanion}
              className="text-[#CB997E] hover:text-[#B76935] font-medium flex items-center space-x-1 cursor-pointer transition-colors"
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
