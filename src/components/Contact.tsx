'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './Contact.module.css';

export default function Contact() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            content: formData.get('message') as string,
        };

        try {
            const { error } = await supabase
                .from('messages')
                .insert([data]);

            if (error) throw error;

            setIsSuccess(true);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('發送失敗，請稍後再試。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact" className={styles.section}>
            <div className={styles.background} />

            <div className={styles.container}>
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className={styles.title}>與我聯繫</h2>
                    <p className={styles.subtitle}>有合作或任何其他的的想法嗎？歡迎聊聊。</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    {isSuccess ? (
                        <motion.div
                            className={styles.successMessage}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <CheckCircle size={48} style={{ marginBottom: '1rem' }} />
                            <h3>訊息已發送！</h3>
                            <p>感謝您的來信，我會盡快回覆您。</p>
                            <button
                                onClick={() => setIsSuccess(false)}
                                className={styles.submitBtn}
                                style={{ marginTop: '1.5rem', width: 'auto', display: 'inline-flex' }}
                            >
                                發送另一則訊息
                            </button>
                        </motion.div>
                    ) : (
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="name" className={styles.label}>姓名</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className={styles.input}
                                    placeholder="王小明"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="email" className={styles.label}>電子郵件</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className={styles.input}
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="message" className={styles.label}>訊息內容</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    className={styles.textarea}
                                    placeholder="請告訴我您的專案需求..."
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        發送中...
                                    </>
                                ) : (
                                    <>
                                        發送訊息
                                        <Send size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
