// Authentication Module with Enhanced Google Login
const Auth = (function() {
    // User state
    const UserState = {
        loggedIn: false,
        data: null,
        preferences: {}
    };

    // Debug function
    function debugLog(message, data = null) {
        console.log(`[Google Auth] ${message}`, data || '');
        
        // Update debug UI if exists
        const debugElement = document.getElementById('googleDebug');
        const statusElement = document.getElementById('googleStatus');
        
        if (debugElement && statusElement) {
            statusElement.textContent = message;
            debugElement.style.display = 'block';
        }
    }

    // Initialize Google Sign-In
    function initializeGoogleSignIn() {
        debugLog('Initializing Google Sign-In...');
        
        // Check if Google Identity Services is loaded
        if (typeof google === 'undefined') {
            debugLog('Google API not loaded yet, waiting...');
            setTimeout(initializeGoogleSignIn, 1000);
            return;
        }
        
        if (!google.accounts) {
            debugLog('Google.accounts not available');
            return;
        }
        
        try {
            debugLog('Google API loaded successfully');
            
            // Show manual button as fallback
            const manualBtn = document.getElementById('manualGoogleBtn');
            if (manualBtn) {
                manualBtn.style.display = 'block';
                manualBtn.addEventListener('click', triggerManualGoogleSignIn);
            }
            
        } catch (error) {
            debugLog('Error initializing Google:', error.message);
        }
    }

    // Manual Google Sign-In trigger
    function triggerManualGoogleSignIn() {
        debugLog('Manual Google Sign-In triggered');
        
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
            UI.showError('Google Sign-In not available. Please refresh the page.');
            return;
        }
        
        // Trigger Google Sign-In
        google.accounts.id.prompt();
    }

    // Handle Google credential response
    async function handleCredentialResponse(response) {
        debugLog('Google credential response received');
        
        // Show loading
        const loadingElement = document.getElementById('googleLoading');
        if (loadingElement) loadingElement.style.display = 'block';
        
        if (!response || !response.credential) {
            debugLog('No credential in response', response);
            if (loadingElement) loadingElement.style.display = 'none';
            UI.showError('Google Sign-In failed. Please try again.');
            return;
        }
        
        try {
            const token = response.credential;
            debugLog('JWT Token received');
            
            // Decode the JWT token
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT token format');
            }
            
            // Decode base64 URL safely
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            debugLog('Decoded payload', { 
                email: payload.email, 
                name: payload.name,
                email_verified: payload.email_verified 
            });
            
            const googleUserData = {
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                given_name: payload.given_name,
                family_name: payload.family_name,
                email_verified: payload.email_verified === true,
                token: token,
                timestamp: Utils.getISOTime(),
                sub: payload.sub
            };
            
            // Validate required fields
            if (!googleUserData.email) {
                throw new Error('No email in Google response');
            }
            
            if (!googleUserData.email_verified) {
                UI.showError('Please verify your email with Google first.');
                if (loadingElement) loadingElement.style.display = 'none';
                return;
            }
            
            // Store Google user data
            Utils.Storage.set('google_user_data', googleUserData);
            
            // Update UI
            updateGoogleUserUI(googleUserData);
            
            // Hide loading
            if (loadingElement) loadingElement.style.display = 'none';
            
            // Auto-proceed after short delay
            setTimeout(() => {
                loginWithGoogle();
            }, 800);
            
        } catch (error) {
            debugLog('Error processing Google response:', error.message);
            if (loadingElement) loadingElement.style.display = 'none';
            UI.showError(`Google Sign-In failed: ${error.message}`);
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
            
            if (googleSignin) googleSignin.style.display = 'none';
            if (manualBtn) manualBtn.style.display = 'none';
            
            debugLog('Google user UI updated');
        }
    }

    // Login with Google
    async function loginWithGoogle() {
        debugLog('Starting Google login process...');
        
        const googleUserData = Utils.Storage.get('google_user_data');
        
        if (!googleUserData) {
            UI.showError('Please sign in with Google first');
            return;
        }
        
        const googleEmail = googleUserData.email;
        debugLog('Checking authorization for:', googleEmail);
        
        // Show loading
        UI.showLoading('Checking Google account authorization...');
        
        try {
            // Check if email is authorized
            const response = await fetch(`${Utils.CONFIG.LOGIN_CHECK_URL}?action=checkEmail&email=${encodeURIComponent(googleEmail)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            debugLog('Authorization result:', result);
            
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
                debugLog('Google login successful');
            } else {
                UI.hideLoading();
                UI.showError('Your Google account is not authorized. Contact admin for access.');
                debugLog('User not authorized');
            }
            
        } catch (error) {
            UI.hideLoading();
            debugLog('Google login error:', error.message);
            UI.showError(`Login failed: ${error.message}. Please try again.`);
        }
    }

    // Traditional login (keep as is)
    async function loginUser() {
        // ... your existing traditional login code ...
    }

    // Handle successful login (common)
    async function handleSuccessfulLogin(userData) {
        // ... your existing successful login code ...
    }

    // Google logout
    function googleLogout() {
        const googleUserData = Utils.Storage.get('google_user_data');
        
        if (googleUserData && googleUserData.token) {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                google.accounts.id.revoke(googleUserData.token, done => {
                    debugLog('Google token revoked');
                });
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
        debugLog('Google logout completed');
    }

    // Initialize on load
    setTimeout(initializeGoogleSignIn, 2000);

    return {
        loginUser,
        handleCredentialResponse,
        loginWithGoogle,
        logout,
        googleLogout,
        checkExistingLogin,
        getUserState: () => UserState,
        debugLog // Expose for testing
    };
})();