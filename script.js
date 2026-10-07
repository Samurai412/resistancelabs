/**
 * Resistance Labs — Interactive Runtime
 * Standards: Native browser APIs, high reliability, zero runtime bloat.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSuntownGoldenHour();
    initSmoothScrolling();
    initHeaderElevation();
});

/**
 * Real-time Suntown Golden Hour Calculator
 * Ritual: Opens 14:00 UTC, closes 18:00 UTC every single day.
 */
function initSuntownGoldenHour() {
    const countdownEl = document.getElementById('gh-countdown');
    const statusBadgeEl = document.getElementById('gh-status-badge');
    const statusTextEl = document.getElementById('gh-status-text');

    if (!countdownEl || !statusBadgeEl || !statusTextEl) return;

    function update() {
        const now = new Date();
        const utcHours = now.getUTCHours();
        const utcMinutes = now.getUTCMinutes();
        const utcSeconds = now.getUTCSeconds();

        const currentSecondsToday = (utcHours * 3600) + (utcMinutes * 60) + utcSeconds;
        const openSeconds = 14 * 3600;  // 14:00 UTC = 50,400s
        const closeSeconds = 18 * 3600; // 18:00 UTC = 64,800s

        const isOpen = currentSecondsToday >= openSeconds && currentSecondsToday < closeSeconds;

        if (isOpen) {
            // Golden Hour is active right now! Countdown until 18:00 UTC
            const secondsRemaining = closeSeconds - currentSecondsToday;
            const h = Math.floor(secondsRemaining / 3600);
            const m = Math.floor((secondsRemaining % 3600) / 60);
            const s = secondsRemaining % 60;

            countdownEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
            countdownEl.classList.add('active-now');
            statusBadgeEl.textContent = 'GOLDEN HOUR IN SESSION';
            statusBadgeEl.style.color = 'var(--cyan)';
            statusTextEl.innerHTML = `<strong>Town Open:</strong> Golden Hour is active right now. Writing room open until 18:00 UTC.`;
        } else {
            // Town is closed. Calculate time until next 14:00 UTC
            let secondsUntilOpen;
            if (currentSecondsToday < openSeconds) {
                secondsUntilOpen = openSeconds - currentSecondsToday;
            } else {
                // Already past 18:00 UTC today; next opening is tomorrow at 14:00 UTC
                secondsUntilOpen = (86400 - currentSecondsToday) + openSeconds;
            }

            const h = Math.floor(secondsUntilOpen / 3600);
            const m = Math.floor((secondsUntilOpen % 3600) / 60);
            const s = secondsUntilOpen % 60;

            countdownEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
            countdownEl.classList.remove('active-now');
            statusBadgeEl.textContent = 'TOWN CLOSED';
            statusBadgeEl.style.color = 'var(--gold)';
            statusTextEl.innerHTML = `Suntown is closed to protect offline life. Opens next at <strong>14:00 UTC</strong> for a 4-hour gathering.`;
        }
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    update();
    window.setInterval(update, 1000);
}

/**
 * Accessible smooth scrolling for on-page navigation anchors
 */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (event) => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            event.preventDefault();
            const headerOffset = 76;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });

            // Update URL hash without jumping
            history.pushState(null, null, targetId);
        });
    });
}

/**
 * Elevate header on scroll for visual depth
 */
function initHeaderElevation() {
    const header = document.getElementById('site-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            header.style.borderBottomColor = 'rgba(255, 255, 255, 0.14)';
            header.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.45)';
        } else {
            header.style.borderBottomColor = 'rgba(255, 255, 255, 0.08)';
            header.style.boxShadow = 'none';
        }
    }, { passive: true });
}
