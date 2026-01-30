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
        const key = `history_${this.userId}`;
        let history = JSON.parse(localStorage.getItem(key)) || [];
        history.unshift(result); // Add to beginning
        if (history.length > 10) history = history.slice(0, 10); // Keep only last 10
        localStorage.setItem(key, JSON.stringify(history));
    }

    getHistory() {
        const key = `history_${this.userId}`;
        const history = localStorage.getItem(key);
        return history ? JSON.parse(history) : [];
    }

    getLastResult() {
        const history = this.getHistory();
        return history.length > 0 ? history[0] : null;
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
        setTimeout(() => {
            registerModal.hide();
            loginModal.show();
        }, 1500);
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

// Load Main App
function loadMainApp(user) {
    calculator = new Calculator(user.id);
    loginModal.hide();
    registerModal.hide();

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

    // Create calculator instance if not exists (for non-logged-in users)
    if (!calculator) {
        calculator = new Calculator('guest');
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

// Page Navigation System
function showPage(pageName) {
    // Check authentication for protected pages
    if ((pageName === 'history' || pageName === 'user') && !auth.getCurrentUser()) {
        alert('Silakan login terlebih dahulu untuk mengakses halaman ini.');
        loginModal.show();
        return;
    }

    // Hide all sections
    const sections = ['home', 'features', 'calculator', 'results', 'history', 'user'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.classList.add('hidden');
        }
    });

    // Show selected section
    const targetSection = document.getElementById(pageName);
    if (targetSection) {
        targetSection.classList.remove('hidden');

        // Load page-specific content
        if (pageName === 'history') {
            displayHistory();
        } else if (pageName === 'user') {
            const user = auth.getCurrentUser();
            if (user) {
                loadUserDashboard(user);
            }
        }
    }

    // Update navigation active state
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigation event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Page navigation
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            showPage(page);
        });
    });

    // Show home page by default
    showPage('home');
});

// Display History
function displayHistory() {
    const user = auth.getCurrentUser();
    if (!user) {
        document.getElementById('historyList').innerHTML = '<p>Silakan login untuk melihat riwayat perhitungan.</p>';
        return;
    }

    if (!calculator) {
        calculator = new Calculator(user.id);
    }

    const history = calculator.getHistory();
    const historyDiv = document.getElementById('historyList');

    // Add filter form
    const filterForm = `
        <div class="mb-4">
            <label for="historyFilter" class="form-label fw-semibold">Filter Riwayat:</label>
            <select class="form-select" id="historyFilter">
                <option value="all">Semua</option>
                <option value="today">Hari Ini</option>
                <option value="week">7 Hari Terakhir</option>
                <option value="month">30 Hari Terakhir</option>
            </select>
        </div>
    `;

    historyDiv.innerHTML = filterForm;

    if (history.length === 0) {
        historyDiv.innerHTML += '<p class="text-muted text-center">Belum ada riwayat perhitungan.</p>';
        return;
    }

    // Display history items
    const historyContainer = document.createElement('div');
    historyContainer.id = 'historyItems';
    historyDiv.appendChild(historyContainer);

    function renderHistory(filteredHistory) {
        historyContainer.innerHTML = '';
        filteredHistory.forEach(calc => {
            const item = document.createElement('div');
            item.className = 'history-item mb-3 p-3 border rounded';
            item.innerHTML = `
                <strong>${calc.businessName}</strong><br>
                Modal Awal: ${formatRupiah(calc.initialCapital)}<br>
                Keuntungan Bulanan: ${formatRupiah(calc.monthlyProfit)}<br>
                ROI: ${calc.roi.toFixed(2)}%<br>
                <small class="text-muted">${new Date(calc.timestamp).toLocaleString('id-ID')}</small>
            `;
            historyContainer.appendChild(item);
        });
    }

    // Initial render
    renderHistory(history);

    // Filter event listener
    document.getElementById('historyFilter').addEventListener('change', (e) => {
        const filter = e.target.value;
        const now = new Date();
        let filteredHistory = history;

        if (filter === 'today') {
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filteredHistory = history.filter(calc => new Date(calc.timestamp) >= today);
        } else if (filter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredHistory = history.filter(calc => new Date(calc.timestamp) >= weekAgo);
        } else if (filter === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredHistory = history.filter(calc => new Date(calc.timestamp) >= monthAgo);
        }

        renderHistory(filteredHistory);
    });
}

// Load User Dashboard
function loadUserDashboard(user) {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userJoinDate').textContent = new Date(user.createdAt).toLocaleDateString('id-ID');
    document.getElementById('totalCalculations').textContent = calculator ? calculator.getHistory().length : 0;
    document.getElementById('lastLogin').textContent = new Date().toLocaleString('id-ID');
}

// Calculator works without login for now - authentication is optional
// Users can use the calculator immediately
