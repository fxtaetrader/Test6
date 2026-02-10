// ===== GLOBAL VARIABLES =====
let trades = [];
let dreams = [];
let equityChart = null;
let winRateChart = null;
let winLossChart = null;
let profitFactorChart = null;
let accountBalance = 0;
let startingBalance = 0;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

// Authentication constants
const USERS_KEY = 'fxTaeUsers';
const CURRENT_USER_KEY = 'fxTaeCurrentUser';
const AUTH_KEY = 'fxTaeAuthenticated';

// ===== AUTHENTICATION FUNCTIONS =====

// Initialize users storage
function initializeUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify([]));
        console.log('Users storage initialized');
    }
}

// Get all users
function getUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
}

// Save user to storage
function saveUser(user) {
    try {
        const users = getUsers();
        
        // Check if email already exists
        const existingUser = users.find(u => u.email.toLowerCase() === user.email.toLowerCase());
        if (existingUser) {
            return { 
                success: false, 
                message: 'Email already registered. Please login or use a different email.' 
            };
        }
        
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return { success: true, user };
    } catch (error) {
        console.error('Error saving user:', error);
        return { success: false, message: 'Error saving user data' };
    }
}

// Authenticate user
function authenticateUser(email, password) {
    try {
        const users = getUsers();
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === password
        );
        
        return user ? { success: true, user } : { 
            success: false, 
            message: 'Invalid email or password' 
        };
    } catch (error) {
        console.error('Error authenticating user:', error);
        return { success: false, message: 'Authentication error' };
    }
}

// Set current user session
function setCurrentUser(user) {
    try {
        // Store only safe user data (no password)
        const safeUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            isGoogleUser: user.isGoogleUser || false
        };
        
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
        sessionStorage.setItem(AUTH_KEY, 'true');
        return true;
    } catch (error) {
        console.error('Error setting current user:', error);
        return false;
    }
}

