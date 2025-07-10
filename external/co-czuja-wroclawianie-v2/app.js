document.addEventListener('DOMContentLoaded', function() {
    // Initialize all animations and interactions
    initScrollAnimations();
    initSmoothScrolling();
    initParallaxEffects();
    initInteractiveElements();
    initMobileOptimizations();
});

// Scroll-triggered animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Add staggered animation for grid items
                const gridItems = entry.target.querySelectorAll('.goal-item, .application-item, .methodology-item, .characteristic-item, .parameter-item');
                gridItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('animate-in');
                    }, index * 150);
                });
            }
        });
    }, observerOptions);

    // Observe all sections and key elements
    const elementsToObserve = [
        '.section',
        '.tension-definition',
        '.tension-characteristics',
        '.tension-parameters',
        '.tension-perception'
    ];

    elementsToObserve.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(element);
        });
    });

    // Add CSS class for animation
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        
        .goal-item, .application-item, .methodology-item, 
        .characteristic-item, .parameter-item {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }
        
        .goal-item.animate-in, .application-item.animate-in, 
        .methodology-item.animate-in, .characteristic-item.animate-in, 
        .parameter-item.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

// Smooth scrolling for CTA button
function initSmoothScrolling() {
    const ctaButton = document.querySelector('.cta-button');
    
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // Scroll to musical tension section
            const targetSection = document.querySelector('.musical-tension');
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
}

// Parallax effects for floating elements
function initParallaxEffects() {
    const floatingElements = document.querySelectorAll('.floating-note, .floating-clef');
    
    let ticking = false;
    
    function updateParallax() {
        const scrollTop = window.pageYOffset;
        const heroHeight = document.querySelector('.hero').offsetHeight;
        
        if (scrollTop < heroHeight) {
            floatingElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                const yPos = scrollTop * speed;
                element.style.transform = `translateY(${yPos}px)`;
            });
        }
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
}

// Interactive elements and hover effects
function initInteractiveElements() {
    // Enhanced button interactions
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
    
    // Card hover effects
    const cards = document.querySelectorAll('.card, .goal-item, .application-item, .methodology-item');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });
    
    // Parameter item interactions
    const parameterItems = document.querySelectorAll('.parameter-item');
    parameterItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.parameter-icon');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
            this.style.borderColor = '#fd8211';
            this.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        });
        
        item.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.parameter-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
            this.style.borderColor = 'rgba(253, 130, 17, 0.2)';
            this.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        });
    });
}

// Mobile optimizations
function initMobileOptimizations() {
    // Disable parallax on mobile devices for performance
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
        const floatingElements = document.querySelectorAll('.floating-note, .floating-clef');
        floatingElements.forEach(element => {
            element.style.transform = 'none';
        });
    }
    
    // Touch feedback for mobile devices
    const touchElements = document.querySelectorAll('.btn, .card, .goal-item, .application-item');
    touchElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.opacity = '0.8';
        });
        
        element.addEventListener('touchend', function() {
            this.style.opacity = '1';
        });
    });
}

// Additional musical animations
function createMusicalParticles() {
    const hero = document.querySelector('.hero');
    const particles = ['♪', '♫', '♩', '♬', '♭', '♯'];
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.textContent = particles[Math.floor(Math.random() * particles.length)];
        particle.style.position = 'absolute';
        particle.style.color = 'rgba(255, 255, 255, 0.1)';
        particle.style.fontSize = '1rem';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '100%';
        particle.style.animation = 'particleFloat 8s linear infinite';
        
        hero.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 8000);
    }
    
    // Add particle animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Create particles periodically
    setInterval(createParticle, 2000);
}

// Initialize musical particles after page load
window.addEventListener('load', createMusicalParticles);

// Scroll progress indicator
function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.position = 'fixed';
    progressBar.style.top = '0';
    progressBar.style.left = '0';
    progressBar.style.width = '0%';
    progressBar.style.height = '3px';
    progressBar.style.backgroundColor = '#fd8211';
    progressBar.style.zIndex = '9999';
    progressBar.style.transition = 'width 0.1s ease';
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// Initialize scroll progress
initScrollProgress();

// Enhanced typing effect for hero title
function initTypingEffect() {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.borderRight = '2px solid white';
        
        let i = 0;
        const typeSpeed = 100;
        
        function typeWriter() {
            if (i < originalText.length) {
                heroTitle.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, typeSpeed);
            } else {
                // Remove cursor after typing is complete
                setTimeout(() => {
                    heroTitle.style.borderRight = 'none';
                }, 1000);
            }
        }
        
        // Start typing after initial page load
        setTimeout(typeWriter, 1000);
    }
}

// Initialize typing effect
setTimeout(initTypingEffect, 500);

// Intersection Observer for section highlights
function initSectionHighlights() {
    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            } else {
                entry.target.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            }
        });
    }, {
        threshold: 0.3
    });
    
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Initialize section highlights
initSectionHighlights();

// Performance optimization: debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll-heavy functions
const debouncedParallax = debounce(initParallaxEffects, 10);
window.addEventListener('scroll', debouncedParallax);

// Add loading animation
function initLoadingAnimation() {
    const body = document.body;
    body.style.opacity = '0';
    body.style.transition = 'opacity 0.5s ease-in-out';
    
    window.addEventListener('load', () => {
        body.style.opacity = '1';
    });
}

// Initialize loading animation
initLoadingAnimation();