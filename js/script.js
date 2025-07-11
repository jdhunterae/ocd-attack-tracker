/********************
 * DOM ELEMENTS
 ********************/
const startAttackBtn = document.getElementById('start-attack-btn');
const addMitigationBtn = document.getElementById('add-mitigation-btn');
const endAttackBtn = document.getElementById('end-attack-btn');

const noActiveAttackDisplay = document.getElementById('no-active-attack');
const activeAttackDisplay = document.getElementById('active-attack-display');
const attackStartTimeSpan = document.getElementById('attack-start-time');
const attackCurrentSeveritySpan = document.getElementById('attack-current-severity');
const attackSeverityBar = document.getElementById('attack-severity-bar');
const attackTagsSpan = document.getElementById('attack-tags');
const mitigationList = document.getElementById('mitigation-list');

const startAttackModal = document.getElementById('start-attack-modal');
const startDatetimeInput = document.getElementById('start-datetime');
const initialSeverityInput = document.getElementById('initial-severity');
const startAttackTagSelection = document.getElementById('start-attack-tag-selection');
const confirmStartAttackBtn = document.getElementById('confirm-start-attack-btn');

const addMitigationModal = document.getElementById('add-mitigation-modal');
const mitigationDatetimeInput = document.getElementById('mitigation-datetime');
const mitigationSeverityInput = document.getElementById('mitigation-severity');
const addMitigationTagSelection = document.getElementById('add-mitigation-tag-selection');
const confirmAddMitigationBtn = document.getElementById('confirm-add-mitigation-btn');

const locationTriggerTagsDiv = document.getElementById('location-trigger-tags');
const newLocationTriggerTagInput = document.getElementById('new-location-trigger-tag-input');
const addLocationTriggerTagBtn = document.getElementById('add-location-trigger-tag-btn');

const mitigationReliefTagsDiv = document.getElementById('mitigation-relief-tags');
const newMitigationReliefTagInput = document.getElementById('new-mitigation-relief-tag-input');
const addMitigationReliefTagBtn = document.getElementById('add-mitigation-relief-tag-btn');

const frequencyBarChart = document.getElementById('frequency-bar-chart');
const severityHeatmap = document.getElementById('severity-heatmap');
const topTriggersList = document.getElementById('top-triggers-list');
const topMitigationsList = document.getElementById('top-mitigations-list');

/********************
 * HELPER FUNCTIONS
 ********************/

/**
 * Saves all data to localStorage.
 */
function saveData() {
    localStorage.setItem(STORAGE_KEY_ATTACKS, JSON.stringify(attacks));
    localStorage.setItem(STORAGE_KEY_LOCATION_TRIGGERS, JSON.stringify(locationTriggers));
    localStorage.setItem(STORAGE_KEY_MITIGATIONS, JSON.stringify(mitigations));
    updateUI();
    renderVisualizations();
}

/**
 * Formats a Date object into a readable string.
 * @param {Date} date - The date to format.
 * @returns {string} Formated date string.
 */
function formatDateTime(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Opens a modal by adding the 'show class.
 * @param {string} modalId - The ID of the modal element.
 */
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

/**
 * Closes a modal by removing the 'show class.
 * @param {string} modalId - The ID of the modal element.
 */
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

/**
 * Renders tags into a given container with optional deletion functionality.
 * @param {HTMLElement} container - The DOM element to render tags into.
 * @param {string[]} tagsArray - The array of tags to display.
 * @param {function} deleteHandler - Function to call when a delete button is clicked.
 */
function renderTags(container, tagsArray, deleteHandler = null) {
    container.innerHTML = '';
    tagsArray.forEach(tag => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        badge.textContent = tag;
        if (deleteHandler) {
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'tag-badge-delete';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = () => deleteHandler(tag);
            badge.appendChild(deleteBtn);
        }
        container.appendChild(badge);
    });
}

/**
 * Renders selectable tags for modals.
 * @param {HTMLElement} container - The DOM element to render tags into.
 * @param {string[]} tagsArray - The array of tags to display.
 * @param {string[]} selectedTags - Array of currently selected tags.
 * @param {function} toggleHandler - Function to call when a tag is clicked.
 */
function renderSelectableTags(container, tagsArray, selectedTags, toggleHandler) {
    container.innerHTML = '';
    tagsArray.forEach(tag => {
        const badge = document.createElement('span');
        const isSelected = selectedTags.includes(tag);
        badge.className = `tag-badge cursor-pointer ${isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`;
        badge.textContent = tag;
        badge.onclick = () => toggleHandler(tag);
        container.appendChild(badge);
    });
}

/********************
 * ATTACK MANAGEMENT LOGIC
 ********************/

/**
 * Updates the UI based on whether an attack is active or not.
 */
