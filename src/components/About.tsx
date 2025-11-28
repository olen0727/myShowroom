'use client';

import { motion } from 'framer-motion';
import { Code2, Database, Layout, Terminal } from 'lucide-react';
import styles from './About.module.css';

const skills = [
    {
        icon: <Layout size={24} />,
        title: '前端開發',
        items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    },
    {
        icon: <Database size={24} />,
        title: '後端開發',
        items: ['Node.js', 'Supabase', 'PostgreSQL', 'Express', 'Prisma'],
    },
    {
        icon: <Terminal size={24} />,
        title: '工具與維運',
        items: ['Git', 'Docker', 'AWS', 'Vercel', 'CI/CD'],
    },
    {
        icon: <Code2 size={24} />,
        title: '其他技能',
        items: ['UI/UX Design', 'Agile', 'Testing', 'SEO'],
    },
];

export default function About() {
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
                        <p>
                            我是一名充滿熱情的全端工程師，注重細節並致力於創造卓越的數位體驗。憑藉著前端與後端的紮實基礎，我專注於構建能解決實際問題的可擴展網頁應用。
                        </p>
                        <p>
                            我的旅程始於對網路運作原理的好奇，這引領我深入程式開發的世界。如今，我運用 Next.js 和 Supabase 等現代技術來構建高效能且使用者友善的應用程式。
                        </p>
                        <p>
                            當我不寫程式時，我喜歡探索新技術、參與開源專案，或與社群分享我的知識。
                        </p>
                    </motion.div>

                    <div className={styles.skillsGrid}>
                        {skills.map((skill, index) => (
                            <motion.div
                                key={skill.title}
                                className={styles.skillCard}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.2, delay: 0 }}
                                whileHover={{ y: -5, borderColor: 'rgba(59, 130, 246, 0.5)' }}
                            >
                                <div className={styles.skillIcon}>{skill.icon}</div>
                                <h4 className={styles.skillTitle}>{skill.title}</h4>
                                <div className={styles.skillList}>
                                    {skill.items.map((item) => (
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
