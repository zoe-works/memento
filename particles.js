class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 60;
        
        // Colors from CSS custom properties or fallback
        this.colors = [
            'rgba(99, 102, 241, 0.4)',  // Indigo
            'rgba(139, 92, 246, 0.4)',  // Violet
            'rgba(34, 211, 238, 0.4)'   // Cyan
        ];

        this.init();
        this.animate();
        
        // Handle resize
        window.addEventListener('resize', () => this.resize());
    }

    init() {
        this.resize();
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    createParticle() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            size: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3 - 0.1, // Slight upward drift
            color: this.colors[Math.floor(Math.random() * this.colors.length)],
            opacity: Math.random() * 0.5 + 0.1,
            pulseSpeed: Math.random() * 0.02 + 0.005,
            pulseDir: Math.random() > 0.5 ? 1 : -1
        };
    }

    updateParticle(p) {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Pulse opacity
        p.opacity += p.pulseSpeed * p.pulseDir;
        if (p.opacity >= 0.8) {
            p.opacity = 0.8;
            p.pulseDir = -1;
        } else if (p.opacity <= 0.1) {
            p.opacity = 0.1;
            p.pulseDir = 1;
        }

        // Wrap around edges
        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;
    }

    drawParticle(p) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // Parse the rgba color to inject current opacity
        const colorParts = p.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
        if (colorParts) {
            this.ctx.fillStyle = `rgba(${colorParts[1]}, ${colorParts[2]}, ${colorParts[3]}, ${p.opacity})`;
        } else {
            this.ctx.fillStyle = p.color;
        }
        
        this.ctx.fill();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        for (let i = 0; i < this.particles.length; i++) {
            this.updateParticle(this.particles[i]);
            this.drawParticle(this.particles[i]);
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem('particles');
});
