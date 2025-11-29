'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Divider,
    Chip,
    Pagination,
    Spinner
} from "@nextui-org/react";
import { Trash2, Mail, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
    id: string;
    name: string;
    email: string;
    message: string;
    read: boolean;
    created_at: string;
}

export default function MessagesTab() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

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

    const handleMarkAsRead = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ read: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setMessages(messages.map(m => m.id === id ? { ...m, read: !currentStatus } : m));
            toast.success(`Message marked as ${!currentStatus ? 'read' : 'unread'}`);
        } catch (error) {
            console.error('Error updating message:', error);
            toast.error('Failed to update message');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMessages(messages.filter(m => m.id !== id));
            toast.success('Message deleted successfully');
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error('Failed to delete message');
        }
    };

    const items = messages.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    if (loading) return <div className="flex justify-center p-10"><Spinner size="lg" /></div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Mail /> Inbox
                    <Chip size="sm" color="primary" variant="flat">{messages.length}</Chip>
                </h3>
                <div className="text-small text-default-500">
                    {messages.filter(m => !m.read).length} unread
                </div>
            </div>

            <div className="space-y-4">
                {items.map((msg) => (
                    <Card
                        key={msg.id}
                        className={`border transition-colors ${msg.read ? 'bg-white/5 border-white/5' : 'bg-primary/5 border-primary/20'}`}
                    >
                        <CardHeader className="flex justify-between items-start gap-4 pb-0">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <h4 className={`text-lg font-bold ${msg.read ? 'text-default-600' : 'text-white'}`}>
                                        {msg.name}
                                    </h4>
                                    {!msg.read && <Chip size="sm" color="primary" variant="dot">New</Chip>}
                                </div>
                                <p className="text-small text-default-400">{msg.email}</p>
                            </div>
                            <div className="flex items-center gap-2 text-tiny text-default-400">
                                <Clock size={12} />
                                {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString()}
                            </div>
                        </CardHeader>
                        <CardBody className="py-4">
                            <p className={`whitespace-pre-wrap ${msg.read ? 'text-default-500' : 'text-default-200'}`}>
                                {msg.message}
                            </p>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button
                                    size="sm"
                                    variant={msg.read ? "bordered" : "solid"}
                                    color={msg.read ? "default" : "primary"}
                                    startContent={<CheckCircle size={14} />}
                                    onPress={() => handleMarkAsRead(msg.id, msg.read)}
                                >
                                    {msg.read ? 'Mark Unread' : 'Mark Read'}
                                </Button>
                                <Button
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    startContent={<Trash2 size={14} />}
                                    onPress={() => handleDelete(msg.id)}
                                >
                                    Delete
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                ))}

                {messages.length === 0 && (
                    <div className="text-center py-12 text-default-500 bg-white/5 rounded-xl border border-white/10 border-dashed">
                        <Mail size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No messages yet.</p>
                    </div>
                )}
            </div>

            {messages.length > rowsPerPage && (
                <div className="flex justify-center pt-4">
                    <Pagination
                        total={Math.ceil(messages.length / rowsPerPage)}
                        page={page}
                        onChange={setPage}
                        color="primary"
                    />
                </div>
            )}
        </div>
    );
}
