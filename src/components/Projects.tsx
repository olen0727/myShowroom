'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ExternalLink, Github } from 'lucide-react';
import styles from './Projects.module.css';

// Project Data
const projects = [
    {
        id: 1,
        title: '電商平台重構',
        category: '前端開發',
        images: [
            'https://picsum.photos/id/1/800/600',
            'https://picsum.photos/id/2/800/600',
            'https://picsum.photos/id/3/800/600'
        ],
        description: '為大型零售商重構的電子商務平台。使用 Next.js 與 Server Components 提升效能，並導入全新的設計系統。',
        tags: ['Next.js', 'TypeScript', 'Tailwind CSS'],
        demo: '#',
        github: '#',
    },
    {
        id: 2,
        title: '金融數據儀表板',
        category: '前端開發',
        images: [
            'https://picsum.photos/id/20/800/600',
            'https://picsum.photos/id/21/800/600',
            'https://picsum.photos/id/22/800/600'
        ],
        description: '即時金融數據視覺化儀表板。整合 WebSocket 實現即時數據更新，並使用 D3.js 繪製複雜圖表。',
        tags: ['React', 'D3.js', 'WebSocket'],
        demo: '#',
        github: '#',
    },
    {
        id: 3,
        title: 'AI 圖像生成工具',
        category: '前端開發',
        images: [
            'https://picsum.photos/id/30/800/600',
            'https://picsum.photos/id/31/800/600',
            'https://picsum.photos/id/32/800/600'
        ],
        description: '基於 Stable Diffusion 的圖像生成 Web 應用。提供直覺的參數調整介面與即時預覽功能。',
        tags: ['Vue.js', 'Python', 'FastAPI'],
        demo: '#',
        github: '#',
    },
    {
        id: 4,
        title: '企業級後台管理系統',
        category: '前端開發',
        images: [
            'https://picsum.photos/id/40/800/600',
            'https://picsum.photos/id/41/800/600',
            'https://picsum.photos/id/42/800/600'
        ],
        description: '為跨國企業設計的後台管理系統。包含權限管理、多語系支援與複雜的表單處理流程。',
        tags: ['Angular', 'RxJS', 'Material UI'],
        demo: '#',
        github: '#',
    },
    {
        id: 5,
        title: '社群媒體分析平台',
        category: '前端開發',
        images: [
            'https://picsum.photos/id/50/800/600',
            'https://picsum.photos/id/51/800/600',
            'https://picsum.photos/id/52/800/600'
        ],
        description: '聚合多個社群平台的數據分析工具。提供趨勢追蹤、情緒分析與競品比較功能。',
        tags: ['React', 'GraphQL', 'Node.js'],
        demo: '#',
        github: '#',
    },
    {
        id: 10,
        title: '智慧家居控制中心',
        category: 'UX 設計',
        images: [
            'https://picsum.photos/id/1001/800/600',
            'https://picsum.photos/id/1002/800/600',
            'https://picsum.photos/id/1003/800/600'
        ],
        description: '為 IoT 設備設計的集中控制中心。強調直覺的儀表板設計，讓使用者能一目了然地監控家中設備狀態，並支援語音指令回饋。',
        tags: ['UI Design', 'Interaction Design', 'Voice UI'],
        demo: '#',
        github: '#',
    },
    {
        id: 11,
        title: '健康追蹤應用',
        category: 'UX 設計',
        images: [
            'https://picsum.photos/id/1011/800/600',
            'https://picsum.photos/id/1012/800/600',
            'https://picsum.photos/id/1013/800/600'
        ],
        description: '專注於心理健康的追蹤 App。運用色彩心理學與微互動設計，鼓勵使用者每日記錄情緒與冥想，營造放鬆療癒的使用體驗。',
        tags: ['Color Theory', 'Micro-interactions', 'Design System'],
        demo: '#',
        github: '#',
    },
    {
        id: 12,
        title: '外送平台體驗研究',
        category: 'UX 設計',
        images: [
            'https://picsum.photos/id/1021/800/600',
            'https://picsum.photos/id/1022/800/600',
            'https://picsum.photos/id/1023/800/600'
        ],
        description: '針對外送員與消費者端的雙向體驗研究。發現了訂單追蹤資訊不透明的問題，並提出即時地圖更新與雙向溝通機制的解決方案。',
        tags: ['Field Research', 'Persona', 'Service Blueprint'],
        demo: '#',
        github: '#',
    },
    {
        id: 13,
        title: '學習管理系統 (LMS)',
        category: 'UX 設計',
        images: [
            'https://picsum.photos/id/1031/800/600',
            'https://picsum.photos/id/1032/800/600',
            'https://picsum.photos/id/1033/800/600'
        ],
        description: '為遠距教學設計的學習平台。著重於課程結構的清晰度與師生互動機制，包含即時問答、作業繳交與學習歷程追蹤功能。',
        tags: ['Information Architecture', 'Dashboard Design'],
        demo: '#',
        github: '#',
    },
    {
        id: 14,
        title: '無障礙設計稽核',
        category: 'UX 設計',
        images: [
            'https://picsum.photos/id/1041/800/600',
            'https://picsum.photos/id/1042/800/600',
            'https://picsum.photos/id/1043/800/600'
        ],
        description: '為政府網站進行 WCAG 2.1 無障礙標準稽核。修正了對比度不足、鍵盤導航缺失等問題，確保所有使用者都能平等地獲取資訊。',
        tags: ['Accessibility', 'WCAG', 'Inclusive Design'],
        demo: '#',
        github: '#',
    },
];

