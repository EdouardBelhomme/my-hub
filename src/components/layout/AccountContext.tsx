import React, { createContext, useContext, useState, useEffect } from 'react';

export type AccountType = 'GOOGLE' | 'MICROSOFT';

export interface ConnectedAccount {
    id: string;
    type: AccountType;
    name: string;
    email: string;
    avatar?: string;
    isAuthenticated: boolean;
    token?: string;
}

interface AccountContextType {
    accounts: ConnectedAccount[];
    addAccount: (account: ConnectedAccount) => void;
    removeAccount: (id: string) => void;
    getAccount: (type: AccountType) => ConnectedAccount | undefined;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [accounts, setAccounts] = useState<ConnectedAccount[]>(() => {
        const saved = localStorage.getItem('myhub-accounts');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('myhub-accounts', JSON.stringify(accounts));
    }, [accounts]);

    const addAccount = (account: ConnectedAccount) => {
        setAccounts(prev => {
            const exists = prev.find(a => a.id === account.id);
            if (exists) return prev;
            return [...prev, account];
        });
    };

    const removeAccount = (id: string) => {
        setAccounts(prev => prev.filter(a => a.id !== id));
    };

    const getAccount = (type: AccountType) => {
        return accounts.find(a => a.type === type);
    };

    return (
        <AccountContext.Provider value={{ accounts, addAccount, removeAccount, getAccount }}>
            {children}
        </AccountContext.Provider>
    );
};

export const useAccounts = () => {
    const context = useContext(AccountContext);
    if (!context) throw new Error('useAccounts must be used within an AccountProvider');
    return context;
};
