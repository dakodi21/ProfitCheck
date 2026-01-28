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

        // Display results
        document.getElementById('totalCapital').textContent = formatCurrency(totalCapital);
        document.getElementById('monthlyProfit').textContent = formatCurrency(monthlyProfit);
        document.getElementById('breakEven').textContent = breakEven.toFixed(1) + ' bulan';
        document.getElementById('roi').textContent = roi.toFixed(2) + '%';

        resultsDiv.classList.remove('hidden');

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

    function saveToHistory(calculation) {
        let history = JSON.parse(localStorage.getItem('profitCheckHistory')) || [];
        history.unshift(calculation); // Add to beginning
        if (history.length > 10) history = history.slice(0, 10); // Keep only last 10
        localStorage.setItem('profitCheckHistory', JSON.stringify(history));
    }

    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('profitCheckHistory')) || [];
        historyDiv.innerHTML = '';

        if (history.length === 0) {
            historyDiv.innerHTML = '<p>Belum ada riwayat perhitungan.</p>';
            return;
        }

        history.forEach(calc => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <strong>${calc.businessName}</strong><br>
                Modal Awal: ${formatCurrency(calc.initialCapital)}<br>
                Keuntungan Bulanan: ${formatCurrency(calc.monthlyProfit)}<br>
                ROI: ${calc.roi.toFixed(2)}%<br>
                <small>${calc.date}</small>
            `;
            historyDiv.appendChild(item);
        });
    }
});
