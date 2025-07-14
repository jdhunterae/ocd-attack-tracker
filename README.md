# OCD Attack Tracker

A simple, client-side web application designed to help individuals track panic, anxiety, and OCD attacks. This tool allows users to record attack details, identify triggers and mitigations, and visualize data through basic graphs and heatmaps to better understand patterns and improve mental well-being.

## Live Demo

Experience the application live here: [jdunterae.github.io/ocd-attack-tracker](https://jdunterae.github.io/ocd-attack-tracker)

## GitHub Repository

You can find the source code for this project on GitHub: [github.com/jdhunterae/ocd-attack-tracker](https://github.com/jdhunterae/ocd-attack-tracker)

## Features

- Attack Tracking:
  - Start Attack: Record the start time, initial severity (1-10), and associate custom location/trigger tags.
  - Mitigation Attempts: While an attack is active, log mitigation efforts (e.g., "drinking tea," "deep breathing") along with the time and the severity level after the attempt.
  - End Attack: Mark an attack as complete, saving it to your historical data.
  - Real-time Status: View the current active attack's details, including its duration, current severity, and a list of recorded mitigation attempts.
- Custom Tag Management:
  - Location/Trigger Tags: Add and remove personalized tags for common places, activities, or stressors (e.g., "alone," "phone call," "driving," "work").
  - Mitigation/Relief Tags: Create and manage tags for effective coping mechanisms (e.g., "going for a walk," "playing a game," "talking to a friend").
- Data Visualization:
  - Attack Frequency Bar Chart: Visualize the number of attacks over the last 30 days to identify daily patterns.
  - Severity Heatmap: A 90-day heatmap displaying average attack severity per day, offering a quick visual overview of trends.
  - Top Triggers List: See a ranked list of your most common attack triggers.
  - Top Mitigations List: Discover which mitigation strategies you use most frequently.
- Data Persistence: All attack records and custom tags are stored locally in your browser's localStorage, ensuring your data is saved between sessions.
- User-Friendly Modals: Custom alert and confirmation modals replace native browser prompts for a more integrated user experience.

## Project Structure (Modular JavaScript)

The JavaScript code has been organized into a modular structure for better maintainability and readability:

```
.
├── index.html                   # Main HTML file, loads the app and its styles.
└── css/
    ├── style.css                # Main styles document for application page
└── js/
    ├── main.js                  # Main entry point, initializes the app and sets up event listeners.
    ├── dataStorage.js.          # Handles all interactions with localStorage for data persistence.
    ├── uiManager.js             # Manages all DOM updates and rendering of app components.
    ├── modalManager.js          # Controls the opening, closing, and state of all modals.
    ├── tagManager.js            # Contains the logic for adding and deleting custom tags.
    ├── attackManager.js.        # Manages the core logic for starting, updating, and ending attacks.
    └── visualizationManager.js  # Responsible for rendering all graphs and heatmaps.
```

## Technologies Used

- HTML5: For the application structure.
- Tailwind CSS: For rapid and responsive styling.
- JavaScript (ES Modules): For all application logic and interactivity.
- localStorage: For client-side data persistence.

## Getting Started (Local Development)

To set up and run the project on your local machine:

1. Clone the repository:

```bash
git clone https://github.com/jdhunterae/ocd-attack-tracker.git
cd ocd-attack-tracker
```

2. Open with a Live Server:

Due to the use of JavaScript modules (type="module"), you'll need a local web server to run the application correctly (to avoid CORS issues).

- VS Code Extension: If you use VS Code, install the "Live Server" extension. Right-click index.html and select "Open with Live Server."
- Python Simple HTTP Server: If you have Python installed, navigate to your project's root directory in your terminal and run:

```bash
python -m http.server
```

Then, open your browser and go to <http://localhost:8000>.

## Deployment (GitHub Pages)

This project is configured for easy deployment using GitHub Pages.

1. Create a GitHub Repository:

    - Go to github.com and create a new public repository (e.g., ocd-attack-tracker).

2. Push Your Code:

    - Follow the Git commands to push your local repository to your new GitHub repository.

3. Configure GitHub Pages:

    - On your GitHub repository page, navigate to Settings > Pages.
    - Under "Build and deployment," choose "Deploy from a branch."
    - Select your primary branch (e.g., main or master) and set the folder to / (root).
    - Click Save.
    - GitHub Pages will build and deploy your site. The live URL will be displayed in the Pages settings (e.g., <https://your-username.github.io/your-repository-name/>).

## Future Enhancements

- [ ] Advanced Data Visualization: Integrate a dedicated charting library (e.g., Chart.js, D3.js) for more interactive and customizable graphs.
- [ ] Detailed Attack History: Implement a dedicated page or section to view and filter all past attacks, allowing for editing or deletion of individual records.
- [ ] Export/Import Data: Provide options to export data (e.g., JSON, CSV) for backup or analysis in other tools, and to import existing data.
- [ ] User Accounts & Cloud Storage: Implement Firebase Authentication and Firestore to allow users to store their data securely in the cloud, enabling multi-device access and data sharing.
- [ ] Improved Accessibility: Enhance keyboard navigation, screen reader support, and color contrast for better accessibility.
- [ ] Progressive Web App (PWA): Make the application installable on desktop and mobile devices for an app-like experience.
- [ ] Notifications: Add optional notifications for active attacks or reminders.

## License

This project is open-source and available under the [MIT License](LICENSE).
