'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Trash2,
    Mail,
    MailOpen,
    Clock,
    User,
    RefreshCw
} from 'lucide-react';

interface Message {
    id: number;
    name: string;
    email: string;
    content: string;
    created_at: string;
    is_read: boolean;
}

export default function MessagesTab() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExpand = async (msg: Message) => {
        if (expandedId === msg.id) {
            setExpandedId(null);
            return;
        }

        setExpandedId(msg.id);

        // Mark as read if not already
        if (!msg.is_read) {
            try {
                await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .eq('id', msg.id);

                // Update local state
                setMessages(prev => prev.map(m =>
                    m.id === msg.id ? { ...m, is_read: true } : m
                ));
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent expanding when clicking delete
        if (!confirm('確定要刪除這則訊息嗎？')) return;

        try {
            const { error } = await supabase.from('messages').delete().eq('id', id);
            if (error) throw error;
            setMessages(messages.filter(m => m.id !== id));
            if (expandedId === id) setExpandedId(null);
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('刪除失敗');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && messages.length === 0) return <div>載入中...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-semibold text-white">收件匣 ({messages.length})</h3>
                <button
                    onClick={fetchMessages}
                    className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors"
                    title="重新整理"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="space-y-3">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`bg-neutral-800/50 rounded-xl border transition-all cursor-pointer overflow-hidden ${expandedId === msg.id
                                ? 'border-blue-500/50 ring-1 ring-blue-500/20'
                                : msg.is_read
                                    ? 'border-neutral-800 hover:border-neutral-700'
                                    : 'border-blue-500/30 bg-blue-500/5'
                            }`}
                        onClick={() => handleExpand(msg)}
                    >
                        {/* Header */}
                        <div className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`p-2 rounded-full ${msg.is_read ? 'bg-neutral-800 text-neutral-500' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {msg.is_read ? <MailOpen size={20} /> : <Mail size={20} />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className={`font-medium truncate ${msg.is_read ? 'text-neutral-300' : 'text-white'}`}>
                                        {msg.name}
                                    </h4>
                                    <p className="text-sm text-neutral-500 truncate">{msg.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-neutral-500 text-sm whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    <span>{formatDate(msg.created_at)}</span>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(msg.id, e)}
                                    className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedId === msg.id && (
                            <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                                <div className="border-t border-neutral-700/50 pt-4 mt-2">
                                    <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </p>
                                    <div className="mt-4 flex justify-end">
                                        <a
                                            href={`mailto:${msg.email}`}
                                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Mail size={16} />
                                            回覆郵件
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {messages.length === 0 && (
                    <div className="text-center py-12 text-neutral-500 border-2 border-dashed border-neutral-800 rounded-lg">
                        目前沒有新訊息。
                    </div>
                )}
            </div>
        </div>
    );
}
