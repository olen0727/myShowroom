'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './Hero.module.css';
import ParticleBackground from './ParticleBackground';

export default function Hero() {
    const [index, setIndex] = useState(0);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await supabase.from('profile').select('*').single();
                if (data) setProfile(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const roles = profile?.hero_roles || ['前端工程師', 'UX 設計師'];

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % roles.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [roles.length]);

    if (loading) return null; // Or a loading skeleton

    return (
        <section className={styles.hero}>
            <div className={styles.background} />

            {/* Floating Orbs */}
            <div className={`${styles.orb} ${styles.orb1}`} />
            <div className={`${styles.orb} ${styles.orb2}`} />
            <div className={`${styles.orb} ${styles.orb3}`} />

            <ParticleBackground />

            <div className={styles.content}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className={styles.title} dangerouslySetInnerHTML={{
                        __html: profile?.hero_title?.replace(/\n/g, '<br />') || '打造極致的<br />數位體驗'
                    }} />
                </motion.div>

                <motion.div
                    className={styles.subtitle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                    {profile?.hero_subtitle_prefix || '我是一名'}
                    <span style={{
                        display: 'inline-flex',
                        position: 'relative',
                        width: 'auto',
                        fontSize: '1.5em',
                        minWidth: '5.5em',
                        height: '1.4em',
                        verticalAlign: 'bottom',
                        justifyContent: 'center',
                        marginLeft: '0.1em',
                        marginRight: '0.1em',
                        fontWeight: 'bold',
                        overflow: 'hidden'
                    }}>
                        <AnimatePresence mode="wait">
                            {(() => {
                                const currentRoleStr = roles[index] || '';
                                const [text, color] = currentRoleStr.includes('|')
                                    ? currentRoleStr.split('|')
                                    : [currentRoleStr, null];

                                return (
                                    <motion.span
                                        key={index}
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1, color: color || 'var(--primary)' }}
                                        exit={{ y: -20, opacity: 0 }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        style={{ position: 'absolute', whiteSpace: 'nowrap' }}
                                    >
                                        {text}
                                    </motion.span>
                                );
                            })()}
                        </AnimatePresence>
                    </span>
                    {profile?.hero_subtitle_suffix || '，熱衷於構建美觀、實用且具擴展性的網頁應用程式。'}
                </motion.div>

                <motion.div
                    className={styles.ctaGroup}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                >
                    <a
                        href="#projects"
                        className={styles.primaryBtn}
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        查看作品
                        <ArrowRight size={20} style={{ display: 'inline', marginLeft: '8px', verticalAlign: 'middle' }} />
                    </a>
                    {profile?.resume_url && (
                        <a href={profile.resume_url} className={styles.secondaryBtn} target="_blank" rel="noopener noreferrer">
                            下載履歷
                            <Download size={20} style={{ display: 'inline', marginLeft: '8px', verticalAlign: 'middle' }} />
                        </a>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