// Get current user
function getCurrentUser() {
    try {
        const user = localStorage.getItem(CURRENT_USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
}

// Logout user
function logoutUser() {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate password strength
function validatePassword(password) {
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

// ===== UTILITY FUNCTIONS =====

// Format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
    
    return `$${Math.abs(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

// Format currency with sign
function formatCurrencyWithSign(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
    
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

// Format date and time for display
function formatDateTime(dateString, timeString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        return `${formattedDate} ${timeString || ''}`.trim();
    } catch (error) {
        console.error('Error formatting date and time:', error);
        return dateString;
    }
}

// Format date for display
function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date for display:', error);
        return dateString;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    const icon = iconMap[type] || 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ===== DATA MANAGEMENT FUNCTIONS =====

// Load trades from localStorage
function loadTrades() {
    try {
        const savedTrades = localStorage.getItem('fxTaeTrades');
        trades = savedTrades ? JSON.parse(savedTrades) : [];
        console.log(`Loaded ${trades.length} trades from storage`);
    } catch (error) {
        console.error('Error loading trades:', error);
        trades = [];
    }
}

// Load dreams from localStorage
function loadDreams() {
    try {
        const savedDreams = localStorage.getItem('fxTaeDreams');
        dreams = savedDreams ? JSON.parse(savedDreams) : [];
        console.log(`Loaded ${dreams.length} dreams from storage`);
    } catch (error) {
        console.error('Error loading dreams:', error);
        dreams = [];
    }
}

// Load account balance from localStorage
function loadAccountBalance() {
    try {
        const savedBalance = localStorage.getItem('fxTaeAccountBalance');
        const savedStartingBalance = localStorage.getItem('fxTaeStartingBalance');
        
        if (savedBalance) accountBalance = parseFloat(savedBalance);
        if (savedStartingBalance) startingBalance = parseFloat(savedStartingBalance);
    } catch (error) {
        console.error('Error loading account balance:', error);
        // Use defaults
        accountBalance = 0;
        startingBalance = 0;
    }
}

// Save trades to localStorage
function saveTrades() {
    try {
        localStorage.setItem('fxTaeTrades', JSON.stringify(trades));
    } catch (error) {
        console.error('Error saving trades:', error);
        showToast('Error saving trades data', 'error');
    }
}

// Save dreams to localStorage
function saveDreams() {
    try {
        localStorage.setItem('fxTaeDreams', JSON.stringify(dreams));
    } catch (error) {
        console.error('Error saving dreams:', error);
        showToast('Error saving dreams data', 'error');
    }
}

// Save account balance to localStorage
function saveAccountBalance() {
    try {
        localStorage.setItem('fxTaeAccountBalance', accountBalance.toString());
        localStorage.setItem('fxTaeStartingBalance', startingBalance.toString());
    } catch (error) {
        console.error('Error saving account balance:', error);
        showToast('Error saving account balance', 'error');
    }
}

// ===== DASHBOARD INITIALIZATION =====

// Initialize application
function initializeApp() {
    console.log('Initializing FX Tae Trading Dashboard...');
    
    // Check authentication
    if (!isAuthenticated()) {
        console.log('User not authenticated, redirecting to login...');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        // Load data
        loadTrades();
        loadDreams();
        loadAccountBalance();
        
        // Update UI
        updateCurrentDate();
        updateUserInfo();
        updateAccountBalanceDisplay();
        updateRecentTrades();
        updateAllTrades();
        updateStats();
        updateTradeLists();
        updateDreamsList();
        
        // Initialize charts
        setTimeout(() => {
            initializeCharts();
            updateCalendar();
        }, 500);
        
        // Setup event listeners
        setupEventListeners();
        
        // Set default date for trade entry
        const tradeDateInput = document.getElementById('tradeDate');
        if (tradeDateInput) {
            tradeDateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // Set default time for trade entry
        const tradeTimeInput = document.getElementById('tradeTime');
        if (tradeTimeInput) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            tradeTimeInput.value = `${hours}:${minutes}`;
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('fxTaeTheme') || 'light';
        setTheme(savedTheme);
        
        console.log('Dashboard initialized successfully!');
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error initializing application', 'error');
    }
}

// Update current date display
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Update user info display
function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const userNameElement = document.getElementById('userName');
        const userEmailElement = document.getElementById('userEmail');
        
        if (userNameElement) userNameElement.textContent = user.name || 'Trader';
        if (userEmailElement) userEmailElement.textContent = user.email || 'trader@example.com';
    }
}

// Update account balance display
function updateAccountBalanceDisplay() {
    try {
        const balanceElement = document.getElementById('accountBalance');
        const currentBalanceInput = document.getElementById('currentBalanceInput');
        const startingBalanceElement = document.getElementById('startingBalance');
        const totalGrowthElement = document.getElementById('totalGrowth');
        const growthPercentageElement = document.getElementById('growthPercentage');
        
        // Calculate account balance from trades
        const calculatedBalance = startingBalance + trades.reduce((sum, trade) => sum + trade.pnl, 0);
        accountBalance = calculatedBalance;
        
        if (balanceElement) {
            balanceElement.textContent = formatCurrency(accountBalance);
        }
        
        if (currentBalanceInput) {
            currentBalanceInput.value = accountBalance;
        }
        
        if (startingBalanceElement) {
            startingBalanceElement.textContent = formatCurrency(startingBalance);
        }
        
        if (totalGrowthElement) {
            const growth = accountBalance - startingBalance;
            totalGrowthElement.textContent = formatCurrency(growth);
            totalGrowthElement.className = `stat-value ${growth >= 0 ? 'profit' : 'loss'}`;
        }
        
        if (growthPercentageElement) {
            const growthPercentage = startingBalance > 0 ? ((accountBalance - startingBalance) / startingBalance) * 100 : 0;
            growthPercentageElement.textContent = `${growthPercentage >= 0 ? '+' : ''}${growthPercentage.toFixed(1)}%`;
            growthPercentageElement.className = `stat-value ${growthPercentage >= 0 ? 'profit' : 'loss'}`;
        }
        
        // Save updated balance
        saveAccountBalance();
    } catch (error) {
        console.error('Error updating account balance display:', error);
    }
}

// Update recent trades table
function updateRecentTrades() {
    const tableBody = document.getElementById('recentTradesTable');
    if (!tableBody) return;
    
    try {
        // Get 5 most recent trades
        const recentTrades = [...trades]
            .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time))
            .slice(0, 5);
        
        if (recentTrades.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-trades">
                        <i class="fas fa-chart-line"></i>
                        <p>No trades recorded yet. Start trading to see your history here.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = recentTrades.map(trade => `
            <tr>
                <td>${formatDateTime(trade.date, trade.time)}</td>
                <td>${trade.tradeNumber}</td>
                <td>${trade.pair}</td>
                <td>${trade.strategy}</td>
                <td class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${formatCurrencyWithSign(trade.pnl)}</td>
                <td><span class="status-badge ${trade.pnl >= 0 ? 'profit' : 'loss'}">${trade.pnl >= 0 ? 'WIN' : 'LOSS'}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editTrade(${trade.id})" title="Edit Trade">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteTrade(${trade.id})" title="Delete Trade">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error updating recent trades:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-trades">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading trades. Please refresh the page.</p>
                </td>
            </tr>
        `;
    }
}

// Update all trades table
function updateAllTrades() {
    const tableBody = document.getElementById('allTradesTable');
    if (!tableBody) return;
    
    try {
        // Sort by date (newest first)
        const allTrades = [...trades].sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
        
        if (allTrades.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-trades">
                        <i class="fas fa-chart-line"></i>
                        <p>No trades recorded yet. Start trading to see your journal here.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = allTrades.map(trade => `
            <tr>
                <td>${formatDateTime(trade.date, trade.time)}</td>
                <td>${trade.tradeNumber}</td>
                <td>${trade.pair}</td>
                <td>${trade.strategy}</td>
                <td class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${formatCurrencyWithSign(trade.pnl)}</td>
                <td>${trade.notes || 'No notes'}</td>
                <td><span class="status-badge ${trade.pnl >= 0 ? 'profit' : 'loss'}">${trade.pnl >= 0 ? 'WIN' : 'LOSS'}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editTrade(${trade.id})" title="Edit Trade">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteTrade(${trade.id})" title="Delete Trade">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error updating all trades:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="no-trades">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading trades. Please refresh the page.</p>
                </td>
            </tr>
        `;
    }
}

// Update statistics
function updateStats() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayTrades = trades.filter(t => t.date === today);
        const todayPnl = todayTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        
        // Update Today's P&L
        const todayPnlElement = document.getElementById('todayPnl');
        if (todayPnlElement) {
            todayPnlElement.textContent = formatCurrencyWithSign(todayPnl);
            todayPnlElement.className = `stat-value ${todayPnl >= 0 ? 'profit' : 'loss'}`;
        }
        
        // Update Today's Trades Count
        const todayTradesCount = document.getElementById('todayTradesCount');
        if (todayTradesCount) {
            todayTradesCount.textContent = `${todayTrades.length}/4`;
        }
        
        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const progress = (todayTrades.length / 4) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        // Update Weekly Performance (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const weeklyTrades = trades.filter(t => t.date >= weekAgo);
        const weeklyPnl = weeklyTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        
        const weeklyPnlElement = document.getElementById('weeklyPnl');
        if (weeklyPnlElement) {
            weeklyPnlElement.textContent = formatCurrencyWithSign(weeklyPnl);
            weeklyPnlElement.className = `stat-value ${weeklyPnl >= 0 ? 'profit' : 'loss'}`;
        }
        
        // Update Monthly Performance (last 30 days)
        const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const monthlyTrades = trades.filter(t => t.date >= monthAgo);
        const monthlyPnl = monthlyTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        
        const monthlyPnlElement = document.getElementById('monthlyPnl');
        if (monthlyPnlElement) {
            monthlyPnlElement.textContent = formatCurrencyWithSign(monthlyPnl);
            monthlyPnlElement.className = `stat-value ${monthlyPnl >= 0 ? 'profit' : 'loss'}`;
        }
        
        // Update win rate
        updateWinRate();
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Update win rate
function updateWinRate() {
    try {
        const winningTrades = trades.filter(t => t.pnl > 0).length;
        const losingTrades = trades.filter(t => t.pnl < 0).length;
        const totalTrades = winningTrades + losingTrades;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        
        const winRateElement = document.getElementById('winRateValue');
        if (winRateElement) {
            winRateElement.textContent = `${winRate.toFixed(1)}%`;
        }
        
        // Update profit factor
        const totalProfit = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
        const totalLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
        
        const profitFactorElement = document.getElementById('profitFactorValue');
        if (profitFactorElement) {
            profitFactorElement.textContent = profitFactor.toFixed(2);
        }
    } catch (error) {
        console.error('Error updating win rate:', error);
    }
}

// Update trade lists
function updateTradeLists() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayTrades = trades.filter(t => t.date === today);
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const weeklyTrades = trades.filter(t => t.date >= weekAgo);
        const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const monthlyTrades = trades.filter(t => t.date >= monthAgo);
        
        updateTradeList('todayTradesList', todayTrades);
        updateTradeList('weeklyTradesList', weeklyTrades);
        updateTradeList('monthlyTradesList', monthlyTrades);
    } catch (error) {
        console.error('Error updating trade lists:', error);
    }
}

function updateTradeList(elementId, tradeList) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
        if (tradeList.length === 0) {
            element.innerHTML = '<p class="no-trades">No trades recorded</p>';
            return;
        }
        
        const list = tradeList.slice(0, 3).map(trade => `
            <div class="trade-item">
                <span>${formatDateTime(trade.date, trade.time)}</span>
                <span>${trade.pair}</span>
                <span class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${formatCurrencyWithSign(trade.pnl)}</span>
            </div>
        `).join('');
        
        element.innerHTML = list;
    } catch (error) {
        console.error(`Error updating trade list ${elementId}:`, error);
        element.innerHTML = '<p class="no-trades">Error loading trades</p>';
    }
}

// Update dreams list
function updateDreamsList() {
    const dreamsList = document.getElementById('dreamsList');
    if (!dreamsList) return;
    
    try {
        if (dreams.length === 0) {
            dreamsList.innerHTML = `
                <div class="no-dreams">
                    <i class="fas fa-cloud"></i>
                    <p>No dreams recorded yet. Write your first trading dream!</p>
                </div>
            `;
            return;
        }
        
        // Sort by date (newest first)
        const sortedDreams = [...dreams].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        dreamsList.innerHTML = sortedDreams.map(dream => `
            <div class="dream-card">
                <div class="dream-header">
                    <span class="dream-date">${formatDate(dream.date)}</span>
                    <div class="dream-actions">
                        <button class="action-btn edit-btn" onclick="editDream(${dream.id})" title="Edit Dream">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteDream(${dream.id})" title="Delete Dream">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="dream-content">${dream.content}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating dreams list:', error);
        dreamsList.innerHTML = `
            <div class="no-dreams">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading dreams. Please refresh the page.</p>
            </div>
        `;
    }
}

// ===== CHART FUNCTIONS =====

// Initialize charts
function initializeCharts() {
    console.log('Initializing charts...');
    
    try {
        // Equity Chart
        const equityCtx = document.getElementById('equityChart');
        if (equityCtx) {
            const equityData = getEquityData('7d'); // Default to 7 days
            
            equityChart = new Chart(equityCtx, {
                type: 'line',
                data: equityData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `Balance: $${context.parsed.y.toLocaleString()}`;
                                },
                                title: function(context) {
                                    if (context[0].dataIndex === 0) return 'Starting Balance';
                                    return context[0].label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            title: {
                                display: true,
                                text: 'Account Balance ($)'
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            title: {
                                display: true,
                                text: 'Date & Time'
                            }
                        }
                    }
                }
            });
            
            console.log('Equity chart created');
        }
        
        // Win Rate Chart
        const winRateCtx = document.getElementById('winRateChart');
        if (winRateCtx) {
            const winRateData = getWinRateData();
            
            winRateChart = new Chart(winRateCtx, {
                type: 'doughnut',
                data: winRateData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { position: 'bottom' } }
                }
            });
            console.log('Win rate chart created');
        }
        
        // Win Loss Chart
        const winLossCtx = document.getElementById('winLossChart');
        if (winLossCtx) {
            const winLossData = getWinLossData();
            
            winLossChart = new Chart(winLossCtx, {
                type: 'pie',
                data: winLossData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
            console.log('Win loss chart created');
        }
        
        // Profit Factor Chart
        const profitFactorCtx = document.getElementById('profitFactorChart');
        if (profitFactorCtx) {
            const profitFactorData = getProfitFactorData();
            
            profitFactorChart = new Chart(profitFactorCtx, {
                type: 'bar',
                data: profitFactorData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
            console.log('Profit factor chart created');
        }
    } catch (error) {
        console.error('Error initializing charts:', error);
        showToast('Error initializing charts', 'error');
    }
}

// Get equity data for chart based on period
function getEquityData(period = '7d') {
    let filteredTrades = [...trades];
    const now = new Date();
    
    // Filter trades based on period
    switch(period.toLowerCase()) {
        case '1m': // 1 month
            const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
            filteredTrades = trades.filter(t => new Date(t.date) >= oneMonthAgo);
            break;
        case '12m': // 12 months
            const twelveMonthsAgo = new Date(now.setMonth(now.getMonth() - 12));
            filteredTrades = trades.filter(t => new Date(t.date) >= twelveMonthsAgo);
            break;
        case '7d': // 7 days (default)
        default:
            const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
            filteredTrades = trades.filter(t => new Date(t.date) >= sevenDaysAgo);
            break;
    }
    
    // Sort trades by date and time
    filteredTrades.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    
    // Start with initial balance
    let balance = startingBalance;
    const data = [balance];
    const labels = ['Starting Balance'];
    
    // Process each trade
    filteredTrades.forEach((trade, index) => {
        balance += trade.pnl;
        data.push(balance);
        
        // Format label with date and time
        const dateObj = new Date(trade.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        // Add time to label
        const label = `${formattedDate} ${trade.time}`;
        labels.push(label);
    });
    
    // If no trades in period, just show starting balance
    if (filteredTrades.length === 0) {
        return {
            labels: ['Starting Balance'],
            datasets: [{
                label: 'Account Balance',
                data: [startingBalance],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        };
    }
    
    return {
        labels: labels,
        datasets: [{
            label: 'Account Balance',
            data: data,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
        }]
    };
}

// Get win rate data for chart
function getWinRateData() {
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const losingTrades = trades.filter(t => t.pnl < 0).length;
    const breakEvenTrades = trades.filter(t => t.pnl === 0).length;
    
    return {
        labels: ['Winning Trades', 'Losing Trades', 'Break Even'],
        datasets: [{
            data: [winningTrades, losingTrades, breakEvenTrades],
            backgroundColor: ['#10b981', '#ef4444', '#94a3b8'],
            borderWidth: 0
        }]
    };
}

// Get win loss data for chart
function getWinLossData() {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    
    return {
        labels: ['Total Profit', 'Total Loss'],
        datasets: [{
            data: [totalProfit, totalLoss],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 0
        }]
    };
}

// Get profit factor data for chart
function getProfitFactorData() {
    const months = getLast6Months();
    const data = [];
    
    months.forEach(month => {
        const monthTrades = trades.filter(t => {
            try {
                const tradeDate = new Date(t.date);
                return tradeDate.getMonth() === month.month && tradeDate.getFullYear() === month.year;
            } catch (e) {
                return false;
            }
        });
        
        const totalProfit = monthTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
        const totalLoss = Math.abs(monthTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
        const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
        
        data.push(profitFactor);
    });
    
    return {
        labels: months.map(m => m.label),
        datasets: [{
            label: 'Profit Factor',
            data: data,
            backgroundColor: '#3b82f6',
            borderColor: '#1d4ed8',
            borderWidth: 1
        }]
    };
}

// Get last 6 months for chart
function getLast6Months() {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            month: date.getMonth(),
            year: date.getFullYear(),
            label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        });
    }
    
    return months;
}

// ===== CALENDAR FUNCTIONS =====

// Update calendar
function updateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonth = document.getElementById('calendarMonth');
    
    if (!calendarGrid || !calendarMonth) return;
    
    try {
        // Update month display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        calendarMonth.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
        
        // Get first day of month and number of days
        const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
        const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        // Create calendar header
        let calendarHTML = `
            <div class="calendar-header">Sun</div>
            <div class="calendar-header">Mon</div>
            <div class="calendar-header">Tue</div>
            <div class="calendar-header">Wed</div>
            <div class="calendar-header">Thu</div>
            <div class="calendar-header">Fri</div>
            <div class="calendar-header">Sat</div>
        `;
        
        // Add empty cells for days before the first day of month
        for (let i = 0; i < startingDay; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayTrades = trades.filter(t => t.date === dateStr);
            const dayPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
            
            let dayClass = 'calendar-day';
            let pnlClass = '';
            let pnlText = '';
            
            if (dayTrades.length > 0) {
                dayClass += dayPnl >= 0 ? ' profit' : ' loss';
                pnlClass = dayPnl >= 0 ? 'profit' : 'loss';
                pnlText = formatCurrencyWithSign(dayPnl);
            }
            
            calendarHTML += `
                <div class="${dayClass}" onclick="viewDayTrades('${dateStr}')">
                    <div class="calendar-date">${day}</div>
                    ${dayTrades.length > 0 ? `
                        <div class="calendar-pnl ${pnlClass}">${pnlText}</div>
                        <div class="calendar-trades">${dayTrades.length} trade(s)</div>
                    ` : ''}
                </div>
            `;
        }
        
        calendarGrid.innerHTML = calendarHTML;
    } catch (error) {
        console.error('Error updating calendar:', error);
        calendarGrid.innerHTML = '<div class="calendar-error">Error loading calendar</div>';
    }
}

// Change calendar month
function changeCalendarMonth(direction) {
    currentCalendarMonth += direction;
    
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    
    updateCalendar();
}

// View day trades
function viewDayTrades(dateStr) {
    const dayTrades = trades.filter(t => t.date === dateStr);
    
    if (dayTrades.length === 0) {
        showToast('No trades on this date', 'info');
        return;
    }
    
    const date = new Date(dateStr);
    const dateFormatted = formatDateForDisplay(dateStr);
    const totalPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    let tradesHTML = dayTrades.map(trade => `
        <div class="day-trade-item">
            <strong>Trade ${trade.tradeNumber} (${trade.time})</strong>
            <span>${trade.pair} - ${trade.strategy}</span>
            <span class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${formatCurrencyWithSign(trade.pnl)}</span>
        </div>
    `).join('');
    
    showModal(`
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-calendar-day"></i> Trades on ${dateFormatted}</h3>
                <button class="close-modal" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="day-summary">
                    <div class="summary-item">
                        <span>Total Trades:</span>
                        <strong>${dayTrades.length}</strong>
                    </div>
                    <div class="summary-item">
                        <span>Daily P&L:</span>
                        <strong class="${totalPnl >= 0 ? 'profit' : 'loss'}">${formatCurrencyWithSign(totalPnl)}</strong>
                    </div>
                </div>
                <div class="day-trades-list">
                    ${tradesHTML}
                </div>
                <div class="modal-actions">
                    <button class="btn-outline" onclick="closeModal()">Close</button>
                </div>
            </div>
        </div>
    `);
}

// ===== TRADE FUNCTIONS =====

// Save a new trade
function saveTrade() {
    try {
        const date = document.getElementById('tradeDate')?.value;
        const time = document.getElementById('tradeTime')?.value;
        const tradeNumber = parseInt(document.getElementById('tradeNumber')?.value);
        let strategy = document.getElementById('strategy')?.value;
        const customStrategy = document.getElementById('customStrategy')?.value;
        const pair = document.getElementById('currencyPair')?.value;
        const pnl = parseFloat(document.getElementById('pnlAmount')?.value);
        const notes = document.getElementById('tradeNotes')?.value;
        
        // Validation
        if (!date || !time || !tradeNumber || !strategy || !pair || isNaN(pnl)) {
            showToast('Please fill all required fields', 'error');
            return false;
        }
        
        // Check max 4 trades per day
        const todayTrades = trades.filter(t => t.date === date);
        if (todayTrades.length >= 4) {
            showToast('Maximum 4 trades per day reached!', 'error');
            return false;
        }
        
        // Use custom strategy if provided
        if (customStrategy && document.getElementById('customStrategy').style.display !== 'none') {
            strategy = customStrategy;
        }
        
        // Create trade object
        const trade = {
            id: Date.now(),
            date,
            time,
            tradeNumber,
            pair,
            strategy,
            pnl,
            notes: notes || 'No notes provided'
        };
        
        // Add to trades array
        trades.unshift(trade);
        
        // Save data
        saveTrades();
        
        // Update UI
        updateAccountBalanceDisplay();
        updateRecentTrades();
        updateAllTrades();
        updateStats();
        updateTradeLists();
        
        // Update charts
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        if (winRateChart) {
            winRateChart.data = getWinRateData();
            winRateChart.update();
        }
        
        if (winLossChart) {
            winLossChart.data = getWinLossData();
            winLossChart.update();
        }
        
        if (profitFactorChart) {
            profitFactorChart.data = getProfitFactorData();
            profitFactorChart.update();
        }
        
        // Update calendar
        updateCalendar();
        
        // Reset form
        const pnlInput = document.getElementById('pnlAmount');
        const notesInput = document.getElementById('tradeNotes');
        
        if (pnlInput) pnlInput.value = '';
        if (notesInput) notesInput.value = '';
        
        showToast('Trade saved successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error saving trade:', error);
        showToast('Error saving trade', 'error');
        return false;
    }
}

// Save and download trade
function saveAndDownloadTrade() {
    const success = saveTrade();
    if (success) {
        // Download the latest trade as PDF
        setTimeout(() => {
            if (trades.length > 0) {
                downloadTradePDF(trades[0]);
            }
        }, 500);
    }
}

// Edit trade
function editTrade(tradeId) {
    const tradeIndex = trades.findIndex(t => t.id === tradeId);
    if (tradeIndex === -1) {
        showToast('Trade not found', 'error');
        return;
    }
    
    const trade = trades[tradeIndex];
    
    // Open edit modal
    document.getElementById('editTradesModal').style.display = 'flex';
    
    // Populate edit form
    const editList = document.getElementById('todayTradesEditList');
    editList.innerHTML = `
        <div class="edit-trade-form">
            <div class="form-group">
                <label>Trade #</label>
                <input type="number" id="editTradeNumber" class="form-input" value="${trade.tradeNumber}" min="1" max="4">
            </div>
            <div class="form-group">
                <label>Currency Pair</label>
                <input type="text" id="editPair" class="form-input" value="${trade.pair}">
            </div>
            <div class="form-group">
                <label>Strategy</label>
                <input type="text" id="editStrategy" class="form-input" value="${trade.strategy}">
            </div>
            <div class="form-group">
                <label>P&L ($)</label>
                <input type="number" id="editPnl" class="form-input" value="${trade.pnl}" step="0.01">
            </div>
            <div class="form-group">
                <label>Time</label>
                <input type="time" id="editTime" class="form-input" value="${trade.time}">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea id="editNotes" class="form-input">${trade.notes}</textarea>
            </div>
            <input type="hidden" id="editTradeId" value="${trade.id}">
        </div>
    `;
}

// Save edited trade
function saveEditedTrades() {
    try {
        const tradeId = parseInt(document.getElementById('editTradeId').value);
        const tradeIndex = trades.findIndex(t => t.id === tradeId);
        
        if (tradeIndex === -1) {
            showToast('Trade not found', 'error');
            return;
        }
        
        // Update trade
        trades[tradeIndex] = {
            ...trades[tradeIndex],
            tradeNumber: parseInt(document.getElementById('editTradeNumber').value),
            pair: document.getElementById('editPair').value,
            strategy: document.getElementById('editStrategy').value,
            pnl: parseFloat(document.getElementById('editPnl').value),
            time: document.getElementById('editTime').value,
            notes: document.getElementById('editNotes').value
        };
        
        // Save data
        saveTrades();
        
        // Update UI
        updateAccountBalanceDisplay();
        updateRecentTrades();
        updateAllTrades();
        updateStats();
        updateTradeLists();
        
        // Update charts
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        if (winRateChart) {
            winRateChart.data = getWinRateData();
            winRateChart.update();
        }
        
        closeEditTradesModal();
        showToast('Trade updated successfully!', 'success');
    } catch (error) {
        console.error('Error saving edited trade:', error);
        showToast('Error updating trade', 'error');
    }
}

// Delete trade
function deleteTrade(tradeId) {
    if (!confirm('Are you sure you want to delete this trade?')) return;
    
    const tradeIndex = trades.findIndex(t => t.id === tradeId);
    if (tradeIndex === -1) return;
    
    try {
        // Remove trade
        trades.splice(tradeIndex, 1);
        
        // Save data
        saveTrades();
        
        // Update UI
        updateAccountBalanceDisplay();
        updateRecentTrades();
        updateAllTrades();
        updateStats();
        updateTradeLists();
        
        // Update charts
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        if (winRateChart) {
            winRateChart.data = getWinRateData();
            winRateChart.update();
        }
        
        // Update calendar
        updateCalendar();
        
        showToast('Trade deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting trade:', error);
        showToast('Error deleting trade', 'error');
    }
}

// Edit today's trades
function editTodayTrades() {
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.date === today);
    
    if (todayTrades.length === 0) {
        showToast('No trades to edit today', 'warning');
        return;
    }
    
    // Open edit modal
    document.getElementById('editTradesModal').style.display = 'flex';
    
    // Populate edit list
    const editList = document.getElementById('todayTradesEditList');
    editList.innerHTML = todayTrades.map(trade => `
        <div class="edit-trade-item">
            <div class="trade-info">
                <strong>Trade ${trade.tradeNumber} (${trade.time})</strong>
                <span>${trade.pair} - ${trade.strategy}</span>
                <span class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${formatCurrencyWithSign(trade.pnl)}</span>
            </div>
            <div class="trade-actions">
                <button class="action-btn edit-btn" onclick="editTrade(${trade.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteTrade(${trade.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Close edit trades modal
function closeEditTradesModal() {
    document.getElementById('editTradesModal').style.display = 'none';
}

// Show custom strategy input
function showCustomStrategy() {
    const customStrategy = document.getElementById('customStrategy');
    if (customStrategy) {
        customStrategy.style.display = 'block';
        customStrategy.focus();
    }
}

// ===== DREAM FUNCTIONS =====

// Save dream
function saveDream() {
    const dreamInput = document.getElementById('dreamInput');
    const content = dreamInput?.value.trim();
    
    if (!content) {
        showToast('Please write your dream first', 'error');
        return;
    }
    
    try {
        const dream = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            content: content
        };
        
        dreams.unshift(dream);
        saveDreams();
        updateDreamsList();
        
        if (dreamInput) dreamInput.value = '';
        showToast('Dream saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving dream:', error);
        showToast('Error saving dream', 'error');
    }
}

// Clear dream input
function clearDream() {
    const dreamInput = document.getElementById('dreamInput');
    if (dreamInput) dreamInput.value = '';
}

// Edit dream
function editDream(dreamId) {
    const dream = dreams.find(d => d.id === dreamId);
    if (!dream) {
        showToast('Dream not found', 'error');
        return;
    }
    
    const dreamInput = document.getElementById('dreamInput');
    if (dreamInput) dreamInput.value = dream.content;
    
    try {
        // Remove the dream from list
        dreams = dreams.filter(d => d.id !== dreamId);
        saveDreams();
        updateDreamsList();
        
        showToast('Dream loaded for editing', 'info');
    } catch (error) {
        console.error('Error editing dream:', error);
        showToast('Error loading dream for editing', 'error');
    }
}

// Delete dream
function deleteDream(dreamId) {
    if (!confirm('Are you sure you want to delete this dream?')) return;
    
    try {
        dreams = dreams.filter(d => d.id !== dreamId);
        saveDreams();
        updateDreamsList();
        
        showToast('Dream deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting dream:', error);
        showToast('Error deleting dream', 'error');
    }
}

// ===== BALANCE FUNCTIONS =====

// Edit starting balance
function editStartingBalance() {
    const startingBalanceElement = document.getElementById('startingBalance');
    const startingBalanceInput = document.getElementById('startingBalanceInput');
    const editButton = document.querySelector('.edit-starting-balance-btn');
    const saveButton = document.getElementById('saveBalanceBtn');
    const cancelButton = document.getElementById('cancelBalanceBtn');
    
    if (!startingBalanceElement || !startingBalanceInput) return;
    
    // Hide edit button, show input and action buttons
    if (editButton) editButton.style.display = 'none';
    startingBalanceElement.style.display = 'none';
    startingBalanceInput.style.display = 'block';
    if (saveButton) saveButton.style.display = 'flex';
    if (cancelButton) cancelButton.style.display = 'flex';
    
    // Set input value to current starting balance
    startingBalanceInput.value = startingBalance;
    
    // Focus on input and select all text
    setTimeout(() => {
        startingBalanceInput.focus();
        startingBalanceInput.select();
    }, 100);
}

// Save starting balance
function saveStartingBalance() {
    const startingBalanceInput = document.getElementById('startingBalanceInput');
    const newStartingBalance = parseFloat(startingBalanceInput.value);
    
    if (isNaN(newStartingBalance) || newStartingBalance <= 0) {
        showToast('Please enter a valid starting balance (greater than 0)', 'error');
        startingBalanceInput.focus();
        return;
    }
    
    // Update starting balance
    startingBalance = newStartingBalance;
    
    // Save to localStorage
    saveAccountBalance();
    
    // Update display
    updateAccountBalanceDisplay();
    
    // Update charts
    if (equityChart) {
        const activePeriodBtn = document.querySelector('.period-btn.active');
        const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
        equityChart.data = getEquityData(period);
        equityChart.update();
    }
    
    // Show success message
    showToast(`Starting balance updated to ${formatCurrency(startingBalance)}`, 'success');
    
    // Hide edit mode
    hideEditMode();
}

// Cancel starting balance edit
function cancelStartingBalanceEdit() {
    const startingBalanceInput = document.getElementById('startingBalanceInput');
    const startingBalanceElement = document.getElementById('startingBalance');
    const editButton = document.querySelector('.edit-starting-balance-btn');
    const saveButton = document.getElementById('saveBalanceBtn');
    const cancelButton = document.getElementById('cancelBalanceBtn');
    
    // Reset input value
    if (startingBalanceInput) startingBalanceInput.value = startingBalance;
    
    // Hide edit mode
    hideEditMode();
}

// Helper function to hide edit mode
function hideEditMode() {
    const startingBalanceElement = document.getElementById('startingBalance');
    const startingBalanceInput = document.getElementById('startingBalanceInput');
    const editButton = document.querySelector('.edit-starting-balance-btn');
    const saveButton = document.getElementById('saveBalanceBtn');
    const cancelButton = document.getElementById('cancelBalanceBtn');
    
    if (editButton) editButton.style.display = 'flex';
    if (startingBalanceElement) startingBalanceElement.style.display = 'block';
    if (startingBalanceInput) startingBalanceInput.style.display = 'none';
    if (saveButton) saveButton.style.display = 'none';
    if (cancelButton) cancelButton.style.display = 'none';
}

// Open edit balance modal
function openEditBalanceModal() {
    const modal = document.getElementById('editBalanceModal');
    const newBalanceInput = document.getElementById('newBalanceInput');
    
    if (modal) modal.style.display = 'flex';
    if (newBalanceInput) newBalanceInput.value = accountBalance;
}

// Close edit balance modal
function closeEditBalanceModal() {
    const modal = document.getElementById('editBalanceModal');
    if (modal) modal.style.display = 'none';
}

// Confirm balance update
function confirmBalanceUpdate() {
    const newBalanceInput = document.getElementById('newBalanceInput');
    const newBalance = parseFloat(newBalanceInput?.value);
    
    if (isNaN(newBalance) || newBalance <= 0) {
        showToast('Please enter a valid balance', 'error');
        return;
    }
    
    try {
        // Adjust starting balance instead of current balance
        startingBalance = newBalance;
        saveAccountBalance();
        updateAccountBalanceDisplay();
        
        // Update charts
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        closeEditBalanceModal();
        showToast('Starting balance updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating balance:', error);
        showToast('Error updating balance', 'error');
    }
}

// ===== PDF EXPORT FUNCTIONS =====

// Generate PDF with styling
function generatePDF({ title, content, filename }) {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            showToast('PDF library not loaded. Please check internet connection.', 'error');
            return;
        }
        
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - (2 * margin);
        let yPosition = margin;
        
        // Add title with styling
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(40, 40, 150);
        pdf.text(title, margin, yPosition);
        yPosition += 15;
        
        // Add date
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, yPosition);
        yPosition += 15;
        
        // Add separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        
        // Process content
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        
        const lines = pdf.splitTextToSize(content, contentWidth);
        
        for (let i = 0; i < lines.length; i++) {
            // Check if we need a new page
            if (yPosition > pdf.internal.pageSize.height - margin) {
                pdf.addPage();
                yPosition = margin;
            }
            
            // Check for bold formatting
            let line = lines[i];
            if (line.includes('**')) {
                const parts = line.split('**');
                let xPos = margin;
                
                for (let j = 0; j < parts.length; j++) {
                    if (j % 2 === 0) {
                        // Normal text
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(parts[j], xPos, yPosition);
                        xPos += pdf.getStringUnitWidth(parts[j]) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
                    } else {
                        // Bold text
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(parts[j], xPos, yPosition);
                        xPos += pdf.getStringUnitWidth(parts[j]) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;
                    }
                }
            } else {
                pdf.text(line, margin, yPosition);
            }
            
            yPosition += 7;
        }
        
        // Add footer
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text('FX Tae Trading Dashboard - www.fxtaetrader.page.gd', margin, pdf.internal.pageSize.height - 10);
        
        // Save PDF
        pdf.save(filename);
        showToast(`PDF "${filename}" downloaded successfully!`, 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Error generating PDF. Please try again.', 'error');
    }
}

// Download today stats as PDF
function downloadTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.date === today);
    const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    const content = `
        **ACCOUNT SUMMARY:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Today's P&L: ${formatCurrencyWithSign(todayPnl)}
        Today's Trades: ${todayTrades.length}/4
        
        **TRADES TODAY:**
        ${todayTrades.length > 0 ? todayTrades.map(t => `
        Trade ${t.tradeNumber} (${t.time}):
        - Pair: ${t.pair}
        - Strategy: ${t.strategy}
        - P&L: ${formatCurrencyWithSign(t.pnl)}
        - Notes: ${t.notes || 'No notes'}
        `).join('\n') : 'No trades recorded today.'}
        
        **PERFORMANCE METRICS:**
        Winning Trades: ${todayTrades.filter(t => t.pnl > 0).length}
        Losing Trades: ${todayTrades.filter(t => t.pnl < 0).length}
        Break Even: ${todayTrades.filter(t => t.pnl === 0).length}
        Win Rate: ${todayTrades.length > 0 ? ((todayTrades.filter(t => t.pnl > 0).length / todayTrades.length) * 100).toFixed(1) : 0}%
    `;
    
    generatePDF({
        title: `Today's Trading Stats - ${today}`,
        content: content,
        filename: `today-stats-${today}.pdf`
    });
}

