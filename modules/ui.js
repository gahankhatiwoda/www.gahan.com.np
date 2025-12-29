// UI Module
const UI = (function() {
    // Update dynamic spacing
    function updateDynamicSpacing() {
        const nav = document.querySelector('.top-nav');
        const dashboard = document.querySelector('.visitor-dashboard');
        const main = document.querySelector('.main-container');
        
        if (nav && dashboard && main) {
            const navHeight = nav.offsetHeight;
            const dashboardHeight = dashboard.offsetHeight;
            const totalTopSpace = navHeight + dashboardHeight + 20;
            
            document.documentElement.style.setProperty('--total-top-space', totalTopSpace + 'px');
            main.style.marginTop = totalTopSpace + 'px';
        }
    }

    // Show success screen
    function showSuccessScreen(username, email, loginTime, method) {
        const loginScreen = document.getElementById('loginScreen');
        const successScreen = document.getElementById('successScreen');
        
        if (loginScreen) loginScreen.style.display = 'none';
        
        const displayUsername = document.getElementById('displayUsername');
        const displayEmail = document.getElementById('displayEmail');
        const displayMethod = document.getElementById('displayMethod');
        const displaySessionTime = document.getElementById('displaySessionTime');
        const displayVisitorId = document.getElementById('displayVisitorId');
        
        if (displayUsername) displayUsername.textContent = username;
        if (displayEmail) displayEmail.textContent = email;
        if (displayMethod) displayMethod.textContent = method === 'google_oauth' ? 'Google OAuth' : 'Traditional';
        if (displaySessionTime) displaySessionTime.textContent = Utils.formatDate(loginTime);
        if (displayVisitorId) displayVisitorId.textContent = Tracking.AppState.session.visitorId;
        
        if (successScreen) {
            successScreen.style.display = 'block';
            successScreen.classList.add('fade-in');
        }
        
        setTimeout(updateDynamicSpacing, 100);
    }

    // Show error message
    function showError(message) {
        const errorElement = document.getElementById('errorMessage');
        const errorText = document.getElementById('errorText');
        
        if (errorElement && errorText) {
            errorText.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    // Hide error message
    function hideError() {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    // Show loading overlay
    function showLoading(message) {
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        if (loadingProgress) loadingProgress.textContent = message;
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    }

    // Hide loading overlay
    function hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                loadingOverlay.style.opacity = '1';
            }, 300);
        }
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    // Switch tab
    function switchTab(tabName) {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.includes(tabName === 'traditional' ? 'Traditional' : 'Google')) {
                btn.classList.add('active');
            }
        });
        
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabName}Tab`);
        if (targetTab) targetTab.classList.add('active');
    }

    // Toggle password visibility
    function togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('.password-toggle i');
        
        if (!passwordInput || !toggleIcon) return;
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }

    // Toggle dark mode
    function toggleDarkMode() {
        const darkMode = !document.body.classList.contains('dark-mode');
        document.body.classList.toggle('dark-mode', darkMode);
        Utils.Storage.set('dark_mode', darkMode);
        showToast(darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'success');
    }

    // Show analytics modal
    function showAnalyticsModal() {
        const modal = document.getElementById('analyticsModal');
        if (modal) {
            modal.style.display = 'flex';
            Analytics.updateModal();
            Analytics.loadRealTimeData();
        }
    }

    // Hide analytics modal
    function hideAnalyticsModal() {
        const modal = document.getElementById('analyticsModal');
        if (modal) modal.style.display = 'none';
    }

    // Show privacy modal
    function showPrivacyModal() {
        const modal = document.getElementById('privacyModal');
        if (modal) modal.style.display = 'flex';
    }

    // Hide privacy modal
    function hidePrivacyModal() {
        const modal = document.getElementById('privacyModal');
        if (modal) modal.style.display = 'none';
    }

    // Accept privacy
    function acceptPrivacy() {
        Utils.Storage.set('privacy_accepted_v2', 'true');
        Utils.Storage.set('privacy_accepted_date', Utils.getISOTime());
        hidePrivacyModal();
        showToast('Privacy preferences saved!', 'success');
    }

    // Show privacy settings
    function showPrivacySettings() {
        hidePrivacyModal();
        showToast('Privacy settings panel coming soon!', 'info');
    }

    // Go to content page
    function goToContent(contentType) {
        Tracking.sendTrackingEvent({
            type: 'content_access',
            eventType: 'content_access',
            metadata: {
                contentType: contentType,
                user: Auth.getUserState().data?.username || 'guest'
            }
        });
        
        Utils.Storage.set('last_content_access', contentType);
        Utils.Storage.set('last_access_time', Utils.getISOTime());
        
        const successScreen = document.getElementById('successScreen');
        if (successScreen) {
            successScreen.innerHTML = `
                <div style="text-align: center; padding: 60px;">
                    <div class="loading-spinner" style="margin: 0 auto 30px;"></div>
                    <h2 style="color: var(--primary);">Loading ${contentType.toUpperCase()} Content</h2>
                    <p style="color: var(--gray); margin-top: 15px;">Preparing enhanced learning materials...</p>
                </div>
            `;
        }
        
        setTimeout(() => {
            const pages = {
                odd: 'odd.html',
                even: 'even.html',
                obj: 'obj.html'
            };
            window.location.href = pages[contentType] || 'index.html';
        }, 1500);
    }

    // Show session info
    function showSessionInfo() {
        const sessionInfo = Tracking.getSessionInfo();
        const info = `
            Session ID: ${sessionInfo.sessionId.substring(0, 20)}...
            Visitor ID: ${sessionInfo.visitorId}
            Session Start: ${Utils.formatDate(sessionInfo.startTime)}
            Page Views: ${sessionInfo.pageViews}
            Events Sent: ${sessionInfo.eventsCount}
            User Agent: ${navigator.userAgent.substring(0, 50)}...
        `;
        
        alert('Session Information:\n\n' + info);
    }

    // Update counter display
    function updateCounterDisplay() {
        const counters = Tracking.getCounters();
        const trends = Tracking.getTrends();
        
        const totalElement = document.getElementById('totalVisitors');
        const uniqueElement = document.getElementById('uniqueVisitors');
        const liveElement = document.getElementById('liveVisitors');
        
        if (totalElement) Utils.animateNumber(totalElement, counters.total, 4);
        if (uniqueElement) Utils.animateNumber(uniqueElement, counters.unique, 4);
        if (liveElement) Utils.animateNumber(liveElement, counters.live, 2);
    }

    // Load user preferences
    function loadUserPreferences() {
        const darkMode = Utils.Storage.get('dark_mode') === true;
        if (darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const passwordToggle = document.querySelector('.password-toggle');
        
        if (usernameInput) {
            usernameInput.addEventListener('keypress', e => {
                if (e.key === 'Enter') {
                    if (passwordInput) passwordInput.focus();
                }
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('keypress', e => {
                if (e.key === 'Enter') {
                    Auth.loginUser();
                }
            });
        }
        
        if (passwordToggle) {
            passwordToggle.addEventListener('click', togglePassword);
        }
        
        window.addEventListener('resize', Utils.debounce(updateDynamicSpacing, 250));
        
        window.addEventListener('online', () => {
            showToast('Connection restored', 'success');
            Tracking.updateCounters();
            Tracking.retryFailedEvents();
        });
        
        window.addEventListener('offline', () => {
            showToast('Connection lost. Working offline...', 'warning');
        });
        
        // Error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            Tracking.sendTrackingEvent({
                type: 'error',
                eventType: 'javascript_error',
                metadata: {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                }
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            Tracking.sendTrackingEvent({
                type: 'error',
                eventType: 'promise_rejection',
                metadata: {
                    reason: event.reason?.toString() || 'Unknown'
                }
            });
        });
    }

    return {
        updateDynamicSpacing,
        showSuccessScreen,
        showError,
        hideError,
        showLoading,
        hideLoading,
        showToast,
        switchTab,
        togglePassword,
        toggleDarkMode,
        showAnalyticsModal,
        hideAnalyticsModal,
        showPrivacyModal,
        hidePrivacyModal,
        acceptPrivacy,
        showPrivacySettings,
        goToContent,
        showSessionInfo,
        updateCounterDisplay,
        loadUserPreferences,
        setupEventListeners
    };
})();