'use client';

import { useState, useEffect } from 'react';
import { Github, Linkedin, Mail, Facebook, Instagram, Twitter, Globe, Youtube, Twitch } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './Footer.module.css';

const ICON_MAP: Record<string, any> = {
    Github, Linkedin, Mail, Facebook, Instagram, Twitter, Globe, Youtube, Twitch
};

export default function Footer() {
    const [socials, setSocials] = useState<any[]>([]);

    useEffect(() => {
        const fetchSocials = async () => {
            try {
                const { data } = await supabase
                    .from('social_links')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });

                if (data) setSocials(data);
            } catch (error) {
                console.error('Error fetching socials:', error);
            }
        };
        fetchSocials();
    }, []);

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.socials}>
                    {socials.map((social) => {
                        const Icon = ICON_MAP[social.icon] || Globe;
                        return (
                            <a
                                key={social.id}
                                href={social.url}
                                className={styles.socialLink}
                                aria-label={social.platform}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Icon size={20} />
                            </a>
                        );
                    })}
                </div>
                <p className={styles.copyright}>
                    &copy; {new Date().getFullYear()} My Showroom. 版權所有.
                </p>
            </div>
        </footer>
    );
}
