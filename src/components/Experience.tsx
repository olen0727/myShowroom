'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import styles from './Experience.module.css';

export default function Experience() {
    const [experiences, setExperiences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExperiences = async () => {
            try {
                const { data, error } = await supabase
                    .from('experience')
                    .select('*')
                    .order('display_order', { ascending: true });

                if (error) throw error;
                setExperiences(data || []);
            } catch (error) {
                console.error('Error fetching experiences:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExperiences();
    }, []);

    if (loading) return null;

    return (
        <section id="experience" className={styles.section}>
            <motion.div
                className={styles.header}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
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
                                    <h3 className={styles.role}>{exp.position}</h3>
                                    <h4 className={styles.company}>{exp.company}</h4>
                                    <p className={styles.description}>{exp.description}</p>
                                    <div className={styles.skills}>
                                        {exp.skills?.map((skill: string) => (
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