// Download weekly stats as PDF
function downloadWeeklyStats() {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const weeklyTrades = trades.filter(t => t.date >= weekAgo);
    const weeklyPnl = weeklyTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    const content = `
        **WEEKLY REPORT (Last 7 Days)**
        Period: ${weekAgo} to ${new Date().toISOString().split('T')[0]}
        
        **ACCOUNT PERFORMANCE:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Weekly P&L: ${formatCurrencyWithSign(weeklyPnl)}
        Total Trades: ${weeklyTrades.length}
        
        **WEEKLY TRADES:**
        ${weeklyTrades.length > 0 ? weeklyTrades.map(t => `
        ${t.date} ${t.time} - Trade ${t.tradeNumber}:
        - Pair: ${t.pair}
        - Strategy: ${t.strategy}
        - P&L: ${formatCurrencyWithSign(t.pnl)}
        - Status: ${t.pnl >= 0 ? 'WIN' : 'LOSS'}
        `).join('\n') : 'No trades recorded this week.'}
        
        **WEEKLY METRICS:**
        Winning Trades: ${weeklyTrades.filter(t => t.pnl > 0).length}
        Losing Trades: ${weeklyTrades.filter(t => t.pnl < 0).length}
        Win Rate: ${weeklyTrades.length > 0 ? ((weeklyTrades.filter(t => t.pnl > 0).length / weeklyTrades.length) * 100).toFixed(1) : 0}%
        Average Daily P&L: ${weeklyTrades.length > 0 ? formatCurrency(weeklyPnl / 7) : '$0.00'}
    `;
    
    generatePDF({
        title: 'Weekly Trading Performance Report',
        content: content,
        filename: `weekly-stats-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

// Download monthly stats as PDF
function downloadMonthlyStats() {
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const monthlyTrades = trades.filter(t => t.date >= monthAgo);
    const monthlyPnl = monthlyTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    const content = `
        **MONTHLY REPORT (Last 30 Days)**
        Period: ${monthAgo} to ${new Date().toISOString().split('T')[0]}
        
        **ACCOUNT PERFORMANCE:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Monthly P&L: ${formatCurrencyWithSign(monthlyPnl)}
        Total Growth: ${formatCurrency(accountBalance - startingBalance)}
        Growth %: ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
        Total Trades: ${monthlyTrades.length}
        
        **TRADE SUMMARY:**
        Winning Trades: ${monthlyTrades.filter(t => t.pnl > 0).length}
        Losing Trades: ${monthlyTrades.filter(t => t.pnl < 0).length}
        Win Rate: ${monthlyTrades.length > 0 ? ((monthlyTrades.filter(t => t.pnl > 0).length / monthlyTrades.length) * 100).toFixed(1) : 0}%
        Total Profit: ${formatCurrency(monthlyTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0))}
        Total Loss: ${formatCurrency(Math.abs(monthlyTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0)))}
        
        **RECENT TRADES (Last 10):**
        ${monthlyTrades.slice(0, 10).map(t => `
        ${t.date} ${t.time} - Trade ${t.tradeNumber}:
        - ${t.pair} | ${t.strategy} | P&L: ${formatCurrencyWithSign(t.pnl)}
        `).join('\n')}
        
        ${monthlyTrades.length > 10 ? `... and ${monthlyTrades.length - 10} more trades` : ''}
    `;
    
    generatePDF({
        title: 'Monthly Trading Performance Report',
        content: content,
        filename: `monthly-stats-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

// Download trade as PDF
function downloadTradePDF(trade) {
    const content = `
        **TRADE DETAILS:**
        Date: ${formatDate(trade.date)}
        Time: ${trade.time}
        Trade Number: ${trade.tradeNumber}
        Currency Pair: ${trade.pair}
        Strategy: ${trade.strategy}
        P&L: ${formatCurrencyWithSign(trade.pnl)}
        Notes: ${trade.notes}
        
        **ACCOUNT INFORMATION:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Total Growth: ${formatCurrency(accountBalance - startingBalance)}
        Growth %: ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
        
        **PERFORMANCE SUMMARY:**
        Total Trades: ${trades.length}
        Winning Trades: ${trades.filter(t => t.pnl > 0).length}
        Losing Trades: ${trades.filter(t => t.pnl < 0).length}
        Win Rate: ${trades.length > 0 ? ((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1) : 0}%
        
        **TRADE ANALYSIS:**
        This trade represents ${Math.abs((trade.pnl / accountBalance) * 100).toFixed(2)}% of current account balance.
        ${trade.pnl >= 0 ? 'Successful trade!' : 'Learning opportunity - review what happened.'}
    `;
    
    generatePDF({
        title: `Trade Details - ${trade.pair} - ${formatDate(trade.date)}`,
        content: content,
        filename: `trade-${trade.id}-${trade.date}.pdf`
    });
}

// Export journal as PDF
function exportJournalPDF() {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length * 100).toFixed(1) : 0;
    
    const content = `
        **COMPLETE TRADING JOURNAL**
        
        **ACCOUNT SUMMARY:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Total Growth: ${formatCurrency(accountBalance - startingBalance)}
        Growth %: ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
        Total Trades: ${trades.length}
        
        **PERFORMANCE METRICS:**
        Winning Trades: ${winningTrades.length}
        Losing Trades: ${losingTrades.length}
        Break Even Trades: ${trades.filter(t => t.pnl === 0).length}
        Win Rate: ${winRate}%
        Total Profit: ${formatCurrency(winningTrades.reduce((sum, t) => sum + t.pnl, 0))}
        Total Loss: ${formatCurrency(Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0)))}
        Net Profit: ${formatCurrency(trades.reduce((sum, t) => sum + t.pnl, 0))}
        Profit Factor: ${losingTrades.reduce((sum, t) => sum + t.pnl, 0) !== 0 ? 
            (winningTrades.reduce((sum, t) => sum + t.pnl, 0) / Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))).toFixed(2) : 'N/A'}
        
        **ALL TRADES (${trades.length} Total):**
        ${trades.map(t => `
        ${t.date} ${t.time} | Trade ${t.tradeNumber} | ${t.pair} | ${t.strategy} | 
        P&L: ${formatCurrencyWithSign(t.pnl)} | Notes: ${t.notes || 'No notes'}
        `).join('\n')}
        
        **JOURNAL NOTES:**
        Generated on: ${new Date().toLocaleDateString()}
        This journal contains your complete trading history.
        Review regularly to identify patterns and improve performance.
    `;
    
    generatePDF({
        title: 'Complete Trading Journal - All Trades',
        content: content,
        filename: `trading-journal-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

// Export analytics as PDF
function exportAnalyticsPDF() {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length * 100).toFixed(1) : 0;
    
    // Calculate statistics
    const pnls = trades.map(t => t.pnl);
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length : 0;
    const maxWin = pnls.length > 0 ? Math.max(...pnls) : 0;
    const maxLoss = pnls.length > 0 ? Math.min(...pnls) : 0;
    
    const content = `
        **TRADING ANALYTICS REPORT**
        
        **PERFORMANCE OVERVIEW:**
        Total Trades: ${trades.length}
        Winning Trades: ${winningTrades.length}
        Losing Trades: ${losingTrades.length}
        Win Rate: ${winRate}%
        Profit Factor: ${profitFactor.toFixed(2)}
        
        **PROFIT ANALYSIS:**
        Total Profit: ${formatCurrency(totalProfit)}
        Total Loss: ${formatCurrency(totalLoss)}
        Net Profit: ${formatCurrency(totalProfit - totalLoss)}
        Average Win: ${formatCurrency(avgWin)}
        Average Loss: ${formatCurrency(avgLoss)}
        Win/Loss Ratio: ${avgLoss !== 0 ? (Math.abs(avgWin / avgLoss)).toFixed(2) : 'N/A'}
        
        **EXTREME PERFORMANCE:**
        Largest Win: ${formatCurrency(maxWin)}
        Largest Loss: ${formatCurrency(maxLoss)}
        Best Day: ${getBestDay()}
        Worst Day: ${getWorstDay()}
        
        **CONSISTENCY METRICS:**
        Max Consecutive Wins: ${calculateMaxConsecutiveWins()}
        Max Consecutive Losses: ${calculateMaxConsecutiveLosses()}
        Current Streak: ${getCurrentStreak()}
        Average Trades Per Day: ${trades.length > 0 ? (trades.length / getTradingDays()).toFixed(1) : 0}
        
        **ACCOUNT GROWTH:**
        Starting Balance: ${formatCurrency(startingBalance)}
        Current Balance: ${formatCurrency(accountBalance)}
        Total Growth: ${formatCurrency(accountBalance - startingBalance)}
        Growth %: ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
        Average Monthly Growth: ${formatCurrency(calculateAverageMonthlyGrowth())}
        
        **RECOMMENDATIONS:**
        ${getAnalyticsRecommendations()}
    `;
    
    generatePDF({
        title: 'Trading Analytics Report',
        content: content,
        filename: `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`
    });
}
        
        **DREAM STATISTICS:**
        Total Dreams: ${dreams.length}
        First Dream: ${dreams.length > 0 ? formatDate(dreams[dreams.length - 1].date) : 'N/A'}
        Latest Dream: ${dreams.length > 0 ? formatDate(dreams[0].date) : 'N/A'}
        
        **ALL DREAMS:**
        ${dreams.map(d => `
        **${formatDate(d.date)}:**
        ${d.content}
        
        `).join('\n')}
        
        **DREAM ANALYSIS:**
        Dreams are powerful tools for manifesting trading success.
        Review these regularly to stay aligned with your goals.
        Use these dreams as motivation during challenging times.
    `;
    });
}

