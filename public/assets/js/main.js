// Smooth scrolling for anchor links
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

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards, command categories, etc.
document.querySelectorAll('.feature-card, .command-category, .step, .support-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Update server count dynamically
async function updateServerCount() {
    try {
        const response = await fetch('/health');
        if (response.ok) {
            const data = await response.json();
            // We don't have server count in /health yet (only uptime, queues)
            // Let's assume activeQueues ~ active servers usage
            // Or just keep the dummy for now, or update healthCheck.ts to expose guild count.
            // healthCheck.ts exposes: uptime, activeQueues, memory.
            // I'll use activeQueues for "Active Sessions".
            
            const statsContainer = document.querySelector('.hero-stats');
            if (statsContainer) {
                // Update Uptime
                const uptimeEl = statsContainer.querySelector('.stat:nth-child(2) .stat-number');
                if (uptimeEl) {
                    const hours = Math.floor(data.uptime / 3600);
                    uptimeEl.textContent = `${hours}h`;
                }

                // Update Active Queues
                const queuesEl = statsContainer.querySelector('.stat:nth-child(1) .stat-number');
                if (queuesEl) {
                    queuesEl.textContent = data.activeQueues;
                    const label = statsContainer.querySelector('.stat:nth-child(1) .stat-label');
                    if (label) label.textContent = 'Active Sessions';
                }
            }
        }
    } catch (error) {
        console.log('Could not fetch stats');
    }
}

// Animate numbers
function animateNumber(elementId, target, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + '+';
        }
    }, 16);
}

// Call on page load
window.addEventListener('load', () => {
    updateServerCount();
});

// Add active state to nav on scroll
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    } else {
        header.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});
