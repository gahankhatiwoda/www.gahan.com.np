// Authentication Module
const Auth = (function() {
    // User state
    const UserState = {
        loggedIn: false,
        data: null,
        preferences: {}
    };

    // Initialize Google Sign-In
    function initializeGoogleSignIn() {
        console.log('Initializing Google Sign-In...');
        
        // Check if Google Identity Services is loaded
        if (typeof google === 'undefined') {
            console.log('Google API not loaded yet, retrying in 1 second...');
            setTimeout(initializeGoogleSignIn, 1000);
            return;
        }
        
        if (!google.accounts || !google.accounts.id) {
            console.error('Google.accounts.id not available');
            showManualGoogleButton();
            return;
        }
        
        try {
            console.log('Google Identity Services loaded successfully');
            
            // Check for pending credentials
            const pendingCredential = localStorage.getItem('pending_google_credential');
            if (pendingCredential) {
                console.log('Processing pending Google credential');
                processGoogleCredential(pendingCredential);
                localStorage.removeItem('pending_google_credential');
            }
            
            // Show manual button as fallback
            showManualGoogleButton();
            
        } catch (error) {
            console.error('Error initializing Google Sign-In:', error);
            showManualGoogleButton();
        }
    }

    // Show manual Google button
    function showManualGoogleButton() {
        const manualBtn = document.getElementById('manualGoogleBtn');
        if (manualBtn) {
            manualBtn.style.display = 'block';
        }
    }

    // Manual Google Sign-In trigger
    function triggerManualGoogleSignIn() {
        console.log('Manual Google Sign-In triggered');
        
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
            UI.showError('Google Sign-In not available. Please refresh the page.');
            return;
        }
        
        try {
            google.accounts.id.prompt();
        } catch (error) {
            console.error('Error triggering Google Sign-In:', error);
            UI.showError('Failed to open Google Sign-In. Please try again.');
        }
    }

    // Handle Google credential response
    function handleCredentialResponse(response) {
        console.log('Google credential response received');
        
        // Show loading
        showGoogleLoading(true);
        
        if (!response || !response.credential) {
            console.error('No credential in response:', response);
            showGoogleLoading(false);
            UI.showError('Google Sign-In failed. No credential received.');
            return;
        }
        
        // Process the credential
        processGoogleCredential(response.credential);
    }

    // Process Google credential
    async function processGoogleCredential(credential) {
        try {
            console.log('Processing Google credential...');
            
            // Decode the JWT token
            const token = credential;
            const parts = token.split('.');
            
            if (parts.length !== 3) {
                throw new Error('Invalid JWT token format');
            }
            
            // Decode base64 URL safely
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            console.log('Decoded Google payload:', payload);
            
            const googleUserData = {
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                given_name: payload.given_name,
                family_name: payload.family_name,
                email_verified: payload.email_verified === true,
                token: token,
                timestamp: Utils.getISOTime(),
                sub: payload.sub // Google user ID
            };
            
            // Validate required fields
            if (!googleUserData.email) {
                throw new Error('No email in Google response');
            }
            
            if (!googleUserData.email_verified) {
                UI.showError('Please verify your email with Google first.');
                showGoogleLoading(false);
                return;
            }
            
            // Store Google user data
            Utils.Storage.set('google_user_data', googleUserData);
            
            // Update UI
            updateGoogleUserUI(googleUserData);
            
            // Hide loading
            showGoogleLoading(false);
            
            // Auto-proceed after short delay
            setTimeout(() => {
                loginWithGoogle();
            }, 800);
            
        } catch (error) {
            console.error('Error processing Google credential:', error);
            showGoogleLoading(false);
            UI.showError(`Google Sign-In failed: ${error.message}`);
        }
    }

    // Show/hide Google loading
    function showGoogleLoading(show) {
        const loadingElement = document.getElementById('googleLoading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    // Update Google user UI
    function updateGoogleUserUI(googleUserData) {
        const googleUserInfo = document.getElementById('googleUserInfo');
        const googleAvatar = document.getElementById('googleAvatar');
        const googleName = document.getElementById('googleName');
        const googleEmail = document.getElementById('googleEmail');
        const googleSignin = document.querySelector('.g_id_signin');
        const manualBtn = document.getElementById('manualGoogleBtn');
        
        if (googleUserInfo && googleAvatar && googleName && googleEmail) {
            googleUserInfo.style.display = 'block';
            googleAvatar.src = googleUserData.picture || 'https://via.placeholder.com/60?text=User';
            googleName.textContent = googleUserData.name || 'Google User';
            googleEmail.textContent = googleUserData.email;
            
            // Hide Google button
            if (googleSignin) googleSignin.style.display = 'none';
            if (manualBtn) manualBtn.style.display = 'none';
            
            console.log('Google user UI updated');
        }
    }

    // Login with Google
    async function loginWithGoogle() {
        console.log('Starting Google login process...');
        
        const googleUserData = Utils.Storage.get('google_user_data');
        
        if (!googleUserData) {
            UI.showError('Please sign in with Google first');
            return;
        }
        
        const googleEmail = googleUserData.email;
        console.log('Checking authorization for:', googleEmail);
        
        // Show loading
        UI.showLoading('Checking Google account authorization...');
        
        try {
            // Check if email is authorized in your system
            const response = await fetch(`${Utils.CONFIG.LOGIN_CHECK_URL}?action=checkEmail&email=${encodeURIComponent(googleEmail)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Authorization result:', result);
            
            if (result.success) {
                // Successful login
                await handleSuccessfulLogin({
                    username: result.username || googleEmail.split('@')[0],
                    email: googleEmail,
                    method: 'google_oauth',
                    remember: true,
                    googleData: googleUserData
                });
                
                UI.hideLoading();
                console.log('Google login successful');
            } else {
                UI.hideLoading();
                UI.showError('Your Google account is not authorized. Contact admin for access.');
                console.log('User not authorized:', result);
            }
            
        } catch (error) {
            UI.hideLoading();
            console.error('Google login error:', error);
            UI.showError(`Login failed: ${error.message}. Please try again.`);
        }
    }

    // Traditional login
    async function loginUser() {
        const username = document.getElementById('username')?.value.trim();
        const password = document.getElementById('password')?.value;
        const rememberMe = document.getElementById('rememberMe')?.checked;
        
        if (!username || !password) {
            UI.showError('Please enter both username and password');
            return;
        }
        
        const loginBtn = document.getElementById('loginBtn');
        if (!loginBtn) return;
        
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        loginBtn.disabled = true;
        UI.hideError();
        
        try {
            const response = await fetch(`${Utils.CONFIG.LOGIN_CHECK_URL}?action=checkCred&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
            const result = await response.json();
            
            if (result.success) {
                await handleSuccessfulLogin({
                    username: username,
                    email: result.email || '',
                    method: 'traditional',
                    remember: rememberMe
                });
            } else {
                UI.showError('Invalid username or password');
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
            }
        } catch (error) {
            UI.showError('Network error. Please try again.');
            console.error('Login error:', error);
        } finally {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    // Handle successful login (common for both methods)
    async function handleSuccessfulLogin(userData) {
        const loginTime = Utils.getISOTime();
        const userSession = {
            username: userData.username,
            email: userData.email,
            sessionId: Tracking.AppState.session.id,
            loginTime: loginTime,
            userAgent: navigator.userAgent,
            loginMethod: userData.method,
            googleData: userData.googleData,
            preferences: {}
        };
        
        Utils.Storage.set('gahan_user_v2', userSession);
        
        if (userData.remember) {
            Utils.Storage.set('remember_user', 'true');
        }
        
        UserState.loggedIn = true;
        UserState.data = userSession;
        UserState.preferences = userSession.preferences || {};
        
        // Send login tracking event
        await Tracking.sendTrackingEvent({
            type: 'login',
            eventType: 'login',
            metadata: {
                method: userData.method,
                username: userData.username,
                provider: userData.method === 'google_oauth' ? 'google' : 'traditional'
            }
        });
        
        // Update counters
        await Tracking.updateCounters();
        
        // Show success screen
        UI.showSuccessScreen(userData.username, userData.email, loginTime, userData.method);
        
        // Show welcome message
        UI.showToast(`Welcome back, ${userData.username}!`, 'success');
    }

    // Google logout
    function googleLogout() {
        const googleUserData = Utils.Storage.get('google_user_data');
        
        if (googleUserData && googleUserData.token) {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                try {
                    google.accounts.id.revoke(googleUserData.token, done => {
                        console.log('Google token revoked:', done);
                    });
                } catch (error) {
                    console.error('Error revoking Google token:', error);
                }
            }
        }
        
        Utils.Storage.remove('google_user_data');
        
        // Reset UI
        const googleUserInfo = document.getElementById('googleUserInfo');
        const googleSignin = document.querySelector('.g_id_signin');
        const manualBtn = document.getElementById('manualGoogleBtn');
        
        if (googleUserInfo) googleUserInfo.style.display = 'none';
        if (googleSignin) googleSignin.style.display = 'block';
        if (manualBtn) manualBtn.style.display = 'block';
        
        UI.showToast('Google account disconnected', 'info');
    }

    // Logout user
    function logout() {
        // Send logout tracking event
        Tracking.sendTrackingEvent({
            type: 'logout',
            eventType: 'logout',
            metadata: {
                sessionDuration: Date.now() - Tracking.AppState.session.startTime,
                pageViews: Tracking.AppState.session.pageViews
            }
        });
        
        // Send session end event
        Tracking.sendTrackingEvent({
            type: 'session_end',
            eventType: 'session_end'
        });
        
        // Clear all user data
        Utils.Storage.remove('gahan_user_v2');
        Utils.Storage.remove('remember_user');
        
        // Also clear Google data if exists
        const userData = Utils.Storage.get('gahan_user_v2');
        if (userData && userData.loginMethod === 'google_oauth') {
            googleLogout();
        }
        
        // Reset state
        UserState.loggedIn = false;
        UserState.data = null;
        UserState.preferences = {};
        
        // Reload page
        location.reload();
    }

    // Check existing login session
    async function checkExistingLogin() {
        const userSession = Utils.Storage.get('gahan_user_v2');
        
        if (userSession && userSession.loginTime) {
            const loginTime = new Date(userSession.loginTime);
            const now = new Date();
            const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursSinceLogin < 24) {
                UserState.loggedIn = true;
                UserState.data = userSession;
                UserState.preferences = userSession.preferences || {};
                
                UI.showSuccessScreen(
                    userSession.username,
                    userSession.email,
                    userSession.loginTime,
                    userSession.loginMethod
                );
                
                await Tracking.updateCounters();
                return true;
            } else {
                Utils.Storage.remove('gahan_user_v2');
            }
        }
        
        return false;
    }

    // Get user state
    function getUserState() {
        return UserState;
    }

    // Initialize Google Sign-In after modules are loaded
    setTimeout(initializeGoogleSignIn, 2000);

    return {
        loginUser,
        handleCredentialResponse,
        loginWithGoogle,
        logout,
        googleLogout,
        triggerManualGoogleSignIn,
        checkExistingLogin,
        getUserState
    };
})();