// Export all data as PDF
function exportAllDataPDF() {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length * 100).toFixed(1) : 0;
    
    const content = `
        **COMPLETE TRADING DATA EXPORT**
        
        **ACCOUNT INFORMATION:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Total Growth: ${formatCurrency(accountBalance - startingBalance)}
        Growth %: ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
        
        **PERFORMANCE SUMMARY:**
        Total Trades: ${trades.length}
        Winning Trades: ${winningTrades.length}
        Losing Trades: ${losingTrades.length}
        Win Rate: ${winRate}%
        Total Profit: ${formatCurrency(winningTrades.reduce((sum, t) => sum + t.pnl, 0))}
        Total Loss: ${formatCurrency(Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0)))}
        Net Profit: ${formatCurrency(trades.reduce((sum, t) => sum + t.pnl, 0))}
        Profit Factor: ${losingTrades.reduce((sum, t) => sum + t.pnl, 0) !== 0 ? 
            (winningTrades.reduce((sum, t) => sum + t.pnl, 0) / Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))).toFixed(2) : 'N/A'}
        
        **ALL TRADES:**
        ${trades.map(t => `
        ${t.date} ${t.time} | Trade ${t.tradeNumber} | ${t.pair} | ${t.strategy} | 
        P&L: ${formatCurrencyWithSign(t.pnl)} | Notes: ${t.notes || 'No notes'}
        `).join('\n')}
        
        **TRADING DREAMS (${dreams.length} Total):**
        ${dreams.map(d => `
        ${formatDate(d.date)}: ${d.content}
        `).join('\n')}
        
        **EXPORT DETAILS:**
        Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
        Total Records: ${trades.length + dreams.length}
        File Format: PDF
        Software: FX Tae Trading Dashboard
        
        **IMPORTANT NOTES:**
        This is your complete trading data. Keep this file safe.
        You can import this data back into the system if needed.
        Regular backups are recommended for data security.
    `;
    
    generatePDF({
        title: 'Complete Trading Data Backup',
        content: content,
        filename: `complete-trading-data-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

// Export dashboard report as PDF
function exportDashboardPDF() {
    const today = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => t.date === today);
    const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnl, 0);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const weeklyTrades = trades.filter(t => t.date >= weekAgo);
    const weeklyPnl = weeklyTrades.reduce((sum, t) => sum + t.pnl, 0);
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const monthlyTrades = trades.filter(t => t.date >= monthAgo);
    const monthlyPnl = monthlyTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    const content = `
        **PROFESSIONAL TRADING DASHBOARD REPORT**
        
        **DASHBOARD SNAPSHOT:**
        Report Date: ${new Date().toLocaleDateString()}
        Account Name: ${getCurrentUser()?.name || 'Trader'}
        Trading Period: Active
        
        **ACCOUNT OVERVIEW:**
        Current Balance: ${formatCurrency(accountBalance)}
        Starting Balance: ${formatCurrency(startingBalance)}
        Total Growth: ${formatCurrency(accountBalance - startingBalance)}
        Growth %: ${((accountBalance - startingBalance) / startingBalance * 100).toFixed(1)}%
        
        **DAILY PERFORMANCE:**
        Today's P&L: ${formatCurrencyWithSign(todayPnl)}
        Today's Trades: ${todayTrades.length}/4
        Daily Target Progress: ${(todayTrades.length / 4 * 100).toFixed(0)}%
        
        **WEEKLY PERFORMANCE:**
        Weekly P&L: ${formatCurrencyWithSign(weeklyPnl)}
        Weekly Trades: ${weeklyTrades.length}
        Average Daily P&L: ${weeklyTrades.length > 0 ? formatCurrency(weeklyPnl / 7) : '$0.00'}
        
        **MONTHLY PERFORMANCE:**
        Monthly P&L: ${formatCurrencyWithSign(monthlyPnl)}
        Monthly Trades: ${monthlyTrades.length}
        Average Daily P&L: ${monthlyTrades.length > 0 ? formatCurrency(monthlyPnl / 30) : '$0.00'}
        
        **PERFORMANCE METRICS:**
        Total Trades: ${trades.length}
        Win Rate: ${trades.length > 0 ? ((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1) : 0}%
        Profit Factor: ${calculateProfitFactor().toFixed(2)}
        Risk/Reward Ratio: ${calculateRiskRewardRatio().toFixed(2)}
        
        **RECENT ACTIVITY (Last 5 Trades):**
        ${trades.slice(0, 5).map(t => `
        ${t.date} ${t.time} - Trade ${t.tradeNumber}:
        - ${t.pair} | ${t.strategy} | P&L: ${formatCurrencyWithSign(t.pnl)}
        - Status: ${t.pnl >= 0 ? 'WIN' : 'LOSS'}
        `).join('\n')}
        
        **DREAMS & GOALS:**
        Total Dreams Recorded: ${dreams.length}
        Latest Dream: ${dreams.length > 0 ? dreams[0].content.substring(0, 100) + '...' : 'No dreams yet'}
        
        **RECOMMENDATIONS:**
        1. ${todayTrades.length < 4 ? 'Consider taking more trades today to reach your daily limit.' : 'Daily trade limit reached. Good discipline!'}
        2. ${winRate < 50 ? 'Focus on improving win rate through better trade selection.' : 'Excellent win rate! Maintain consistency.'}
        3. ${accountBalance > startingBalance ? 'Account is growing. Continue with current strategy.' : 'Review trading strategy for improvement.'}
        
        **GENERATED BY:**
        FX Tae Trading Dashboard
        www.fxtaetrader.page.gd
        ${new Date().toLocaleDateString()}
    `;
    
    generatePDF({
        title: 'Professional Trading Dashboard Report',
        content: content,
        filename: `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`
    });
}

// Download chart as PDF
function downloadChartAsPDF(canvasId, chartName) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        showToast('Chart not found', 'error');
        return;
    }
    
    try {
        // Use html2canvas to capture the chart with better quality
        html2canvas(canvas, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        }).then(canvasImage => {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('landscape');
            
            // Add title
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(40, 40, 150);
            pdf.text(chartName, 20, 20);
            
            // Add date
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
            
            // Add chart image
            const imgData = canvasImage.toDataURL('image/png', 1.0);
            const imgWidth = 250;
            const imgHeight = (canvasImage.height * imgWidth) / canvasImage.width;
            
            pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
            
            // Add footer
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.text('FX Tae Trading Dashboard - Professional Chart Export', 20, pdf.internal.pageSize.height - 10);
            
            // Save PDF
            pdf.save(`${chartName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
            
            showToast(`${chartName} downloaded as PDF`, 'success');
        }).catch(error => {
            console.error('Error capturing chart:', error);
            showToast('Error downloading chart. Please try again.', 'error');
        });
    } catch (error) {
        console.error('Error downloading chart as PDF:', error);
        showToast('Error downloading chart', 'error');
    }
}

