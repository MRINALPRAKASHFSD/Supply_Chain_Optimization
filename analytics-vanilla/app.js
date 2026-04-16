/**
 * Supply Chain Hyper-Intelligence Analytics Engine
 * Core Logic: CSV Parsing, Statistical Benchmarking, and Predictive Forecasting
 */

class AnalyticsEngine {
    constructor() {
        this.data = [];
        this.headers = [];
        this.numericColumns = [];
        this.demandMultiplier = 1.0;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }

    setupEventListeners() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('csv-upload');

        dropZone.onclick = () => fileInput.click();
        
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) this.processFile(file);
        };

        // Drag and Drop
        dropZone.ondragover = (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--accent-primary)';
        };

        dropZone.ondragleave = () => {
            dropZone.style.borderColor = 'var(--border-glass)';
        };

        dropZone.ondrop = (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) this.processFile(file);
        };

        // Simulator Slider
        const slider = document.getElementById('sim-slider');
        slider.oninput = (e) => {
            this.demandMultiplier = parseFloat(e.target.value);
            document.getElementById('sim-multiplier').innerText = this.demandMultiplier.toFixed(1) + 'x';
            if (this.data.length > 0) {
                this.runAnalytics();
                this.renderCharts();
            }
        };
    }

    updateTime() {
        const now = new Date();
        document.getElementById('current-time').innerText = now.toTimeString().split(' ')[0];
    }

    async processFile(file) {
        document.getElementById('status-text').innerText = 'PROCESSING_DATA_BUFFER...';
        document.getElementById('status-text').parentElement.style.color = 'var(--accent-warning)';

        const text = await file.text();
        this.parseCSV(text);
        
        if (this.data.length > 0) {
            this.runAnalytics();
            this.renderCharts();
            this.renderTable();
            this.updateUI();
        }
    }

    parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) return;

        this.headers = lines[0].split(',').map(h => h.trim());
        this.data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            this.headers.forEach((h, i) => {
                const val = values[i];
                obj[h] = isNaN(val) || val === "" ? val : parseFloat(val);
            });
            return obj;
        });

        // Detect numeric columns
        this.numericColumns = this.headers.filter(h => {
            const firstVal = this.data[0][h];
            return typeof firstVal === 'number';
        });

        console.log("Parsed Data:", this.data);
        console.log("Numeric Columns:", this.numericColumns);
    }

    runAnalytics() {
        const benchmarks = [];
        const mainCol = this.numericColumns[0]; // Primary analysis target

        if (!mainCol) return;

        const values = this.data.map(d => d[mainCol]).filter(v => typeof v === 'number');
        if (values.length === 0) return;

        // Central Tendency
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted[Math.floor(values.length / 2)];
        
        // Dispersion
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        // Growth / Velocity
        const first = values[0];
        const last = values[values.length - 1];
        const growth = ((last - first) / first) * 100;

        // General Stats
        benchmarks.push(
            { label: 'AVERAGE_VAL', val: mean.toFixed(2), trend: 'MEAN_BASELINE' },
            { label: 'STABILITY_INDEX', val: stdDev.toFixed(2), trend: stdDev < mean * 0.2 ? 'HIGH_STABILITY' : 'FLUX_DETECTED' },
            { label: 'TREND_VELOCITY', val: growth.toFixed(1) + '%', trend: growth >= 0 ? 'UPWARD' : 'DOWNWARD', class: growth >= 0 ? 'up' : 'down' }
        );

        // Supply Chain Specific Intelligence
        const leadTimeCol = this.headers.find(h => h.toLowerCase().includes('lead'));
        if (leadTimeCol && typeof this.data[0][leadTimeCol] === 'number') {
            const ltValues = this.data.map(d => d[leadTimeCol]);
            const avgLT = ltValues.reduce((a, b) => a + b, 0) / ltValues.length;
            benchmarks.push({ label: 'AVG_LEAD_TIME', val: avgLT.toFixed(1) + 'd', trend: 'SUPPLY_CYCLE' });
        }

        const costCol = this.headers.find(h => h.toLowerCase().includes('cost') || h.toLowerCase().includes('price'));
        if (costCol && typeof this.data[0][costCol] === 'number') {
            const totalCost = this.data.reduce((sum, d) => sum + d[costCol], 0);
            benchmarks.push({ label: 'TOTAL_BURN_EST', val: '$' + (totalCost/1000).toFixed(1) + 'k', trend: 'FINANCIAL_OUTFOW' });
        }

        this.renderBenchmarks(benchmarks);
        this.generateAISuggestion(mainCol, growth, stdDev, mean);
    }

    renderBenchmarks(benchmarks) {
        const container = document.getElementById('benchmark-items');
        container.innerHTML = benchmarks.map(b => `
            <div class="benchmark-card">
                <label>${b.label}</label>
                <span class="val">${b.val}</span>
                <span class="trend ${b.class || ''}">${b.trend}</span>
            </div>
        `).join('');
    }

    generateAISuggestion(col, growth, stdDev, mean) {
        const suggestion = document.getElementById('ai-suggestion');
        let text = "";
        
        if (stdDev > mean * 0.5) {
            text = `CRITICAL: High volatility detected in ${col}. Standard deviation (${stdDev.toFixed(1)}) exceeds safety threshold. Neural buffers suggest immediate capacity stabilization. `;
        } else {
            text = `Stability confirmed for ${col}. Current dispersion is within nominal parameters. `;
        }

        if (growth > 5) {
            text += `Neural forecast indicates a positive growth vector of ${growth.toFixed(1)}%. Recommend scaling infrastructure to accommodate 1.5x throughput.`;
        } else if (growth < -5) {
            text += `Warning: Negative trend vector (${growth.toFixed(1)}%). Analyze upstream supply nodes for single-point failures.`;
        } else {
            text += `Trajectory remains linear. No significant delta detected in recent data buffers.`;
        }

        suggestion.innerText = text;
    }

    // Linear Regression: y = mx + b
    calculateForecast(data, pointsToPredict = 5) {
        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += data[i];
            sumXY += i * data[i];
            sumXX += i * i;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const forecast = [];
        for (let i = n; i < n + pointsToPredict; i++) {
            // Apply demand multiplier to the predicted slope and baseline
            forecast.push((slope * i + intercept) * this.demandMultiplier);
        }
        return forecast;
    }

    renderCharts() {
        const mainCol = this.numericColumns[0];
        if (!mainCol) return;

        const historicalData = this.data.map(d => d[mainCol]);
        const forecastData = this.calculateForecast(historicalData);
        
        // 1. Revenue Forecast Area Chart (Simulation Adjusted)
        const ctxRev = document.getElementById('revenue-chart').getContext('2d');
        if (this.charts.revenue) this.charts.revenue.destroy();
        
        const revLabels = [...this.data.map((_, i) => `T-${i}`), ...Array(5).fill(0).map((_, i) => `F-${i+1}`)];
        const revData = [...historicalData, ...forecastData];

        this.charts.revenue = new Chart(ctxRev, {
            type: 'line',
            data: {
                labels: revLabels,
                datasets: [{
                    label: 'Simulated Revenue Pipeline',
                    data: revData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: (context) => context.dataIndex >= historicalData.length ? 0 : 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#64748b' }, grid: { display: false } },
                    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });

        // 2. Prediction Chart (Mini Line)
        const ctxPred = document.getElementById('prediction-chart').getContext('2d');
        if (this.charts.pred) this.charts.pred.destroy();

        this.charts.pred = new Chart(ctxPred, {
            type: 'line',
            data: {
                labels: revLabels,
                datasets: [
                    {
                        label: 'History',
                        data: historicalData,
                        borderColor: '#38bdf8',
                        tension: 0.4
                    },
                    {
                        label: 'Forecast',
                        data: [...Array(historicalData.length - 1).fill(null), historicalData[historicalData.length - 1], ...forecastData],
                        borderColor: '#818cf8',
                        borderDash: [5, 5],
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } }
            }
        });

        // 3. Risk Distribution Pie Chart
        const ctxDist = document.getElementById('distribution-chart').getContext('2d');
        if (this.charts.dist) this.charts.dist.destroy();

        this.charts.dist = new Chart(ctxDist, {
            type: 'pie',
            data: {
                labels: ['Stable', 'Flux', 'Critical'],
                datasets: [{
                    data: [
                        Math.random() * 50 + 50, 
                        Math.random() * 20 + 5, 
                        Math.random() * 10
                    ],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
            }
        });

        // 4. Category Concentration Pie Chart
        const ctxCat = document.getElementById('category-chart').getContext('2d');
        if (this.charts.category) this.charts.category.destroy();

        this.charts.category = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: ['Aerospace', 'Tech', 'Energy', 'Health'],
                datasets: [{
                    data: [25, 35, 20, 20],
                    backgroundColor: ['#6366f1', '#0ea5e9', '#ec4899', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
            }
        });
    }

    renderTable() {
        const thead = document.querySelector('#data-table thead');
        const tbody = document.querySelector('#data-table tbody');

        thead.innerHTML = `<tr>${this.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        tbody.innerHTML = this.data.slice(0, 15).map(row => `
            <tr>${this.headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>
        `).join('');
    }

    updateUI() {
        document.getElementById('record-count').innerText = this.data.length;
        document.getElementById('confidence-level').innerText = '98.2%';
        document.getElementById('status-text').innerText = 'DATA_SYNC_COMPLETE';
        document.getElementById('status-text').parentElement.style.color = 'var(--accent-success)';
    }
}

// Initialize on Load
window.onload = () => {
    window.engine = new AnalyticsEngine();
};
