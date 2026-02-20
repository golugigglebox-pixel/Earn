// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDi4coFSKvCVmde9jqCI467XVW3hN-oGo4",
    authDomain: "shoes-shopping-app-6a1d3.firebaseapp.com",
    databaseURL: "https://shoes-shopping-app-6a1d3-default-rtdb.firebaseio.com",
    projectId: "shoes-shopping-app-6a1d3",
    storageBucket: "shoes-shopping-app-6a1d3.appspot.com",
    messagingSenderId: "816065792865",
    appId: "1:816065792865:web:e137703381e98c59961320",
    measurementId: "G-TKT836KPLF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Current user (mock for demo - in production, use Firebase Auth)
const currentUser = {
    id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 9876543210',
    referralCode: 'CAD123ABC',
    balance: 25000,
    totalInvested: 45000,
    totalEarnings: 8250,
    dailyProfit: 3250,
    investmentDays: 2
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadDashboardData();
    loadProducts();
    loadActivities();
    loadPaymentSettings();
    setupListeners();
});

// Initialize App
function initializeApp() {
    // Set current date
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        dateElement.textContent = formatDate(now) + ' ' + formatTime(now);
    }
    
    // Set user display
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = `User ${currentUser.id.slice(0, 4)} ******`;
    }
    
    // Update user stats
    updateUserStats();
}

// Update User Stats
function updateUserStats() {
    document.getElementById('dailyProfit') && (document.getElementById('dailyProfit').textContent = `₹ ${currentUser.dailyProfit.toLocaleString()}`);
    document.getElementById('totalIncome') && (document.getElementById('totalIncome').textContent = `₹ ${currentUser.totalEarnings.toLocaleString()}`);
    document.getElementById('investmentDays') && (document.getElementById('investmentDays').textContent = currentUser.investmentDays);
    document.getElementById('quickInvestAmount') && (document.getElementById('quickInvestAmount').textContent = `₹800`);
    
    // Profile page stats
    document.getElementById('totalInvested') && (document.getElementById('totalInvested').textContent = `₹${currentUser.totalInvested.toLocaleString()}`);
    document.getElementById('totalEarnings') && (document.getElementById('totalEarnings').textContent = `₹${currentUser.totalEarnings.toLocaleString()}`);
    document.getElementById('availableBalance') && (document.getElementById('availableBalance').textContent = `₹${currentUser.balance.toLocaleString()}`);
}

// Load Dashboard Data
function loadDashboardData() {
    // Load products for slider
    loadProductsForSlider();
    
    // Load user investments
    loadUserInvestments();
}

// Load Products
function loadProducts() {
    database.ref('products').once('value', (snapshot) => {
        const products = snapshot.val() || {};
        displayProducts(products);
    });
}

// Load Products for Slider
function loadProductsForSlider() {
    database.ref('products').limitToFirst(5).once('value', (snapshot) => {
        const products = snapshot.val() || {};
        displayProductsSlider(products);
    });
}

