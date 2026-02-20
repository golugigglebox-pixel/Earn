// Check authentication
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load user data from database
    loadUserData(user.uid);
});

// Load user data from database
async function loadUserData(uid) {
    try {
        const snapshot = await database.ref(`users/${uid}`).once('value');
        const userData = snapshot.val();
        
        if (userData) {
            // Set current user
            window.currentUser = {
                id: uid,
                ...userData
            };
            
            // Update UI with user data
            updateUserStats();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}