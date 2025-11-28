'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Mail, CheckCircle, XCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

interface Message {
    id: string;
    name: string;
    email: string;
    message: string;
    created_at: string;
    is_read: boolean;
}

export default function MessagesTab() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
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

    const handleToggleRead = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_read: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setMessages(messages.map(m => m.id === id ? { ...m, is_read: !currentStatus } : m));
        } catch (error) {
            console.error('Error updating message status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除這則訊息嗎？')) return;

        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMessages(messages.filter(m => m.id !== id));
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('刪除失敗');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) return <div>載入中...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="text-blue-400" />
                    訊息收件匣
                    <span className="text-sm font-normal text-neutral-500 ml-2 bg-white/5 px-2 py-0.5 rounded-full">
                        {messages.length} 則訊息
                    </span>
                </h3>
            </div>

            <div className="space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`
                            group rounded-xl border transition-all duration-300 overflow-hidden
                            ${msg.is_read
                                ? 'bg-white/5 border-white/5 opacity-70 hover:opacity-100'
                                : 'bg-blue-500/5 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                            }
                        `}
                    >
                        {/* Header / Summary */}
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => toggleExpand(msg.id)}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`
                                    p-2 rounded-full flex-shrink-0
                                    ${msg.is_read ? 'bg-neutral-800 text-neutral-500' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'}
                                `}>
                                    <Mail size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className={`font-medium truncate ${msg.is_read ? 'text-neutral-300' : 'text-white'}`}>
                                            {msg.name}
                                        </h4>
                                        <span className="text-xs text-neutral-500">
                                            {new Date(msg.created_at).toLocaleDateString()}
                                        </span>
                                        {!msg.is_read && (
                                            <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wider">NEW</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-400 truncate pr-4">
                                        {msg.message}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleRead(msg.id, msg.is_read);
                                    }}
                                    className={`
                                        p-2 rounded-full transition-colors
                                        ${msg.is_read
                                            ? 'text-neutral-500 hover:text-blue-400 hover:bg-blue-500/10'
                                            : 'text-blue-400 hover:text-neutral-400 hover:bg-white/5'
                                        }
                                    `}
                                    title={msg.is_read ? '標示為未讀' : '標示為已讀'}
                                >
                                    {msg.is_read ? <XCircle size={20} /> : <CheckCircle size={20} />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(msg.id);
                                    }}
                                    className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                                    title="刪除"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <div className="text-neutral-500">
                                    {expandedId === msg.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedId === msg.id && (
                            <div className="px-4 pb-4 pt-0 pl-[4.5rem]">
                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4">
                                        <span className="bg-white/10 px-2 py-1 rounded text-xs select-all">{msg.email}</span>
                                        <span>•</span>
                                        <span>{new Date(msg.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-neutral-200 leading-relaxed whitespace-pre-wrap">
                                        {msg.message}
                                    </p>
                                    <div className="mt-6 flex justify-end">
                                        <a
                                            href={`mailto:${msg.email}`}
                                            className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
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
                    <div className="text-center py-16 text-neutral-500 border-2 border-dashed border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
                        <p>目前沒有新訊息</p>
                    </div>
                )}
            </div>
        </div>
    );
}
