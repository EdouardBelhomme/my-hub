export interface DriveItem {
    id: string;
    name: string;
    type: 'folder' | 'document' | 'image' | 'file';
    size?: string;
    date: string;
    thumbnail?: string;
    webViewLink?: string;
    accountId?: string;
}

export const mapGoogleFileToDriveItem = (f: any, accountId?: string): DriveItem => ({
    id: accountId ? `${accountId}::${f.id}` : f.id,
    name: f.name,
    type: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' :
        f.mimeType?.includes('image') ? 'image' :
            f.mimeType?.includes('pdf') || f.mimeType?.includes('document') ? 'document' : 'file',
    size: f.size ? `${(Number(f.size) / 1024 / 1024).toFixed(1)} MB` : '-',
    date: new Date(f.modifiedTime).toLocaleDateString(),
    thumbnail: f.thumbnailLink,
    webViewLink: f.webViewLink,
    accountId
});

export const mapOneDriveFileToDriveItem = (f: any, accountId?: string): DriveItem => ({
    id: accountId ? `${accountId}::${f.id}` : f.id,
    name: f.name,
    type: f.folder ? 'folder' :
        f.file?.mimeType?.includes('image') ? 'image' : 'file',
    size: f.size ? `${(Number(f.size) / 1024 / 1024).toFixed(1)} MB` : '-',
    date: new Date(f.lastModifiedDateTime).toLocaleDateString(),
    webViewLink: f.webUrl,
    accountId
});