// Helper functions for analytics
function calculateMaxConsecutiveWins() {
    let maxWins = 0;
    let currentWins = 0;
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    
    sortedTrades.forEach(trade => {
        if (trade.pnl > 0) {
            currentWins++;
            maxWins = Math.max(maxWins, currentWins);
        } else {
            currentWins = 0;
        }
    });
    
    return maxWins;
}

function calculateMaxConsecutiveLosses() {
    let maxLosses = 0;
    let currentLosses = 0;
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    
    sortedTrades.forEach(trade => {
        if (trade.pnl < 0) {
            currentLosses++;
            maxLosses = Math.max(maxLosses, currentLosses);
        } else {
            currentLosses = 0;
        }
    });
    
    return maxLosses;
}

function getCurrentStreak() {
    if (trades.length === 0) return 'No trades';
    
    // Sort trades by date (newest first)
    const sortedTrades = [...trades].sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
    
    const latestTrade = sortedTrades[0];
    let streak = 1;
    
    for (let i = 1; i < sortedTrades.length; i++) {
        if ((latestTrade.pnl > 0 && sortedTrades[i].pnl > 0) || 
            (latestTrade.pnl < 0 && sortedTrades[i].pnl < 0)) {
            streak++;
        } else {
            break;
        }
    }
    
    return `${streak} ${latestTrade.pnl > 0 ? 'win' : 'loss'}${streak > 1 ? 's' : ''}`;
}

