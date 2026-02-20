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
const auth = firebase.auth();
const database = firebase.database();

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User logged in:', user.uid);
        
        // Check if on login/register page, redirect to dashboard
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'login.html' || currentPage === 'register.html') {
            window.location.href = 'dashboard.html';
        }
    } else {
        // User is signed out
        console.log('User logged out');
        
        // Check if on protected page, redirect to login
        const protectedPages = ['dashboard.html', 'products.html', 'profile.html', 'investments.html', 'transactions.html', 'promotion.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Forgot password form handler
    const forgotForm = document.getElementById('forgotPasswordForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Phone login form handler
    const phoneForm = document.getElementById('phoneLoginForm');
    if (phoneForm) {
        phoneForm.addEventListener('submit', handlePhoneLogin);
    }
    
    // Password strength checker
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    // Password confirmation checker
    const confirmInput = document.getElementById('confirmPassword');
    if (confirmInput) {
        confirmInput.addEventListener('input', checkPasswordMatch);
    }
});

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    const loginBtn = document.getElementById('loginBtn');
    
    // Show loading state
    setButtonLoading(loginBtn, true);
    
    try {
        // Set persistence based on remember me
        const persistence = rememberMe 
            ? firebase.auth.Auth.Persistence.LOCAL 
            : firebase.auth.Auth.Persistence.SESSION;
        
        await auth.setPersistence(persistence);
        
        // Sign in
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        // Update last login
        await database.ref(`users/${userCredential.user.uid}`).update({
            lastLogin: new Date().toISOString()
        });
        
        showToast('Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        handleAuthError(error);
        setButtonLoading(loginBtn, false);
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const referralCode = document.getElementById('referralCode')?.value;
    const terms = document.getElementById('terms')?.checked;
    const registerBtn = document.getElementById('registerBtn');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }
    
    // Validate password strength
    if (!isPasswordStrong(password)) {
        showToast('Password is too weak!', 'error');
        return;
    }
    
    // Validate terms
    if (!terms) {
        showToast('Please accept terms and conditions', 'warning');
        return;
    }
    
    setButtonLoading(registerBtn, true);
    
    try {
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update profile
        await user.updateProfile({
            displayName: name
        });
        
        // Generate referral code
        const userReferralCode = generateReferralCode(name);
        
        // Save user data to database
        const userData = {
            uid: user.uid,
            name: name,
            email: email,
            phone: phone,
            referralCode: userReferralCode,
            referredBy: referralCode || null,
            balance: 0,
            totalInvested: 0,
            totalEarnings: 0,
            dailyProfit: 0,
            investmentDays: 0,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            emailVerified: user.emailVerified,
            status: 'active'
        };
        
        await database.ref(`users/${user.uid}`).set(userData);
        
        // If referred, update referrer's stats
        if (referralCode) {
            await handleReferral(referralCode, user.uid);
        }
        
        showToast('Account created successfully!', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Registration error:', error);
        handleAuthError(error);
        setButtonLoading(registerBtn, false);
    }
}

// Handle Forgot Password
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    setButtonLoading(submitBtn, true);
    
    try {
        await auth.sendPasswordResetEmail(email);
        showToast('Password reset email sent! Check your inbox.', 'success');
        closeModal('forgotPasswordModal');
    } catch (error) {
        console.error('Password reset error:', error);
        handleAuthError(error);
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

// Handle Phone Login
let confirmationResult;
let recaptchaVerifier;

async function handlePhoneLogin(e) {
    e.preventDefault();
    
    const phoneNumber = document.getElementById('phoneNumber').value;
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
        showToast('Please enter a valid phone number', 'error');
        return;
    }
    
    setButtonLoading(sendOtpBtn, true);
    
    try {
        // Initialize reCAPTCHA
        if (!recaptchaVerifier) {
            recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sendOtpBtn', {
                'size': 'invisible'
            });
        }
        
        // Send OTP
        confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
        
        // Show OTP section
        document.getElementById('otpSection').style.display = 'block';
        document.getElementById('phoneLoginForm').style.display = 'none';
        
        showToast('OTP sent successfully!', 'success');
        
    } catch (error) {
        console.error('Phone login error:', error);
        handleAuthError(error);
    } finally {
        setButtonLoading(sendOtpBtn, false);
    }
}

// Verify OTP
document.getElementById('verifyOtpBtn')?.addEventListener('click', async function() {
    const otpInputs = document.querySelectorAll('.otp-input');
    const otp = Array.from(otpInputs).map(input => input.value).join('');
    const verifyBtn = this;
    
    if (otp.length !== 6) {
        showToast('Please enter complete OTP', 'warning');
        return;
    }
    
    setButtonLoading(verifyBtn, true);
    
    try {
        const result = await confirmationResult.confirm(otp);
        const user = result.user;
        
        // Check if user exists in database
        const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
        
        if (!userSnapshot.exists()) {
            // New user - redirect to registration for additional info
            localStorage.setItem('tempPhoneUser', JSON.stringify({
                uid: user.uid,
                phone: user.phoneNumber
            }));
            window.location.href = 'register.html?phone=true';
        } else {
            // Existing user - redirect to dashboard
            window.location.href = 'dashboard.html';
        }
        
    } catch (error) {
        console.error('OTP verification error:', error);
        showToast('Invalid OTP. Please try again.', 'error');
        setButtonLoading(verifyBtn, false);
    }
});

