// Utility Functions Module
const Utils = (function() {
    // Configuration
    const CONFIG = {
        SHEET_URL: "https://script.google.com/macros/s/AKfycbyLSzGLCQ_SDzBDYGLcEWBk7kMs1DEUznin7wsuMo9wrggAdynA02us-I0YGKKbI921/exec",
        LOGIN_CHECK_URL: "https://script.google.com/macros/s/AKfycbxW52YW8GHm0OK7cJPnICiAkMt8EFDcU6laCi_tebb4syIDCpW4LRyMM_gBwwKs81Z-/exec",
        REFRESH_INTERVAL: 30000,
        HEARTBEAT_INTERVAL: 120000,
        INACTIVITY_TIMEOUT: 300000
    };

    // Generate unique visitor ID
    function generateVisitorId() {
        const random = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now().toString(36);
        const hash = btoa(random + timestamp).substr(0, 20);
        return 'vis_' + hash;
    }

    // Generate unique session ID
    function generateSessionId(visitorId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const hash = btoa(visitorId + timestamp + random).substr(0, 32);
        return 'sess_' + hash;
    }

    // Animate number transition
    function animateNumber(element, target, padding) {
        if (!element) return;
        
        const current = parseInt(element.textContent) || 0;
        if (current === target) return;
        
        const duration = 400;
        const steps = 15;
        const increment = (target - current) / steps;
        let step = 0;
        
        function update() {
            if (step < steps) {
                const value = Math.round(current + (increment * step));
                element.textContent = value.toString().padStart(padding, '0');
                step++;
                requestAnimationFrame(update);
            } else {
                element.textContent = target.toString().padStart(padding, '0');
            }
        }
        
        update();
    }

    // Debounce function
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

    // Get device type
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return "tablet";
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return "mobile";
        }
        return "desktop";
    }

    // Parse user agent
    function parseUserAgent(userAgent) {
        if (!userAgent) return { device: "desktop", browser: "unknown", os: "unknown" };
        
        const ua = userAgent.toLowerCase();
        let device = "desktop";
        let browser = "unknown";
        let os = "unknown";
        
        // Detect device
        if (ua.match(/mobile|android|iphone|ipad|ipod/)) {
            device = "mobile";
        } else if (ua.match(/tablet/)) {
            device = "tablet";
        }
        
        // Detect browser
        if (ua.includes("chrome")) browser = "chrome";
        else if (ua.includes("firefox")) browser = "firefox";
        else if (ua.includes("safari")) browser = "safari";
        else if (ua.includes("edge")) browser = "edge";
        else if (ua.includes("opera")) browser = "opera";
        
        // Detect OS
        if (ua.includes("windows")) os = "windows";
        else if (ua.includes("mac os")) os = "macos";
        else if (ua.includes("linux")) os = "linux";
        else if (ua.includes("android")) os = "android";
        else if (ua.includes("ios")) os = "ios";
        
        return { device, browser, os };
    }

    // Get screen resolution
    function getScreenResolution() {
        return `${window.screen.width}x${window.screen.height}`;
    }

    // Get timezone
    function getTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
            return "unknown";
        }
    }

    // Format date
    function formatDate(date, format = 'short') {
        const d = new Date(date);
        if (format === 'short') {
            return d.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return d.toLocaleString();
    }

    // Validate email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate password strength
    function isStrongPassword(password) {
        return password.length >= 6;
    }

    // Sanitize input
    function sanitizeInput(input) {
        return input.trim().replace(/[<>]/g, '');
    }

    // Get current time in ISO format
    function getISOTime() {
        return new Date().toISOString();
    }

    // Calculate time difference in minutes
    function getTimeDiffInMinutes(startTime) {
        const now = new Date();
        const start = new Date(startTime);
        return Math.round((now - start) / (1000 * 60));
    }

    // Calculate percentage
    function calculatePercentage(part, total) {
        if (total === 0) return 0;
        return Math.round((part / total) * 100);
    }

    // Format number with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Get URL parameters
    function getUrlParams() {
        const params = {};
        window.location.search.substring(1).split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) params[key] = decodeURIComponent(value || '');
        });
        return params;
    }

    // Check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Copy to clipboard
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }

    // Throttle function
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Storage helper with fallback
    const Storage = {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('LocalStorage failed, using sessionStorage');
                try {
                    sessionStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e2) {
                    console.error('Both storage methods failed');
                    return false;
                }
            }
        },

        get: function(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                try {
                    const item = sessionStorage.getItem(key);
                    return item ? JSON.parse(item) : null;
                } catch (e2) {
                    return null;
                }
            }
        },

        remove: function(key) {
            try {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            } catch (e) {
                console.error('Error removing from storage:', e);
            }
        },

        clear: function() {
            try {
                localStorage.clear();
                sessionStorage.clear();
            } catch (e) {
                console.error('Error clearing storage:', e);
            }
        }
    };

    return {
        CONFIG,
        generateVisitorId,
        generateSessionId,
        animateNumber,
        debounce,
        getDeviceType,
        parseUserAgent,
        getScreenResolution,
        getTimezone,
        formatDate,
        isValidEmail,
        isStrongPassword,
        sanitizeInput,
        getISOTime,
        getTimeDiffInMinutes,
        calculatePercentage,
        formatNumber,
        getUrlParams,
        isInViewport,
        copyToClipboard,
        throttle,
        Storage
    };
})();