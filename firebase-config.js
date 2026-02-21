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
