import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';

const CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';

const msalConfig = {
    auth: {
        clientId: CLIENT_ID,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
    }
};

export const msalInstance = new PublicClientApplication(msalConfig);

if (CLIENT_ID) {
    msalInstance.initialize().then(() => {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
        }

        msalInstance.addEventCallback((event) => {
            if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
                const payload = event.payload as any;
                const account = payload.account;
                msalInstance.setActiveAccount(account);
            }
        });
    }).catch(console.error);
}

const getGraphClient = async () => {
    const account = msalInstance.getActiveAccount();
    if (!account) {
        throw new Error('No active account! Verify a user has been signed in and setActiveAccount has been called.');
    }

    const response = await msalInstance.acquireTokenSilent({
        scopes: ['User.Read', 'Mail.Read', 'Files.Read'],
        account: account
    });

    return Client.init({
        authProvider: (done) => {
            done(null, response.accessToken);
        }
    });
};

export const signInMicrosoft = async () => {
    if (!CLIENT_ID) throw new Error('Microsoft Client ID not configured');

    try {
        const loginResponse = await msalInstance.loginPopup({
            scopes: ['User.Read', 'Mail.Read', 'Files.Read'],
            prompt: 'select_account'
        });

        return {
            id: loginResponse.account.homeAccountId,
            name: loginResponse.account.name || '',
            email: loginResponse.account.username || '',
            token: loginResponse.accessToken
        };
    } catch (error) {
        console.error('Microsoft Sign In Error', error);
        throw error;
    }
};

export const signOutMicrosoft = async () => {
    await msalInstance.logoutPopup();
};

export const fetchOutlookFolders = async () => {
    try {
        const client = await getGraphClient();
        const response = await client.api('/me/mailFolders')
            .top(20)
            .select('id,displayName,totalItemCount,unreadItemCount')
            .get();
        return response.value;
    } catch (error) {
        console.error('Error fetching Outlook folders', error);
        return [];
    }
};

export const fetchOutlookMessages = async (folderId?: string) => {
    try {
        const client = await getGraphClient();
        let apiPath = '/me/messages';

        if (folderId) {
            apiPath = `/me/mailFolders/${folderId}/messages`;
        }

        const response = await client.api(apiPath)
            .top(20)
            .select('id,subject,sender,bodyPreview,receivedDateTime,isRead,flag')
            .orderby('receivedDateTime DESC')
            .get();
        return response.value;
    } catch (error) {
        console.error('Error fetching Outlook', error);
        return [];
    }
};

export const fetchOneDriveFiles = async () => {
    try {
        const client = await getGraphClient();
        const response = await client.api('/me/drive/root/children')
            .select('id,name,file,folder,size,lastModifiedDateTime,webUrl')
            .get();
        return response.value;
    } catch (error) {
        console.error('Error fetching OneDrive', error);
        return [];
    }
};
export const sendOutlookMail = async (to: string, subject: string, body: string, attachments: File[] = []) => {
    try {
        const client = await getGraphClient();

        const fileAttachments = await Promise.all(attachments.map(async (file) => {
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

            return {
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: file.name,
                contentType: file.type,
                contentBytes: base64Content
            };
        }));

        const sendMail = {
            message: {
                subject: subject,
                body: {
                    contentType: 'HTML',
                    content: body
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: to
                        }
                    }
                ],
                attachments: fileAttachments
            },
            saveToSentItems: 'true'
        };

        await client.api('/me/sendMail')
            .post(sendMail);
        return true;
    } catch (error) {
        console.error('Error sending Outlook mail', error);
        return false;
    }
};

export const markOutlookAsRead = async (messageId: string) => {
    try {
        const client = await getGraphClient();
        await client.api(`/me/messages/${messageId}`)
            .update({ isRead: true });
        return true;
    } catch (error) {
        console.error('Error marking Outlook mail as read', error);
        return false;
    }
};

export const deleteOutlookMessage = async (messageId: string) => {
    try {
        const client = await getGraphClient();
        await client.api(`/me/messages/${messageId}`)
            .delete();
        return true;
    } catch (error) {
        console.error('Error deleting Outlook message', error);
        return false;
    }
};
