/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot,
  handleFirestoreError,
  FirestoreOperationType
} from './firebase';
import { UserProfile, JournalEntry, ActiveTab } from './types';
import { sanitizeFirestorePayload } from './utils/sanitize';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { JournalEditor } from './components/JournalEditor';
import { JournalHistory } from './components/JournalHistory';
import { ReflectionCompassView } from './components/ReflectionCompassView';
import { WellbeingCompanionView } from './components/WellbeingCompanionView';
import { WellbeingDisclaimer } from './components/WellbeingDisclaimer';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Journal Entries State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('write');

  // Persistence and Sync State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isCompassGenerating, setIsCompassGenerating] = useState(false);
  const [compassError, setCompassError] = useState<string | null>(null);
  const [compassSelectedEntryId, setCompassSelectedEntryId] = useState<string | null>(null);
  const [showDiscardConfirmModal, setShowDiscardConfirmModal] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveStatusResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingEntryToLoad, setPendingEntryToLoad] = useState<JournalEntry | null>(null);
  const isInitialLoadRef = useRef(true);

  // Factory for a fresh, empty entry
  const createNewDraft = (userId: string): JournalEntry => ({
    id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title: '',
    content: '',
    mood: undefined,
    tags: [],
    location: undefined,
    compass: undefined,
    chatHistory: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    wordCount: 0,
  });

  // 1. Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };
        setUser(profile);
      } else {
        setUser(null);
        setEntries([]);
        setCurrentEntry(null);
        setCompassSelectedEntryId(null);
        isInitialLoadRef.current = true;
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore entries listener for authenticated user
  useEffect(() => {
    if (!user?.uid) {
      setEntries([]);
      return;
    }

    const currentUid = user.uid;
    const journalsRef = collection(db, 'users', currentUid, 'journals');
    const q = query(journalsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const loadedEntries: JournalEntry[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as JournalEntry;
          loadedEntries.push({
            ...data,
            id: docSnap.id,
            userId: currentUid,
          });
        });

        setEntries(loadedEntries);

        // On fresh login/initial app load, always start Journal Canvas with a fresh blank local-only draft
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          setCurrentEntry(createNewDraft(currentUid));
        }
      },
      (err) => {
        handleFirestoreError(err, FirestoreOperationType.LIST, `users/${currentUid}/journals`);
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          setCurrentEntry(createNewDraft(currentUid));
        }
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // 3. Save Entry to Firestore
  const saveEntryToFirestore = async (entryToSave: JournalEntry) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      setSaveStatus('error');
      setSaveErrorMessage('User authentication required to save entries.');
      return;
    }

    const titleTrimmed = (entryToSave.title || '').trim();
    const contentTrimmed = (entryToSave.content || '').trim();

    // Validate meaningful content: Do not save completely blank entries
    if (!titleTrimmed && !contentTrimmed) {
      setSaveStatus('error');
      setSaveErrorMessage('Please add a title or reflection thoughts before saving.');
      return;
    }

    if (saveStatusResetTimeoutRef.current) {
      clearTimeout(saveStatusResetTimeoutRef.current);
    }

    const docPath = `users/${currentUid}/journals/${entryToSave.id}`;

    try {
      setSaveStatus('saving');
      setSaveErrorMessage(null);

      const entryDocRef = doc(db, 'users', currentUid, 'journals', entryToSave.id);
      
      const payloadWithTimestamp: JournalEntry = {
        ...entryToSave,
        title: entryToSave.title || '',
        content: entryToSave.content || '',
        tags: Array.isArray(entryToSave.tags) ? entryToSave.tags : [],
        wordCount: contentTrimmed ? contentTrimmed.split(/\s+/).length : 0,
        userId: currentUid, // Enforce authenticated Firebase UID
        updatedAt: Date.now(),
      };

      // Strip any undefined keys
      const cleanPayload = sanitizeFirestorePayload(payloadWithTimestamp);

      // Await the Firestore write successfully
      await setDoc(entryDocRef, cleanPayload, { merge: true });

      // Immediate local state update for zero-latency UI consistency
      setCurrentEntry(payloadWithTimestamp);
      setEntries((prev) => {
        const existingIndex = prev.findIndex((e) => e.id === entryToSave.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = payloadWithTimestamp;
          return updated;
        } else {
          return [payloadWithTimestamp, ...prev];
        }
      });

      setSaveStatus('saved');
      setSaveErrorMessage(null);

      // Auto reset 'saved' state back to 'idle' after 3.5 seconds
      saveStatusResetTimeoutRef.current = setTimeout(() => {
        setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
      }, 3500);
    } catch (err: any) {
      const errorMsg = handleFirestoreError(err, FirestoreOperationType.WRITE, docPath);
      setSaveStatus('error');
      setSaveErrorMessage(errorMsg || 'Failed to save to Firestore. Please retry.');
    }
  };

  // 4. Update Current Entry locally and schedule debounce auto-save (ONLY for existing saved entries)
  const handleUpdateEntry = (updatedFields: Partial<JournalEntry>) => {
    if (!currentEntry) return;

    const updatedEntry: JournalEntry = {
      ...currentEntry,
      ...updatedFields,
      updatedAt: Date.now(),
    };

    setCurrentEntry(updatedEntry);

    // Clear previous pending debounced auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // AUTOSAVE BEHAVIOR:
    // Only auto-save if this entry has ALREADY been explicitly saved to Firestore at least once
    const isExistingSavedEntry = entries.some((e) => e.id === currentEntry.id);

    if (isExistingSavedEntry && auth.currentUser?.uid) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        // Only auto-save if there is non-empty content
        if (updatedEntry.title.trim() || updatedEntry.content.trim()) {
          saveEntryToFirestore(updatedEntry);
        }
      }, 1500);
    }
  };

  // 5. Delete Entry from Firestore
  const handleDeleteEntry = async (entryId: string) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;

    const docPath = `users/${currentUid}/journals/${entryId}`;
    try {
      await deleteDoc(doc(db, 'users', currentUid, 'journals', entryId));

      setEntries((prev) => prev.filter((e) => e.id !== entryId));

      if (currentEntry?.id === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId);
        if (remaining.length > 0) {
          setCurrentEntry(remaining[0]);
        } else {
          setCurrentEntry(createNewDraft(currentUid));
        }
      }
    } catch (err: any) {
      const errorMsg = handleFirestoreError(err, FirestoreOperationType.DELETE, docPath);
      alert(`Delete failed: ${errorMsg}`);
    }
  };

  // 6. Generate Reflection Compass (for the explicitly selected journal entry)
  const handleGenerateCompass = async (entry: JournalEntry) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      setCompassError('You must be signed in to generate and save a Reflection Compass.');
      return;
    }

    if (!entry.content.trim()) {
      setCompassError('The selected journal entry has no written content to reflect upon.');
      return;
    }

    setCompassError(null);
    setIsCompassGenerating(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setCompassError('Your session has expired. Please sign in again.');
        return;
      }

      const idToken = await currentUser.getIdToken();

      // Data minimization: Send ONLY the explicitly selected entry's content
      const response = await fetch('/api/gemini/compass', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ journalContent: entry.content }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error (${response.status})`);
      }

      const resData = await response.json();
      if (resData.compass) {
        const updated: JournalEntry = {
          ...entry,
          userId: currentUid,
          compass: resData.compass,
          updatedAt: Date.now(),
        };

        // If Journal Canvas is currently editing this same entry, keep it in sync; otherwise do not overwrite Canvas draft
        setCurrentEntry((prev) => (prev && prev.id === updated.id ? updated : prev));
        await saveEntryToFirestore(updated);
      } else {
        throw new Error('No structured compass returned from synthesis.');
      }
    } catch (err: any) {
      console.error('Failed to generate or save compass:', err);
      setCompassError(err.message || 'Could not synthesize or save reflection compass.');
    } finally {
      setIsCompassGenerating(false);
    }
  };

  // Check if current draft has unsaved edits
  const checkHasUnsavedChanges = (): boolean => {
    if (!currentEntry) return false;
    const saved = entries.find((e) => e.id === currentEntry.id);
    if (saved) {
      const titleChanged = (saved.title || '') !== (currentEntry.title || '');
      const contentChanged = (saved.content || '') !== (currentEntry.content || '');
      const moodChanged = saved.mood !== currentEntry.mood;
      const tagsChanged = (saved.tags || []).join(',') !== (currentEntry.tags || []).join(',');
      const locationChanged = JSON.stringify(saved.location || null) !== JSON.stringify(currentEntry.location || null);
      return titleChanged || contentChanged || moodChanged || tagsChanged || locationChanged;
    }
    // New unsaved draft that has not been saved into entries yet
    return Boolean(
      currentEntry.title.trim() ||
      currentEntry.content.trim() ||
      currentEntry.mood ||
      (currentEntry.tags && currentEntry.tags.length > 0) ||
      currentEntry.location
    );
  };

  const handleCreateNewEntry = () => {
    if (checkHasUnsavedChanges()) {
      setShowDiscardConfirmModal(true);
    } else {
      executeCreateNewDraft();
    }
  };

  const executeCreateNewDraft = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    if (saveStatusResetTimeoutRef.current) {
      clearTimeout(saveStatusResetTimeoutRef.current);
    }
    const currentUid = auth.currentUser?.uid || user?.uid || 'anonymous';
    const fresh = createNewDraft(currentUid);
    setCurrentEntry(fresh);
    setSaveStatus('idle');
    setSaveErrorMessage(null);
    setCompassError(null);
    setActiveTab('write');
    setShowDiscardConfirmModal(false);
  };

  const handleSelectEntryFromHistory = (selected: JournalEntry) => {
    if (checkHasUnsavedChanges() && currentEntry?.id !== selected.id) {
      setPendingEntryToLoad(selected);
      setShowDiscardConfirmModal(true);
    } else {
      setCurrentEntry(selected);
      setSaveStatus('idle');
      setSaveErrorMessage(null);
      setActiveTab('write');
    }
  };

  const handleConfirmDiscard = () => {
    if (pendingEntryToLoad) {
      setCurrentEntry(pendingEntryToLoad);
      setPendingEntryToLoad(null);
      setSaveStatus('idle');
      setSaveErrorMessage(null);
      setActiveTab('write');
    } else {
      executeCreateNewDraft();
    }
    setShowDiscardConfirmModal(false);
  };

  const handleCancelDiscard = () => {
    setPendingEntryToLoad(null);
    setShowDiscardConfirmModal(false);
  };

  // Render Loading Screen during Auth Check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCF0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#3D3631] animate-spin mx-auto" />
          <p className="text-xs font-mono text-[#7A726D]">Initializing Gemini Reflection Journal...</p>
        </div>
      </div>
    );
  }

  // Render Unauthenticated Landing Page
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FDFCF0] text-[#4A433F]">
        <WellbeingDisclaimer />
        <LandingPage />
      </div>
    );
  }

  const isCurrentEntrySaved = currentEntry ? entries.some((e) => e.id === currentEntry.id) : false;
  const activeCompassEntry = entries.find((e) => e.id === compassSelectedEntryId) || (entries.length > 0 ? entries[0] : null);

  // Render Authenticated Dashboard
  return (
    <div id="app-root" className="min-h-screen flex flex-col bg-[#FDFCF0] text-[#4A433F]">
      <WellbeingDisclaimer />
      
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewEntry={handleCreateNewEntry}
        saveStatus={saveStatus}
        entriesCount={entries.length}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'write' && currentEntry && (
          <JournalEditor
            entry={currentEntry}
            isExistingSavedEntry={isCurrentEntrySaved}
            onUpdateEntry={handleUpdateEntry}
            onSave={() => saveEntryToFirestore(currentEntry)}
            saveStatus={saveStatus}
            onNavigateToCompass={() => {
              if (isCurrentEntrySaved && currentEntry) {
                setCompassSelectedEntryId(currentEntry.id);
              }
              setActiveTab('compass');
            }}
            onNavigateToCompanion={() => setActiveTab('companion')}
            saveErrorMessage={saveErrorMessage}
            onNewEntry={handleCreateNewEntry}
          />
        )}

        {activeTab === 'history' && (
          <JournalHistory
            entries={entries}
            onSelectEntry={handleSelectEntryFromHistory}
            onDeleteEntry={handleDeleteEntry}
            onNewEntry={handleCreateNewEntry}
            onViewCompass={(selected) => {
              setCompassSelectedEntryId(selected.id);
              setActiveTab('compass');
            }}
          />
        )}

        {activeTab === 'compass' && (
          <ReflectionCompassView
            selectedEntry={activeCompassEntry}
            entries={entries}
            onGenerateCompass={handleGenerateCompass}
            isGenerating={isCompassGenerating}
            compassError={compassError}
            onClearError={() => setCompassError(null)}
            onSelectEntry={(selected) => {
              setCompassError(null);
              setCompassSelectedEntryId(selected.id);
            }}
          />
        )}

        {activeTab === 'companion' && (
          <WellbeingCompanionView
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Unsaved Changes Confirmation Modal */}
      {showDiscardConfirmModal && (
        <div 
          id="discard-changes-modal-overlay" 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div 
            id="discard-changes-modal" 
            className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#FDF0EE] flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-[#C85A54]" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#3D3631]">
                  Unsaved Changes in Draft
                </h3>
                <p className="text-sm text-[#7A726D] mt-1 leading-relaxed">
                  {pendingEntryToLoad
                    ? 'Your current reflection has unsaved edits. Would you like to discard them and load the selected entry?'
                    : 'Your current reflection has unsaved edits. Would you like to discard them and create a fresh blank journal entry?'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                id="cancel-discard-btn"
                onClick={handleCancelDiscard}
                className="px-4 py-2 text-xs font-medium text-[#4A433F] hover:bg-[#F5F2EA] border border-[#E5E0D5] rounded-lg transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                id="confirm-discard-btn"
                onClick={handleConfirmDiscard}
                className="px-4 py-2 text-xs font-medium text-white bg-[#C85A54] hover:bg-[#B34943] rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                {pendingEntryToLoad ? 'Discard & Load Entry' : 'Discard & Start New Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