function updateUI() {
    if (activeAttack) {
        noActiveAttackDisplay.classList.add('hidden');
        activeAttackDisplay.classList.remove('hidden');
        startAttackBtn.classList.add('hidden');

        attackStartTimeSpan.textContent = formatDateTime(activeAttack.startTime);
        attackCurrentSeveritySpan.textContent = activeAttack.currentSeverity;
        attackSeverityBar.style.width = `${activeAttack.currentSeverity * 10}%`;
        attackSeverityBar.style.backgroundColor = getSeverityColor(activeAttack.currentSeverity);
        attackTagsSpan.textContent = [...activeAttack.locationTriggers].join(', ');

        mitigationList.innerHTML = '';
        activeAttack.mitigationAttempts.forEach(attempt => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="font-semibold">${formatDateTime(attempt.timestamp)}:</span> ${attempt.tags.join(', ')} (Severity changed to <span class="font-bold text-amber-600">${attempt.severityAfter}</span>)`;
            mitigationList.appendChild(li);
        });
    } else {
        noActiveAttackDisplay.classList.remove('hidden');
        activeAttackDisplay.classList.add('hidden');
        startAttackBtn.classList.remove('hidden');
    }

    renderTags(locationTriggerTagsDiv, locationTriggers, deleteLocationTriggerTag);
    renderTags(mitigationReliefTagsDiv, mitigations, deleteMitigationReliefTag);
}

/**
 * Gets a color based on severity level.
 * @param {number} severity - The severity level (1-10).
 * @returns {string} Hex color code.
 */
function getSeverityColor(severity) {
    if (severity <= 3) return '#22c55e';
    if (severity <= 6) return '#f59e0b';
    return '#ef4444';
}

/**
 * Handles starting a new attack.
 */
function handleStartAttack() {
    let selectedTags = [];

    // Populate modal with current date/time and tags
    startDatetimeInput.value = new Date().toISOString().slice(0, 16);
    initialSeverityInput.value = 5; // Default severity
    renderSelectableTags(startAttackTagSelection, locationTriggers, selectedTags, (tag) => {
        if (selectedTags.includes(tag)) {
            selectedTags = selectedTags.filter(t => t !== tag);
        } else {
            selectedTags.push(tag);
        }
        renderSelectableTags(startAttackTagSelection, locationTriggers, selectedTags, (t) => {
            if (selectedTags.includes(t)) {
                selectedTags = selectedTags.filter(st => st !== t);
            } else {
                selectedTags.push(t);
            }
            renderSelectableTags(startAttackTagSelection, locationTriggers, selectedTags, arguments.callee); // Re-render with updated selection
        });
    });
    openModal('start-attack-modal');

    // Confirm button logic for start attack
    confirmStartAttackBtn.onclick = () => {
        const startTime = new Date(startDatetimeInput.value).getTime();
        const initialSeverity = parseInt(initialSeverityInput.value);

        if (isNaN(startTime) || !initialSeverity || initialSeverity < 1 || initialSeverity > 10) {
            alert('Please provide a valid start date/time and severity (1-10).'); // Using alert here for simplicity, would use custom modal in production.
            return;
        }

        activeAttack = {
            id: Date.now(), // Unique ID for the attack
            startTime: startTime,
            endTime: null,
            initialSeverity: initialSeverity,
            currentSeverity: initialSeverity,
            locationTriggers: selectedTags,
            mitigationAttempts: []
        };
        saveData();
        closeModal('start-attack-modal');
    };
}

/**
 * Handles adding a mitigation attempt to the active attack.
 */
function handleAddMitigation() {
    if (!activeAttack) return;

    let selectedMitigationTags = [];

    // Populate modal with current date/time and tags
    mitigationDatetimeInput.value = new Date().toISOString().slice(0, 16);
    mitigationSeverityInput.value = activeAttack.currentSeverity; // Default to current severity
    renderSelectableTags(addMitigationTagSelection, mitigations, selectedMitigationTags, (tag) => {
        if (selectedMitigationTags.includes(tag)) {
            selectedMitigationTags = selectedMitigationTags.filter(t => t !== tag);
        } else {
            selectedMitigationTags.push(tag);
        }
        renderSelectableTags(addMitigationTagSelection, mitigations, selectedMitigationTags, arguments.callee); // Re-render
    });
    openModal('add-mitigation-modal');

    // Confirm button logic for add mitigation
    confirmAddMitigationBtn.onclick = () => {
        const timestamp = new Date(mitigationDatetimeInput.value).getTime();
        const newSeverity = parseInt(mitigationSeverityInput.value);

        if (isNaN(timestamp) || !newSeverity || newSeverity < 1 || newSeverity > 10) {
            alert('Please provide a valid date/time and severity (1-10).'); // Using alert here for simplicity
            return;
        }

        activeAttack.mitigationAttempts.push({
            timestamp: timestamp,
            tags: selectedMitigationTags,
            severityAfter: newSeverity
        });
        activeAttack.currentSeverity = newSeverity; // Update current severity
        saveData();
        closeModal('add-mitigation-modal');
    };
}

/**
 * Handles ending the active attack.
 */
function handleEndAttack() {
    if (!activeAttack) return;

    // Confirm ending the attack (simple confirm for now, could be a modal)
    if (confirm('Are you sure you want to end this attack?')) { // Using confirm for simplicity
        activeAttack.endTime = Date.now();
        attacks.push(activeAttack); // Add to historical attacks
        activeAttack = null; // Clear active attack
        saveData();
    }
}

/********************
 * TAG MANAGEMENT LOGIC
 ********************/

/**
 * Adds a new location/trigger tag.
 */
function addLocationTriggerTag() {
    const newTag = newLocationTriggerTagInput.value.trim();
    if (newTag && !locationTriggers.includes(newTag)) {
        locationTriggers.push(newTag);
        newLocationTriggerTagInput.value = '';
        saveData();
    } else if (newTag) {
        alert('Tag already exists!');
    }
}

/**
 * Deletes a location/trigger tag.
 * @param {string} tagToDelete - The tag to delete.
 */
function deleteLocationTriggerTag(tagToDelete) {
    if (confirm(`Are you sure you want to delete "${tagToDelete}"?`)) { // Using confirm for simplicity
        locationTriggers = locationTriggers.filter(tag => tag !== tagToDelete);
        saveData();
    }
}

/**
 * Adds a new mitigation/relief tag.
 */
function addMitigationReliefTag() {
    const newTag = newMitigationReliefTagInput.value.trim();
    if (newTag && !mitigations.includes(newTag)) {
        mitigations.push(newTag);
        newMitigationReliefTagInput.value = '';
        saveData();
    } else if (newTag) {
        alert('Tag already exists!');
    }
}

/**
 * Deletes a mitigation/relief tag.
 * @param {string} tagToDelete - The tag to delete.
 */
function deleteMitigationReliefTag(tagToDelete) {
    if (confirm(`Are you sure you want to delete "${tagToDelete}"?`)) { // Using confirm for simplicity
        mitigations = mitigations.filter(tag => tag !== tagToDelete);
        saveData();
    }
}

/********************
 * DATA VISUALIZATION LOGIC
 ********************/


/**
 * Renders all data visualizations.
 */
function renderVisualizations() {
    renderFrequencyBarChart();
    renderSeverityHeatmap();
    renderTopTags();
}

/**
 * Renders the attack frequency bar chart for the last 30 days.
 */
function renderFrequencyBarChart() {
    frequencyBarChart.innerHTML = '';
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

    // Sort dates for display
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
        frequencyBarChart.appendChild(bar);
    });
}

/**
 * Renders the severity heatmap for the last 90 days.
 */
function renderSeverityHeatmap() {
    severityHeatmap.innerHTML = '';
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
        severityHeatmap.appendChild(cell);
    });
}

/**
 * Renders the top triggers and mitigations lists.
 */
function renderTopTags() {
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
    topTriggersList.innerHTML = '';
    if (sortedTriggers.length === 0) {
        topTriggersList.innerHTML = '<li class="text-gray-500">No trigger data yet.</li>';
    } else {
        sortedTriggers.forEach(([tag, count]) => {
            const li = document.createElement('li');
            li.textContent = `${tag} (${count} attacks)`;
            topTriggersList.appendChild(li);
        });
    }

    // Sort and display top mitigations
    const sortedMitigations = Array.from(mitigationCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5
    topMitigationsList.innerHTML = '';
    if (sortedMitigations.length === 0) {
        topMitigationsList.innerHTML = '<li class="text-gray-500">No mitigation data yet.</li>';
    } else {
        sortedMitigations.forEach(([tag, count]) => {
            const li = document.createElement('li');
            li.textContent = `${tag} (${count} uses)`;
            topMitigationsList.appendChild(li);
        });
    }
}

/********************
 * EVENT LISTENERS
 ********************/
startAttackBtn.addEventListener('click', handleStartAttack);
addMitigationBtn.addEventListener('click', handleAddMitigation);
endAttackBtn.addEventListener('click', handleEndAttack);

addLocationTriggerTagBtn.addEventListener('click', addLocationTriggerTag);
newLocationTriggerTagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addLocationTriggerTag();
});

addMitigationReliefTagBtn.addEventListener('click', addMitigationReliefTag);
newMitigationReliefTagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addMitigationReliefTag();
});

/********************
 * INITIAL LOAD
 ********************/
document.addEventListener('DOMContentLoaded', () => {
    // Check for an active attack that might have been left un-ended
    const storedAttacks = JSON.parse(localStorage.getItem(STORAGE_KEY_ATTACKS)) || [];
    activeAttack = storedAttacks.find(attack => attack.endTime === null) || null;

    // If an active attack was found, remove it from the historical attacks array
    // to prevent duplicates when it's eventually ended and pushed back.
    if (activeAttack) {
        attacks = storedAttacks.filter(attack => attack.id !== activeAttack.id);
    } else {
        attacks = storedAttacks;
    }

    updateUI();
    renderVisualizations();
});