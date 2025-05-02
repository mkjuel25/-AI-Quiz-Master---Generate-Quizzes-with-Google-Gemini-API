# 🧠 AI Quiz Master - Generate Quizzes with Google Gemini API

A simple, self-contained web application built with PHP (backend proxy), HTML, CSS (Tailwind CSS), and JavaScript that leverages the Google Gemini API to generate interactive multiple-choice general knowledge questions on demand.

## ✨ Features

*   **AI-Powered Questions:** Generates unique multiple-choice questions using the Google Gemini (`gemini-2.0-flash`) API.
*   **Custom Topics:** Allows users to enter a specific topic for questions (e.g., "space exploration", "history of robotics", "types of cheese").
*   **Random Questions:** Defaults to generating questions on a random general knowledge topic if no custom topic is set.
*   **Interactive UI:** Clean and responsive user interface with a timer for each question.
*   **Scoring:** Tracks the number of correct and incorrect answers locally.
*   **Question History:** Stores a history of past questions, the correct answer, and the user's answer (including skipped/timed out questions) using browser Local Storage. History persists across browser sessions (with a configurable expiry).
*   **Skip Functionality:** Users can click "Next Question! 👉" before answering to skip the current question (which counts as incorrect).
*   **Loading State:** Visual feedback during question fetching using a skeleton loader and progress bar.
*   **Error Handling:** Displays specific error messages if the API key is missing or if there are issues fetching or parsing the question from the API.

## 📸 Screenshots

Here are a couple of screenshots showing the application in action:

**Main Quiz Interface (Before Answering)**
![Screenshot of Main Quiz Interface](images/screenshot_1.png) <!-- IMPORTANT: Replace images/screenshot_1.png with the actual path to your first screenshot -->

**Quiz Interface (After Answering) and History Modal**
![Screenshot of Quiz Interface after Answering and History Modal]([images/screenshot_2.png]([https://takfe.com/uploads/stories/img/1746169971.jpg](https://takfe.com/uploads/stories/img/1746170002.jpg))) <!-- IMPORTANT: Replace images/screenshot_2.png with the actual path to your second screenshot -->

## 🚀 Technologies Used

*   **Backend:** PHP (v7.4 or higher recommended, with cURL extension enabled)
*   **Frontend:** HTML, CSS (using Tailwind CSS via CDN), JavaScript
*   **API:** Google Gemini API (`gemini-2.0-flash` model)
*   **Other:** cURL (PHP extension), Browser Local Storage

## 🛠️ Setup and Installation

To run this project locally, you will need:

*   A web server capable of running PHP (e.g., Apache, Nginx, PHP's built-in development server).
*   PHP installed with the cURL extension enabled.
*   A Google Cloud Project or access to Google AI Studio to obtain a Google Gemini API Key.

Follow these steps:

1.  **Clone or Download:** Get the project files onto your machine.
2.  **Place Files:** Put the four project files (`index.html`, `api.php`, `style.css`, `script.js`) into your web server's document root or a directory accessible via your web browser.
    *   **Screenshot Images:** If you have screenshot images you want to display in the README, place them in a location accessible by the web server (a common practice is creating an `images` folder) and update the paths in this `README.md` file accordingly.
3.  **Obtain Gemini API Key:**
    *   Go to [Google AI Studio](https://aistudio.google.com/) or your Google Cloud Console.
    *   Create an API key for the Gemini API.
4.  **Configure API Key using a `.env` file:**
    *   **Create `.env` file:** In the **same directory** as your `api.php` file, create a new file named `.env`.
    *   **Add API Key:** Add the following line to the `.env` file, replacing `YOUR_ACTUAL_API_KEY_GOES_HERE` with your actual Google Gemini API key:
        ```dotenv
        GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_GOES_HERE
        ```
    *   **IMPORTANT SECURITY STEP:** This `.env` file contains a secret key. You **must** add `.env` to your `.gitignore` file if you are using Git, so you don't accidentally commit your secret key to version control.
5.  **(Optional but Recommended) Configure GitIgnore:** If using Git, create or open a `.gitignore` file in your project's root directory and add the line `.env`.
6.  **Access the Application:** Open your web browser and navigate to the URL where you placed the `index.html` file (e.g., `http://localhost/your-project-folder/index.html`).

## 🎮 Usage

1.  When you open the `index.html` page, the first question will start loading automatically, and a timer will begin.
2.  **Answer a Question:** Click on one of the option buttons (A, B, C, or D) to select your answer. The timer will stop, feedback will appear, the correct answer will be highlighted, and your score will update.
3.  **Get Next Question:** Click the "Next Question! 👉" button to fetch a new question.
    *   **Skip:** If you click "Next Question! 👉" *before* selecting an answer, the current question will be marked as incorrect/skipped, the timer will stop, the correct answer will be shown, and a new question will load immediately.
4.  **Set Custom Topic:** Use the input field at the top to type a specific topic (e.g., "ancient Rome", "types of clouds", "famous painters"). Click "Set Topic! ✨". The next question fetched will be about that topic. Leave the input empty and click "Set Topic! ✨" (or just click "Next Question!") to return to random general knowledge questions.
5.  **View History:** Click the "📜 History" button to open a modal showing a list of the questions you've completed in the current session (including skipped/timed out ones), along with the correct answers and your selection. You can delete individual entries from the history using the trashcan icon.
## 📁 File Structure

The project is structured into four main files:

/your-project-folder/

├── .env         
├── index.html   
├── scripts.js    
└── api.php      
└── style.css

*   `index.html`: Contains the main HTML structure of the quiz interface. It links to the CSS and JavaScript files.
*   `style.css`: Contains all the custom CSS rules and overrides for styling the application elements (in addition to Tailwind CSS).
*   `scripts.js`: Holds all the frontend JavaScript logic, including fetching questions from `api.php`, handling user interactions, managing the timer, scores, history, and browser Local Storage.
*   `api.php`: This is the backend script. It loads the API key from the `.env` file, listens for `POST` requests from `scripts.js`, constructs the request to the Google Gemini API, parses the API response, and returns the question data as JSON.

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements, feel free to open an issue or submit a pull request.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 👤 Author

Jewel <!-- Optional: Replace with your details -->
