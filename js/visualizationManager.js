import * as dataStorage from './dataStorage.js';

let DOM = {}; // Will store references to DOM elements

/**
 * Initializes the VisualizationManager with DOM elements.
 * @param {Object} domElements - An object containing references to DOM elements.
 */
export function init(domElements) {
    DOM = domElements;
}

/**
 * Renders all data visualizations.
 */
export function renderVisualizations() {
    renderFrequencyBarChart();
    renderSeverityHeatmap();
    renderTopTags();
}

/**
 * Renders the attack frequency bar chart for the last 30 days.
 */
function renderFrequencyBarChart() {
    DOM.frequencyBarChart.innerHTML = '';
    const attacks = dataStorage.getAttacks();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const attackCounts = new Map(); // Map<DateString, Count>

    // Initialize counts for the last 30 days
    for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        attackCounts.set(d.toISOString().split('T')[0], 0);
    }

    // Populate counts from attacks
    attacks.forEach(attack => {
        if (attack.endTime) { // Only count ended attacks
            const attackDate = new Date(attack.startTime);
            attackDate.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(today.getTime() - attackDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 30) {
                const dateString = attackDate.toISOString().split('T')[0];
                attackCounts.set(dateString, (attackCounts.get(dateString) || 0) + 1);
            }
        }
    });

    // Sort dates for display (oldest to newest)
    const sortedDates = Array.from(attackCounts.keys()).sort();

    let maxCount = 0;
    sortedDates.forEach(dateString => {
        maxCount = Math.max(maxCount, attackCounts.get(dateString));
    });

    sortedDates.forEach(dateString => {
        const count = attackCounts.get(dateString);
        const barHeight = maxCount > 0 ? (count / maxCount) * 100 : 0; // Height as percentage of max
        const bar = document.createElement('div');
        bar.className = 'bar-chart-bar';
        bar.style.height = `${Math.max(barHeight, 5)}%`; // Ensure a minimum height for visibility
        bar.title = `${dateString}: ${count} attacks`;

        const label = document.createElement('span');
        label.className = 'bar-chart-label';
        label.textContent = new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

        const value = document.createElement('span');
        value.className = 'bar-chart-value';
        value.textContent = count;

        bar.appendChild(label);
        bar.appendChild(value);
        DOM.frequencyBarChart.appendChild(bar);
    });
}

/**
 * Renders the severity heatmap for the last 90 days.
 */
function renderSeverityHeatmap() {
    DOM.severityHeatmap.innerHTML = '';
    const attacks = dataStorage.getAttacks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayData = new Map(); // Map<DateString, { totalSeverity: number, count: number }>

    // Initialize day data for the last 90 days
    for (let i = 0; i < 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dayData.set(d.toISOString().split('T')[0], { totalSeverity: 0, count: 0 });
    }

    // Aggregate data
    attacks.forEach(attack => {
        if (attack.endTime) {
            const attackDate = new Date(attack.startTime);
            attackDate.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(today.getTime() - attackDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 90) {
                const dateString = attackDate.toISOString().split('T')[0];
                const data = dayData.get(dateString);
                data.totalSeverity += attack.initialSeverity; // Using initial severity for heatmap
                data.count++;
                dayData.set(dateString, data);
            }
        }
    });

    // Render cells
    const sortedDates = Array.from(dayData.keys()).sort(); // Sort to ensure chronological order

    sortedDates.forEach(dateString => {
        const data = dayData.get(dateString);
        const avgSeverity = data.count > 0 ? data.totalSeverity / data.count : 0;

        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.title = `${dateString}: ${data.count} attacks, Avg Severity: ${avgSeverity.toFixed(1)}`;

        // Color intensity based on average severity (0-10)
        let color;
        if (avgSeverity === 0) {
            color = '#f3f4f6'; // Lightest gray for no attacks
        } else if (avgSeverity <= 2) {
            color = '#dcfce7'; // green-100
        } else if (avgSeverity <= 4) {
            color = '#a7f3d0'; // green-200
        } else if (avgSeverity <= 6) {
            color = '#fde68a'; // yellow-200
        } else if (avgSeverity <= 8) {
            color = '#fca5a5'; // red-300
        } else {
            color = '#ef4444'; // red-500
        }
        cell.style.backgroundColor = color;
        DOM.severityHeatmap.appendChild(cell);
    });
}

/**
 * Renders the top triggers and mitigations lists.
 */
function renderTopTags() {
    const attacks = dataStorage.getAttacks();
    const triggerCounts = new Map(); // Map<Tag, Count>
    const mitigationCounts = new Map(); // Map<Tag, Count>

    attacks.forEach(attack => {
        if (attack.endTime) {
            attack.locationTriggers.forEach(tag => {
                triggerCounts.set(tag, (triggerCounts.get(tag) || 0) + 1);
            });
            attack.mitigationAttempts.forEach(attempt => {
                attempt.tags.forEach(tag => {
                    mitigationCounts.set(tag, (mitigationCounts.get(tag) || 0) + 1);
                });
            });
        }
    });

    // Sort and display top triggers
    const sortedTriggers = Array.from(triggerCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5
    DOM.topTriggersList.innerHTML = '';
    if (sortedTriggers.length === 0) {
        DOM.topTriggersList.innerHTML = '<li class="text-gray-500">No trigger data yet.</li>';
    } else {
        sortedTriggers.forEach(([tag, count]) => {
            const li = document.createElement('li');
            li.textContent = `${tag} (${count} attacks)`;
            DOM.topTriggersList.appendChild(li);
        });
    }

    // Sort and display top mitigations
    const sortedMitigations = Array.from(mitigationCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5
    DOM.topMitigationsList.innerHTML = '';
    if (sortedMitigations.length === 0) {
        DOM.topMitigationsList.innerHTML = '<li class="text-gray-500">No mitigation data yet.</li>';
    } else {
        sortedMitigations.forEach(([tag, count]) => {
            const li = document.createElement('li');
            li.textContent = `${tag} (${count} uses)`;
            DOM.topMitigationsList.appendChild(li);
        });
    }
}
