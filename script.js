// ===================================
// Theme Management
// ===================================

function initTheme() {
    const savedTheme = localStorage.getItem('landing-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);
    return theme;
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('landing-theme', newTheme);

    // Add a subtle transition effect
    document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
}

// ===================================
// Device Detection & Smart Download
// ===================================

function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    // Check for mobile devices first
    if (/android/i.test(userAgent)) {
        return 'android';
    }
    if (/iphone|ipad|ipod/i.test(userAgent)) {
        return 'ios';
    }

    // Desktop detection
    if (platform.includes('win')) {
        return 'windows';
    }
    if (platform.includes('mac')) {
        return 'macos';
    }
    if (platform.includes('linux')) {
        return 'linux';
    }

    return 'web';
}

async function getLatestReleaseUrl() {
    const repo = 'RyanWez/ahkyaway_mhat-releases';
    const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
    const fallbackUrl = `https://github.com/${repo}/releases/latest`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Find Android Assets
        const assets = data.assets;

        // Priority: arm64-v8a -> universal -> any apk
        const arm64 = assets.find(a => a.name.includes('arm64-v8a') && a.name.endsWith('.apk'));
        const universal = assets.find(a => a.name.includes('universal') && a.name.endsWith('.apk'));
        const anyApk = assets.find(a => a.name.endsWith('.apk'));

        // Return the best match or fallback to the releases page
        return (arm64 || universal || anyApk)?.browser_download_url || fallbackUrl;
    } catch (error) {
        // Silently fail and use fallback URL
        return fallbackUrl;
    }
}

async function handleDownload(e) {
    // Prevent default if it's a link (though we use a button)
    if (e) e.preventDefault();

    const device = detectDevice();
    const btn = e ? e.currentTarget : document.getElementById('download-btn');

    // Prevent multiple clicks
    if (btn && btn.classList.contains('loading')) return;

    const originalHTML = btn ? btn.innerHTML : '';

    // Helper to show loading state
    const showLoading = () => {
        if (!btn) return;
        btn.classList.add('loading');
        btn.disabled = true;
        const span = btn.querySelector('span');
        if (span) span.textContent = 'Loading...';
    };

    // Helper to restore button
    const restoreButton = () => {
        if (!btn) return;
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    };

    // Show loading state
    showLoading();

    // Desktop/iOS redirects (Static for now as requested, concentrating on Android)
    if (device === 'ios' || device === 'macos' || device === 'windows' || device === 'linux') {
        window.open('https://github.com/RyanWez/ahkyaway_mhat-releases/releases', '_blank');
        restoreButton();
        return;
    }

    // Android Logic (Dynamic)
    if (device === 'android') {
        const url = await getLatestReleaseUrl();

        // Create a temporary link and click it
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        restoreButton();
    } else {
        // Fallback for web/unknown
        window.open('https://github.com/RyanWez/ahkyaway_mhat-releases/releases', '_blank');
        restoreButton();
    }
}

// ===================================
// Improved Carousel with Smooth Animations
// ===================================

class Carousel {
    constructor(element) {
        this.carousel = element;
        this.track = element.querySelector('.carousel-track');
        this.slides = Array.from(element.querySelectorAll('.carousel-slide'));
        this.dotsContainer = document.getElementById('carousel-dots');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');

        this.currentIndex = 0;
        this.slideCount = this.slides.length;

        // Drag state
        this.isDragging = false;
        this.startX = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        this.animationId = null;
        this.velocity = 0;
        this.lastX = 0;
        this.lastTime = 0;

        this.init();
    }

    init() {
        this.createDots();
        this.bindEvents();
        this.goToSlide(0);
        this.updateActiveSlide();

        // Store instance on element
        this.carousel.carouselInstance = this;
    }