function getTradingDays() {
    if (trades.length === 0) return 1;
    
    const dates = [...new Set(trades.map(t => t.date))];
    return dates.length;
}

function getBestDay() {
    if (trades.length === 0) return 'No trades';
    
    const tradesByDate = {};
    trades.forEach(trade => {
        if (!tradesByDate[trade.date]) {
            tradesByDate[trade.date] = 0;
        }
        tradesByDate[trade.date] += trade.pnl;
    });
    
    let bestDate = '';
    let bestPnl = -Infinity;
    
    Object.entries(tradesByDate).forEach(([date, pnl]) => {
        if (pnl > bestPnl) {
            bestPnl = pnl;
            bestDate = date;
        }
    });
    
    return `${formatDate(bestDate)}: ${formatCurrencyWithSign(bestPnl)}`;
}

function getWorstDay() {
    if (trades.length === 0) return 'No trades';
    
    const tradesByDate = {};
    trades.forEach(trade => {
        if (!tradesByDate[trade.date]) {
            tradesByDate[trade.date] = 0;
        }
        tradesByDate[trade.date] += trade.pnl;
    });
    
    let worstDate = '';
    let worstPnl = Infinity;
    
    Object.entries(tradesByDate).forEach(([date, pnl]) => {
        if (pnl < worstPnl) {
            worstPnl = pnl;
            worstDate = date;
        }
    });
    
    return `${formatDate(worstDate)}: ${formatCurrencyWithSign(worstPnl)}`;
}

