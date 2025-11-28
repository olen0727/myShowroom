'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';
import Link from 'next/link';
import styles from './Hero.module.css';
import ParticleBackground from './ParticleBackground';

const roles = ['前端工程師', 'UX 設計師'];

export default function Hero() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % roles.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

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
                    <h1 className={styles.title}>
                        打造極致的
                        <br />
                        數位體驗
                    </h1>
                </motion.div>

                <motion.div
                    className={styles.subtitle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                    我是一名
                    <span style={{
                        display: 'inline-flex',
                        position: 'relative',
                        width: 'auto',
                        minWidth: '5.5em',
                        height: '1.6em',
                        verticalAlign: 'bottom',
                        justifyContent: 'center',
                        marginLeft: '0.1em',
                        marginRight: '0.1em',
                        color: 'var(--primary)',
                        fontWeight: 'bold',
                        overflow: 'hidden'
                    }}>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={index}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                style={{ position: 'absolute', whiteSpace: 'nowrap' }}
                            >
                                {roles[index]}
                            </motion.span>
                        </AnimatePresence>
                    </span>
                    ，熱衷於構建美觀、實用且具擴展性的網頁應用程式，致力於解決真實世界的問題。
                </motion.div>

                <motion.div
                    className={styles.ctaGroup}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                >
                    <Link href="#projects" className={styles.primaryBtn}>
                        查看作品
                        <ArrowRight size={20} style={{ display: 'inline', marginLeft: '8px', verticalAlign: 'middle' }} />
                    </Link>
                    <Link href="/resume.pdf" className={styles.secondaryBtn} target="_blank">
                        下載履歷
                        <Download size={20} style={{ display: 'inline', marginLeft: '8px', verticalAlign: 'middle' }} />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