// Login with Google
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if user exists in database
        const userSnapshot = await database.ref(`users/${user.uid}`).once('value');
        
        if (!userSnapshot.exists()) {
            // Create new user record
            const userData = {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                phone: user.phoneNumber || '',
                referralCode: generateReferralCode(user.displayName),
                balance: 0,
                totalInvested: 0,
                totalEarnings: 0,
                dailyProfit: 0,
                investmentDays: 0,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                emailVerified: user.emailVerified,
                status: 'active'
            };
            
            await database.ref(`users/${user.uid}`).set(userData);
        } else {
            // Update last login
            await database.ref(`users/${user.uid}`).update({
                lastLogin: new Date().toISOString()
            });
        }
        
        showToast('Login successful!', 'success');
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Google login error:', error);
        handleAuthError(error);
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        showToast('Logged out successfully', 'success');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
}

// Handle Referral
async function handleReferral(referralCode, newUserId) {
    try {
        // Find user with this referral code
        const usersSnapshot = await database.ref('users').orderByChild('referralCode').equalTo(referralCode).once('value');
        
        if (usersSnapshot.exists()) {
            const referrerData = Object.values(usersSnapshot.val())[0];
            const referrerId = Object.keys(usersSnapshot.val())[0];
            
            // Update referrer's referrals
            await database.ref(`users/${referrerId}/referrals`).push({
                userId: newUserId,
                date: new Date().toISOString(),
                bonus: 100 // Initial referral bonus
            });
            
            // Add bonus to referrer's balance
            await database.ref(`users/${referrerId}`).update({
                balance: firebase.database.ServerValue.increment(100),
                totalEarnings: firebase.database.ServerValue.increment(100)
            });
            
            // Create transaction for bonus
            await database.ref('transactions').push({
                userId: referrerId,
                type: 'referral_bonus',
                amount: 100,
                description: 'Referral bonus for new user',
                status: 'completed',
                date: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error handling referral:', error);
    }
}

// Check Password Strength
function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthBars = document.querySelectorAll('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    // Calculate strength
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;
    
    // Update bars
    strengthBars.forEach((bar, index) => {
        if (index < strength) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }
    });
    
    // Update text
    if (password.length === 0) {
        strengthText.textContent = 'Too weak';
    } else if (strength <= 2) {
        strengthText.textContent = 'Weak';
    } else if (strength <= 3) {
        strengthText.textContent = 'Medium';
    } else if (strength <= 4) {
        strengthText.textContent = 'Strong';
    } else {
        strengthText.textContent = 'Very Strong';
    }
}

function isPasswordStrong(password) {
    return password.length >= 8 && 
           password.match(/[a-z]+/) && 
           password.match(/[A-Z]+/) && 
           password.match(/[0-9]+/);
}

// Check Password Match
function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    if (confirm.length > 0) {
        if (password === confirm) {
            confirmInput.style.borderColor = '#10b981';
        } else {
            confirmInput.style.borderColor = '#ef4444';
        }
    }
}

// Generate Referral Code
function generateReferralCode(name) {
    const prefix = name.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
}

// Validate Phone Number
function validatePhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Handle Auth Errors
function handleAuthError(error) {
    let message = 'An error occurred. Please try again.';
    
    switch (error.code) {
        case 'auth/invalid-email':
            message = 'Invalid email address';
            break;
        case 'auth/user-disabled':
            message = 'This account has been disabled';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password';
            break;
        case 'auth/email-already-in-use':
            message = 'Email already in use';
            break;
        case 'auth/weak-password':
            message = 'Password is too weak';
            break;
        case 'auth/network-request-failed':
            message = 'Network error. Check your connection';
            break;
        case 'auth/too-many-requests':
            message = 'Too many attempts. Try again later';
            break;
        case 'auth/popup-closed-by-user':
            message = 'Login popup was closed';
            break;
    }
    
    showToast(message, 'error');
}

// Toggle Password Visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.currentTarget;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// OTP Input Navigation
function moveToNext(current, nextIndex) {
    if (current.value.length === 1) {
        const next = document.querySelector(`.otp-input:nth-child(${nextIndex + 1})`);
        if (next) {
            next.focus();
        }
    }
}

// Show Forgot Password Modal
function showForgotPassword() {
    openModal('forgotPasswordModal');
}

// Show Phone Login Modal
function showPhoneLogin() {
    openModal('phoneLoginModal');
}

// Show Terms
function showTerms() {
    alert('Terms of Service would be displayed here');
}

// Show Privacy
function showPrivacy() {
    alert('Privacy Policy would be displayed here');
}

// Resend OTP
async function resendOtp() {
    if (confirmationResult) {
        try {
            await confirmationResult.confirm(); // This will resend
            showToast('OTP resent successfully!', 'success');
        } catch (error) {
            console.error('Resend OTP error:', error);
            showToast('Error resending OTP', 'error');
        }
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Set Button Loading State
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        const originalText = button.innerHTML;
        button.dataset.originalText = originalText;
        button.innerHTML = '<span class="spinner"></span> Loading...';
    } else {
        button.disabled = false;
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
        }
    }
}

// Show Toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
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
}