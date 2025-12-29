// Tracking Module
const Tracking = (function() {
    // App State
    const AppState = {
        session: {
            id: null,
            visitorId: null,
            startTime: null,
            pageViews: 0,
            events: [],
            metadata: {}
        },
        analytics: {
            counters: { total: 0, unique: 0, live: 0 },
            trends: {},
            privacyAccepted: false
        }
    };

    // Initialize session tracking
    async function initializeSession() {
        console.log('🔄 Initializing session tracking...');
        
        // Generate or retrieve visitor ID
        let visitorId = Utils.Storage.get('gahan_visitor_id_v2');
        const isNewVisitor = !visitorId;
        
        if (!visitorId) {
            visitorId = Utils.generateVisitorId();
            Utils.Storage.set('gahan_visitor_id_v2', visitorId);
            Utils.Storage.set('visitor_first_seen_v2', Utils.getISOTime());
            Utils.Storage.set('visitor_consent_v2', 'basic');
            console.log('👤 New visitor created:', visitorId.substring(0, 20));
        }
        
        // Check session expiration
        const lastSessionTime = Utils.Storage.get('last_session_time_v2');
        const now = Date.now();
        const sessionExpired = !lastSessionTime || (now - parseInt(lastSessionTime)) > (30 * 60 * 1000);
        
        // Generate session ID
        let sessionId;
        if (sessionExpired) {
            sessionId = Utils.generateSessionId(visitorId);
            Utils.Storage.set('last_session_id_v2', sessionId);
            Utils.Storage.set('last_session_time_v2', now.toString());
            console.log('🆕 New session started:', sessionId.substring(0, 20));
            
            // Send session start event
            await sendTrackingEvent({
                type: 'session_start',
                eventType: 'session_start',
                isNewSession: true,
                isNewVisitor: isNewVisitor,
                metadata: {
                    referrer: document.referrer || 'direct',
                    screenResolution: Utils.getScreenResolution(),
                    colorDepth: window.screen.colorDepth,
                    language: navigator.language,
                    timezone: Utils.getTimezone()
                }
            });
        } else {
            sessionId = Utils.Storage.get('last_session_id_v2') || Utils.generateSessionId(visitorId);
            console.log('🔄 Continuing existing session:', sessionId.substring(0, 20));
        }
        
        // Update AppState
        AppState.session = {
            id: sessionId,
            visitorId: visitorId,
            startTime: parseInt(lastSessionTime) || now,
            pageViews: 1,
            events: [],
            metadata: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                cookiesEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack || 'unspecified',
                deviceType: Utils.getDeviceType()
            }
        };
        
        // Send page view event
        setTimeout(async () => {
            await sendTrackingEvent({
                type: 'page_view',
                eventType: 'page_view',
                page: window.location.pathname,
                isNewSession: sessionExpired,
                isNewVisitor: false
            });
        }, 500);
        
        return { sessionId, visitorId };
    }

    // Send tracking event
    async function sendTrackingEvent(eventData) {
        const baseData = {
            sessionId: AppState.session.id,
            visitorId: AppState.session.visitorId,
            timestamp: Utils.getISOTime(),
            userAgent: navigator.userAgent.substring(0, 200),
            referrer: document.referrer || 'direct',
            page: window.location.pathname,
            screenResolution: Utils.getScreenResolution(),
            language: navigator.language,
            timezone: Utils.getTimezone(),
            ...eventData
        };
        
        console.log('📤 Sending tracking event:', {
            type: baseData.type,
            sessionId: baseData.sessionId?.substring(0, 15)
        });
        
        try {
            // Use Beacon API for better reliability
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(baseData)], { type: 'application/json' });
                navigator.sendBeacon(Utils.CONFIG.SHEET_URL, blob);
            } else {
                // Fallback to fetch
                await fetch(Utils.CONFIG.SHEET_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(baseData)
                });
            }
            
            // Store event locally
            AppState.session.events.push({
                ...baseData,
                sentAt: Utils.getISOTime()
            });
            
            // Keep only last 100 events
            if (AppState.session.events.length > 100) {
                AppState.session.events = AppState.session.events.slice(-100);
            }
            
            console.log('✅ Event sent successfully:', baseData.type);
            return true;
        } catch (error) {
            console.error('❌ Failed to send event:', error);
            queueEventForRetry(baseData);
            return false;
        }
    }

    // Queue failed event for retry
    function queueEventForRetry(eventData) {
        const failedEvents = Utils.Storage.get('failed_events') || [];
        failedEvents.push({
            ...eventData,
            retryCount: 0,
            lastAttempt: Utils.getISOTime()
        });
        
        // Keep only last 50 failed events
        if (failedEvents.length > 50) {
            failedEvents = failedEvents.slice(-50);
        }
        
        Utils.Storage.set('failed_events', failedEvents);
    }

    // Retry failed events
    async function retryFailedEvents() {
        const failedEvents = Utils.Storage.get('failed_events') || [];
        const successful = [];
        
        for (const event of failedEvents) {
            if (event.retryCount >= 3) continue;
            
            try {
                await fetch(Utils.CONFIG.SHEET_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(event)
                });
                
                successful.push(event);
                console.log('🔄 Retry successful for event:', event.type);
            } catch (error) {
                event.retryCount++;
                event.lastAttempt = Utils.getISOTime();
            }
        }
        
        // Remove successful events
        const remainingEvents = failedEvents.filter(e => !successful.includes(e));
        Utils.Storage.set('failed_events', remainingEvents);
    }

    // Update counters from server
    async function updateCounters() {
        try {
            const response = await fetch(`${Utils.CONFIG.SHEET_URL}?action=getStats&_=${Date.now()}`);
            const data = await response.json();
            
            if (data && data.total_visitors !== undefined) {
                // Store previous values for trend calculation
                const prevTotal = AppState.analytics.counters.total;
                const prevUnique = AppState.analytics.counters.unique;
                const prevLive = AppState.analytics.counters.live;
                
                // Update counters
                AppState.analytics.counters = {
                    total: data.total_visitors || 0,
                    unique: data.unique_visitors || 0,
                    live: data.live_visitors || 0
                };
                
                // Calculate trends
                AppState.analytics.trends = {
                    totalChange: AppState.analytics.counters.total - prevTotal,
                    uniqueChange: AppState.analytics.counters.unique - prevUnique,
                    liveChange: AppState.analytics.counters.live - prevLive,
                    updateTime: Utils.getISOTime()
                };
                
                return true;
            }
        } catch (error) {
            console.error('❌ Failed to update counters:', error);
            return false;
        }
    }

    // Setup activity tracking
    function setupActivityTracking() {
        let activityTimeout;
        let lastHeartbeat = Date.now();
        let idleTime = 0;
        
        const activityEvents = [
            'mousemove', 'mousedown', 'keydown', 'keypress', 'keyup',
            'click', 'dblclick', 'scroll', 'touchstart', 'touchmove',
            'wheel', 'resize', 'focus', 'blur'
        ];
        
        const resetActivityTimer = () => {
            clearTimeout(activityTimeout);
            idleTime = 0;
            
            const now = Date.now();
            if (now - lastHeartbeat > Utils.CONFIG.INACTIVITY_TIMEOUT) {
                sendTrackingEvent({
                    type: 'heartbeat',
                    eventType: 'heartbeat',
                    metadata: { idleTime: Math.round((now - lastHeartbeat) / 1000) }
                });
                lastHeartbeat = now;
            }
            
            Utils.Storage.set('last_session_time_v2', Date.now().toString());
            
            activityTimeout = setTimeout(() => {
                idleTime += Utils.CONFIG.INACTIVITY_TIMEOUT;
            }, Utils.CONFIG.INACTIVITY_TIMEOUT);
        };
        
        activityEvents.forEach(event => {
            document.addEventListener(event, resetActivityTimer, { passive: true });
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                sendTrackingEvent({
                    type: 'page_hide',
                    eventType: 'page_hide',
                    metadata: { visibilityState: 'hidden' }
                });
            } else {
                sendTrackingEvent({
                    type: 'page_show',
                    eventType: 'page_show',
                    metadata: { visibilityState: 'visible' }
                });
                resetActivityTimer();
            }
        });
        
        window.addEventListener('beforeunload', () => {
            sendTrackingEvent({
                type: 'session_end',
                eventType: 'session_end',
                metadata: {
                    sessionDuration: Date.now() - AppState.session.startTime,
                    pageViews: AppState.session.pageViews
                }
            });
            
            if (navigator.sendBeacon) {
                const endEvent = {
                    type: 'session_end',
                    eventType: 'session_end',
                    sessionId: AppState.session.id,
                    visitorId: AppState.session.visitorId,
                    timestamp: Utils.getISOTime(),
                    metadata: {
                        sessionDuration: Date.now() - AppState.session.startTime,
                        pageViews: AppState.session.pageViews
                    }
                };
                
                const blob = new Blob([JSON.stringify(endEvent)], { type: 'application/json' });
                navigator.sendBeacon(Utils.CONFIG.SHEET_URL, blob);
            }
        });
        
        resetActivityTimer();
        
        setInterval(() => {
            if (!document.hidden && idleTime < 60) {
                sendTrackingEvent({
                    type: 'heartbeat',
                    eventType: 'heartbeat',
                    metadata: { periodic: true }
                });
            }
        }, Utils.CONFIG.HEARTBEAT_INTERVAL);
    }

    // Get session info
    function getSessionInfo() {
        return {
            sessionId: AppState.session.id,
            visitorId: AppState.session.visitorId,
            startTime: AppState.session.startTime,
            pageViews: AppState.session.pageViews,
            eventsCount: AppState.session.events.length
        };
    }

    // Get counters
    function getCounters() {
        return AppState.analytics.counters;
    }

    // Get trends
    function getTrends() {
        return AppState.analytics.trends;
    }

    return {
        initializeSession,
        sendTrackingEvent,
        retryFailedEvents,
        updateCounters,
        setupActivityTracking,
        getSessionInfo,
        getCounters,
        getTrends,
        AppState
    };
})();