// QR NEXUS - Cinematic Animations Engine

class AnimationEngine {
    constructor() {
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        this.initAmbientCanvas();
        this.initCustomEases();
    }

    // Initialize ambient background particles
    initAmbientCanvas() {
        const canvas = document.getElementById('ambient-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let particles = [];
        let animationId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticle = () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.1,
            pulse: Math.random() * Math.PI * 2
        });

        const initParticles = () => {
            particles = [];
            const count = Math.min(50, Math.floor((canvas.width * canvas.height) / 20000));
            for (let i = 0; i < count; i++) {
                particles.push(createParticle());
            }
        };

        const drawParticle = (p) => {
            const pulseOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 230, 0, ${pulseOpacity})`;
            ctx.fill();

            // Glow effect
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
            gradient.addColorStop(0, `rgba(255, 230, 0, ${pulseOpacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 230, 0, 0)');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.pulse += 0.02;

                // Wrap around edges
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                drawParticle(p);
            });

            animationId = requestAnimationFrame(animate);
        };

        resize();
        initParticles();
        animate();

        window.addEventListener('resize', () => {
            resize();
            initParticles();
        });
    }

    // Custom GSAP eases
    initCustomEases() {
        if (typeof gsap !== 'undefined' && typeof CustomEase !== 'undefined') {
            CustomEase.create('cinematicIn', 'M0,0 C0.11,0.494 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1');
            CustomEase.create('cinematicOut', 'M0,0 C0.496,0 0.55,0.016 0.682,0.148 0.808,0.274 0.506,1 1,1');
            CustomEase.create('lightBloom', 'M0,0 C0.14,0 0.242,0.438 0.272,0.561 0.313,0.728 0.354,0.963 0.362,1 0.37,0.985 0.432,0.988 0.498,0.988 0.564,0.988 0.7,1 1,1');
        }
    }

    // Page transition - Fade to black, then light bloom
    async pageTransition(fromPage, toPage, callback) {
        const overlay = document.createElement('div');
        overlay.className = 'transition-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 999;
            background: #000; opacity: 0; pointer-events: none;
        `;
        document.body.appendChild(overlay);

        // Fade to black
        await this.animate(overlay, { opacity: 1 }, 0.3);

        // Execute callback (switch pages)
        if (callback) callback();

        // Light bloom effect
        overlay.style.background = 'radial-gradient(circle at center, rgba(255,230,0,0.1) 0%, #000 50%)';

        // Reveal with light
        await this.animate(overlay, { opacity: 0 }, 0.5);
        overlay.remove();
    }

    // Modal open - Light pours from top
    openModal(modal) {
        modal.classList.add('active');
        const container = modal.querySelector('.modal-container');
        const glow = modal.querySelector('.modal-glow');

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(container,
                { y: -50, scale: 0.9, opacity: 0 },
                { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
            );
            gsap.fromTo(glow,
                { opacity: 0, scale: 0.5 },
                { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }
            );
        }
    }

    // Modal close - Light fades out
    closeModal(modal) {
        const container = modal.querySelector('.modal-container');

        if (typeof gsap !== 'undefined') {
            gsap.to(container, {
                y: 20, scale: 0.95, opacity: 0, duration: 0.3, ease: 'power2.in',
                onComplete: () => modal.classList.remove('active')
            });
        } else {
            modal.classList.remove('active');
        }
    }

    // Button ripple effect
    createRipple(event, element) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute; width: ${size}px; height: ${size}px;
            left: ${x}px; top: ${y}px; border-radius: 50%;
            background: radial-gradient(circle, rgba(255,230,0,0.4) 0%, transparent 70%);
            transform: scale(0); pointer-events: none;
        `;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        if (typeof gsap !== 'undefined') {
            gsap.to(ripple, {
                scale: 1, opacity: 0, duration: 0.6, ease: 'power2.out',
                onComplete: () => ripple.remove()
            });
        } else {
            ripple.animate([
                { transform: 'scale(0)', opacity: 1 },
                { transform: 'scale(1)', opacity: 0 }
            ], { duration: 600 }).onfinish = () => ripple.remove();
        }
    }

    // QR success flash
    qrSuccessFlash() {
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            background: radial-gradient(circle, rgba(255,230,0,0.5) 0%, transparent 70%);
            pointer-events: none;
        `;
        document.body.appendChild(flash);

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.1 });
            gsap.to(flash, { opacity: 0, duration: 0.4, delay: 0.1, onComplete: () => flash.remove() });
        } else {
            flash.animate([
                { opacity: 0 }, { opacity: 1 }, { opacity: 0 }
            ], { duration: 500 }).onfinish = () => flash.remove();
        }
    }

    // Stagger animate elements
    staggerReveal(elements, delay = 0.1) {
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(elements,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: delay, ease: 'power2.out' }
            );
        }
    }

    // Helper: Animate with promise
    animate(element, props, duration) {
        return new Promise(resolve => {
            if (typeof gsap !== 'undefined') {
                gsap.to(element, { ...props, duration, onComplete: resolve });
            } else {
                Object.assign(element.style, props);
                setTimeout(resolve, duration * 1000);
            }
        });
    }
}

// Export instance
const animations = new AnimationEngine();
