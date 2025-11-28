import { Github, Linkedin, Mail } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.socials}>
                    <a href="#" className={styles.socialLink} aria-label="GitHub">
                        <Github size={20} />
                    </a>
                    <a href="#" className={styles.socialLink} aria-label="LinkedIn">
                        <Linkedin size={20} />
                    </a>
                    <a href="mailto:contact@example.com" className={styles.socialLink} aria-label="Email">
                        <Mail size={20} />
                    </a>
                </div>
                <p className={styles.copyright}>
                    &copy; {new Date().getFullYear()} My Showroom. 版權所有.
                </p>
            </div>
        </footer>
    );
}