// Display Products Slider
function displayProductsSlider(products) {
    const slider = document.getElementById('newProductsSlider');
    if (!slider) return;
    
    slider.innerHTML = '';
    
    Object.values(products).forEach(product => {
        if (product.status !== 'active') return;
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <h3>${product.name}</h3>
            <div class="product-price">₹${product.price.toLocaleString()}</div>
            <div class="product-roi">${product.roi}% ROI</div>
            <button class="product-btn" onclick="quickInvest('${product.id}')">Invest</button>
        `;
        slider.appendChild(card);
    });
}

// Display Products Grid
function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    Object.entries(products).forEach(([id, product]) => {
        if (product.status !== 'active') return;
        
        const riskClass = `risk-${product.risk || 'medium'}`;
        const card = document.createElement('div');
        card.className = 'product-card-large';
        card.innerHTML = `
            <span class="product-badge">${product.category || 'Investment'}</span>
            <h3>${product.name}</h3>
            <div class="product-category">Min: ₹${product.price.toLocaleString()}</div>
            <div class="product-price-large">₹${product.price.toLocaleString()}</div>
            <div class="product-meta">
                <span class="product-roi-large">${product.roi}% ROI</span>
                <span class="product-risk ${riskClass}">${(product.risk || 'Medium').toUpperCase()}</span>
            </div>
            <div class="product-meta">
                <span>${product.duration || 365} days</span>
            </div>
            <button class="product-btn" onclick="investNow('${id}')">Invest Now</button>
        `;
        grid.appendChild(card);
    });
}

// Load Activities
function loadActivities() {
    database.ref('activity').orderByChild('timestamp').limitToLast(5).once('value', (snapshot) => {
        const activities = snapshot.val() || {};
        displayActivities(activities);
    });
}

// Display Activities
function displayActivities(activities) {
    const list = document.getElementById('recentActivities');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (Object.keys(activities).length === 0) {
        // Mock activities
        const mockActivities = [
            { title: 'Investment credited', time: '2 min ago', amount: '+₹500', type: 'profit' },
            { title: 'Withdrawal processed', time: '1 hour ago', amount: '-₹2,000', type: 'withdrawal' },
            { title: 'Daily profit credited', time: '5 hours ago', amount: '+₹325', type: 'profit' },
            { title: 'Investment made', time: '1 day ago', amount: '-₹10,000', type: 'investment' }
        ];
        
        mockActivities.forEach(activity => {
            const item = createActivityItem(activity);
            list.appendChild(item);
        });
    } else {
        Object.values(activities).reverse().forEach(activity => {
            const item = createActivityItem({
                title: activity.action,
                time: activity.time,
                amount: activity.amount,
                type: activity.type || 'profit'
            });
            list.appendChild(item);
        });
    }
}

function createActivityItem(activity) {
    const div = document.createElement('div');
    div.className = 'activity-item';
    
    let iconClass = 'fa-chart-line';
    let iconBg = 'profit';
    
    if (activity.type === 'withdrawal') {
        iconClass = 'fa-money-bill-wave';
        iconBg = 'withdrawal';
    } else if (activity.type === 'investment') {
        iconClass = 'fa-coins';
        iconBg = 'investment';
    }
    
    div.innerHTML = `
        <div class="activity-icon ${iconBg}">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="activity-details">
            <div class="activity-title">${activity.title}</div>
            <div class="activity-time">${activity.time}</div>
        </div>
        <div class="activity-amount ${activity.amount.startsWith('+') ? 'positive' : 'negative'}">${activity.amount}</div>
    `;
    
    return div;
}

// Load Payment Settings
function loadPaymentSettings() {
    database.ref('settings/payment').once('value', (snapshot) => {
        const settings = snapshot.val() || {};
        
        // Update UPI details
        const upiIdElement = document.getElementById('upiId');
        if (upiIdElement) {
            upiIdElement.textContent = settings.upiId || 'admin@okhdfcbank';
        }
        
        const qrElement = document.getElementById('upiQR');
        if (qrElement) {
            qrElement.src = settings.qrCode || 'https://via.placeholder.com/200';
        }
    });
}

// Load User Investments
function loadUserInvestments() {
    // This would filter by current user ID in production
    database.ref('investments').orderByChild('userId').equalTo(currentUser.id).once('value', (snapshot) => {
        const investments = snapshot.val() || {};
        displayUserInvestments(investments);
    });
}

// Display User Investments
function displayUserInvestments(investments) {
    const list = document.getElementById('investmentsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (Object.keys(investments).length === 0) {
        list.innerHTML = '<div class="text-center" style="padding: 2rem;">No investments found</div>';
        return;
    }
    
    Object.entries(investments).forEach(([id, investment]) => {
        const progress = (investment.daysCompleted / investment.duration) * 100;
        const card = document.createElement('div');
        card.className = 'investment-card';
        card.innerHTML = `
            <div class="investment-header">
                <div>
                    <div class="investment-product">${investment.productName}</div>
                    <div class="investment-date">Started: ${formatDate(new Date(investment.startDate))}</div>
                </div>
                <div class="investment-amount">₹${investment.amount.toLocaleString()}</div>
            </div>
            <div class="investment-details">
                <div class="investment-detail">
                    <span class="label">Current Value</span>
                    <span class="value">₹${(investment.currentValue || investment.amount).toLocaleString()}</span>
                </div>
                <div class="investment-detail">
                    <span class="label">Profit</span>
                    <span class="value ${(investment.profitLoss || 0) >= 0 ? 'profit-positive' : 'profit-negative'}">
                        ${(investment.profitLoss || 0) >= 0 ? '+' : '-'}₹${Math.abs(investment.profitLoss || 0).toLocaleString()}
                    </span>
                </div>
                <div class="investment-detail">
                    <span class="label">Returns</span>
                    <span class="value">${investment.profitLossPercent || 0}%</span>
                </div>
            </div>
            <div class="investment-progress">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="investment-footer">
                <span class="investment-status status-${investment.status}">${investment.status}</span>
                <span>${investment.daysCompleted || 0}/${investment.duration} days</span>
            </div>
        `;
        list.appendChild(card);
    });
}

// Load Transactions
function loadTransactions() {
    database.ref('transactions').orderByChild('userId').equalTo(currentUser.id).limitToLast(20).once('value', (snapshot) => {
        const transactions = snapshot.val() || {};
        displayTransactions(transactions);
    });
}

// Display Transactions
function displayTransactions(transactions) {
    const list = document.getElementById('transactionsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (Object.keys(transactions).length === 0) {
        list.innerHTML = '<div class="text-center" style="padding: 2rem;">No transactions found</div>';
        return;
    }
    
    Object.values(transactions).reverse().forEach(t => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        
        let icon = 'fa-arrow-down';
        let iconClass = 'deposit';
        let amountClass = 'positive';
        let amountPrefix = '+';
        
        if (t.type === 'withdrawal') {
            icon = 'fa-arrow-up';
            iconClass = 'withdrawal';
            amountClass = 'negative';
            amountPrefix = '-';
        } else if (t.type === 'profit') {
            icon = 'fa-chart-line';
            iconClass = 'profit';
        } else if (t.type === 'investment') {
            icon = 'fa-coins';
            iconClass = 'investment';
            amountClass = 'negative';
            amountPrefix = '-';
        }
        
        item.innerHTML = `
            <div class="transaction-icon ${iconClass}">
                <i class="fas ${icon}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-title">${t.description || t.type}</div>
                <div class="transaction-meta">${formatDate(new Date(t.date))}</div>
            </div>
            <div class="transaction-amount ${amountClass}">${amountPrefix}₹${t.amount.toLocaleString()}</div>
        `;
        
        list.appendChild(item);
    });
}

// Menu Toggle
document.getElementById('menuToggle')?.addEventListener('click', toggleMenu);

function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function closeAllModals() {
    document.getElementById('sideMenu')?.classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// Modal Functions
function showInvestModal() {
    // Load products for select
    database.ref('products').once('value', (snapshot) => {
        const products = snapshot.val() || {};
        const select = document.getElementById('investProduct');
        select.innerHTML = '<option value="">Choose product...</option>';
        
        Object.entries(products).forEach(([id, product]) => {
            if (product.status === 'active') {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `${product.name} - ₹${product.price} (${product.roi}% ROI)`;
                select.appendChild(option);
            }
        });
    });
    
    openModal('investModal');
}

function showRecharge() {
    openModal('rechargeModal');
}

function showWithdraw() {
    document.getElementById('availableBalance').textContent = `₹${currentUser.balance.toLocaleString()}`;
    openModal('withdrawModal');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// Investment Form
document.getElementById('investForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const productId = document.getElementById('investProduct').value;
    const amount = parseFloat(document.getElementById('investAmount').value);
    const method = document.getElementById('paymentMethod').value;
    
    if (!productId) {
        showToast('Please select a product');
        return;
    }
    
    // Get product details
    database.ref(`products/${productId}`).once('value', (snapshot) => {
        const product = snapshot.val();
        
        if (amount < product.price) {
            showToast(`Minimum investment is ₹${product.price}`);
            return;
        }
        
        // Create investment
        const investment = {
            userId: currentUser.id,
            userName: currentUser.name,
            productId: productId,
            productName: product.name,
            amount: amount,
            currentValue: amount,
            profitLoss: 0,
            profitLossPercent: 0,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + (product.duration * 24 * 60 * 60 * 1000)).toISOString(),
            duration: product.duration,
            daysCompleted: 0,
            status: 'pending',
            roi: product.roi
        };
        
        database.ref('investments').push(investment)
            .then(() => {
                // Create transaction
                const transaction = {
                    userId: currentUser.id,
                    type: 'investment',
                    amount: amount,
                    description: `Invested in ${product.name}`,
                    status: 'pending',
                    date: new Date().toISOString()
                };
                
                database.ref('transactions').push(transaction);
                
                showToast('Investment successful!');
                closeModal('investModal');
                
                // Add to activity
                database.ref('activity').push({
                    user: currentUser.name,
                    action: `Invested ₹${amount} in ${product.name}`,
                    time: 'Just now',
                    timestamp: Date.now()
                });
            })
            .catch(error => {
                console.error('Error making investment:', error);
                showToast('Error making investment');
            });
    });
});

// Recharge Form
document.getElementById('rechargeForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('rechargeAmount').value);
    const method = document.getElementById('rechargeMethod').value;
    
    if (amount < 100) {
        showToast('Minimum recharge amount is ₹100');
        return;
    }
    
    // Create transaction
    const transaction = {
        userId: currentUser.id,
        type: 'deposit',
        amount: amount,
        method: method,
        description: `Added money via ${method.toUpperCase()}`,
        status: 'pending',
        date: new Date().toISOString()
    };
    
    database.ref('transactions').push(transaction)
        .then(() => {
            showToast('Recharge request submitted! Please complete payment.');
            closeModal('rechargeModal');
            
            // Add to activity
            database.ref('activity').push({
                user: currentUser.name,
                action: `Recharged ₹${amount} via ${method}`,
                time: 'Just now',
                timestamp: Date.now()
            });
        })
        .catch(error => {
            console.error('Error creating recharge:', error);
            showToast('Error creating recharge');
        });
});

// Withdraw Form
document.getElementById('withdrawForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const method = document.getElementById('withdrawMethod').value;
    
    if (amount < 100) {
        showToast('Minimum withdrawal amount is ₹100');
        return;
    }
    
    if (amount > currentUser.balance) {
        showToast('Insufficient balance');
        return;
    }
    
    // Validate details based on method
    if (method === 'bank') {
        const accountName = document.getElementById('accountName').value;
        const accountNumber = document.getElementById('accountNumber').value;
        const ifscCode = document.getElementById('ifscCode').value;
        
        if (!accountName || !accountNumber || !ifscCode) {
            showToast('Please fill all bank details');
            return;
        }
    } else if (method === 'upi') {
        const upiId = document.getElementById('upiIdWithdraw').value;
        if (!upiId) {
            showToast('Please enter UPI ID');
            return;
        }
    }
    
    // Create withdrawal request
    const withdrawal = {
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        amount: amount,
        method: method,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        accountDetails: method === 'bank' 
            ? `${document.getElementById('accountName').value} - ${document.getElementById('accountNumber').value}`
            : document.getElementById('upiIdWithdraw').value
    };
    
    database.ref('withdrawals').push(withdrawal)
        .then(() => {
            showToast('Withdrawal request submitted!');
            closeModal('withdrawModal');
            
            // Add to activity
            database.ref('activity').push({
                user: currentUser.name,
                action: `Requested withdrawal of ₹${amount}`,
                time: 'Just now',
                timestamp: Date.now()
            });
        })
        .catch(error => {
            console.error('Error creating withdrawal:', error);
            showToast('Error creating withdrawal');
        });
});

// Check-in
document.getElementById('checkinBtn')?.addEventListener('click', function() {
    // Check if already checked in today
    const today = new Date().toDateString();
    const lastCheckin = localStorage.getItem('lastCheckin');
    
    if (lastCheckin === today) {
        showToast('Already checked in today!');
        return;
    }
    
    // Calculate streak
    let streak = parseInt(localStorage.getItem('checkinStreak') || '0');
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (localStorage.getItem('lastCheckin') === yesterday) {
        streak++;
    } else {
        streak = 1;
    }
    
    // Save check-in
    localStorage.setItem('lastCheckin', today);
    localStorage.setItem('checkinStreak', streak);
    
    // Update streak display
    document.getElementById('streakCount') && (document.getElementById('streakCount').textContent = `${streak} days`);
    
    // Show success modal
    openModal('checkinModal');
    
    // Add bonus to balance (mock)
    const bonus = 50 + (streak * 10);
    showToast(`Earned ₹${bonus} check-in bonus!`);
});

// Copy Referral
function copyReferral() {
    navigator.clipboard.writeText(currentUser.referralCode)
        .then(() => showToast('Referral code copied!'))
        .catch(() => showToast('Failed to copy'));
}

function copyReferralCode() {
    copyReferral();
}

function copyUpiId() {
    const upiId = document.getElementById('upiId').textContent;
    navigator.clipboard.writeText(upiId)
        .then(() => showToast('UPI ID copied!'))
        .catch(() => showToast('Failed to copy'));
}

// Share Referral
function shareReferral() {
    if (navigator.share) {
        navigator.share({
            title: 'Join me on Invest Platform',
            text: `Use my referral code ${currentUser.referralCode} to get bonus!`,
            url: window.location.origin
        });
    } else {
        copyReferral();
    }
}

// Share App
function shareApp() {
    shareReferral();
}

// Set Amount Preset
function setAmount(amount) {
    document.getElementById('rechargeAmount').value = amount;
}

// Toggle Search
function toggleSearch() {
    const searchBar = document.getElementById('searchBar');
    searchBar.style.display = searchBar.style.display === 'none' ? 'flex' : 'none';
}

// Filter Products
function filterProducts(category) {
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Filter products
    database.ref('products').once('value', (snapshot) => {
        const products = snapshot.val() || {};
        const filtered = {};
        
        Object.entries(products).forEach(([id, product]) => {
            if (category === 'all' || product.category === category) {
                filtered[id] = product;
            }
        });
        
        displayProducts(filtered);
    });
}

// Search Products
document.getElementById('productSearch')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    database.ref('products').once('value', (snapshot) => {
        const products = snapshot.val() || {};
        const filtered = {};
        
        Object.entries(products).forEach(([id, product]) => {
            if (product.name.toLowerCase().includes(searchTerm)) {
                filtered[id] = product;
            }
        });
        
        displayProducts(filtered);
    });
});

// Switch Investment Tab
function switchInvestmentTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Filter investments by status
    database.ref('investments').orderByChild('userId').equalTo(currentUser.id).once('value', (snapshot) => {
        const investments = snapshot.val() || {};
        const filtered = {};
        
        Object.entries(investments).forEach(([id, inv]) => {
            if (tab === 'all' || inv.status === tab) {
                filtered[id] = inv;
            }
        });
        
        displayUserInvestments(filtered);
    });
}

// Filter Transactions
function filterTransactions(type) {
    document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    database.ref('transactions').orderByChild('userId').equalTo(currentUser.id).once('value', (snapshot) => {
        const transactions = snapshot.val() || {};
        const filtered = {};
        
        Object.entries(transactions).forEach(([id, t]) => {
            if (type === 'all' || t.type === type) {
                filtered[id] = t;
            }
        });
        
        displayTransactions(filtered);
    });
}

// Quick Invest
function quickInvest(productId) {
    showInvestModal();
    setTimeout(() => {
        document.getElementById('investProduct').value = productId;
    }, 500);
}

// Invest Now
function investNow(productId) {
    showInvestModal();
    setTimeout(() => {
        document.getElementById('investProduct').value = productId;
    }, 500);
}

// Show Product Details on amount change
document.getElementById('investAmount')?.addEventListener('input', function() {
    const productId = document.getElementById('investProduct').value;
    const amount = parseFloat(this.value) || 0;
    
    if (productId) {
        database.ref(`products/${productId}`).once('value', (snapshot) => {
            const product = snapshot.val();
            
            if (amount >= product.price) {
                document.getElementById('productDetails').style.display = 'block';
                document.getElementById('productROI').textContent = product.roi + '%';
                document.getElementById('productDuration').textContent = product.duration + ' days';
                
                const expectedReturn = amount * (1 + product.roi / 100);
                document.getElementById('expectedReturn').textContent = '₹' + expectedReturn.toLocaleString();
            } else {
                document.getElementById('productDetails').style.display = 'none';
            }
        });
    }
});

// Show/hide withdrawal details based on method
document.getElementById('withdrawMethod')?.addEventListener('change', function() {
    const method = this.value;
    
    document.getElementById('bankDetails').style.display = method === 'bank' ? 'block' : 'none';
    document.getElementById('upiDetailsWithdraw').style.display = method === 'upi' ? 'block' : 'none';
});

// Show/hide UPI details in recharge
document.getElementById('rechargeMethod')?.addEventListener('change', function() {
    document.getElementById('upiDetails').style.display = this.value === 'upi' ? 'block' : 'none';
});

// Go Back
function goBack() {
    window.history.back();
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session
        window.location.href = 'login.html';
    }
}

// Edit Profile
function editProfile() {
    alert('Edit profile functionality');
}

// Change Photo
function changePhoto() {
    alert('Change photo functionality');
}

// Show Investment Info
function showInvestmentInfo() {
    alert('Investment Information:\n\n• Minimum investment: ₹100\n• Daily profit: 0.5%\n• Returns credited daily\n• Withdrawal anytime');
}

// Show Investment Stats
function showInvestmentStats() {
    alert('Investment Statistics:\n\n• Total Invested: ₹45,000\n• Current Value: ₹53,250\n• Total Profit: ₹8,250\n• Avg Returns: 18.3%');
}

// Setup Listeners
function setupListeners() {
    // Product select change
    document.getElementById('investProduct')?.addEventListener('change', function() {
        if (this.value) {
            const amount = document.getElementById('investAmount').value;
            if (amount) {
                // Trigger amount input to show details
                const event = new Event('input');
                document.getElementById('investAmount').dispatchEvent(event);
            }
        } else {
            document.getElementById('productDetails').style.display = 'none';
        }
    });
}

// Show Toast
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Format Date
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Page-specific initializations
if (window.location.pathname.includes('transactions.html')) {
    loadTransactions();
}

if (window.location.pathname.includes('investments.html')) {
    loadUserInvestments();
}

if (window.location.pathname.includes('profile.html')) {
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profilePhone').textContent = currentUser.phone;
    document.getElementById('totalInvested').textContent = `₹${currentUser.totalInvested.toLocaleString()}`;
    document.getElementById('activeInvestments').textContent = '3';
    document.getElementById('totalEarnings').textContent = `₹${currentUser.totalEarnings.toLocaleString()}`;
}

if (window.location.pathname.includes('promotion.html')) {
    document.getElementById('referralCode').textContent = currentUser.referralCode;
    document.getElementById('totalReferrals').textContent = '12';
    document.getElementById('referralEarnings').textContent = '₹2,450';
    
    // Load bonus grid
    const bonusGrid = document.getElementById('bonusGrid');
    if (bonusGrid) {
        for (let i = 1; i <= 7; i++) {
            const day = document.createElement('div');
            day.className = `bonus-day ${i <= 3 ? 'completed' : ''}`;
            day.innerHTML = `
                <span class="day">Day ${i}</span>
                <span class="amount">₹${i * 10}</span>
            `;
            bonusGrid.appendChild(day);
        }
    }
}