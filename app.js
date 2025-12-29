// Main Application Initialization
(async function() {
    // Initialize application
    async function initializeApp() {
        UI.showLoading("Initializing Enhanced Tracking System...");
        
        try {
            // Step 1: Update dynamic spacing
            UI.updateDynamicSpacing();
            
            // Step 2: Check privacy acceptance
            await checkPrivacyStatus();
            
            // Step 3: Initialize session tracking
            await Tracking.initializeSession();
            
            // Step 4: Load user preferences
            UI.loadUserPreferences();
            
            // Step 5: Check existing login session
            await Auth.checkExistingLogin();
            
            // Step 6: Setup activity tracking
            Tracking.setupActivityTracking();
            
            // Step 7: Set up event listeners
            UI.setupEventListeners();
            
            // Step 8: Start background updates
            Analytics.startBackgroundUpdates();
            
            // Step 9: Initial counter update
            await Tracking.updateCounters();
            UI.updateCounterDisplay();
            
            // Step 10: Hide loading screen
            setTimeout(() => {
                UI.hideLoading();
                UI.showToast('System initialized successfully!', 'success');
            }, 1000);
            
        } catch (error) {
            console.error('Initialization error:', error);
            UI.showToast('Initialization failed. Some features may not work.', 'error');
            UI.hideLoading();
        }
    }

    // Check privacy status
    async function checkPrivacyStatus() {
        const privacyAccepted = Utils.Storage.get('privacy_accepted_v2');
        const firstVisit = !Utils.Storage.get('visitor_first_seen_v2');
        
        if (!privacyAccepted && firstVisit) {
            setTimeout(() => {
                UI.showPrivacyModal();
            }, 2000);
        }
        
        return privacyAccepted;
    }

    // Start when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        UI.updateDynamicSpacing();
        initializeApp();
    });

    // Update spacing on load
    window.addEventListener('load', function() {
        setTimeout(UI.updateDynamicSpacing, 100);
        setTimeout(UI.updateDynamicSpacing, 500);
    });

    // Service Worker registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('ServiceWorker registered:', registration.scope);
            }).catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
        });
    }
})();