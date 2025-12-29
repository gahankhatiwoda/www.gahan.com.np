// Analytics Module
const Analytics = (function() {
    // Switch analytics tab
    function switchTab(tabName) {
        const tabButtons = document.querySelectorAll('.modal-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.includes(tabName)) {
                btn.classList.add('active');
            }
        });
        
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabName}Tab`);
        if (targetTab) targetTab.classList.add('active');
        
        switch(tabName) {
            case 'realtime':
                loadRealTimeData();
                break;
            case 'geography':
                loadGeographyData();
                break;
            case 'devices':
                loadDeviceData();
                break;
        }
    }

    // Update analytics modal
    function updateModal() {
        const counters = Tracking.getCounters();
        
        const modalTotal = document.getElementById('modalTotal');
        const modalUnique = document.getElementById('modalUnique');
        const modalLive = document.getElementById('modalLive');
        const lastUpdateTime = document.getElementById('lastUpdateTime');
        
        if (modalTotal) modalTotal.textContent = counters.total;
        if (modalUnique) modalUnique.textContent = counters.unique;
        if (modalLive) modalLive.textContent = counters.live;
        if (lastUpdateTime) lastUpdateTime.textContent = new Date().toLocaleTimeString();
    }

    // Load real-time data
    async function loadRealTimeData() {
        try {
            const response = await fetch(`${Utils.CONFIG.SHEET_URL}?action=getRealTime&_=${Date.now()}`);
            const data = await response.json();
            
            const container = document.getElementById('liveVisitorsList');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!data || !data.recent_activity || data.recent_activity.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 30px; color: var(--gray);">
                        <i class="fas fa-users-slash" style="font-size: 30px; margin-bottom: 15px;"></i>
                        <p>No recent activity</p>
                    </div>
                `;
                return;
            }
            
            data.recent_activity.forEach(activity => {
                const item = document.createElement('div');
                item.style.cssText = `
                    padding: 12px 15px;
                    margin-bottom: 8px;
                    background: var(--light);
                    border-radius: 8px;
                    border-left: 4px solid var(--primary);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                `;
                
                const time = new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                item.innerHTML = `
                    <div>
                        <div style="font-weight: 600; color: var(--dark);">${activity.eventType}</div>
                        <div style="font-size: 12px; color: var(--gray);">${activity.page}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; color: var(--primary);">${time}</div>
                        <div style="font-size: 11px; color: var(--gray);">${activity.country || 'Unknown'}</div>
                    </div>
                `;
                
                container.appendChild(item);
            });
        } catch (error) {
            console.error('Failed to load real-time data:', error);
        }
    }

    // Load geography data
    async function loadGeographyData() {
        // This would typically fetch from your backend
        const container = document.getElementById('countryList');
        if (!container) return;
        
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--gray);">
                <i class="fas fa-globe-americas" style="font-size: 30px; margin-bottom: 15px;"></i>
                <p>Geographic analytics coming soon</p>
                <p style="font-size: 12px; margin-top: 10px;">This feature requires additional backend setup</p>
            </div>
        `;
    }

    // Load device data
    async function loadDeviceData() {
        // This would typically fetch from your backend
        const container = document.getElementById('deviceStats');
        if (!container) return;
        
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--gray);">
                <i class="fas fa-mobile-alt" style="font-size: 30px; margin-bottom: 15px;"></i>
                <p>Device analytics coming soon</p>
                <p style="font-size: 12px; margin-top: 10px;">This feature requires additional backend setup</p>
            </div>
        `;
    }

    // Start background updates
    function startBackgroundUpdates() {
        // Update counters every 30 seconds
        setInterval(async () => {
            await Tracking.updateCounters();
            UI.updateCounterDisplay();
        }, Utils.CONFIG.REFRESH_INTERVAL);
        
        // Retry failed events every 5 minutes
        setInterval(Tracking.retryFailedEvents, 300000);
    }

    return {
        switchTab,
        updateModal,
        loadRealTimeData,
        loadGeographyData,
        loadDeviceData,
        startBackgroundUpdates
    };
})();