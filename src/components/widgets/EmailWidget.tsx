import React, { useState, useEffect } from 'react';
import { Star, Inbox, Send, Search, PlusCircle, LogOut, Folder, Trash2, AlertOctagon, Edit, Reply, Forward, X } from 'lucide-react';
import { useAccounts } from '../layout/AccountContext';
import type { AccountType } from '../layout/AccountContext';
import { signInGoogle, signOutGoogle, fetchGmailMessages, initGoogleClient, fetchGmailLabels, sendGmail, markGmailAsRead, trashGmailMessage } from '../../services/GoogleService';
import { signInMicrosoft, signOutMicrosoft, fetchOutlookMessages, fetchOutlookFolders, sendOutlookMail, markOutlookAsRead, deleteOutlookMessage } from '../../services/MicrosoftService';
import styles from './EmailWidget.module.css';
import DOMPurify from 'dompurify';

interface Email {
    id: string;
    sender: string;
    subject: string;
    preview: string;
    date: string;
    read: boolean;
    starred: boolean;
    body?: string;
}

interface Category {
    id: string;
    name: string;
    type: 'system' | 'user';
    icon?: React.ReactNode;
}

export const EmailWidget: React.FC = () => {
    const { accounts, addAccount, removeAccount } = useAccounts();
    const [activeAccount, setActiveAccount] = useState<string | 'all'>('all');
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string>('INBOX');

    const [isComposing, setIsComposing] = useState(false);
    const [composeData, setComposeData] = useState<{ to: string; subject: string; body: string; attachments: File[] }>({ to: '', subject: '', body: '', attachments: [] });
    const contentEditableRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        initGoogleClient();
    }, []);

    useEffect(() => {
        const loadCategories = async () => {
            if (activeAccount === 'all') {
                setCategories([
                    { id: 'INBOX', name: 'Inbox', type: 'system', icon: <Inbox size={16} /> },
                    { id: 'STARRED', name: 'Starred', type: 'system', icon: <Star size={16} /> },
                    { id: 'SENT', name: 'Sent', type: 'system', icon: <Send size={16} /> },
                ]);
                setActiveCategoryId('INBOX');
                return;
            }

            const account = accounts.find(a => a.id === activeAccount);
            if (!account) return;

            let fetchedCategories: Category[] = [];

            if (account.type === 'GOOGLE') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (account.token && (window as any).gapi?.client) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).gapi.client.setToken({ access_token: account.token });
                }
                const labels = await fetchGmailLabels();
                const systemLabels = ['INBOX', 'STARRED', 'SENT', 'TRASH', 'SPAM', 'IMPORTANT', 'DRAFT'];

                fetchedCategories = labels
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .filter((l: any) => systemLabels.includes(l.id) || l.type === 'user')
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((l: any) => {
                        let icon = <Folder size={16} />;
                        if (l.id === 'INBOX') icon = <Inbox size={16} />;
                        else if (l.id === 'STARRED') icon = <Star size={16} />;
                        else if (l.id === 'SENT') icon = <Send size={16} />;
                        else if (l.id === 'TRASH') icon = <Trash2 size={16} />;
                        else if (l.id === 'SPAM') icon = <AlertOctagon size={16} />;

                        return {
                            id: l.id,
                            name: l.name,
                            type: l.type === 'system' ? 'system' : 'user',
                            icon
                        };
                    })
                    .sort((a: Category, b: Category) => {
                        if (a.type === 'system' && b.type !== 'system') return -1;
                        if (a.type !== 'system' && b.type === 'system') return 1;
                        const order = ['INBOX', 'STARRED', 'SENT', 'IMPORTANT', 'DRAFT', 'SPAM', 'TRASH'];
                        return order.indexOf(a.id) - order.indexOf(b.id);
                    });

            } else if (account.type === 'MICROSOFT') {
                const folders = await fetchOutlookFolders();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                fetchedCategories = folders.map((f: any) => {
                    let icon = <Folder size={16} />;
                    const lowerName = f.displayName.toLowerCase();
                    if (lowerName === 'inbox') icon = <Inbox size={16} />;
                    else if (lowerName === 'sent items') icon = <Send size={16} />;
                    else if (lowerName === 'deleted items') icon = <Trash2 size={16} />;
                    else if (lowerName === 'junk email') icon = <AlertOctagon size={16} />;

                    return {
                        id: f.id,
                        name: f.displayName,
                        type: 'user',
                        icon
                    };
                });
            }

            setCategories(fetchedCategories);
            const inbox = fetchedCategories.find(c => c.name.toLowerCase() === 'inbox');
            setActiveCategoryId(inbox ? inbox.id : fetchedCategories[0]?.id || '');
        };

        loadCategories();
    }, [activeAccount, accounts]);

    useEffect(() => {
        const loadEmails = async () => {
            if (accounts.length === 0) {
                setEmails([]);
                return;
            }

            setLoading(true);
            try {
                let fetchedEmails: Email[] = [];

                if (activeAccount === 'all') {
                    for (const account of accounts) {
                        if (account.type === 'GOOGLE' && account.token) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (window as any).gapi?.client?.setToken({ access_token: account.token });

                            let labelId = 'INBOX';
                            if (activeCategoryId === 'SENT') labelId = 'SENT';
                            else if (activeCategoryId === 'STARRED') labelId = 'STARRED';

                            const msgs = await fetchGmailMessages(labelId);
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            fetchedEmails.push(...msgs.map((msg: any) => ({
                                id: `${account.id}-${msg.id}`,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                sender: msg.payload.headers.find((h: any) => h.name === 'From')?.value || 'Unknown',
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                subject: msg.payload.headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject',
                                preview: msg.snippet,
                                date: new Date(Number(msg.internalDate)).toLocaleDateString(),
                                read: !msg.labelIds.includes('UNREAD'),
                                starred: msg.labelIds.includes('STARRED'),
                            })));
                        } else if (account.type === 'MICROSOFT') {
                            if (activeCategoryId === 'INBOX') {
                                const msgs = await fetchOutlookMessages();
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                fetchedEmails.push(...msgs.map((msg: any) => ({
                                    id: `${account.id}-${msg.id}`,
                                    sender: msg.sender.emailAddress.name,
                                    subject: msg.subject,
                                    preview: msg.bodyPreview,
                                    date: new Date(msg.receivedDateTime).toLocaleDateString(),
                                    read: msg.isRead,
                                    starred: msg.flag.flagStatus === 'flagged',
                                })));
                            }
                        }
                    }
                } else {
                    const account = accounts.find(a => a.id === activeAccount);
                    if (!account) {
                        setEmails([]);
                        setLoading(false);
                        return;
                    }

                    if (account.type === 'GOOGLE') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        if (account.token && (window as any).gapi?.client) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (window as any).gapi.client.setToken({ access_token: account.token });
                        }

                        const msgs = await fetchGmailMessages(activeCategoryId);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        fetchedEmails = msgs.map((msg: any) => ({
                            id: msg.id,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            sender: msg.payload.headers.find((h: any) => h.name === 'From')?.value || 'Unknown',
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            subject: msg.payload.headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject',
                            preview: msg.snippet,
                            date: new Date(Number(msg.internalDate)).toLocaleDateString(),
                            read: !msg.labelIds.includes('UNREAD'),
                            starred: msg.labelIds.includes('STARRED'),
                        }));
                    } else if (account.type === 'MICROSOFT') {
                        const msgs = await fetchOutlookMessages(activeCategoryId);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        fetchedEmails = msgs.map((msg: any) => ({
                            id: msg.id,
                            sender: msg.sender.emailAddress.name,
                            subject: msg.subject,
                            preview: msg.bodyPreview,
                            date: new Date(msg.receivedDateTime).toLocaleDateString(),
                            read: msg.isRead,
                            starred: msg.flag.flagStatus === 'flagged',
                        }));
                    }
                }

                setEmails(fetchedEmails);
            } catch (error) {
                console.error('Failed to load emails', error);
            } finally {
                setLoading(false);
            }
        };

        loadEmails();
    }, [activeAccount, accounts, activeCategoryId]);

    const handleConnect = async (type: AccountType) => {
        try {
            let accountData;
            if (type === 'GOOGLE') {
                accountData = await signInGoogle();
            } else {
                accountData = await signInMicrosoft();
            }

            if (accountData && accountData.id && accountData.email) {
                addAccount({
                    id: accountData.id,
                    type,
                    name: accountData.name || accountData.email,
                    email: accountData.email,
                    isAuthenticated: true,
                    token: accountData.token
                });
                setActiveAccount(accountData.id);
            } else {
                throw new Error('Invalid account data received');
            }
        } catch (error) {
            console.error('Failed to connect account:', error);
            alert('Failed to connect account. Please check the console for details.');
        }
    };

    const handleDisconnect = async (id: string) => {
        const account = accounts.find(a => a.id === id);
        if (account?.type === 'GOOGLE') await signOutGoogle();
        if (account?.type === 'MICROSOFT') await signOutMicrosoft();

        removeAccount(id);
        if (activeAccount === id) setActiveAccount('all');
    };

    interface GmailPayload {
        mimeType: string;
        body?: {
            data?: string;
        };
        parts?: GmailPayload[];
    }

    const decodeBase64 = (data: string) => {
        try {
            const binaryString = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return new TextDecoder('utf-8').decode(bytes);
        } catch (e) {
            console.error('Failed to decode base64 string', e);
            return '';
        }
    };

    const getEmailBody = (payload: GmailPayload): string | null => {
        if (!payload) return null;

        if (payload.mimeType === 'text/html' && payload.body && payload.body.data) {
            return decodeBase64(payload.body.data);
        }

        if (payload.parts) {
            for (const part of payload.parts) {
                const body = getEmailBody(part);
                if (body) return body;
            }
        }

        return null;
    };

    const handleEmailClick = async (email: Email) => {
        if (!email.read) {
            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));

            const accountId = activeAccount === 'all' ? email.id.split('-')[0] : activeAccount;
            const messageId = activeAccount === 'all' ? email.id.split('-')[1] : email.id;
            const account = accounts.find(a => a.id === accountId);

            if (account) {
                if (account.type === 'GOOGLE') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (account.token && (window as any).gapi?.client) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (window as any).gapi.client.setToken({ access_token: account.token });
                    }
                    await markGmailAsRead(messageId);
                } else if (account.type === 'MICROSOFT') {
                    await markOutlookAsRead(messageId);
                }
            }
        }

        if (email.body) {
            setSelectedEmail(email);
            return;
        }

        if (activeAccount === 'all') {
            alert('Please select a specific account to read this email');
            return;
        }

        const account = accounts.find(a => a.id === activeAccount);
        if (!account) {
            alert('Account not found');
            return;
        }

        try {
            setLoading(true);
            let fullBody = '';

            if (account.type === 'GOOGLE') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (account.token && (window as any).gapi?.client) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window as any).gapi.client.setToken({ access_token: account.token });
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const response = await (window as any).gapi.client.gmail.users.messages.get({
                    userId: 'me',
                    id: email.id,
                    format: 'full'
                });

                const payload = response.result.payload as GmailPayload;
                const htmlBody = getEmailBody(payload);
                if (htmlBody) {
                    fullBody = htmlBody;
                } else {
                    const parts = payload.parts;
                    if (parts) {
                        const textPart = parts.find((p) => p.mimeType === 'text/plain');
                        fullBody = (textPart && textPart.body && textPart.body.data)
                            ? decodeBase64(textPart.body.data)
                            : email.preview;
                    } else {
                        if (payload.body && payload.body.data) {
                            fullBody = decodeBase64(payload.body.data);
                        } else {
                            fullBody = email.preview;
                        }
                    }
                }
            } else if (account.type === 'MICROSOFT') {
                fullBody = email.preview;
            }

            setSelectedEmail({ ...email, body: fullBody });
        } catch (error) {
            console.error('Failed to load email body', error);
            setSelectedEmail({ ...email, body: email.preview });
        } finally {
            setLoading(false);
        }
    };

    const handleCompose = () => {
        setComposeData({ to: '', subject: '', body: '', attachments: [] });
        setIsComposing(true);
        if (contentEditableRef.current) contentEditableRef.current.innerHTML = '';
    };

    const handleReply = () => {
        if (!selectedEmail) return;
        const replyBody = `<br><br>--- Original Message ---<br>From: ${selectedEmail.sender}<br>Date: ${selectedEmail.date}<br>Subject: ${selectedEmail.subject}<br><br>${selectedEmail.body || selectedEmail.preview}`;
        setComposeData({
            to: selectedEmail.sender,
            subject: `Re: ${selectedEmail.subject}`,
            body: replyBody,
            attachments: []
        });
        setIsComposing(true);
        setTimeout(() => {
            if (contentEditableRef.current) contentEditableRef.current.innerHTML = replyBody;
        }, 0);
    };

    const handleForward = () => {
        if (!selectedEmail) return;
        const forwardBody = `<br><br>--- Forwarded Message ---<br>From: ${selectedEmail.sender}<br>Date: ${selectedEmail.date}<br>Subject: ${selectedEmail.subject}<br><br>${selectedEmail.body || selectedEmail.preview}`;
        setComposeData({
            to: '',
            subject: `Fwd: ${selectedEmail.subject}`,
            body: forwardBody,
            attachments: []
        });
        setIsComposing(true);
        setTimeout(() => {
            if (contentEditableRef.current) contentEditableRef.current.innerHTML = forwardBody;
        }, 0);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setComposeData(prev => ({ ...prev, attachments: [...prev.attachments, ...newFiles] }));
        }
    };

    const removeAttachment = (index: number) => {
        setComposeData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const handleDelete = async () => {
        if (!selectedEmail) return;
        if (!confirm('Are you sure you want to delete this email?')) return;

        const account = accounts.find(a => a.id === activeAccount);
        if (!account) return;

        setLoading(true);
        let success = false;

        if (account.type === 'GOOGLE') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (account.token && (window as any).gapi?.client) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).gapi.client.setToken({ access_token: account.token });
            }
            success = await trashGmailMessage(selectedEmail.id);
        } else if (account.type === 'MICROSOFT') {
            success = await deleteOutlookMessage(selectedEmail.id);
        }

        setLoading(false);
        if (success) {
            setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
            setSelectedEmail(null);
        } else {
            alert('Failed to delete email.');
        }
    };

    const handleSend = async () => {
        const bodyContent = contentEditableRef.current?.innerHTML || '';

        if (!composeData.to || !composeData.subject || !bodyContent) {
            alert('Please fill in all fields');
            return;
        }

        const account = accounts.find(a => a.id === activeAccount);
        if (!account) {
            alert('Please select an account to send from');
            return;
        }

        setLoading(true);
        let success = false;

        if (account.type === 'GOOGLE') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (account.token && (window as any).gapi?.client) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).gapi.client.setToken({ access_token: account.token });
            }
            success = await sendGmail(composeData.to, composeData.subject, bodyContent, composeData.attachments);
        } else if (account.type === 'MICROSOFT') {
            success = await sendOutlookMail(composeData.to, composeData.subject, bodyContent, composeData.attachments);
        }

        setLoading(false);
        if (success) {
            setIsComposing(false);
            alert('Email sent successfully!');
        } else {
            alert('Failed to send email.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.accountSelector}>
                    <button
                        className={`${styles.accountBtn} ${activeAccount === 'all' ? styles.activeAccount : ''}`}
                        onClick={() => setActiveAccount('all')}
                    >
                        <div className={styles.avatar}>⊕</div>
                        <span>All Accounts</span>
                    </button>

                    {accounts.map(acc => (
                        <div key={acc.id} className={styles.accountItem}>
                            <button
                                className={`${styles.accountBtn} ${activeAccount === acc.id ? styles.activeAccount : ''}`}
                                onClick={() => setActiveAccount(acc.id)}
                            >
                                <div className={styles.avatar}>{acc.name?.[0] || '?'}</div>
                                <span>{acc.name || 'Unknown'}</span>
                            </button>
                            <button
                                className={styles.disconnectBtn}
                                onClick={() => handleDisconnect(acc.id)}
                                title="Disconnect"
                            >
                                <LogOut size={12} />
                            </button>
                        </div>
                    ))}

                    <div className={styles.addAccount}>
                        <button onClick={() => handleConnect('GOOGLE')}>
                            <PlusCircle size={14} /> Gmail
                        </button>
                        <button onClick={() => handleConnect('MICROSOFT')}>
                            <PlusCircle size={14} /> Outlook
                        </button>
                    </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.nav}>
                    <button className={styles.composeBtn} onClick={handleCompose}>
                        <Edit size={16} />
                        <span>Compose</span>
                    </button>
                    <div className={styles.divider} />
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`${styles.navItem} ${activeCategoryId === cat.id ? styles.active : ''}`}
                            onClick={() => setActiveCategoryId(cat.id)}
                        >
                            {cat.icon}
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.main}>
                <div className={styles.toolbar}>
                    <div className={styles.search}>
                        <Search size={14} />
                        <input type="text" placeholder="Search mail" />
                    </div>
                </div>

                <div className={styles.emailList}>
                    {selectedEmail ? (
                        <div className={styles.emailViewer}>
                            <div className={styles.viewerHeader}>
                                <div className={styles.viewerControls}>
                                    <button className={styles.backBtn} onClick={() => setSelectedEmail(null)}>
                                        ← Back
                                    </button>
                                    <div className={styles.actionBtns}>
                                        <button onClick={handleReply} title="Reply">
                                            <Reply size={18} />
                                        </button>
                                        <button onClick={handleForward} title="Forward">
                                            <Forward size={18} />
                                        </button>
                                        <button onClick={handleDelete} title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className={styles.viewerSubject}>{selectedEmail.subject}</h3>
                                <div className={styles.viewerMeta}>
                                    <span className={styles.viewerSender}>{selectedEmail.sender}</span>
                                    <span className={styles.viewerDate}>{selectedEmail.date}</span>
                                </div>
                            </div>
                            <div className={styles.viewerBody}>
                                {selectedEmail.body ? (
                                    <iframe
                                        title="Email Content"
                                        srcDoc={DOMPurify.sanitize(selectedEmail.body)}
                                        className={styles.emailFrame}
                                        style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }}
                                    />
                                ) : (
                                    <div className={styles.loading}>Loading email...</div>
                                )}
                            </div>
                        </div>
                    ) : loading ? (
                        <div className={styles.loading}>Loading emails...</div>
                    ) : emails.length === 0 ? (
                        <div className={styles.empty}>No emails found</div>
                    ) : (
                        emails.map(email => (
                            <div
                                key={email.id}
                                className={`${styles.emailItem} ${!email.read ? styles.unread : ''}`}
                                onClick={() => handleEmailClick(email)}
                            >
                                <div className={styles.emailLeft}>
                                    <button
                                        className={`${styles.starBtn} ${email.starred ? styles.starred : ''}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Star size={16} fill={email.starred ? "currentColor" : "none"} />
                                    </button>
                                    <div className={styles.sender}>{email.sender}</div>
                                </div>
                                <div className={styles.content}>
                                    <span className={styles.subject}>{email.subject}</span>
                                    <span className={styles.preview}> - {email.preview}</span>
                                </div>
                                <div className={styles.emailRight}>
                                    <span className={styles.date}>{email.date}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {isComposing && (
                <div className={styles.modalOverlay}>
                    <div className={styles.composeModal}>
                        <div className={styles.modalHeader}>
                            <h3>New Message</h3>
                            <button onClick={() => setIsComposing(false)}><X size={20} /></button>
                        </div>
                        <div className={styles.modalBody}>
                            <input
                                type="text"
                                placeholder="To"
                                value={composeData.to}
                                onChange={e => setComposeData({ ...composeData, to: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Subject"
                                value={composeData.subject}
                                onChange={e => setComposeData({ ...composeData, subject: e.target.value })}
                            />
                            <div
                                className={styles.richEditor}
                                contentEditable
                                ref={contentEditableRef}
                                onInput={(e) => setComposeData({ ...composeData, body: e.currentTarget.innerHTML })}
                            />

                            <div className={styles.attachments}>
                                {composeData.attachments.map((file, index) => (
                                    <div key={index} className={styles.attachmentItem}>
                                        <span>{file.name}</span>
                                        <button onClick={() => removeAttachment(index)}><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <label className={styles.attachBtn}>
                                <input type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
                                <Folder size={16} /> Attach
                            </label>
                            <button className={styles.sendBtn} onClick={handleSend} disabled={loading}>
                                {loading ? 'Sending...' : 'Send'} <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
