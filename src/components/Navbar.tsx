'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Menu, X, Code2 } from 'lucide-react';
import styles from './Navbar.module.css';

const navLinks = [
    { name: '首頁', href: '/' },
    { name: '關於我', href: '#about' },
    { name: '作品集', href: '#projects' },
    { name: '職涯旅程', href: '#experience' },
];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`${styles.nav} ${isScrolled ? styles.scrolled : ''}`}
        >
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <Code2 size={28} className="text-primary" />
                    <span>MyShowroom</span>
                </Link>

                {/* Desktop Menu */}
                <div className={styles.desktopMenu}>
                    {navLinks.map((link) => (
                        <Link key={link.name} href={link.href} className={styles.link}>
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={styles.mobileButton}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={styles.mobileMenu}
                    >
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={styles.mobileLink}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
