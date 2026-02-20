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

// Mock user data (replace with actual auth)
const currentUser = {
    id: 'user123',
    name: 'John Doe',
    displayId: '5541',
    dailyProfit: 3250,
    totalIncome: 6500,
    investmentDays: 2,
    quickInvest: 800
};

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadProducts();
    setupEventListeners();
});

function initializeDashboard() {
    // Update stats
    document.getElementById('dailyProfit').textContent = `₹ ${currentUser.dailyProfit.toLocaleString()}`;
    document.getElementById('totalIncome').textContent = `₹ ${currentUser.totalIncome.toLocaleString()}`;
    document.getElementById('investmentDays').textContent = currentUser.investmentDays;
    document.getElementById('quickInvestAmount').textContent = `₹${currentUser.quickInvest}`;
    
    // Set user display
    document.getElementById('userDisplay').textContent = `User ${currentUser.displayId} ******`;
    
    // Set current date
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toTimeString().split(' ')[0].substring(0,5);
    document.getElementById('currentDate').textContent = `${formattedDate} ${formattedTime}`;
}

function loadProducts() {
    const slider = document.getElementById('newProductsSlider');
    
    // Sample products (replace with Firebase data)
    const products = [
        { name: 'Dairymilk 1', price: 1000, roi: 12 },
        { name: 'Dairymilk 2', price: 2000, roi: 15 },
        { name: 'Dairymilk 3', price: 5000, roi: 18 },
        { name: 'Dairymilk 4', price: 10000, roi: 20 }
    ];
    
    slider.innerHTML = '';
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <h3>${product.name}</h3>
            <div class="product-price">₹${product.price}</div>
            <div class="product-roi">${product.roi}% ROI</div>
            <button class="product-btn" onclick="investInProduct('${product.name}', ${product.price})">
                Invest Now
            </button>
        `;
        slider.appendChild(card);
    });
}

// Check-in functionality
document.getElementById('checkinBtn')?.addEventListener('click', function() {
    const today = new Date().toDateString();
    const lastCheckin = localStorage.getItem('lastCheckin');
    
    if (lastCheckin === today) {
        showToast('Already checked in today!');
        return;
    }
    
    localStorage.setItem('lastCheckin', today);
    
    // Update streak
    let streak = parseInt(localStorage.getItem('checkinStreak') || '0');
    streak++;
    localStorage.setItem('checkinStreak', streak);
    
    // Update badge
    document.querySelector('.badge').textContent = streak;
    
    showToast(`Check-in successful! Day ${streak} streak!`);
});

// Show modals
function showRecharge() {
    showToast('Recharge feature coming soon!');
}

function showWithdraw() {
    showToast('Withdraw feature coming soon!');
}

function showInvestModal() {
    showToast('Investment feature coming soon!');
}

function investInProduct(name, price) {
    showToast(`Investing ₹${price} in ${name}`);
}

// Toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Add toast styles
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--card-bg);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-size: 0.9rem;
        z-index: 2000;
        animation: slideUp 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translate(-50%, 100%);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
`;
document.head.appendChild(style);

function setupEventListeners() {
    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    };
}
