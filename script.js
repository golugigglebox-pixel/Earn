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
const auth = firebase.auth();

let currentUser = null;
let userId = null;

// Auth State Observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        userId = user.uid;
        await loadUserData();
        await loadDashboardData();
    } else {
        window.location.href = 'login.html';
    }
});

// Load User Data
async function loadUserData() {
    try {
        const snapshot = await database.ref(`users/${userId}`).once('value');
        currentUser = snapshot.val() || {
            name: 'User',
            email: '',
            dailyProfit: 3250,
            totalIncome: 6500,
            investmentDays: 2,
            checkIn: 7,
            referral: 0,
            recharge: 0,
            withdraw: 0
        };
        
        updateUI();
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load Dashboard Data from Firebase
async function loadDashboardData() {
    try {
        // Load user stats from Firebase
        const statsSnapshot = await database.ref(`users/${userId}/stats`).once('value');
        const stats = statsSnapshot.val() || {};
        
        // Load products from admin
        const productsSnapshot = await database.ref('products').limitToFirst(1).once('value');
        const products = productsSnapshot.val() || {};
        
        if (Object.keys(products).length > 0) {
            const firstProduct = Object.values(products)[0];
            document.querySelector('.product-name').textContent = firstProduct.name || 'Dairymilk 1';
            document.querySelector('.product-amount').textContent = `₹ ${firstProduct.amount || 3250}`;
            document.querySelector('.price-value').textContent = `₹${firstProduct.price || 800}`;
        }
        
        // Update UI with Firebase data
        document.getElementById('dailyProfitAmount').textContent = `₹ ${stats.dailyProfit || 3250}`;
        document.getElementById('totalIncome').textContent = `₹ ${stats.totalIncome || 6500}`;
        document.getElementById('investmentDays').textContent = stats.investmentDays || 2;
        document.getElementById('dailyProfit').textContent = stats.checkIn || 7;
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Update UI
function updateUI() {
    if (!currentUser) return;
    
    // Update stats
    document.getElementById('dailyProfit').textContent = currentUser.checkIn || 7;
    document.getElementById('referral').textContent = currentUser.referral || 0;
    document.getElementById('recharge').textContent = currentUser.recharge || 0;
    document.getElementById('withdraw').textContent = currentUser.withdraw || 0;
    
    // Update user display
    const userIdDisplay = userId ? userId.slice(-4) : '5541';
    document.getElementById('userDisplay').textContent = `User ${userIdDisplay} ******`;
    
    // Update date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('currentDate').textContent = `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Check-in Function
async function handleCheckIn() {
    try {
        const today = new Date().toDateString();
        
        // Update check-in count in Firebase
        const updates = {
            checkIn: (currentUser.checkIn || 7) + 1
        };
        
        await database.ref(`users/${userId}`).update(updates);
        currentUser.checkIn = updates.checkIn;
        
        document.getElementById('dailyProfit').textContent = updates.checkIn;
        showToast('Check-in successful!');
        
        // Add to activity
        await database.ref('activity').push({
            user: currentUser.name || 'User',
            action: 'Checked in',
            time: 'Just now',
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('Error during check-in:', error);
        showToast('Error during check-in');
    }
}

// Investment Form
document.getElementById('investForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const product = document.getElementById('investProduct').value;
    const amount = parseFloat(document.getElementById('investAmount').value);
    
    try {
        // Create investment in Firebase
        await database.ref('investments').push({
            userId: userId,
            userName: currentUser.name || 'User',
            productName: product,
            amount: amount,
            status: 'active',
            date: new Date().toISOString(),
            timestamp: Date.now()
        });
        
        // Update user stats
        const updates = {
            totalInvested: (currentUser.totalInvested || 0) + amount
        };
        await database.ref(`users/${userId}`).update(updates);
        
        showToast('Investment successful!');
        closeModal('investModal');
        
        // Add to activity
        await database.ref('activity').push({
            user: currentUser.name || 'User',
            action: `Invested ₹${amount} in ${product}`,
            time: 'Just now',
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('Error making investment:', error);
        showToast('Error making investment');
    }
});

// Modal Functions
function showInvestModal() {
    document.getElementById('investModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Toast Notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};

// Add click handlers for stat boxes
document.querySelectorAll('.stat-box').forEach((box, index) => {
    box.addEventListener('click', () => {
        const actions = ['checkin', 'referral', 'recharge', 'withdraw'];
        const action = actions[index];
        
        switch(action) {
            case 'checkin':
                handleCheckIn();
                break;
            case 'referral':
                window.location.href = 'referral.html';
                break;
            case 'recharge':
                window.location.href = 'recharge.html';
                break;
            case 'withdraw':
                window.location.href = 'withdraw.html';
                break;
        }
    });
});
