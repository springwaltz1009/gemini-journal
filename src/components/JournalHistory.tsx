import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Compass, 
  MapPin, 
  Download, 
  Calendar, 
  ArrowRight,
  BookOpen,
  X,
  FileText
} from 'lucide-react';
import { JournalEntry, MoodType } from '../types';

interface JournalHistoryProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onNewEntry: () => void;
  onViewCompass: (entry: JournalEntry) => void;
}

export const JournalHistory: React.FC<JournalHistoryProps> = ({
  entries,
  onSelectEntry,
  onDeleteEntry,
  onNewEntry,
  onViewCompass,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'words'>('newest');
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract all distinct tags from entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach((t) => {
          if (t && typeof t === 'string') tagSet.add(t);
        });
      }
    });
    return Array.from(tagSet);
  }, [entries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    const qLower = (searchQuery || '').trim().toLowerCase();
    return entries
      .filter((entry) => {
        const title = (entry.title || '').toLowerCase();
        const content = (entry.content || '').toLowerCase();
        const tags = Array.isArray(entry.tags) ? entry.tags : [];
        const locLabel = (entry.location?.label || '').toLowerCase();

        const matchesQuery = 
          !qLower ||
          title.includes(qLower) ||
          content.includes(qLower) ||
          tags.some((t) => (t || '').toLowerCase().includes(qLower)) ||
          locLabel.includes(qLower);

        const matchesMood = selectedMood === 'all' || entry.mood === selectedMood;
        const matchesTag = !selectedTag || tags.includes(selectedTag);

        return matchesQuery && matchesMood && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortBy === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
        if (sortBy === 'words') return (b.wordCount || 0) - (a.wordCount || 0);
        return 0;
      });
  }, [entries, searchQuery, selectedMood, selectedTag, sortBy]);

  const handleExportEntryMarkdown = (entry: JournalEntry) => {
    const md = `# ${entry.title || 'Untitled Reflection'}
**Date:** ${new Date(entry.createdAt).toLocaleString()}  
**Mood:** ${entry.mood || 'N/A'}  
**Tags:** ${entry.tags.map((t) => `#${t}`).join(', ') || 'None'}  
**Location:** ${entry.location?.label || 'N/A'}

---

${entry.content}

${entry.compass ? `
---
### Reflection Compass
- **Exploration:** ${entry.compass.whatExplored}
- **Key Ideas:** ${entry.compass.keyIdeas.join('; ')}
- **Next Actions:** ${entry.compass.possibleNextActions.join('; ')}
- **Revisit:** ${entry.compass.thingsToRevisit.join('; ')}
- **Reflection Question:** "${entry.compass.reflectionQuestion}"
` : ''}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').replace(/\s+/g, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteEntry(entryToDelete.id);
      setEntryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="journal-history-view" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E1DDF0]">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#27234F]">
            Reflection History
          </h1>
          <p className="text-sm text-[#6B647A] mt-1">
            Search, review, and export all your private journal entries and Gemini conversations.
          </p>
        </div>

        <button
          id="history-new-entry-btn"
          onClick={onNewEntry}
          className="px-4 py-2 bg-[#27234F] hover:bg-[#1D193D] text-[#F8F7FC] rounded-lg text-xs font-medium inline-flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          <span>Write New Entry</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-[#8B83A3] absolute left-3.5 top-3" />
            <input
              id="history-search-input"
              type="text"
              placeholder="Search by keywords, tags, or places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFFFFF] border border-[#E1DDF0] rounded-lg text-xs text-[#1F2937] placeholder:text-[#8B83A3] focus:outline-none focus:border-[#C9C7EB] shadow-xs"
            />
          </div>

          {/* Sort Selector */}
          <div className="sm:col-span-4">
            <select
              id="history-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 bg-[#FFFFFF] border border-[#E1DDF0] rounded-lg text-xs text-[#1F2937] focus:outline-none focus:border-[#C9C7EB] shadow-xs cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="words">Sort: Longest Word Count</option>
            </select>
          </div>
        </div>

        {/* Mood & Tag Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[#6B647A] font-mono text-[11px]">Filter Mood:</span>
          {(['all', 'peaceful', 'thoughtful', 'grateful', 'energized', 'anxious', 'neutral'] as const).map((m) => (
            <button
              key={m}
              id={`filter-mood-${m}`}
              onClick={() => setSelectedMood(m)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                selectedMood === m
                  ? 'bg-[#27234F] text-[#F8F7FC]'
                  : 'bg-[#FFFFFF] border border-[#E1DDF0] text-[#1F2937] hover:bg-[#F1EFF8]'
              }`}
            >
              {m}
            </button>
          ))}

          {/* Tag Badges */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#E1DDF0]">
              <span className="text-[#6B647A] font-mono text-[11px]">Tags:</span>
              {allTags.slice(0, 6).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    selectedTag === t
                      ? 'bg-[#F0EBFA] text-[#8C6D53] border border-[#C5A46D]'
                      : 'bg-[#F1EFF8] text-[#1F2937] hover:bg-[#EEEAF8]'
                  }`}
                >
                  #{t}
                </button>
              ))}
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-[#8B83A3] hover:text-[#27234F] cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Entries List */}
      <div className="mt-8 space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-dashed border-[#C9C7EB] rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-[#8B83A3] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#27234F] mb-1">
              {entries.length === 0 ? 'No Reflections Written Yet' : 'No Matching Reflections Found'}
            </h3>
            <p className="text-sm text-[#6B647A] max-w-md mx-auto mb-6">
              {entries.length === 0
                ? 'Your private journaling journey begins here. Open the canvas to record your first entry.'
                : 'Try adjusting your search keywords, mood selection, or tag filters.'}
            </p>
            {entries.length === 0 && (
              <button
                onClick={onNewEntry}
                className="px-5 py-2.5 bg-[#27234F] hover:bg-[#1D193D] text-[#F8F7FC] rounded-lg text-xs font-medium cursor-pointer shadow-xs"
              >
                Write First Reflection
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              id={`history-entry-card-${entry.id}`}
              className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl p-5 shadow-xs hover:border-[#C9C7EB] hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Left Meta & Content */}
                <div 
                  onClick={() => onSelectEntry(entry)}
                  className="flex-1 cursor-pointer group"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B647A] font-mono mb-2">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-[#8B83A3]" />
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[#C9C7EB]">•</span>
                    <span>{entry.wordCount} words</span>

                    {entry.mood && (
                      <span className="px-2 py-0.5 rounded-full bg-[#F1EFF8] text-[#1F2937] font-sans capitalize text-[11px]">
                        {entry.mood}
                      </span>
                    )}

                    {entry.location && (
                      <span className="flex items-center text-[#51467D] bg-[#EEEAF8] px-2 py-0.5 rounded text-[11px] font-mono">
                        <MapPin className="w-3 h-3 mr-1 text-[#6B5B95]" />
                        {entry.location.label}
                      </span>
                    )}

                    {entry.compass && (
                      <span className="flex items-center text-[#8C6D53] bg-[#F0EBFA] px-2 py-0.5 rounded text-[11px]">
                        <Compass className="w-3 h-3 mr-1 text-[#C5A46D]" />
                        Compass Charted
                      </span>
                    )}

                    {entry.chatHistory.length > 0 && (
                      <span className="text-[#8B83A3] text-[11px]">
                        💬 {entry.chatHistory.length} turns
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#27234F] group-hover:text-[#6B5B95] transition-colors">
                    {entry.title || 'Untitled Reflection'}
                  </h3>

                  <p className="text-sm text-[#6B647A] line-clamp-2 mt-1 leading-relaxed">
                    {entry.content || '(Empty entry)'}
                  </p>

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {entry.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded bg-[#F1EFF8] text-[#1F2937] text-[10px] font-mono border border-[#E1DDF0]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Action Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E1DDF0]">
                  <div className="flex items-center space-x-1">
                    {entry.compass && (
                      <button
                        onClick={() => onViewCompass(entry)}
                        title="View Reflection Compass"
                        className="p-2 text-[#6B647A] hover:text-[#6B5B95] hover:bg-[#F1EFF8] rounded-md transition-colors cursor-pointer"
                      >
                        <Compass className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleExportEntryMarkdown(entry)}
                      title="Download Markdown"
                      className="p-2 text-[#6B647A] hover:text-[#27234F] hover:bg-[#F1EFF8] rounded-md transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setEntryToDelete(entry)}
                      title="Delete Entry"
                      className="p-2 text-[#8B83A3] hover:text-[#B34F6A] hover:bg-[#FFF2F5] rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectEntry(entry)}
                    className="text-xs font-medium text-[#27234F] hover:text-[#6B5B95] flex items-center space-x-1 cursor-pointer pt-1"
                  >
                    <span>Open Canvas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 bg-[#27234F]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFFFF] border border-[#E1DDF0] rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h4 className="font-serif font-bold text-lg text-[#27234F]">
              Delete Reflection?
            </h4>
            <p className="text-xs text-[#6B647A] leading-relaxed">
              Are you sure you want to permanently delete &ldquo;{entryToDelete.title || 'Untitled'}&rdquo;? This will remove the entry and its Gemini dialogue from Cloud Firestore.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setEntryToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 border border-[#E1DDF0] rounded-lg text-xs font-medium text-[#1F2937] hover:bg-[#F1EFF8] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-2 bg-[#B34F6A] hover:bg-[#A84540] text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
