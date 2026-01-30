// Utility Functions
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

function hashPassword(password) {
    // Simple hash function (in production, use proper encryption)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
    alertDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

// Authentication System
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = null;
    }

    register(name, email, password) {
        // Check if email already exists
        if (this.users.find(u => u.email === email)) {
            return { success: false, message: 'Email sudah terdaftar!' };
        }

        const user = {
            id: Date.now(),
            name: name,
            email: email,
            password: hashPassword(password),
            createdAt: new Date().toISOString()
        };

        this.users.push(user);
        localStorage.setItem('users', JSON.stringify(this.users));
        return { success: true, message: 'Registrasi berhasil!' };
    }

    login(email, password, remember = false) {
        const user = this.users.find(u =>
            u.email === email && u.password === hashPassword(password)
        );

        if (!user) {
            return { success: false, message: 'Email atau password salah!' };
        }

        this.currentUser = user;
        const session = {
            userId: user.id,
            name: user.name,
            email: user.email,
            remember: remember
        };

        localStorage.setItem('session', JSON.stringify(session));
        return { success: true, user: user };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('session');
    }

    checkSession() {
        const session = JSON.parse(localStorage.getItem('session'));
        if (session && session.remember) {
            const user = this.users.find(u => u.id === session.userId);
            if (user) {
                this.currentUser = user;
                return user;
            }
        }
        return null;
    }

    getCurrentUser() {
        const session = JSON.parse(localStorage.getItem('session'));
        if (session) {
            return this.users.find(u => u.id === session.userId);
        }
        return null;
    }
}

// Calculator System
class Calculator {
    constructor(userId) {
        this.userId = userId;
    }

    calculate(data) {
        const initialCapital = parseFloat(data.initialCapital);
        const monthlyExpenses = parseFloat(data.monthlyExpenses);
        const expectedRevenue = parseFloat(data.expectedRevenue);
        const profitMargin = parseFloat(data.profitMargin) / 100;

        // Calculations
        const totalCapital = initialCapital + (monthlyExpenses * 12); // Assuming 1 year buffer
        const monthlyProfit = (expectedRevenue * profitMargin) - monthlyExpenses;
        const breakEven = initialCapital / (expectedRevenue - monthlyExpenses);
        const roi = ((monthlyProfit * 12) / initialCapital) * 100;

        const result = {
            businessName: data.businessName,
            initialCapital,
            monthlyExpenses,
            expectedRevenue,
            profitMargin: profitMargin * 100,
            totalCapital,
            monthlyProfit,
            breakEven,
            roi,
            timestamp: new Date().toISOString()
        };

        this.saveResult(result);
        return result;
    }

    saveResult(result) {
        const key = `calculation_${this.userId}`;
        localStorage.setItem(key, JSON.stringify(result));
    }

    getLastResult() {
        const key = `calculation_${this.userId}`;
        const result = localStorage.getItem(key);
        return result ? JSON.parse(result) : null;
    }
}

// Initialize
const auth = new AuthSystem();
let calculator = null;

// Modal instances
let loginModal = null;
let registerModal = null;

// Initialize modals
window.addEventListener('DOMContentLoaded', () => {
    loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    registerModal = new bootstrap.Modal(document.getElementById('registerModal'));

    const user = auth.checkSession();
    if (user) {
        // User is logged in, show calculator directly
        document.getElementById('navLogin').style.display = 'none';
        document.getElementById('navRegister').style.display = 'none';
        // Add logout option to nav
        const nav = document.querySelector('.navbar-nav');
        const logoutLi = document.createElement('li');
        logoutLi.className = 'nav-item';
        logoutLi.innerHTML = '<a class="nav-link" href="#" id="navLogout">Logout</a>';
        nav.appendChild(logoutLi);
        document.getElementById('navLogout').addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin logout?')) {
                auth.logout();
                location.reload();
            }
        });
    }

    // Navigation event listeners
    document.getElementById('navLogin').addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.show();
    });

    document.getElementById('navRegister').addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.show();
    });

    document.getElementById('heroRegister').addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.show();
    });
});

// Register Form
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    const result = auth.register(name, email, password);

    if (result.success) {
        showAlert('registerAlert', result.message + ' Silakan login.', 'success');
        setTimeout(() => showPage('loginPage'), 1500);
    } else {
        showAlert('registerAlert', result.message, 'danger');
    }
});

// Login Form
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;

    const result = auth.login(email, password, remember);

    if (result.success) {
        loadMainApp(result.user);
    } else {
        showAlert('loginAlert', result.message, 'danger');
    }
});

// Navigation Links
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.hide();
    loginModal.show();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.hide();
    registerModal.show();
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        auth.logout();
        showPage('loginPage');
        document.getElementById('calculatorForm').reset();
        document.getElementById('resultSection').classList.add('hidden');
    }
});

// Load Main App
function loadMainApp(user) {
    document.getElementById('userName').textContent = user.name;
    calculator = new Calculator(user.id);
    showPage('mainApp');

    // Load last calculation if exists
    const lastResult = calculator.getLastResult();
    if (lastResult) {
        displayResult(lastResult);
    }
}

// Calculator Form
document.getElementById('calculatorForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
        businessName: document.getElementById('businessName').value,
        initialCapital: document.getElementById('initialCapital').value,
        monthlyExpenses: document.getElementById('monthlyExpenses').value,
        expectedRevenue: document.getElementById('expectedRevenue').value,
        profitMargin: document.getElementById('profitMargin').value
    };

    // Validation
    for (let key in data) {
        if (key !== 'businessName' && (!data[key] || parseFloat(data[key]) < 0)) {
            alert('Semua field harus diisi dengan nilai yang valid!');
            return;
        }
    }

    const result = calculator.calculate(data);
    displayResult(result);

    // Reset form
    document.getElementById('calculatorForm').reset();
});

// Display Result
function displayResult(result) {
    document.getElementById('totalCapital').textContent = formatRupiah(result.totalCapital);
    document.getElementById('monthlyProfit').textContent = formatRupiah(result.monthlyProfit);
    document.getElementById('breakEven').textContent = result.breakEven.toFixed(1) + ' bulan';
    document.getElementById('roi').textContent = result.roi.toFixed(2) + '%';

    document.getElementById('results').classList.remove('hidden');

    // Smooth scroll to result
    setTimeout(() => {
        document.getElementById('results').scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }, 100);
}

// Reset Button
document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin mereset form?')) {
        document.getElementById('calculatorForm').reset();
        document.getElementById('resultSection').classList.add('hidden');
    }
});
