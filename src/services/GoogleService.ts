const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const SCOPES = 'openid profile email https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.readonly';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const gapi: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tokenClient: any;
let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

export const initGoogleClient = async () => {
    if (!CLIENT_ID) return false;
    if (isInitialized) return true;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        const gisPromise = new Promise<void>((resolve) => {
            if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            document.body.appendChild(script);
        });

        const gapiPromise = new Promise<void>((resolve) => {
            if (typeof gapi !== 'undefined' && gapi.client) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                gapi.load('client', () => {
                    gapi.client.setApiKey(API_KEY);
                    Promise.all([
                        gapi.client.load('gmail', 'v1'),
                        gapi.client.load('drive', 'v3'),
                        gapi.client.load('calendar', 'v3')
                    ]).then(() => resolve());
                });
            };
            document.body.appendChild(script);
        });

        await Promise.all([gisPromise, gapiPromise]);

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '',
        });

        isInitialized = true;
        return true;
    })();

    return initPromise;
};

export const signInGoogle = async () => {
    if (!tokenClient) {
        await initGoogleClient();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Promise<any>((resolve, reject) => {
        try {
            if (!tokenClient) {
                reject(new Error('Google Token Client not initialized'));
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tokenClient.callback = async (resp: any) => {
                if (resp.error) {
                    reject(resp);
                    return;
                }

                if (gapi.client) gapi.client.setToken(resp);

                const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${resp.access_token}` }
                }).then(r => r.json());

                resolve({
                    id: userInfo.sub,
                    name: userInfo.name,
                    email: userInfo.email,
                    avatar: userInfo.picture,
                    token: resp.access_token
                });
            };

            tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (error) {
            console.error('Google Sign In Error', error);
            reject(error);
        }
    });
};

export const signOutGoogle = async () => {
    if (typeof gapi === 'undefined' || !gapi.client) return;

    const token = gapi.client.getToken();
    if (token !== null) {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            google.accounts.oauth2.revoke(token.access_token, () => { });
        }
        gapi.client.setToken(null);
    }
};

export const fetchGmailLabels = async () => {
    try {
        if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.gmail) {
            return [];
        }

        const response = await gapi.client.gmail.users.labels.list({
            userId: 'me'
        });
        return response.result.labels || [];
    } catch (error) {
        console.error('Error fetching Gmail labels', error);
        return [];
    }
};

export const fetchGmailMessages = async (labelId: string = 'INBOX') => {
    try {
        if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.gmail) {
            return [];
        }

        const response = await gapi.client.gmail.users.messages.list({
            userId: 'me',
            maxResults: 20,
            labelIds: [labelId]
        });
        const messages = response.result.messages || [];

        const fullMessages = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages.map(async (msg: any) => {
                const detail = await gapi.client.gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'metadata',
                    metadataHeaders: ['From', 'Subject']
                });
                return detail.result;
            })
        );

        return fullMessages;
    } catch (error) {
        console.error('Error fetching Gmail', error);
        return [];
    }
};

export const fetchGoogleDriveFiles = async (parentId: string = 'root') => {
    try {
        if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.drive) {
            return [];
        }

        const response = await gapi.client.drive.files.list({
            'pageSize': 20,
            'q': `'${parentId}' in parents and trashed = false`,
            'fields': "nextPageToken, files(id, name, mimeType, size, modifiedTime, iconLink, thumbnailLink, webViewLink)",
            'orderBy': 'folder,name'
        });
        return response.result.files || [];
    } catch (error) {
        console.error('Error fetching Drive files', error);
        return [];
    }
};

const NOTES_FOLDER_NAME = 'MY HUB NOTES';

export const ensureNotesFolder = async () => {
    try {
        if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.drive) return null;

        const response = await gapi.client.drive.files.list({
            q: `name = '${NOTES_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id)',
            spaces: 'drive'
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            return files[0].id;
        }

        const fileMetadata = {
            'name': NOTES_FOLDER_NAME,
            'mimeType': 'application/vnd.google-apps.folder'
        };

        const createResponse = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });

        return createResponse.result.id;
    } catch (error) {
        console.error('Error ensuring notes folder', error);
        return null;
    }
};

export const listNotes = async () => {
    try {
        const folderId = await ensureNotesFolder();
        if (!folderId) return [];

        const response = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and mimeType = 'text/plain' and trashed = false`,
            fields: 'files(id, name, modifiedTime)',
            orderBy: 'modifiedTime desc'
        });

        return response.result.files || [];
    } catch (error) {
        console.error('Error listing notes', error);
        return [];
    }
};

export const getNoteContent = async (fileId: string) => {
    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media'
        });
        return response.body;
    } catch (error) {
        console.error('Error reading note content', error);
        return '';
    }
};

export const createNote = async (title: string, content: string) => {
    try {
        const folderId = await ensureNotesFolder();
        if (!folderId) return null;

        const metadata = {
            name: title.endsWith('.txt') ? title : `${title}.txt`,
            mimeType: 'text/plain',
            parents: [folderId]
        };

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: text/plain\r\n\r\n' +
            content +
            close_delim;

        const request = gapi.client.request({
            'path': '/upload/drive/v3/files',
            'method': 'POST',
            'params': { 'uploadType': 'multipart' },
            'headers': {
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody
        });

        const response = await request;
        return response.result;
    } catch (error) {
        console.error('Error creating note', error);
        return null;
    }
};

export const updateNote = async (fileId: string, title: string, content: string) => {
    try {
        const updateContentRequest = gapi.client.request({
            'path': `/upload/drive/v3/files/${fileId}`,
            'method': 'PATCH',
            'params': { 'uploadType': 'media' },
            'body': content
        });
        await updateContentRequest;

        const newName = title.endsWith('.txt') ? title : `${title}.txt`;
        await gapi.client.drive.files.update({
            fileId: fileId,
            resource: { name: newName }
        });

        return true;
    } catch (error) {
        console.error('Error updating note', error);
        return false;
    }
};

export const deleteNote = async (fileId: string) => {
    try {
        await gapi.client.drive.files.update({
            fileId: fileId,
            resource: { trashed: true }
        });
        return true;
    } catch (error) {
        console.error('Error deleting note', error);
        return false;
    }
};

export const fetchGoogleCalendarEvents = async (startDate?: Date, endDate?: Date) => {
    try {
        if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.calendar) {
            return [];
        }

        const timeMin = startDate ? startDate.toISOString() : new Date().toISOString();
        const timeMax = endDate ? endDate.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': timeMin,
            'timeMax': timeMax,
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 100,
            'orderBy': 'startTime'
        });
        return response.result.items || [];
    } catch (error) {
        console.error('Error fetching Calendar events', error);
        return [];
    }
};

export const sendGmail = async (to: string, subject: string, body: string, attachments: File[] = []) => {
    try {
        if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.gmail) {
            return false;
        }

        const boundary = 'foo_bar_baz';
        const parts = [
            `--${boundary}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            '',
            body
        ];

        for (const file of attachments) {
            const base64Content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });

            parts.push(`--${boundary}`);
            parts.push(`Content-Type: ${file.type}; name="${file.name}"`);
            parts.push(`Content-Disposition: attachment; filename="${file.name}"`);
            parts.push('Content-Transfer-Encoding: base64');
            parts.push('');
            parts.push(base64Content);
        }

        parts.push(`--${boundary}--`);

        const email = [
            `To: ${to}`,
            `Subject: ${subject}`,
            `Content-Type: multipart/mixed; boundary="${boundary}"`,
            'MIME-Version: 1.0',
            '',
            parts.join('\n')
        ].join('\n');

        const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        await gapi.client.gmail.users.messages.send({
            userId: 'me',
            resource: {
                raw: base64EncodedEmail
            }
        });

        return true;
    } catch (error) {
        console.error('Error sending Gmail', error);
        return false;
    }
};

export const markGmailAsRead = async (messageId: string) => {
    try {
        if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.gmail) {
            return false;
        }

        await gapi.client.gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            resource: {
                removeLabelIds: ['UNREAD']
            }
        });
        return true;
    } catch (error) {
        console.error('Error marking Gmail as read', error);
        return false;
    }
};

export const trashGmailMessage = async (messageId: string) => {
    try {
        if (typeof gapi === 'undefined' || !gapi.client || !gapi.client.gmail) {
            return false;
        }

        await gapi.client.gmail.users.messages.trash({
            userId: 'me',
            id: messageId
        });
        return true;
    } catch (error) {
        console.error('Error trashing Gmail message', error);
        return false;
    }
};
