import * as dataStorage from './dataStorage.js';
import * as uiManager from './uiManager.js';
import * as modalManager from './modalManager.js';
import * as tagManager from './tagManager.js';
import * as attackManager from './attackManager.js';
import * as visualizationManager from './visualizationManager.js';

// --- DOM Elements (Centralized) ---
const DOM = {
    // Attack Tracking Section
    startAttackBtn: document.getElementById('start-attack-btn'),
    addMitigationBtn: document.getElementById('add-mitigation-btn'),
    endAttackBtn: document.getElementById('end-attack-btn'),
    noActiveAttackDisplay: document.getElementById('no-active-attack'),
    activeAttackDisplay: document.getElementById('active-attack-display'),
    attackStartTimeSpan: document.getElementById('attack-start-time'),
    attackCurrentSeveritySpan: document.getElementById('attack-current-severity'),
    attackSeverityBar: document.getElementById('attack-severity-bar'),
    attackTagsSpan: document.getElementById('attack-tags'),
    mitigationList: document.getElementById('mitigation-list'),

    // Start Attack Modal
    startAttackModal: document.getElementById('start-attack-modal'),
    startDatetimeInput: document.getElementById('start-datetime'),
    initialSeverityInput: document.getElementById('initial-severity'),
    // Updated tag selection elements for Start Attack Modal
    startAttackTagInput: document.getElementById('start-attack-tag-input'),
    addStartAttackTagBtn: document.getElementById('add-start-attack-tag-btn'),
    startAttackSelectedTags: document.getElementById('start-attack-selected-tags'),
    startAttackSuggestedTags: document.getElementById('start-attack-suggested-tags'),
    confirmStartAttackBtn: document.getElementById('confirm-start-attack-btn'),

    // Add Mitigation Modal
    addMitigationModal: document.getElementById('add-mitigation-modal'),
    mitigationDatetimeInput: document.getElementById('mitigation-datetime'),
    mitigationSeverityInput: document.getElementById('mitigation-severity'),
    // Updated tag selection elements for Add Mitigation Modal
    addMitigationTagInput: document.getElementById('add-mitigation-tag-input'),
    addMitigationTagBtn: document.getElementById('add-mitigation-tag-btn'),
    addMitigationSelectedTags: document.getElementById('add-mitigation-selected-tags'),
    addMitigationSuggestedTags: document.getElementById('add-mitigation-suggested-tags'),
    confirmAddMitigationBtn: document.getElementById('confirm-add-mitigation-btn'),

    // Tag Management Section
    locationTriggerTagsDiv: document.getElementById('location-trigger-tags'),
    newLocationTriggerTagInput: document.getElementById('new-location-trigger-tag-input'),
    addLocationTriggerTagBtn: document.getElementById('add-location-trigger-tag-btn'),
    mitigationReliefTagsDiv: document.getElementById('mitigation-relief-tags'),
    newMitigationReliefTagInput: document.getElementById('new-mitigation-relief-tag-input'),
    addMitigationReliefTagBtn: document.getElementById('add-mitigation-relief-tag-btn'),

    // Data Visualization Section
    frequencyBarChart: document.getElementById('frequency-bar-chart'),
    severityHeatmap: document.getElementById('severity-heatmap'),
    topTriggersList: document.getElementById('top-triggers-list'),
    topMitigationsList: document.getElementById('top-mitigations-list'),

    // Custom Alert Modal
    customAlertModal: document.getElementById('custom-alert-modal'),
    customAlertTitle: document.getElementById('custom-alert-title'),
    customAlertMessage: document.getElementById('custom-alert-message'),
    customAlertOkBtn: document.getElementById('custom-alert-ok-btn'),
    customAlertCancelBtn: document.getElementById('custom-alert-cancel-btn'),
};

// --- Debugging: Check if all DOM elements were found ---
for (const key in DOM) {
    if (DOM[key] === null) {
        console.error(`ERROR: DOM element with ID '${key}' not found! Please check index.html.`);
    }
}
console.log('DOM elements collected:', DOM);


// --- Initialization Function ---
function initializeApp() {
    // Initialize data from localStorage
    dataStorage.loadData();

    // Pass DOM elements and initial data to managers that need them
    uiManager.init(DOM);
    modalManager.init(DOM);
    tagManager.init(DOM);
    attackManager.init(DOM);
    visualizationManager.init(DOM);

    // Set up event listeners
    setupEventListeners();

    // Initial UI update and visualization render
    uiManager.updateUI();
    visualizationManager.renderVisualizations();
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Attack tracking buttons
    DOM.startAttackBtn.addEventListener('click', () => attackManager.handleStartAttack());
    DOM.addMitigationBtn.addEventListener('click', () => attackManager.handleAddMitigation());
    DOM.endAttackBtn.addEventListener('click', () => attackManager.handleEndAttack());

    // Tag management buttons and inputs (for the main tag management section)
    DOM.addLocationTriggerTagBtn.addEventListener('click', () => tagManager.addLocationTriggerTag());
    DOM.newLocationTriggerTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') tagManager.addLocationTriggerTag();
    });
    DOM.addMitigationReliefTagBtn.addEventListener('click', () => tagManager.addMitigationReliefTag());
    DOM.newMitigationReliefTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') tagManager.addMitigationReliefTag();
    });

    // New Tag Input/Add for Modals
    DOM.addStartAttackTagBtn.addEventListener('click', () => attackManager.handleAddNewStartTagFromModal());
    DOM.startAttackTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attackManager.handleAddNewStartTagFromModal();
    });

    DOM.addMitigationTagBtn.addEventListener('click', () => attackManager.handleAddNewMitigationTagFromModal());
    DOM.addMitigationTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attackManager.handleAddNewMitigationTagFromModal();
    });


    // Modal close buttons (using event delegation for simplicity)
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const modalId = event.target.dataset.modalId;
            if (modalId) {
                modalManager.closeModal(modalId);
            }
        });
    });

    // Close modal when clicking outside (on the modal overlay itself)
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modalManager.closeModal(modal.id);
            }
        });
    });
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);
