import type { Value } from 'platejs';

export interface Project {
    id: string;
    title: string;
    description: string;
    content?: Value | string | null;
    images: string[];
    tags: string[];
    demo_url?: string;
    github_url?: string;
    category?: string;
    created_at?: string;
    display_order?: number;
}

export interface CarouselProject {
    id: string;
    title: string;
    description: string;
    image: string;
    tags: string[];
    demo_url?: string;
    github_url?: string;
    display_order?: number;
}
