'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ExternalLink, Github } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './Projects.module.css';

// Image Slider Component
function ImageSlider({ images, title }: { images: string[], title: string }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered) return;
        if (!images || images.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 4000); // Auto-slide every 4 seconds
        return () => clearInterval(timer);
    }, [images, isHovered]);

    if (!images || images.length === 0) {
        return <div className={styles.imageContainer} style={{ background: '#1a1a1a' }} />;
    }

    return (
        <div
            className={styles.imageContainer}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                >
                    <Image
                        src={images[currentIndex]}
                        alt={`${title} - Image ${currentIndex + 1}`}
                        fill
                        className={styles.image}
                    />
                </motion.div>
            </AnimatePresence>

            {images.length > 1 && (
                <div className={styles.sliderControls}>
                    {images.map((_, idx) => (
                        <div
                            key={idx}
                            className={`${styles.sliderDot} ${idx === currentIndex ? styles.activeDot : ''}`}
                            onClick={() => setCurrentIndex(idx)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Projects() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const projectRefs = useRef<(HTMLDivElement | null)[]>([]);
    const sectionRef = useRef<HTMLElement>(null);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const navContentRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .order('display_order', { ascending: true });

                if (error) throw error;
                setProjects(data || []);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    // 計算側邊欄項目的最大寬度
    useEffect(() => {
        // 只有在側邊欄顯示時才計算
        if (!showSidebar) return;

        // 延遲一點時間確保 DOM 已經渲染完成
        const timer = setTimeout(() => {
            let maxW = 0;
            navContentRefs.current.forEach(el => {
                if (el) {
                    const width = el.getBoundingClientRect().width;
                    if (width > maxW) maxW = width;
                }
            });

            // 我需要加上一些 padding 空間
            // 內容寬度 + 左右 padding (約 1.5em = 24px) + 額外緩衝
            if (maxW > 0) {
                setSidebarWidth(Math.max(200, maxW + 40));
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [showSidebar, projects.length]); // 當側邊欄顯示狀態改變或專案載入後執行

    // Scroll Spy for Sidebar Visibility & Active Project
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            // Check if inside Projects section
            if (sectionRef.current) {
                const sectionTop = sectionRef.current.offsetTop;
                const sectionHeight = sectionRef.current.offsetHeight;
                const sectionBottom = sectionTop + sectionHeight;

                // Show sidebar when section is visible (with some buffer)
                if (scrollY > sectionTop - windowHeight / 2 && scrollY < sectionBottom - windowHeight / 2) {
                    setShowSidebar(true);
                } else {
                    setShowSidebar(false);
                }
            }

            // Active Project Logic
            const triggerPoint = windowHeight / 2;
            let currentId = null;

            projectRefs.current.forEach((ref, index) => {
                if (ref) {
                    const rect = ref.getBoundingClientRect();
                    if (rect.top <= triggerPoint && rect.bottom >= triggerPoint) {
                        currentId = projects[index]?.id;
                    }
                }
            });

            if (currentId !== activeProjectId) {
                setActiveProjectId(currentId);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [activeProjectId, projects]);

    const scrollToProject = (index: number) => {
        const ref = projectRefs.current[index];
        if (ref) {
            const headerOffset = 100;
            const elementPosition = ref.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    if (loading) {
        return <section className={styles.section} style={{ minHeight: '100vh' }} />;
    }

    return (
        <section id="projects" className={styles.section} ref={sectionRef}>
            <div className={styles.background}>
                {/* 背景容器 */}
            </div>

            {/* Sidebar Navigation */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div
                        className={styles.sidebarNav}
                        initial={{ opacity: 0, x: 20, y: "-50%" }}
                        animate={{ opacity: 1, x: 0, y: "-50%" }}
                        exit={{ opacity: 0, x: 20, y: "-50%" }}
                        transition={{ duration: 0.3 }}
                        style={{ '--sidebar-width': `${sidebarWidth}px` } as any}
                    >
                        {projects.map((project, index) => (
                            <div
                                key={project.id}
                                className={styles.navItemWrapper}
                                onClick={() => scrollToProject(index)}
                            >
                                <div
                                    className={styles.navContent}
                                    ref={(el) => { navContentRefs.current[index] = el; }}
                                >
                                    <span className={`${styles.navTag} ${project.category === 'UX' ? styles.tagUx : styles.tagFrontend}`}>
                                        {project.category === '前端' ? '前端' : 'UX'}
                                    </span>
                                    <span className={styles.navText}>{project.title}</span>
                                </div>
                                <div className={`${styles.navItem} ${activeProjectId === project.id ? styles.navItemActive : ''}`} />
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={styles.header}>
                <h2 className={styles.title}>精選作品</h2>
                <p className={styles.subtitle}>融合程式邏輯與設計美學，打造極致的數位體驗</p>
            </div>

            <div className={styles.container}>
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        ref={(el) => { projectRefs.current[index] = el; }}
                        className={`${styles.projectRow} ${index % 2 !== 0 ? styles.projectRowReverse : ''}`}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <ImageSlider images={project.images} title={project.title} />

                        <div className={styles.infoContainer}>
                            <div className={styles.projectNumber}>
                                {(index + 1).toString().padStart(2, '0')}
                            </div>
                            <h3 className={styles.projectTitle}>
                                {project.title}
                                <span className={`${styles.projectTag} ${project.category === 'UX' ? styles.tagUx : styles.tagFrontend}`}>
                                    {project.category === '前端' ? '前端' : 'UX'}
                                </span>
                            </h3>
                            <p className={styles.projectDesc}>{project.description}</p>
                            <div className={styles.tags}>
                                {project.tags.map((tag: string) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                            <div className={styles.links}>
                                <a href={project.demo_url} className={styles.linkBtn} target="_blank" rel="noopener noreferrer">
                                    線上預覽 <ExternalLink size={18} />
                                </a>
                                <a href={project.github_url} className={styles.githubBtn} target="_blank" rel="noopener noreferrer">
                                    <Github size={20} />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