function calculateAverageMonthlyGrowth() {
    if (trades.length === 0) return 0;
    
    const firstTradeDate = new Date(Math.min(...trades.map(t => new Date(t.date).getTime())));
    const monthsTrading = Math.max(1, (new Date().getMonth() - firstTradeDate.getMonth()) + 
        (new Date().getFullYear() - firstTradeDate.getFullYear()) * 12);
    
    return (accountBalance - startingBalance) / monthsTrading;
}

function calculateProfitFactor() {
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    
    return totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
}

function calculateRiskRewardRatio() {
    if (trades.length === 0) return 0;
    
    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0)) / losingTrades.length : 0;
    
    return avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0;
}

function getAnalyticsRecommendations() {
    const winRate = trades.length > 0 ? (trades.filter(t => t.pnl > 0).length / trades.length * 100) : 0;
    const profitFactor = calculateProfitFactor();
    
    let recommendations = [];
    
    if (trades.length < 10) {
        recommendations.push('Need more trades for accurate analysis (minimum 10 trades recommended)');
    }
    
    if (winRate < 40) {
        recommendations.push('Focus on improving win rate through better trade selection');
    } else if (winRate > 60) {
        recommendations.push('Excellent win rate! Consider increasing position sizes carefully');
    }
    
    if (profitFactor < 1.5) {
        recommendations.push('Work on improving profit factor through better risk management');
    } else if (profitFactor > 3) {
        recommendations.push('Outstanding profit factor! Maintain your current strategy');
    }
    
    if (calculateMaxConsecutiveLosses() > 3) {
        recommendations.push('Reduce consecutive losses by taking breaks after losing streaks');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('Continue with current strategy. All metrics are within good ranges');
    }
    
    return recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n');
}

// ===== MODAL FUNCTIONS =====

// Show modal
function showModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = content;
    document.body.appendChild(modal);
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.style.display = 'none';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// ===== THEME FUNCTIONS =====

// Set theme
function setTheme(theme) {
    try {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        localStorage.setItem('fxTaeTheme', theme);
        
        // Update theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if ((theme === 'light' && btn.textContent.includes('Light')) || 
                (theme === 'dark' && btn.textContent.includes('Dark'))) {
                btn.classList.add('active');
            }
        });
        
        showToast(`Switched to ${theme} theme`, 'success');
    } catch (error) {
        console.error('Error setting theme:', error);
    }
}

// Clear all data
function clearAllData() {
    if (!confirm('WARNING: This will delete ALL your trading data, dreams, and reset your account. This action cannot be undone. Are you sure?')) {
        return;
    }
    
    try {
        localStorage.removeItem('fxTaeTrades');
        localStorage.removeItem('fxTaeDreams');
        localStorage.removeItem('fxTaeAccountBalance');
        localStorage.removeItem('fxTaeStartingBalance');
        
        trades = [];
        dreams = [];
        accountBalance = 10000;
        startingBalance = 10000;
        
        saveTrades();
        saveDreams();
        saveAccountBalance();
        
        updateAccountBalanceDisplay();
        updateRecentTrades();
        updateAllTrades();
        updateDreamsList();
        updateStats();
        updateTradeLists();
        updateCalendar();
        
        if (equityChart) {
            const activePeriodBtn = document.querySelector('.period-btn.active');
            const period = activePeriodBtn ? activePeriodBtn.getAttribute('data-period') : '7d';
            equityChart.data = getEquityData(period);
            equityChart.update();
        }
        
        if (winRateChart) {
            winRateChart.data = getWinRateData();
            winRateChart.update();
        }
        
        showToast('All data cleared successfully!', 'success');
    } catch (error) {
        console.error('Error clearing all data:', error);
        showToast('Error clearing data', 'error');
    }
}

// ===== EVENT LISTENERS SETUP =====

