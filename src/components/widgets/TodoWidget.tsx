import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, List } from 'lucide-react';
import { useLayout } from '../layout/LayoutContext';
import styles from './TodoWidget.module.css';

interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
}

interface TodoList {
    id: string;
    name: string;
    items: TodoItem[];
}

interface TodoData {
    lists: TodoList[];
    activeListId: string;
}

interface TodoWidgetProps {
    id: string;
    data?: TodoData;
}

const initialData: TodoData = {
    lists: [
        { id: 'default', name: 'Tasks', items: [] }
    ],
    activeListId: 'default'
};

export const TodoWidget: React.FC<TodoWidgetProps> = ({ id, data = initialData }) => {
    const { updateWidgetData } = useLayout();
    const [newTaskText, setNewTaskText] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);
    const [newListName, setNewListName] = useState('');

    const safeData = data.lists ? data : initialData;
    const activeList = safeData.lists.find(l => l.id === safeData.activeListId) || safeData.lists[0];

    const updateData = (newData: TodoData) => {
        updateWidgetData(id, newData);
    };

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;

        const newItem: TodoItem = {
            id: Date.now().toString(),
            text: newTaskText,
            completed: false
        };

        const newLists = safeData.lists.map(list => {
            if (list.id === activeList.id) {
                return { ...list, items: [...list.items, newItem] };
            }
            return list;
        });

        updateData({ ...safeData, lists: newLists });
        setNewTaskText('');
    };

    const toggleTask = (taskId: string) => {
        const newLists = safeData.lists.map(list => {
            if (list.id === activeList.id) {
                const newItems = list.items.map(item =>
                    item.id === taskId ? { ...item, completed: !item.completed } : item
                );
                return { ...list, items: newItems };
            }
            return list;
        });
        updateData({ ...safeData, lists: newLists });
    };

    const deleteTask = (taskId: string) => {
        const newLists = safeData.lists.map(list => {
            if (list.id === activeList.id) {
                return { ...list, items: list.items.filter(item => item.id !== taskId) };
            }
            return list;
        });
        updateData({ ...safeData, lists: newLists });
    };

    const addList = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        const newList: TodoList = {
            id: Date.now().toString(),
            name: newListName,
            items: []
        };

        updateData({
            lists: [...safeData.lists, newList],
            activeListId: newList.id
        });
        setNewListName('');
        setIsAddingList(false);
    };

    const switchList = (listId: string) => {
        updateData({ ...safeData, activeListId: listId });
    };

    const deleteList = (e: React.MouseEvent, listId: string) => {
        e.stopPropagation();
        if (safeData.lists.length <= 1) return;

        const newLists = safeData.lists.filter(l => l.id !== listId);
        updateData({
            lists: newLists,
            activeListId: newLists[0].id
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.listsHeader}>
                    <span>Lists</span>
                    <button onClick={() => setIsAddingList(true)} className={styles.iconBtn}>
                        <Plus size={14} />
                    </button>
                </div>

                <div className={styles.listsContainer}>
                    {safeData.lists.map(list => (
                        <div
                            key={list.id}
                            className={`${styles.listItem} ${list.id === activeList.id ? styles.activeList : ''}`}
                            onClick={() => switchList(list.id)}
                        >
                            <List size={14} />
                            <span className={styles.listName}>{list.name}</span>
                            {safeData.lists.length > 1 && (
                                <button
                                    className={styles.deleteListBtn}
                                    onClick={(e) => deleteList(e, list.id)}
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {isAddingList && (
                    <form onSubmit={addList} className={styles.addListForm}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="List name..."
                            value={newListName}
                            onChange={e => setNewListName(e.target.value)}
                            onBlur={() => !newListName && setIsAddingList(false)}
                        />
                    </form>
                )}
            </div>

            <div className={styles.main}>
                <div className={styles.header}>
                    <h3>{activeList.name}</h3>
                    <span className={styles.count}>
                        {activeList.items.filter(i => i.completed).length}/{activeList.items.length}
                    </span>
                </div>

                <form onSubmit={addTask} className={styles.addTaskForm}>
                    <input
                        type="text"
                        placeholder="Add a task..."
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                    />
                    <button type="submit" disabled={!newTaskText.trim()}>
                        <Plus size={18} />
                    </button>
                </form>

                <div className={styles.tasksList}>
                    {activeList.items.length === 0 ? (
                        <div className={styles.emptyState}>No tasks yet</div>
                    ) : (
                        activeList.items.map(item => (
                            <div key={item.id} className={`${styles.taskItem} ${item.completed ? styles.completed : ''}`}>
                                <button
                                    className={styles.checkBtn}
                                    onClick={() => toggleTask(item.id)}
                                >
                                    {item.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                                </button>
                                <span className={styles.taskText}>{item.text}</span>
                                <button
                                    className={styles.deleteTaskBtn}
                                    onClick={() => deleteTask(item.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
