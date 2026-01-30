document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculatorForm');
    const resultsDiv = document.getElementById('results');
    const historyDiv = document.getElementById('historyList');

    // Load history from localStorage
    loadHistory();

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const businessName = document.getElementById('businessName').value;
        const initialCapital = parseFloat(document.getElementById('initialCapital').value);
        const monthlyExpenses = parseFloat(document.getElementById('monthlyExpenses').value);
        const expectedRevenue = parseFloat(document.getElementById('expectedRevenue').value);
        const profitMargin = parseFloat(document.getElementById('profitMargin').value) / 100;

        // Calculations
        const totalCapital = initialCapital + (monthlyExpenses * 12); // Assuming 1 year buffer
        const monthlyProfit = (expectedRevenue * profitMargin) - monthlyExpenses;
        const breakEven = initialCapital / (expectedRevenue - monthlyExpenses);
        const roi = ((monthlyProfit * 12) / initialCapital) * 100;

        // Show results section with animation
        resultsDiv.classList.remove('hidden');

        // Animate results with counting effect
        animateValue('totalCapital', 0, totalCapital, 1500, formatCurrency);
        animateValue('monthlyProfit', 0, monthlyProfit, 1500, formatCurrency);
        animateValue('breakEven', 0, breakEven, 1000, (val) => val.toFixed(1) + ' bulan');
        animateValue('roi', 0, roi, 1000, (val) => val.toFixed(2) + '%');

        // Save to history
        const calculation = {
            businessName,
            initialCapital,
            monthlyExpenses,
            expectedRevenue,
            profitMargin: profitMargin * 100,
            totalCapital,
            monthlyProfit,
            breakEven,
            roi,
            date: new Date().toLocaleString()
        };

        saveToHistory(calculation);
        loadHistory();

        // Reset form
        form.reset();
    });

    function formatCurrency(amount) {
        return 'Rp ' + amount.toLocaleString('id-ID');
    }

    // Animation function for counting numbers
    function animateValue(elementId, start, end, duration, formatter = (val) => val) {
        const element = document.getElementById(elementId);
        element.classList.add('counting');

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(start + (end - start) * easeOutQuart);

            element.textContent = formatter(currentValue);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = formatter(end);
                element.classList.remove('counting');
            }
        };

        window.requestAnimationFrame(step);
    }

    function saveToHistory(calculation) {
        let history = JSON.parse(localStorage.getItem('profitCheckHistory')) || [];
        history.unshift(calculation); // Add to beginning
        if (history.length > 10) history = history.slice(0, 10); // Keep only last 10
        localStorage.setItem('profitCheckHistory', JSON.stringify(history));
    }

    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('profitCheckHistory')) || [];
        historyDiv.innerHTML = '';

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
                    Modal Awal: ${formatCurrency(calc.initialCapital)}<br>
                    Keuntungan Bulanan: ${formatCurrency(calc.monthlyProfit)}<br>
                    ROI: ${calc.roi.toFixed(2)}%<br>
                    <small class="text-muted">${calc.date}</small>
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
                filteredHistory = history.filter(calc => new Date(calc.date) >= today);
            } else if (filter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredHistory = history.filter(calc => new Date(calc.date) >= weekAgo);
            } else if (filter === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredHistory = history.filter(calc => new Date(calc.date) >= monthAgo);
            }

            renderHistory(filteredHistory);
        });
    }
});
