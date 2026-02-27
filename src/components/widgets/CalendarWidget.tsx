import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, addYears, subYears } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Bell, PlusCircle, LogOut } from 'lucide-react';
import { useLayout } from '../layout/LayoutContext';
import { useAccounts } from '../layout/AccountContext';
import { signInGoogle, signOutGoogle, fetchGoogleCalendarEvents, initGoogleClient } from '../../services/GoogleService';
import type { AccountType } from '../layout/AccountContext';
import styles from './CalendarWidget.module.css';

interface Reminder {
    id: string;
    date: string;
    text: string;
    source?: 'local' | 'google';
}

interface CalendarData {
    reminders: Reminder[];
}

interface CalendarWidgetProps {
    id: string;
    data?: CalendarData;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ id, data }) => {
    const { updateWidgetData } = useLayout();
    const { accounts, addAccount, removeAccount } = useAccounts();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddingReminder, setIsAddingReminder] = useState(false);
    const [reminderText, setReminderText] = useState('');
    const [activeAccount, setActiveAccount] = useState<string | 'all'>('all');
    const [googleEvents, setGoogleEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('month');

    const reminders = data?.reminders || [];

    useEffect(() => {
        initGoogleClient();
    }, []);

    useEffect(() => {
        if (activeAccount === 'local') return;

        if (activeAccount === 'all') {
            const googleAccounts = accounts.filter(a => a.type === 'GOOGLE');
            if (googleAccounts.length === 0) {
                setGoogleEvents([]);
                return;
            }
        }

        if (activeAccount !== 'all') {
            const account = accounts.find(a => a.id === activeAccount && a.type === 'GOOGLE');
            if (!account) {
                setGoogleEvents([]);
                return;
            }
        } else {
            return;
        }

        const account = accounts.find(a => a.id === activeAccount && a.type === 'GOOGLE');
        if (!account) return;

        const loadEvents = async () => {
            setLoading(true);
            try {
                if (account.token && (window as any).gapi?.client) {
                    (window as any).gapi.client.setToken({ access_token: account.token });
                }

                const monthStart = startOfMonth(currentDate);
                const monthEnd = endOfMonth(currentDate);
                const events = await fetchGoogleCalendarEvents(monthStart, monthEnd);
                setGoogleEvents(events);
            } catch (error) {
                console.error('Failed to loadcalendar events', error);
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, [activeAccount, accounts, currentDate]);

    const updateReminders = (newReminders: Reminder[]) => {
        updateWidgetData(id, { reminders: newReminders });
    };

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
    });

    const startDay = startOfMonth(currentDate).getDay();
    const paddingDays = Array(startDay === 0 ? 6 : startDay - 1).fill(null);

    const handleNavigation = (direction: 'prev' | 'next') => {
        const operations = {
            day: { prev: subDays, next: addDays },
            week: { prev: subWeeks, next: addWeeks },
            month: { prev: subMonths, next: addMonths },
            year: { prev: subYears, next: addYears }
        };

        const op = operations[viewMode][direction];
        const newDate = op(currentDate, 1);
        setCurrentDate(newDate);
        if (viewMode === 'day') setSelectedDate(newDate);
    };

    const handlePrev = () => handleNavigation('prev');
    const handleNext = () => handleNavigation('next');

    const getHeaderTitle = () => {
        switch (viewMode) {
            case 'day':
                return format(currentDate, 'MMMM d, yyyy');
            case 'week':
                const start = startOfWeek(currentDate, { weekStartsOn: 1 });
                const end = endOfWeek(currentDate, { weekStartsOn: 1 });
                if (start.getFullYear() !== end.getFullYear()) {
                    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
                }
                return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
            case 'month':
                return format(currentDate, 'MMMM yyyy');
            case 'year':
                return format(currentDate, 'yyyy');
        }
    };

    const handleAddReminder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reminderText.trim()) return;

        const newReminder: Reminder = {
            id: Date.now().toString(),
            date: selectedDate.toISOString(),
            text: reminderText
        };

        updateReminders([...reminders, newReminder]);
        setReminderText('');
        setIsAddingReminder(false);
    };

    const getRemindersForDate = (date: Date) => {
        return reminders.filter(r => isSameDay(new Date(r.date), date));
    };

    const handleConnect = async (type: AccountType) => {
        try {
            const accountData = await signInGoogle();
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
            }
        } catch (error) {
            console.error('Failed to connect Google Calendar:', error);
            alert('Failed to connect. Please check console for details.');
        }
    };

    const handleDisconnect = async (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        if (account?.type === 'GOOGLE') await signOutGoogle();
        removeAccount(accountId);
        if (activeAccount === accountId) setActiveAccount('all');
    };

    const getCombinedRemindersForDate = (date: Date) => {
        const localReminders = getRemindersForDate(date);

        if (activeAccount === 'all') {
            const googleReminders = googleEvents
                .filter(event => {
                    const eventDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date);
                    return isSameDay(eventDate, date);
                })
                .map(event => ({
                    id: event.id,
                    date: event.start.dateTime || event.start.date,
                    text: event.summary || 'Untitled Event',
                    source: 'google' as const
                }));
            return [...localReminders, ...googleReminders];
        } else if (activeAccount !== 'all') {
            const googleReminders = googleEvents
                .filter(event => {
                    const eventDate = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date);
                    return isSameDay(eventDate, date);
                })
                .map(event => ({
                    id: event.id,
                    date: event.start.dateTime || event.start.date,
                    text: event.summary || 'Untitled Event',
                    source: 'google' as const
                }));
            return googleReminders;
        }

        return localReminders;
    };


    const selectedReminders = getCombinedRemindersForDate(selectedDate);

    return (
        <div className={styles.container}>
            {}
            <div className={styles.accountSelector}>
                <button
                    className={`${styles.accountBtn} ${activeAccount === 'all' ? styles.activeAccount : ''}`}
                    onClick={() => setActiveAccount('all')}
                >
                    ⊕ All Accounts
                </button>
                {accounts.filter(a => a.type === 'GOOGLE').map(acc => (
                    <div key={acc.id} className={styles.accountItem}>
                        <button
                            className={`${styles.accountBtn} ${activeAccount === acc.id ? styles.activeAccount : ''}`}
                            onClick={() => setActiveAccount(acc.id)}
                        >
                            {acc.name || acc.email}
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
                <button className={styles.addAccountBtn} onClick={() => handleConnect('GOOGLE')}>
                    <PlusCircle size={14} /> Google Calendar
                </button>
            </div>

            <div className={styles.calendarSection}>
                <div className={styles.header}>
                    <div className={styles.navControls}>
                        <button onClick={handlePrev}><ChevronLeft size={16} /></button>
                        <span className={styles.monthTitle}>
                            {getHeaderTitle()}
                        </span>
                        <button onClick={handleNext}><ChevronRight size={16} /></button>
                    </div>
                    <div className={styles.viewSwitcher}>
                        {(['day', 'week', 'month', 'year'] as const).map(mode => (
                            <button
                                key={mode}
                                className={`${styles.viewBtn} ${viewMode === mode ? styles.activeView : ''}`}
                                onClick={() => setViewMode(mode)}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {viewMode === 'month' && (
                    <>
                        <div className={styles.weekdays}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                <div key={i} className={styles.weekday}>{d}</div>
                            ))}
                        </div>
                        <div className={styles.grid}>
                            {paddingDays.map((_, i) => (
                                <div key={`padding-${i}`} className={styles.dayEmpty} />
                            ))}
                            {days.map(day => {
                                const dayReminders = getCombinedRemindersForDate(day);
                                const isSelected = isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, currentDate);

                                return (
                                    <button
                                        key={day.toString()}
                                        className={`
                                          ${styles.day} 
                                          ${!isCurrentMonth ? styles.dayOutside : ''} 
                                          ${isSelected ? styles.daySelected : ''}
                                          ${isToday(day) ? styles.dayToday : ''}
                                        `}
                                        onClick={() => setSelectedDate(day)}
                                    >
                                        {format(day, 'd')}
                                        {dayReminders.length > 0 && (
                                            <div className={styles.dot} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {viewMode === 'week' && (
                    <div className={styles.weekView}>
                        {eachDayOfInterval({
                            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                            end: endOfWeek(currentDate, { weekStartsOn: 1 })
                        }).map(day => {
                            const dayReminders = getCombinedRemindersForDate(day);
                            const isSelected = isSameDay(day, selectedDate);
                            return (
                                <div
                                    key={day.toString()}
                                    className={`${styles.weekDayColumn} ${isSelected ? styles.selectedColumn : ''}`}
                                    onClick={() => setSelectedDate(day)}
                                >
                                    <div className={styles.weekDayHeader}>
                                        <span className={styles.weekDayName}>{format(day, 'EEE')}</span>
                                        <span className={styles.weekDayDate}>{format(day, 'd')}</span>
                                    </div>
                                    <div className={styles.weekDayEvents}>
                                        {dayReminders.map(r => (
                                            <div key={r.id} className={styles.weekEventDot} title={r.text} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {viewMode === 'day' && (
                    <div className={styles.dayView}>
                        <div className={styles.dayHeader}>
                            <h2>{format(selectedDate, 'EEEE, MMMM do')}</h2>
                        </div>
                        <div className={styles.dayEventsList}>
                            {getCombinedRemindersForDate(selectedDate).length === 0 ? (
                                <div className={styles.emptyDay}>No events</div>
                            ) : (
                                getCombinedRemindersForDate(selectedDate).map(r => (
                                    <div key={r.id} className={styles.dayEventItem}>
                                        <div className={styles.eventTime}>
                                            {format(new Date(r.date), 'HH:mm')}
                                        </div>
                                        <div className={styles.eventContent}>
                                            <div className={styles.eventTitle}>{r.text}</div>
                                            {r.source === 'google' && <div className={styles.eventSource}>Google</div>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {viewMode === 'year' && (
                    <div className={styles.yearView}>
                        {Array.from({ length: 12 }).map((_, i) => {
                            const monthDate = new Date(currentDate.getFullYear(), i, 1);
                            return (
                                <button
                                    key={i}
                                    className={styles.yearMonthBtn}
                                    onClick={() => {
                                        setCurrentDate(monthDate);
                                        setViewMode('month');
                                    }}
                                >
                                    {format(monthDate, 'MMM')}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className={styles.remindersSection}>
                <div className={styles.remindersHeader}>
                    <span>{format(selectedDate, 'MMM d')}</span>
                    {activeAccount === 'all' && (
                        <button
                            className={styles.addBtn}
                            onClick={() => setIsAddingReminder(true)}
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>

                {loading && <div className={styles.loading}>Loading events...</div>}

                {isAddingReminder && activeAccount === 'all' && (
                    <form onSubmit={handleAddReminder} className={styles.addForm}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="New reminder..."
                            value={reminderText}
                            onChange={e => setReminderText(e.target.value)}
                            onBlur={() => !reminderText && setIsAddingReminder(false)}
                        />
                    </form>
                )}

                <div className={styles.remindersList}>
                    {selectedReminders.length === 0 ? (
                        <div className={styles.emptyState}>No events or reminders</div>
                    ) : (
                        selectedReminders.map(reminder => (
                            <div key={reminder.id} className={styles.reminderItem}>
                                <Bell size={12} className={styles.reminderIcon} />
                                <span>{reminder.text}</span>
                                {reminder.source === 'google' && (
                                    <span className={styles.badge}>Google</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div >
    );
};
