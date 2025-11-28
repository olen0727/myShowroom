'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './Experience.module.css';

const experiences = [
    {
        id: 1,
        role: "資深前端工程師",
        company: "Tech Giant Co.",
        period: "2021 - Present",
        description: "帶領前端團隊進行架構重構，提升網頁效能 40%。導入 Next.js 與 TypeScript，建立共用元件庫，大幅縮短開發週期。",
        skills: ["React", "Next.js", "TypeScript", "Team Lead"]
    },
    {
        id: 2,
        role: "前端工程師",
        company: "Creative Digital Agency",
        period: "2019 - 2021",
        description: "負責多個大型品牌官網開發，專注於互動特效與 RWD 切版。與設計師緊密合作，實現高品質的 UI/UX 體驗。",
        skills: ["Vue.js", "GSAP", "SCSS", "WebGL"]
    },
    {
        id: 3,
        role: "網頁開發實習生",
        company: "Start-up Inc.",
        period: "2018 - 2019",
        description: "協助開發公司內部管理系統，參與 API 串接與介面優化。在敏捷開發流程中學習現代化前端技術。",
        skills: ["JavaScript", "HTML/CSS", "Git", "REST API"]
    }
];

export default function Experience() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
    const y = useTransform(scrollYProgress, [0, 0.2], [100, 0]);

    return (
        <section id="experience" className={styles.section} ref={containerRef}>
            <motion.div
                className={styles.header}
                style={{ opacity, y }}
            >
                <h2 className={styles.title}>職涯旅程</h2>
                <p className={styles.subtitle}>Professional Journey</p>
            </motion.div>

            <div className={styles.container}>
                <div className={styles.timeline}>
                    {experiences.map((exp, index) => (
                        <motion.div
                            key={exp.id}
                            className={styles.timelineItem}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: index * 0.2 }}
                        >
                            <div className={styles.timelineDot} />
                            <div className={styles.timelineContent}>
                                <div className={styles.card}>
                                    <span className={styles.period}>{exp.period}</span>
                                    <h3 className={styles.role}>{exp.role}</h3>
                                    <h4 className={styles.company}>{exp.company}</h4>
                                    <p className={styles.description}>{exp.description}</p>
                                    <div className={styles.skills}>
                                        {exp.skills.map(skill => (
                                            <span key={skill} className={styles.skill}>{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
