import React, { useState, useEffect, useRef } from 'react';
import { useLayout } from '../layout/LayoutContext';
import { useAccounts } from '../layout/AccountContext';
import { listNotes, getNoteContent, createNote, updateNote, deleteNote } from '../../services/GoogleService';
import { Cloud, RefreshCw, Check, Plus, Trash2 } from 'lucide-react';
import debounce from 'lodash.debounce';
import { v4 as uuidv4 } from 'uuid';
import styles from './NotesWidget.module.css';

interface Note {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
    isLocal?: boolean;
}

interface NotesData {
    notes: Note[];
    activeNoteId: string | null;
}

interface NotesWidgetProps {
    id: string;
    data?: NotesData;
}

export const NotesWidget: React.FC<NotesWidgetProps> = ({ id, data }) => {
    const { updateWidgetData } = useLayout();
    const { accounts } = useAccounts();
    const [notes, setNotes] = useState<Note[]>(data?.notes || []);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(data?.activeNoteId || null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

    const googleAccount = accounts.find(a => a.type === 'GOOGLE');

    const activeNote = notes.find(n => n.id === activeNoteId);

    const saveNoteToDrive = async (note: Note) => {
        if (!googleAccount) return;

        setSyncStatus('syncing');
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (googleAccount.token && (window as any).gapi?.client) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).gapi.client.setToken({ access_token: googleAccount.token });
            }

            if (note.isLocal) {
                const result = await createNote(note.title, note.content);
                if (result && result.id) {
                    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, id: result.id, isLocal: false } : n));
                    if (activeNoteId === note.id) setActiveNoteId(result.id);
                }
            } else {
                await updateNote(note.id, note.title, note.content);
            }
            setSyncStatus('synced');
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to save note', error);
            setSyncStatus('error');
        }
    };

    const debouncedSave = useRef(
        debounce((note: Note) => {
            saveNoteToDrive(note);
        }, 1000)
    );

    useEffect(() => {
        const debounced = debouncedSave.current;
        return () => {
            debounced.cancel();
        };
    }, []);

    const updateLocalNote = (noteId: string, updates: Partial<Note>) => {
        const newNotes = notes.map(n => n.id === noteId ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);

        setNotes(newNotes);
        updateWidgetData(id, { notes: newNotes, activeNoteId });

        const updatedNote = newNotes.find(n => n.id === noteId);
        if (updatedNote) {
            debouncedSave.current({ ...updatedNote, ...updates });
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!activeNoteId) return;
        updateLocalNote(activeNoteId, { content: e.target.value });
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!activeNoteId) return;
        updateLocalNote(activeNoteId, { title: e.target.value });
    };

    const createNewNote = () => {
        const newNote: Note = {
            id: uuidv4(),
            title: 'New Note',
            content: '',
            updatedAt: new Date().toISOString(),
            isLocal: true
        };
        const newNotes = [newNote, ...notes];
        setNotes(newNotes);
        setActiveNoteId(newNote.id);
        updateWidgetData(id, { notes: newNotes, activeNoteId: newNote.id });
        debouncedSave.current(newNote);
    };

    const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const noteToDelete = notes.find(n => n.id === noteId);

        const newNotes = notes.filter(n => n.id !== noteId);
        setNotes(newNotes);
        if (activeNoteId === noteId) setActiveNoteId(null);
        updateWidgetData(id, { notes: newNotes, activeNoteId: activeNoteId === noteId ? null : activeNoteId });

        if (noteToDelete && !noteToDelete.isLocal && googleAccount) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (googleAccount.token && (window as any).gapi?.client) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).gapi.client.setToken({ access_token: googleAccount.token });
            }
            await deleteNote(noteId);
        }
    };

    const handleNoteSelect = async (noteId: string) => {
        setActiveNoteId(noteId);
        updateWidgetData(id, { notes, activeNoteId: noteId });

        const note = notes.find(n => n.id === noteId);
        if (note && !note.isLocal && !note.content && googleAccount) {
            setSyncStatus('syncing');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (googleAccount.token && (window as any).gapi?.client) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).gapi.client.setToken({ access_token: googleAccount.token });
            }
            const content = await getNoteContent(noteId);
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content } : n));
            setSyncStatus('idle');
        }
    };

    const handleSync = async () => {
        if (!googleAccount) return;

        setSyncStatus('syncing');
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (googleAccount.token && (window as any).gapi?.client) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).gapi.client.setToken({ access_token: googleAccount.token });
            }

            const files = await listNotes();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mergedNotes: Note[] = files.map((f: any) => {
                const existing = notes.find(n => n.id === f.id);
                return {
                    id: f.id,
                    title: f.name.replace(/\.txt$/, ''),
                    content: existing?.content || '',
                    updatedAt: f.modifiedTime,
                    isLocal: false
                };
            });

            setNotes(mergedNotes);
            updateWidgetData(id, { notes: mergedNotes, activeNoteId });
            setSyncStatus('synced');
            setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (error) {
            console.error('Sync failed', error);
            setSyncStatus('error');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h3>Notes</h3>
                    <button onClick={createNewNote} className={styles.addBtn} title="New Note">
                        <Plus size={16} />
                    </button>
                </div>
                <div className={styles.notesList}>
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className={`${styles.noteItem} ${activeNoteId === note.id ? styles.active : ''}`}
                            onClick={() => handleNoteSelect(note.id)}
                        >
                            <div className={styles.noteTitle}>{note.title || 'Untitled'}</div>
                            <div className={styles.noteDate}>
                                {new Date(note.updatedAt).toLocaleDateString()}
                            </div>
                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => handleDeleteNote(note.id, e)}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {notes.length === 0 && (
                        <div className={styles.emptyState}>No notes</div>
                    )}
                </div>
                <div className={styles.syncContainer}>
                    {googleAccount ? (
                        <button
                            className={styles.syncBtn}
                            onClick={handleSync}
                            title="Sync with Google Drive"
                            disabled={syncStatus === 'syncing'}
                        >
                            {syncStatus === 'syncing' ? <RefreshCw className={styles.spin} size={14} /> :
                                syncStatus === 'synced' ? <Check size={14} /> :
                                    <Cloud size={14} />}
                            <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Sync'}</span>
                        </button>
                    ) : (
                        <span className={styles.hint}>Connect Google to sync</span>
                    )}
                </div>
            </div>
            <div className={styles.main}>
                {activeNote ? (
                    <>
                        <input
                            type="text"
                            className={styles.titleInput}
                            value={activeNote.title}
                            onChange={handleTitleChange}
                            placeholder="Note Title"
                        />
                        <textarea
                            className={styles.textarea}
                            value={activeNote.content}
                            onChange={handleContentChange}
                            placeholder="Type your notes here..."
                        />
                    </>
                ) : (
                    <div className={styles.noSelection}>
                        Select a note or create a new one
                    </div>
                )}
            </div>
        </div>
    );
};