// Image Slider Component
function ImageSlider({ images, title }: { images: string[], title: string }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 4000); // Auto-slide every 4 seconds
        return () => clearInterval(timer);
    }, [images.length, isHovered]);

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

            <div className={styles.sliderControls}>
                {images.map((_, idx) => (
                    <div
                        key={idx}
                        className={`${styles.sliderDot} ${idx === currentIndex ? styles.activeDot : ''}`}
                        onClick={() => setCurrentIndex(idx)}
                    />
                ))}
            </div>
        </div>
    );
}

export default function Projects() {
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const projectRefs = useRef<(HTMLDivElement | null)[]>([]);
    const sectionRef = useRef<HTMLElement>(null);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const navContentRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    }, [showSidebar]); // 當側邊欄顯示狀態改變時執行

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
                        currentId = projects[index].id;
                    }
                }
            });

            if (currentId !== activeProjectId) {
                setActiveProjectId(currentId);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [activeProjectId]);

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

    const frontendProjects = projects.filter(p => p.category === '前端開發');
    const uxProjects = projects.filter(p => p.category === 'UX 設計');

    return (
        <section id="projects" className={styles.section} ref={sectionRef}>
            <div className={styles.background}>
                {/* Generate random matrix columns */}
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className={styles.matrixColumn}
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDuration: `${Math.random() * 2 + 4}s`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
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
                                    <span className={`${styles.navTag} ${project.category === 'UX 設計' ? styles.tagUx : styles.tagFrontend}`}>
                                        {project.category === '前端開發' ? '前端' : 'UX'}
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
                {/* Frontend Section */}
                {frontendProjects.map((project, index) => (
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
                                <span className={`${styles.projectTag} ${project.category === 'UX 設計' ? styles.tagUx : styles.tagFrontend}`}>
                                    {project.category === '前端開發' ? '前端' : 'UX'}
                                </span>
                            </h3>
                            <p className={styles.projectDesc}>{project.description}</p>
                            <div className={styles.tags}>
                                {project.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                            <div className={styles.links}>
                                <a href={project.demo} className={styles.linkBtn} target="_blank" rel="noopener noreferrer">
                                    線上預覽 <ExternalLink size={18} />
                                </a>
                                <a href={project.github} className={styles.githubBtn} target="_blank" rel="noopener noreferrer">
                                    <Github size={20} />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* UX Section */}
                <div className={styles.categoryHeader}>
                    <h2 className={styles.categoryTitle}>UX 設計專案</h2>
                </div>
                {uxProjects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        ref={(el) => { projectRefs.current[index + frontendProjects.length] = el; }}
                        className={`${styles.projectRow} ${index % 2 !== 0 ? styles.projectRowReverse : ''}`}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <ImageSlider images={project.images} title={project.title} />

                        <div className={styles.infoContainer}>
                            <div className={styles.projectNumber}>
                                {(index + 1 + frontendProjects.length).toString().padStart(2, '0')}
                            </div>
                            <h3 className={styles.projectTitle}>
                                {project.title}
                                <span className={`${styles.projectTag} ${project.category === 'UX 設計' ? styles.tagUx : styles.tagFrontend}`}>
                                    {project.category === '前端開發' ? '前端' : 'UX'}
                                </span>
                            </h3>
                            <p className={styles.projectDesc}>{project.description}</p>
                            <div className={styles.tags}>
                                {project.tags.map((tag) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                            <div className={styles.links}>
                                <a href={project.demo} className={styles.linkBtn} target="_blank" rel="noopener noreferrer">
                                    線上預覽 <ExternalLink size={18} />
                                </a>
                                <a href={project.github} className={styles.githubBtn} target="_blank" rel="noopener noreferrer">
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
