import React, { useState, useEffect } from 'react';
import { Folder, FileText, Image, File, MoreVertical, Grid, List as ListIcon, ChevronRight, PlusCircle, LogOut } from 'lucide-react';
import { useAccounts } from '../layout/AccountContext';
import type { AccountType } from '../layout/AccountContext';
import { signInGoogle, signOutGoogle, fetchGoogleDriveFiles } from '../../services/GoogleService';
import { signInMicrosoft, signOutMicrosoft, fetchOneDriveFiles } from '../../services/MicrosoftService';
import styles from './DriveWidget.module.css';

import { mapGoogleFileToDriveItem, mapOneDriveFileToDriveItem, type DriveItem } from '../../utils/driveUtils';

export const DriveWidget: React.FC = () => {
    const { accounts, addAccount, removeAccount } = useAccounts();
    const [activeAccount, setActiveAccount] = useState<string | 'all'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentFolderId, setCurrentFolderId] = useState<string>('root');
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Home' }]);
    const [files, setFiles] = useState<DriveItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadFiles = async () => {
            if (accounts.length === 0) {
                setFiles([]);
                return;
            }

            setLoading(true);
            try {
                let fetchedFiles: DriveItem[] = [];

                if (activeAccount === 'all') {
                    if (currentFolderId !== 'root') {
                        setCurrentFolderId('root');
                        setBreadcrumbs([{ id: 'root', name: 'Home' }]);
                    }

                    for (const account of accounts) {
                        if (account.type === 'GOOGLE' && account.token) {
                            (window as any).gapi?.client?.setToken({ access_token: account.token });
                            const driveFiles = await fetchGoogleDriveFiles('root');
                            fetchedFiles.push(...driveFiles.map((f: any) => mapGoogleFileToDriveItem(f, account.id)));
                        } else if (account.type === 'MICROSOFT') {
                            const driveFiles = await fetchOneDriveFiles();
                            fetchedFiles.push(...driveFiles.map((f: any) => mapOneDriveFileToDriveItem(f, account.id)));
                        }
                    }
                } else {
                    const account = accounts.find(a => a.id === activeAccount);
                    if (!account) {
                        setFiles([]);
                        setLoading(false);
                        return;
                    }

                    if (account.type === 'GOOGLE') {
                        if (account.token && (window as any).gapi?.client) {
                            (window as any).gapi.client.setToken({ access_token: account.token });
                        }
                        const driveFiles = await fetchGoogleDriveFiles(currentFolderId);
                        fetchedFiles = driveFiles.map((f: any) => mapGoogleFileToDriveItem(f));
                    } else if (account.type === 'MICROSOFT') {
                        const driveFiles = await fetchOneDriveFiles();
                        fetchedFiles = driveFiles.map((f: any) => mapOneDriveFileToDriveItem(f));
                    }
                }

                setFiles(fetchedFiles);
            } catch (error) {
                console.error('Failed to load files', error);
            } finally {
                setLoading(false);
            }
        };

        loadFiles();
    }, [activeAccount, accounts, currentFolderId]);

    const handleItemClick = (item: any) => {
        if (item.type === 'folder') {
            if (activeAccount === 'all') {
                const [accountId, realId] = item.id.split('::');
                setActiveAccount(accountId);
                setCurrentFolderId(realId);
                setBreadcrumbs([
                    { id: 'root', name: 'Home' },
                    { id: realId, name: item.name }
                ]);
            } else {
                setCurrentFolderId(item.id);
                setBreadcrumbs([...breadcrumbs, { id: item.id, name: item.name }]);
            }
        } else if (item.webViewLink) {
            window.open(item.webViewLink, '_blank');
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        const target = breadcrumbs[index];
        setCurrentFolderId(target.id);
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    };

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



    const getIcon = (type: DriveItem['type']) => {
        switch (type) {
            case 'folder': return <Folder className={styles.iconFolder} size={48} />;
            case 'document': return <FileText className={styles.iconDoc} size={48} />;
            case 'image': return <Image className={styles.iconImage} size={48} />;
            default: return <File className={styles.iconFile} size={48} />;
        }
    };

    const getSmallIcon = (type: DriveItem['type']) => {
        switch (type) {
            case 'folder': return <Folder className={styles.iconFolder} size={20} />;
            case 'document': return <FileText className={styles.iconDoc} size={20} />;
            case 'image': return <Image className={styles.iconImage} size={20} />;
            default: return <File className={styles.iconFile} size={20} />;
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
                            <PlusCircle size={14} /> Google Drive
                        </button>
                        <button onClick={() => handleConnect('MICROSOFT')}>
                            <PlusCircle size={14} /> OneDrive
                        </button>

                    </div>
                </div>
            </div>

            <div className={styles.main}>
                <div className={styles.toolbar}>
                    <div className={styles.breadcrumbs}>
                        {breadcrumbs.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {index > 0 && <ChevronRight size={14} className={styles.separator} />}
                                <button
                                    className={styles.crumb}
                                    onClick={() => handleBreadcrumbClick(index)}
                                >
                                    {item.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon size={16} />
                        </button>
                    </div>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>Loading files...</div>
                    ) : files.length === 0 ? (
                        <div className={styles.empty}>No files found</div>
                    ) : viewMode === 'grid' ? (
                        <div className={styles.grid}>
                            {files.map(item => (
                                <div
                                    key={item.id}
                                    className={styles.gridItem}
                                    onClick={() => handleItemClick(item)}
                                    style={{ cursor: item.type === 'folder' ? 'pointer' : 'default' }}
                                >
                                    <div className={styles.gridIcon}>
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt={item.name} className={styles.thumbnail} />
                                        ) : (
                                            getIcon(item.type)
                                        )}
                                    </div>
                                    <div className={styles.gridInfo}>
                                        <span className={styles.gridName}>{item.name}</span>
                                        <span className={styles.gridMeta}>{item.type === 'folder' ? item.date : item.size}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.list}>
                            <div className={styles.listHeader}>
                                <span className={styles.colName}>Name</span>
                                <span className={styles.colDate}>Date Modified</span>
                                <span className={styles.colSize}>Size</span>
                                <span className={styles.colAction}></span>
                            </div>
                            {files.map(item => (
                                <div
                                    key={item.id}
                                    className={styles.listItem}
                                    onClick={() => handleItemClick(item)}
                                    style={{ cursor: item.type === 'folder' ? 'pointer' : 'default' }}
                                >
                                    <div className={styles.listName}>
                                        {getSmallIcon(item.type)}
                                        <span>{item.name}</span>
                                    </div>
                                    <span className={styles.listDate}>{item.date}</span>
                                    <span className={styles.listSize}>{item.size || '-'}</span>
                                    <button className={styles.moreBtn}>
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
