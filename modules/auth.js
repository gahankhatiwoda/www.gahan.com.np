// Authentication Module
const Auth = (function() {
    // User state
    const UserState = {
        loggedIn: false,
        data: null,
        preferences: {}
    };

    // Login user with credentials
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

    // Handle Google credential response
    function handleCredentialResponse(response) {
        if (!response || !response.credential) {
            UI.showError('Google Sign-In failed. Please try again.');
            return;
        }
        
        try {
            const token = response.credential;
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            const googleUserData = {
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                given_name: payload.given_name,
                family_name: payload.family_name,
                email_verified: payload.email_verified,
                token: token,
                timestamp: Utils.getISOTime()
            };
            
            Utils.Storage.set('google_user_data', googleUserData);
            
            const googleUserInfo = document.getElementById('googleUserInfo');
            const googleAvatar = document.getElementById('googleAvatar');
            const googleName = document.getElementById('googleName');
            const googleEmail = document.getElementById('googleEmail');
            const googleSignin = document.querySelector('.g_id_signin');
            
            if (googleUserInfo && googleAvatar && googleName && googleEmail && googleSignin) {
                googleUserInfo.style.display = 'block';
                googleAvatar.src = googleUserData.picture;
                googleName.textContent = googleUserData.name;
                googleEmail.textContent = googleUserData.email;
                googleSignin.style.display = 'none';
            }
            
            setTimeout(loginWithGoogle, 1000);
            
        } catch (error) {
            UI.showError('Failed to process Google Sign-In.');
            console.error('Google Sign-In error:', error);
        }
    }

    // Login with Google
    async function loginWithGoogle() {
        const googleUserData = Utils.Storage.get('google_user_data');
        
        if (!googleUserData) {
            UI.showError('Please sign in with Google first');
            return;
        }
        
        const googleEmail = googleUserData.email;
        
        try {
            const response = await fetch(`${Utils.CONFIG.LOGIN_CHECK_URL}?action=checkEmail&email=${encodeURIComponent(googleEmail)}`);
            const result = await response.json();
            
            if (!result.success) {
                UI.showError('Your Google account is not authorized. Contact admin for access.');
                return;
            }
            
            await handleSuccessfulLogin({
                username: result.username || googleEmail.split('@')[0],
                email: googleEmail,
                method: 'google_oauth',
                remember: true,
                googleData: googleUserData
            });
            
        } catch (error) {
            UI.showError('Network error. Please try again.');
            console.error('Google login error:', error);
        }
    }

    // Handle successful login
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
        
        await Tracking.sendTrackingEvent({
            type: 'login',
            eventType: 'login',
            metadata: {
                method: userData.method,
                username: userData.username
            }
        });
        
        await Tracking.updateCounters();
        
        UI.showSuccessScreen(userData.username, userData.email, loginTime, userData.method);
        UI.showToast(`Welcome back, ${userData.username}!`, 'success');
    }

    // Logout user
    function logout() {
        Tracking.sendTrackingEvent({
            type: 'logout',
            eventType: 'logout',
            metadata: {
                sessionDuration: Date.now() - Tracking.AppState.session.startTime,
                pageViews: Tracking.AppState.session.pageViews
            }
        });
        
        Tracking.sendTrackingEvent({
            type: 'session_end',
            eventType: 'session_end'
        });
        
        Utils.Storage.remove('gahan_user_v2');
        Utils.Storage.remove('remember_user');
        Utils.Storage.remove('google_user_data');
        
        UserState.loggedIn = false;
        UserState.data = null;
        UserState.preferences = {};
        
        location.reload();
    }

    // Google logout
    function googleLogout() {
        const googleUserData = Utils.Storage.get('google_user_data');
        
        if (googleUserData && googleUserData.token) {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
                google.accounts.id.revoke(googleUserData.token, () => {
                    console.log('Google token revoked');
                });
            }
        }
        
        Utils.Storage.remove('google_user_data');
        const googleUserInfo = document.getElementById('googleUserInfo');
        const googleSignin = document.querySelector('.g_id_signin');
        
        if (googleUserInfo) googleUserInfo.style.display = 'none';
        if (googleSignin) googleSignin.style.display = 'block';
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

    return {
        loginUser,
        handleCredentialResponse,
        loginWithGoogle,
        logout,
        googleLogout,
        checkExistingLogin,
        getUserState
    };
})();