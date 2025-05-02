# 🧠 AI Quiz Master - Generate Quizzes with Google Gemini API

A simple, self-contained web application built with PHP, HTML, CSS (Tailwind CSS), and JavaScript that leverages the Google Gemini API to generate multiple-choice general knowledge questions on demand.

## ✨ Features

*   **AI-Powered Questions:** Generates unique multiple-choice questions using the Google Gemini (`gemini-2.0-flash`) API.
*   **Custom Topics:** Allows users to enter a specific topic for questions (e.g., "space exploration", "history of robotics", "types of cheese").
*   **Random Questions:** Defaults to generating questions on a random general knowledge topic if no custom topic is set.
*   **Interactive UI:** Clean and responsive user interface with a timer for each question.
*   **Scoring:** Tracks the number of correct and incorrect answers.
*   **Question History:** Stores a history of past questions, the correct answer, and the user's answer (including skipped/timed out questions) using browser Local Storage. History persists across browser sessions (with a configurable expiry).
*   **Skip Functionality:** Users can click "Next Question! 👉" before answering to skip the current question (which counts as incorrect).
*   **Loading State:** Visual feedback during question fetching using a skeleton loader and progress bar.

## 🚀 Technologies Used

*   **Backend:** PHP (for making API calls to Google Gemini)
*   **Frontend:** HTML, CSS (using Tailwind CSS via CDN), JavaScript
*   **API:** Google Gemini API (`gemini-2.0-flash` model)
*   **Other:** cURL (PHP extension), Browser Local Storage

## 🛠️ Setup and Installation

To run this project locally, you will need:

*   A web server capable of running PHP (e.g., Apache, Nginx, PHP's built-in server).
*   PHP installed with the cURL extension enabled.
*   A Google Cloud Project or access to Google AI Studio to obtain a Google Gemini API Key.

Follow these steps:

1.  **Clone or Download:** Get the project files onto your machine.
2.  **Place Files:** Put the four project files (`index.html`, `api.php`, `style.css`, `script.js`) into your web server's document root or a directory accessible via your web browser.
3.  **Obtain Gemini API Key:**
    *   Go to [Google AI Studio](https://aistudio.google.com/) or your Google Cloud Console.
    *   Create an API key for the Gemini API.
4.  **Configure API Key:**
    *   Open the `api.php` file in a text editor.
    *   Find the line that says `$api_key = 'YOUR_API_KEY';`.
    *   **Replace `'YOUR_API_KEY'` with your actual Gemini API key.**
    ```php
    // api.php
    $api_key = 'YOUR_ACTUAL_API_KEY_GOES_HERE'; // <-- Replace this placeholder
    ```
    *   **Security Note:** For enhanced security in production environments, consider storing API keys outside the web root or using environment variables instead of directly in the code file.
5.  **Access the Application:** Open your web browser and navigate to the URL where you placed the `index.html` file (e.g., `http://localhost/ai-quiz-master/index.html`).

## 🎮 Usage

1.  When you open the `index.html` page, the first question will load automatically. A timer will start counting down.
2.  Click on one of the option buttons (A, B, C, or D) to select your answer.
3.  The application will immediately show feedback (Correct/Incorrect) and highlight the correct answer. Your score will update.
4.  Click the "Next Question! 👉" button to fetch a new question.
    *   If you click "Next Question! 👉" *before* selecting an answer, the current question will be marked as incorrect/skipped, the timer will stop, and a new question will load immediately.
5.  Use the input field at the top to type a specific topic and click "Set Topic! ✨". The next question fetched will be about that topic. Leave the input empty and click "Set Topic! ✨" (or just click "Next Question!") to return to random general knowledge questions.
6.  Click the "📜 History" button to view a list of the questions you've answered (or skipped) in the current session, along with the correct answers and your selections. You can delete individual entries from the history.

## 📁 File Structure

The project is structured into four main files:

*   `index.html`: Contains the main HTML structure of the quiz interface. It links to the CSS and JavaScript files.
*   `style.css`: Contains all the custom CSS rules and overrides for styling the application elements (in addition to Tailwind CSS).
*   `script.js`: Holds all the frontend JavaScript logic, including fetching questions from `api.php`, handling user interactions, managing the timer, scores, history, and browser Local Storage.
*   `api.php`: This is the backend script. It listens for `POST` requests from `script.js`, constructs the request to the Google Gemini API (including your API key), parses the API response, and returns the question data as JSON.

## 📜 License

This project is licensed under the MIT License.