// Setup event listeners
function setupEventListeners() {
    // Menu button
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            
            // Show selected page
            const pageId = this.getAttribute('data-page');
            const pageElement = document.getElementById(pageId);
            if (pageElement) {
                pageElement.classList.add('active');
            }
            
            // Close sidebar on mobile
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove('active');
            }
            
            // Update charts on analytics page
            if (pageId === 'analytics') {
                setTimeout(() => {
                    if (winLossChart) winLossChart.update();
                    if (profitFactorChart) profitFactorChart.update();
                }, 100);
            }
        });
    });
    
    // Chart period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            // Update chart based on period
            const period = this.getAttribute('data-period');
            updateChartPeriod(period);
        });
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                logoutUser();
                window.location.href = 'index.html';
            }
        });
    }
    
    // Edit balance button
    const editBalanceBtn = document.getElementById('editBalanceBtn');
    if (editBalanceBtn) {
        editBalanceBtn.addEventListener('click', openEditBalanceModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modals with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                }
            });
        }
    });
    
    // Export dashboard button - FIXED
    const exportDashboardBtn = document.getElementById('exportDashboard');
    if (exportDashboardBtn) {
        exportDashboardBtn.addEventListener('click', function() {
            exportDashboardPDF();
        });
    }
    
    // Set up all download buttons
    setupDownloadButtons();
}

// Setup all download buttons
function setupDownloadButtons() {
    // Today's P&L download button
    const todayDownloadBtn = document.querySelector('.stat-card.blue-card .download-btn');
    if (todayDownloadBtn) {
        todayDownloadBtn.addEventListener('click', downloadTodayStats);
    }
    
    // Weekly Performance download button
    const weeklyDownloadBtn = document.querySelector('.stat-card.green-card .download-btn');
    if (weeklyDownloadBtn) {
        weeklyDownloadBtn.addEventListener('click', downloadWeeklyStats);
    }
    
    // Monthly Performance download button
    const monthlyDownloadBtn = document.querySelector('.stat-card.orange-card .download-btn');
    if (monthlyDownloadBtn) {
        monthlyDownloadBtn.addEventListener('click', downloadMonthlyStats);
    }
}

// Update chart period
function updateChartPeriod(period) {
    // Update active button
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-period') === period) {
            btn.classList.add('active');
        }
    });
    
    // Update equity chart with new period
    if (equityChart) {
        equityChart.data = getEquityData(period);
        equityChart.update();
    }
    
    showToast(`Showing equity curve for ${getPeriodLabel(period)}`, 'info');
}

// Helper function to get period label
function getPeriodLabel(period) {
    switch(period) {
        case '7d': return '7 Days';
        case '1m': return '1 Month';
        case '12m': return '12 Months';
        default: return '7 Days';
    }
}

// ===== LANDING PAGE FUNCTIONS =====

// Handle Google authentication
function handleGoogleAuth(type) {
    showToast('Please select your Google account to continue...', 'info');
    
    // Simulate Google auth flow
    setTimeout(() => {
        const email = `user${Date.now()}@example.com`;
        const name = 'Google User';
        
        if (type === 'signup') {
            const user = {
                id: Date.now(),
                name,
                email,
                password: 'google_auth',
                createdAt: new Date().toISOString(),
                isGoogleUser: true
            };
            
            // Save Google user
            const users = getUsers();
            if (!users.some(u => u.email === email)) {
                users.push(user);
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
            }
            
            setCurrentUser(user);
            showToast('Google account connected! Redirecting...', 'success');
        } else {
            // For login, check if user exists
            const users = getUsers();
            const user = users.find(u => u.email === email);
            
            if (user) {
                setCurrentUser(user);
                showToast('Login successful! Redirecting...', 'success');
            } else {
                showToast('No account found with this Google account. Please sign up first.', 'error');
                return;
            }
        }
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }, 1000);
}

// Handle signup form submission
function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName')?.value.trim();
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const agreeTerms = document.getElementById('agreeTerms')?.checked;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    if (!validatePassword(password)) {
        showToast('Password must be at least 8 characters with letters and numbers', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showToast('Please accept the terms and conditions', 'error');
        return;
    }
    
    // Create user object
    const user = {
        id: Date.now(),
        name,
        email,
        password, // In production, this should be hashed
        createdAt: new Date().toISOString(),
        isGoogleUser: false
    };
    
    // Save user
    const result = saveUser(user);
    if (!result.success) {
        showToast(result.message, 'error');
        return;
    }
    
    // Set as current user and redirect
    if (setCurrentUser(result.user)) {
        showToast('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        showToast('Error creating account', 'error');
    }
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    
    if (!email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    // Authenticate
    const result = authenticateUser(email, password);
    if (!result.success) {
        showToast(result.message, 'error');
        return;
    }
    
    // Set as current user and redirect
    if (setCurrentUser(result.user)) {
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } else {
        showToast('Error logging in', 'error');
    }
}

// Toggle password visibility
function togglePasswordVisibility(button) {
    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Switch auth tabs
function switchAuthTab(tabName) {
    // Update active tab
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Show active form
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
        if (form.id === `${tabName}Form`) {
            form.classList.add('active');
        }
    });
}

// ===== INITIALIZATION =====

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Check if we're on landing page or dashboard
    const isLandingPage = window.location.pathname.includes('index.html') || 
                         window.location.pathname === '/' ||
                         window.location.pathname.endsWith('.html') === false;
    
    if (isLandingPage) {
        console.log('Initializing landing page...');
        
        // Initialize users storage
        initializeUsers();
        
        // Setup auth tabs switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                switchAuthTab(tabName);
            });
        });
        
        // Setup password visibility toggle
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                togglePasswordVisibility(this);
            });
        });
        
        // Setup form submissions
        const signupForm = document.getElementById('signupForm');
        const loginForm = document.getElementById('loginForm');
        
        if (signupForm) {
            signupForm.addEventListener('submit', handleSignup);
        }
        
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // Setup top navigation buttons
        const topLoginBtn = document.getElementById('topLoginBtn');
        const topSignupBtn = document.getElementById('topSignupBtn');
        
        if (topLoginBtn) {
            topLoginBtn.addEventListener('click', () => {
                switchAuthTab('login');
                document.querySelector('.auth-section')?.scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        if (topSignupBtn) {
            topSignupBtn.addEventListener('click', () => {
                switchAuthTab('signup');
                document.querySelector('.auth-section')?.scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        // Redirect if already authenticated
        if (isAuthenticated()) {
            console.log('User already authenticated, redirecting to dashboard...');
            window.location.href = 'dashboard.html';
        }
    } else if (window.location.pathname.includes('dashboard.html')) {
        console.log('Initializing dashboard...');
        
        // Check authentication
        if (!isAuthenticated()) {
            console.log('User not authenticated, redirecting to login...');
            window.location.href = 'index.html';
            return;
        }
        
        // Initialize after loading screen
        setTimeout(() => {
            const loader = document.getElementById('loader');
            const mainContainer = document.getElementById('mainContainer');
            
            if (loader && mainContainer) {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                    mainContainer.style.display = 'block';
                    initializeApp();
                }, 500);
            } else {
                initializeApp();
            }
        }, 2000);
    }
});

// ===== GLOBAL EXPORTS =====
// Make functions available globally
window.initializeApp = initializeApp;
window.saveTrade = saveTrade;
window.saveAndDownloadTrade = saveAndDownloadTrade;
window.editTrade = editTrade;
window.saveEditedTrades = saveEditedTrades;
window.deleteTrade = deleteTrade;
window.editTodayTrades = editTodayTrades;
window.closeEditTradesModal = closeEditTradesModal;
window.showCustomStrategy = showCustomStrategy;
window.saveDream = saveDream;
window.clearDream = clearDream;
window.editDream = editDream;
window.deleteDream = deleteDream;
window.editStartingBalance = editStartingBalance;
window.saveStartingBalance = saveStartingBalance;
window.cancelStartingBalanceEdit = cancelStartingBalanceEdit;
window.openEditBalanceModal = openEditBalanceModal;
window.closeEditBalanceModal = closeEditBalanceModal;
window.confirmBalanceUpdate = confirmBalanceUpdate;

// PDF Export Functions
window.downloadTodayStats = downloadTodayStats;
window.downloadWeeklyStats = downloadWeeklyStats;
window.downloadMonthlyStats = downloadMonthlyStats;
window.downloadTradePDF = downloadTradePDF;
window.exportJournalPDF = exportJournalPDF;
window.exportAnalyticsPDF = exportAnalyticsPDF;
window.exportNotebookPDF = exportNotebookPDF;
window.exportAllDataPDF = exportAllDataPDF;
window.exportDashboardPDF = exportDashboardPDF;
window.downloadChartAsPDF = downloadChartAsPDF;

// Calendar Functions
window.changeCalendarMonth = changeCalendarMonth;
window.viewDayTrades = viewDayTrades;

// Modal Functions
window.showModal = showModal;
window.closeModal = closeModal;

// Theme Functions
window.setTheme = setTheme;
window.clearAllData = clearAllData;
window.logoutUser = logoutUser;

// Landing page functions
window.handleGoogleAuth = handleGoogleAuth;
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.togglePasswordVisibility = togglePasswordVisibility;
window.switchAuthTab = switchAuthTab;

// Utility functions
window.showToast = showToast;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.formatCurrency = formatCurrency;
window.formatCurrencyWithSign = formatCurrencyWithSign;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.updateChartPeriod = updateChartPeriod;

console.log('Script loaded successfully');