    createDots() {
        this.slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dotsContainer.appendChild(dot);
        });
        this.dots = Array.from(this.dotsContainer.querySelectorAll('.carousel-dot'));
    }

    bindEvents() {
        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });

        // Touch events
        this.track.addEventListener('touchstart', (e) => this.touchStart(e), { passive: true });
        this.track.addEventListener('touchmove', (e) => this.touchMove(e), { passive: false });
        this.track.addEventListener('touchend', () => this.touchEnd());

        // Mouse events for desktop dragging
        this.track.addEventListener('mousedown', (e) => this.touchStart(e));
        this.track.addEventListener('mousemove', (e) => this.touchMove(e));
        this.track.addEventListener('mouseup', () => this.touchEnd());
        this.track.addEventListener('mouseleave', () => {
            if (this.isDragging) this.touchEnd();
        });

        // Prevent context menu on drag
        this.track.addEventListener('contextmenu', (e) => {
            if (this.isDragging) e.preventDefault();
        });

        // Prevent image dragging
        this.slides.forEach(slide => {
            const img = slide.querySelector('img');
            if (img) {
                img.addEventListener('dragstart', (e) => e.preventDefault());
            }
        });

        // Auto-play on visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopAutoplay();
            }
        });
    }

    getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
    }

    touchStart(event) {
        this.isDragging = true;
        this.startX = this.getPositionX(event);
        this.lastX = this.startX;
        this.lastTime = Date.now();
        this.velocity = 0;

        cancelAnimationFrame(this.animationId);
        this.track.style.transition = 'none';
    }

    touchMove(event) {
        if (!this.isDragging) return;

        const currentX = this.getPositionX(event);
        const diff = currentX - this.startX;

        // Calculate velocity
        const now = Date.now();
        const dt = now - this.lastTime;
        if (dt > 0) {
            this.velocity = (currentX - this.lastX) / dt;
        }
        this.lastX = currentX;
        this.lastTime = now;

        this.currentTranslate = this.prevTranslate + diff;

        // Apply transform directly for immediate feedback
        this.track.style.transform = `translateX(${this.currentTranslate}px)`;

        // Prevent scrolling while dragging
        if (Math.abs(diff) > 10) {
            event.preventDefault();
        }
    }

    touchEnd() {
        this.isDragging = false;

        const movedBy = this.currentTranslate - this.prevTranslate;
        const threshold = window.innerWidth * 0.15;

        // Use velocity for faster flicks
        const velocityThreshold = 0.5;

        // Determine if we should change slides
        if ((movedBy < -threshold || this.velocity < -velocityThreshold) && this.currentIndex < this.slideCount - 1) {
            this.currentIndex++;
        } else if ((movedBy > threshold || this.velocity > velocityThreshold) && this.currentIndex > 0) {
            this.currentIndex--;
        }

        this.goToSlide(this.currentIndex);
    }

    goToSlide(index) {
        this.currentIndex = index;

        // Calculate offset based on slide width + gap
        const slideWidth = this.slides[0].offsetWidth;
        const gap = 24; // Match CSS gap
        const offset = -index * (slideWidth + gap);

        // Center the active slide
        const containerWidth = this.carousel.offsetWidth;
        const centerOffset = (containerWidth - slideWidth) / 2;

        this.currentTranslate = offset + centerOffset;
        this.prevTranslate = this.currentTranslate;

        this.track.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        this.track.style.transform = `translateX(${this.currentTranslate}px)`;

        // Update dots
        this.updateDots();
        this.updateActiveSlide();
    }

    updateDots() {
        this.dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }

    updateActiveSlide() {
        this.slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === this.currentIndex);
        });
    }

    prev() {
        if (this.currentIndex > 0) {
            this.goToSlide(this.currentIndex - 1);
        } else {
            // Loop to end
            this.goToSlide(this.slideCount - 1);
        }
    }

    next() {
        if (this.currentIndex < this.slideCount - 1) {
            this.goToSlide(this.currentIndex + 1);
        } else {
            // Loop to start
            this.goToSlide(0);
        }
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }
}

// ===================================
// Smooth Scroll
// ===================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===================================
// Active Nav Link on Scroll
// ===================================

function initActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${entry.target.id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Handle home specifically when at top
    window.addEventListener('scroll', () => {
        if (window.scrollY < 100) {
            navLinks.forEach(link => link.classList.remove('active'));
            const homeLink = document.querySelector('.nav-link[href="#hero"]');
            if (homeLink) homeLink.classList.add('active');
        }
    }, { passive: true });
}

// ===================================
// Scroll Reveal Animations
// ===================================

function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target); 
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    reveals.forEach(el => observer.observe(el));
}

// Parallax removed - gradient orbs no longer used

// ===================================
// Initialize
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initTheme();

    // Initialize language
    initLanguage();

    // Initialize carousel
    const carouselElement = document.getElementById('carousel');
    if (carouselElement) {
        new Carousel(carouselElement);
    }

    // Initialize smooth scroll
    initSmoothScroll();

    // Initialize active nav link
    initActiveNavLink();

    // Initialize scroll reveal
    initScrollReveal();

    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Language toggle button
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.addEventListener('click', toggleLanguage);
    }

    // Download button - smart device detection (Navbar)
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleDownload);
    }

    // Download button - smart device detection (Hero)
    const heroDownloadBtn = document.getElementById('hero-download-btn');
    if (heroDownloadBtn) {
        heroDownloadBtn.addEventListener('click', handleDownload);
    }

    // Handle window resize for carousel
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const carouselElement = document.getElementById('carousel');
            if (carouselElement && carouselElement.carouselInstance) {
                carouselElement.carouselInstance.goToSlide(
                    carouselElement.carouselInstance.currentIndex
                );
            }
        }, 250);
    });

    // Add reveal class to sections
    const sections = document.querySelectorAll('.section-header, .download-container, .platform-grid');
    sections.forEach(section => {
        section.classList.add('reveal');
    });

    // Re-run scroll reveal after adding classes
    setTimeout(() => {
        initScrollReveal();
    }, 100);
});

// Preload critical images
window.addEventListener('load', () => {
    // Add loaded class for any additional animations
    document.body.classList.add('loaded');
});
