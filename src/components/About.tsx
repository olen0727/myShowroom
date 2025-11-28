'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Code2, Database, Layout, Terminal, Server, Smartphone, Globe, Cpu, Cloud, GitBranch, Box, Layers, Users, CheckCircle, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './About.module.css';

// Icon Map
const ICON_MAP: Record<string, any> = {
    Layout, Database, Terminal, Code2, Server, Smartphone, Globe, Cpu, Cloud, GitBranch, Box, Layers, Users, CheckCircle, Search
};

const CATEGORY_ORDER = ['前端開發', '後端開發', '工具與維運', '其他技能'];

export default function About() {
    const [profile, setProfile] = useState<any>(null);
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, skillsRes] = await Promise.all([
                    supabase.from('profile').select('about_bio').single(),
                    supabase.from('skills').select('*').order('display_order', { ascending: true })
                ]);

                if (profileRes.data) setProfile(profileRes.data);
                if (skillsRes.data) setSkills(skillsRes.data);
            } catch (error) {
                console.error('Error fetching about data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Group skills by category
    const groupedSkills = CATEGORY_ORDER.map(category => {
        const categorySkills = skills.filter(s => s.category === category);
        if (categorySkills.length === 0) return null;

        // Use the icon of the first skill or a default one as the category icon
        // Ideally, category icons should be defined in a separate config or DB
        let CategoryIcon = Layout;
        if (category === '後端開發') CategoryIcon = Database;
        if (category === '工具與維運') CategoryIcon = Terminal;
        if (category === '其他技能') CategoryIcon = Code2;

        return {
            title: category,
            icon: <CategoryIcon size={24} />,
            items: categorySkills.map(s => s.name)
        };
    }).filter(Boolean);

    if (loading) return null;

    return (
        <section id="about" className={styles.section}>
            <div className={styles.background}>
                <div className={`${styles.blob} ${styles.blob1}`} />
                <div className={`${styles.blob} ${styles.blob2}`} />
                <div className={`${styles.blob} ${styles.blob3}`} />
            </div>
            <div className={styles.container}>
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className={styles.title}>關於我</h2>
                    <p className={styles.subtitle}>我的旅程與技術專業</p>
                </motion.div>

                <div className={styles.content}>
                    <motion.div
                        className={styles.bio}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h3>我是誰</h3>
                        <div className="space-y-4 text-neutral-300 leading-relaxed">
                            {profile?.about_bio?.split('\n').map((paragraph: string, idx: number) => (
                                paragraph.trim() && <p key={idx}>{paragraph}</p>
                            ))}
                        </div>
                    </motion.div>

                    <div className={styles.skillsGrid}>
                        {groupedSkills.map((skill: any, index) => (
                            <motion.div
                                key={skill.title}
                                className={styles.skillCard}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.2, delay: index * 0.1 }}
                                whileHover={{ y: -5, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                            >
                                <div className={styles.skillIcon}>{skill.icon}</div>
                                <h4 className={styles.skillTitle}>{skill.title}</h4>
                                <div className={styles.skillList}>
                                    {skill.items.map((item: string) => (
                                        <span key={item} className={styles.skillTag}>{item}</span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
