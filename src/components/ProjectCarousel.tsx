'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';
import { ExternalLink, Github } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './ProjectCarousel.module.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

interface CarouselProject {
    id: string;
    title: string;
    description: string;
    image: string;
    tags: string[];
    demo_url?: string;
    github_url?: string;
}

export default function ProjectCarousel() {
    const [projects, setProjects] = useState<CarouselProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data, error } = await supabase
                    .from('carousel_projects')
                    .select('*')
                    .order('display_order', { ascending: true });

                if (error) throw error;
                setProjects(data || []);
            } catch (error) {
                console.error('Error fetching carousel projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) return null; // Or a loading skeleton
    if (projects.length === 0) return null;

    return (
        <div className={styles.carouselContainer}>
            <h2 className={styles.carouselTitle}>其他專案</h2>

            <Swiper
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                slideToClickedSlide={true}
                loop={projects.length > 3} // Only loop if enough items
                coverflowEffect={{
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 2.5,
                    slideShadows: false,
                }}
                pagination={{ clickable: true }}
                autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                }}
                modules={[EffectCoverflow, Pagination, Autoplay]}
                className={styles.swiperContainer}
            >
                {projects.map((project) => (
                    <SwiperSlide key={project.id} className={styles.slide}>
                        <div className={styles.imageWrapper}>
                            {project.image ? (
                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    className={styles.image}
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">
                                    No Image
                                </div>
                            )}
                        </div>
                        <div className={styles.content}>
                            <h3 className={styles.title}>{project.title}</h3>
                            <p className={styles.description}>{project.description}</p>
                            <div className={styles.tags}>
                                {project.tags?.map(tag => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>

                            <div className={styles.actions} style={{
                                justifyContent: (!project.demo_url || !project.github_url) ? 'center' : 'space-between'
                            }}>
                                {project.demo_url && (
                                    <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.demoBtn}`}>
                                        Live Demo <ExternalLink size={16} />
                                    </a>
                                )}
                                {project.github_url && (
                                    <a href={project.github_url} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.githubBtn}`}>
                                        GitHub <Github size={16} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
