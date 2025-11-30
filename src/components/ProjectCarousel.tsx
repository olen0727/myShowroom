'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';
import { ExternalLink, Github } from 'lucide-react';
import styles from './ProjectCarousel.module.css';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

// Mock Data
const MOCK_PROJECTS = [
    {
        id: '1',
        title: 'Project Alpha',
        description: 'A cutting-edge web application built with Next.js and Supabase.',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop',
        tags: ['Next.js', 'React', 'TypeScript'],
        demo_url: 'https://example.com',
        github_url: 'https://github.com'
    },
    {
        id: '2',
        title: 'Project Beta',
        description: 'Mobile-first e-commerce platform with seamless checkout experience.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000&auto=format&fit=crop',
        tags: ['Vue', 'Firebase', 'Tailwind'],
        demo_url: 'https://example.com',
        github_url: ''
    },
    {
        id: '3',
        title: 'Project Gamma',
        description: 'Real-time data visualization dashboard for financial analytics.',
        image: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?q=80&w=1000&auto=format&fit=crop',
        tags: ['D3.js', 'Angular', 'Node.js'],
        demo_url: '',
        github_url: 'https://github.com'
    },
    {
        id: '4',
        title: 'Project Delta',
        description: 'AI-powered content generation tool for marketers.',
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop',
        tags: ['Python', 'FastAPI', 'OpenAI'],
        demo_url: 'https://example.com',
        github_url: 'https://github.com'
    },
    {
        id: '5',
        title: 'Project Epsilon',
        description: 'Social media management platform with scheduling features.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop',
        tags: ['React Native', 'GraphQL', 'AWS'],
        demo_url: 'https://example.com',
        github_url: 'https://github.com'
    }
];

export default function ProjectCarousel() {
    return (
        <div className={styles.carouselContainer}>
            <h2 className={styles.carouselTitle}>更多作品</h2>

            <Swiper
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                loop={true}
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
                }}
                modules={[EffectCoverflow, Pagination, Autoplay]}
                className={styles.swiperContainer}
            >
                {MOCK_PROJECTS.map((project) => (
                    <SwiperSlide key={project.id} className={styles.slide}>
                        <div className={styles.imageWrapper}>
                            <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                className={styles.image}
                            />
                        </div>
                        <div className={styles.content}>
                            <h3 className={styles.title}>{project.title}</h3>
                            <p className={styles.description}>{project.description}</p>
                            <div className={styles.tags}>
                                {project.tags.map(tag => (
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
