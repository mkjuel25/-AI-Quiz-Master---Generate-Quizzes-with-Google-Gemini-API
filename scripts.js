// script.js

let currentPrompt = ''; // Store the current user-set prompt
let currentQuestionData = null; // Store the fetched question data including the correct answer text
let correctCount = 0;
let wrongCount = 0;
let history = [];
const localStorageKey = 'quizMasterData';
const localStorageExpiryMinutes = 30; // Data expires after 30 minutes of inactivity
let progressIntervalId = null; // To store the interval ID for the progress bar timer
let autoNextTimeoutId = null; // To store the timeout ID for auto-next
let isAnswered = false; // Flag to check if the current question has been answered

const elements = {
  question: document.getElementById('question'),
  options: document.getElementById('options'),
  feedback: document.getElementById('feedback'),
  nextBtn: document.getElementById('nextBtn'),
  skeletonLoader: document.getElementById('skeletonLoader'),
  content: document.getElementById('content'),
  progressBar: document.getElementById('progressBar'),
  correctCount: document.getElementById('correctCount'),
  wrongCount: document.getElementById('wrongCount'),
  historyModal: document.getElementById('historyModal'),
  historyList: document.getElementById('historyList'),
  historyBtn: document.getElementById('historyBtn'),
  closeHistory: document.getElementById('closeHistory'),
  customPrompt: document.getElementById('customPrompt'),
  submitPrompt: document.getElementById('submitPrompt'),
  errorMessage: document.getElementById('errorMessage') // Added error message element
};

// --- Local Storage with Expiry ---
function saveToStorage() {
  const expiryTime = new Date().getTime() + (localStorageExpiryMinutes * 60 * 1000);
  localStorage.setItem(localStorageKey, JSON.stringify({
    history: history,
    correctCount: correctCount,
    wrongCount: wrongCount,
    currentPrompt: currentPrompt, // Save the current prompt
    expiry: expiryTime // Store expiry timestamp
  }));
  console.log("Data saved to localStorage. Expires:", new Date(expiryTime).toLocaleString());
}

function loadFromStorage() {
  const savedData = localStorage.getItem(localStorageKey);
  const currentTime = new Date().getTime();

  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      // Check if data exists and is not expired
      if (data && data.expiry && data.expiry > currentTime) {
         history = Array.isArray(data.history) ? data.history : [];
         correctCount = typeof data.correctCount === 'number' ? data.correctCount : 0;
         wrongCount = typeof data.wrongCount === 'number' ? data.wrongCount : 0;
         currentPrompt = typeof data.currentPrompt === 'string' ? data.currentPrompt : ''; // Load the saved prompt
         // Data is valid, update display
         updateScores(); // Update display immediately
         // Set the loaded prompt back into the input field visually
         elements.customPrompt.value = currentPrompt;
         console.log("Loaded data from localStorage (not expired).");
         return; // Stop here if data was loaded successfully
      } else {
          console.log("LocalStorage data expired.");
          localStorage.removeItem(localStorageKey); // Clear expired data
      }
    } catch (e) {
       console.error("Failed to parse localStorage data:", e);
        localStorage.removeItem(localStorageKey); // Clear corrupted data
    }
  }

  // If no saved data, data expired, or parsing failed, initialize/clear
  console.log("Initializing or clearing state.");
  history = [];
  correctCount = 0;
  wrongCount = 0;
  currentPrompt = ''; // Clear prompt
  elements.customPrompt.value = ''; // Clear input field
  saveToStorage(); // Save initial state with new expiry
  updateScores(); // Update display
}

// --- Timer Management ---
function stopAutoProgress() {
  if (progressIntervalId !== null) {
    clearInterval(progressIntervalId);
    progressIntervalId = null;
  }
}

 function stopAutoNextTimeout() {
    if (autoNextTimeoutId !== null) {
        clearTimeout(autoNextTimeoutId);
        autoNextTimeoutId = null;
    }
 }

function startAutoProgress() {
  stopAutoProgress(); // Ensure any previous progress timer is stopped
   if (isAnswered) return; // Don't start timer if already answered

  elements.progressBar.style.width = '0%'; // Reset progress bar
  let width = 0;
  const duration = 15000; // Timer duration in milliseconds (e.g., 15 seconds)
  const intervalTime = 50; // Update every 50ms
  const increment = (100 / (duration / intervalTime)); // Calculate increment per interval

  progressIntervalId = setInterval(() => {
    width += increment;
    if (width >= 100) {
      width = 100;
      stopAutoProgress();
      if (!isAnswered && currentQuestionData && currentQuestionData.question) {
           // Only handle timeout if a valid question was loaded and not answered
           handleTimeout();
       } else if (!isAnswered) {
          // If timer ended but no question loaded properly, allow manual next
           elements.nextBtn.disabled = false; // Already enabled by displayQuestion now, but good safeguard
       }
    }
    elements.progressBar.style.width = `${width}%`;
  }, intervalTime);
}

// Function to handle timeout / Skip - auto-next is triggered here
function handleTimeout() {
    if (isAnswered) return; // Ensure we don't process timeout if already answered
     if (!currentQuestionData || !currentQuestionData.question) {
         console.warn("Timeout/Skip occurred but no valid question data.");
         elements.feedback.textContent = '⏱️ Skipped! No valid question was loaded.';
         elements.feedback.classList.remove('text-green-400', 'text-red-400', 'text-purple-400');
         elements.feedback.classList.add('text-yellow-400'); // Yellow for timeout/skip with error
         elements.nextBtn.disabled = false; // Should already be enabled
         isAnswered = true; // Mark as "handled"
         return; // Don't proceed further if no valid question
     }

    isAnswered = true; // Mark as answered/skipped

    stopAutoProgress(); // Stop the visual timer

    wrongCount++; // Increment wrong count for skipped questions
    updateScores(); // Update score display and storage

    elements.feedback.textContent = `⏱️ Time's up / Skipped! ⏭️ The correct answer was: ${currentQuestionData.answer ?? 'N/A'}`;
    elements.feedback.classList.remove('text-green-400', 'text-red-400', 'text-purple-400');
    elements.feedback.classList.add('text-orange-400'); // Orange for timeout/skip

    // Disable and style options
    const optionsElements = elements.options.querySelectorAll('.option-btn');
    optionsElements.forEach(option => {
        option.disabled = true; // Disable clicks
         // Highlight the correct answer if it exists
         if (currentQuestionData.answer && option.dataset.optionText === currentQuestionData.answer) {
              option.classList.add('correct');
               option.classList.remove('bg-gray-700', 'hover:bg-gray-600', 'focus:ring-blue-500'); // Remove hover and focus rings
         }
         // Ensure other options lose hover/shadow styles
         option.classList.remove('hover:bg-gray-600', 'shadow-md', 'hover:shadow-lg');
    });

    // Add skip/timeout to history
    addHistoryEntry("Timeout", false); // Using "Timeout" to signify it wasn't a chosen answer

    // Auto-fetch next question after a short delay if triggered by timer,
    // or fetch immediately if clicked by user.
    // We don't need auto-next timeout if user clicked 'Next'.
    // The 'Next' click handler itself will call fetchQuestion.
}


// --- Quiz Logic ---
async function fetchQuestion() {
  stopAutoProgress(); // Stop timers before fetching
  stopAutoNextTimeout(); // Stop any scheduled auto-next (important if auto-next was pending after a timeout)
  isAnswered = false; // Reset answered state for the new question
  elements.errorMessage.classList.add('hidden'); // Hide previous error message
  elements.skeletonLoader.classList.remove('hidden');
  elements.content.classList.add('opacity-0');
  elements.nextBtn.disabled = true; // Disable next button while loading/answering
  elements.options.innerHTML = ''; // Clear previous options
  elements.feedback.textContent = ''; // Clear previous feedback
  elements.question.textContent = ''; // Clear previous question
  currentQuestionData = null; // Clear previous question data
  elements.progressBar.style.width = '0%'; // Reset progress bar immediately on fetch
  elements.feedback.classList.remove('text-green-400', 'text-red-400', 'text-orange-400', 'text-yellow-400'); // Remove all old feedback colors
  elements.feedback.classList.add('text-purple-400'); // Reset feedback color

  try {
    // The fetch URL points to the separate api.php file
    const response = await fetch('api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `prompt=${encodeURIComponent(currentPrompt)}` // Use currentPrompt from JS variable
    });

    if (!response.ok) {
         // Attempt to read error response from PHP even if not 200 OK
         const errorBody = await response.text();
         throw new Error(`HTTP error! status: ${response.status}\nResponse: ${errorBody}`);
    }

    const data = await response.json();

    if (data.error) {
         throw new Error(`API/Server Error: ${data.error}`);
    }

    // Check if essential data is present and correctly formatted for display
    if (!data.question || !data.options || data.options.length !== 4 || !data.answer) {
         console.error("Received data:", data); // Log the problematic data
         throw new Error("Invalid data format or incomplete data received from API. Missing question, options, or answer.");
    }

    // Small delay for visual effect (optional)
    await new Promise(resolve => setTimeout(resolve, 300));

    currentQuestionData = data; // Store the fetched data
    displayQuestion(data);
    // --- Enable nextBtn immediately after displaying the question ---
    elements.nextBtn.disabled = false;
    startAutoProgress(); // Restart timer for the new question

  } catch (error) {
    console.error('Fetch error:', error);
    elements.feedback.textContent = '🚫 Error loading question.'; // Error feedback
    elements.feedback.classList.remove('text-green-400', 'text-purple-400', 'text-orange-400', 'text-yellow-400');
    elements.feedback.classList.add('text-red-400'); // Red for fetch/parse errors

    elements.question.textContent = 'Could not load question.';
    elements.options.innerHTML = '<p class="text-red-400 text-center text-sm">Check API key, prompt, or try again.</p>';
    elements.errorMessage.textContent = `${error.message}`; // Display detailed error
    elements.errorMessage.classList.remove('hidden');
    elements.nextBtn.disabled = false; // Allow trying next question even after error
    isAnswered = true; // Mark as "handled" (failed to load/parse) - this prevents timer logic from running on an errored state
    stopAutoProgress(); // Ensure timer is off on error
  } finally {
    elements.skeletonLoader.classList.add('hidden');
    elements.content.classList.remove('opacity-0');
  }
}

// Implement displayQuestion function
function displayQuestion(data) {
  elements.question.textContent = data.question || 'No question loaded.';
  elements.options.innerHTML = ''; // Clear previous options

  if (data.options && data.options.length === 4) {
    const optionLetters = ['A', 'B', 'C', 'D'];
    data.options.forEach((optionText, index) => {
      const optionElement = document.createElement('button');
      // Added more classes for depth, hover, and slightly adjusted padding
      optionElement.classList.add('option-btn', 'bg-gray-700', 'hover:bg-gray-600', 'px-4', 'py-3', 'rounded-lg', 'text-left', 'transition-all', 'w-full', 'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'shadow-md', 'hover:shadow-lg');
      optionElement.innerHTML = `<span class="font-semibold mr-2">${optionLetters[index]})</span> ${optionText}`; // Added margin-right to letter
      optionElement.dataset.optionIndex = index; // Store index
      optionElement.dataset.optionText = optionText; // Store text

      // Add click listener to each option
      optionElement.addEventListener('click', () => checkAnswer(optionElement));

      elements.options.appendChild(optionElement);
    });
    // The next button is enabled in fetchQuestion after the displayQuestion call.
    isAnswered = false; // Reset answered state
  } else {
      // This case should be less likely with improved fetch checks, but still handle
      elements.options.innerHTML = '<p class="text-red-400 text-center text-sm">Could not load options in correct format.</p>';
      elements.nextBtn.disabled = false; // Allow trying next question - already enabled
       isAnswered = true; // Mark as answered (failed)
       stopAutoProgress(); // Stop timer if options didn't load correctly
       elements.feedback.textContent = '⚠️ Options missing!'; // Add specific feedback
       elements.feedback.classList.remove('text-green-400', 'text-purple-400', 'text-orange-400', 'text-yellow-400');
       elements.feedback.classList.add('text-red-400');
  }

  elements.feedback.textContent = 'Choose wisely... 🤔'; // Fun initial feedback
  elements.feedback.classList.remove('text-green-400', 'text-red-400', 'text-orange-400', 'text-yellow-400');
  elements.feedback.classList.add('text-purple-400');
}

// Implement checkAnswer function
function checkAnswer(selectedElement) {
  if (isAnswered) return; // Prevent answering multiple times
  isAnswered = true; // Mark as answered

  stopAutoProgress(); // Stop the timer once an answer is selected
  stopAutoNextTimeout(); // Stop any scheduled auto-next


  const selectedOptionText = selectedElement.dataset.optionText;
  // Ensure currentQuestionData and its answer are available before checking
  const isCorrect = currentQuestionData?.answer && selectedOptionText === currentQuestionData.answer;
  const optionsElements = elements.options.querySelectorAll('.option-btn');

  // Disable all options after one is selected
  optionsElements.forEach(option => {
    option.disabled = true; // Disable clicks
    const optionText = option.dataset.optionText;

    // Apply feedback colors
    if (currentQuestionData?.answer && optionText === currentQuestionData.answer) {
      option.classList.add('correct'); // Mark correct answer
      option.classList.remove('bg-gray-700', 'hover:bg-gray-600', 'focus:ring-blue-500', 'shadow-md', 'hover:shadow-lg'); // Remove styling
    } else if (option === selectedElement) {
      option.classList.add('wrong', 'selected'); // Mark selected wrong answer
       option.classList.remove('bg-gray-700', 'hover:bg-gray-600', 'focus:ring-blue-500', 'shadow-md', 'hover:shadow-lg'); // Remove styling
    }
     // Other wrong options just get disabled style from :disabled and removed styling
     option.classList.remove('hover:bg-gray-600', 'shadow-md', 'hover:shadow-lg');
  });

  // Update scores and feedback
  if (isCorrect) {
    correctCount++;
    elements.feedback.textContent = 'Absolutely Correct! 🎉 Brilliant!';
    elements.feedback.classList.remove('text-red-400', 'text-purple-400', 'text-orange-400', 'text-yellow-400');
    elements.feedback.classList.add('text-green-400');
  } else {
    wrongCount++;
     const correctAnswerText = currentQuestionData?.answer ?? 'N/A';
    elements.feedback.textContent = `Oops, not quite! 😞 The correct answer was: ${correctAnswerText}`;
    elements.feedback.classList.remove('text-green-400', 'text-purple-400', 'text-orange-400', 'text-yellow-400');
    elements.feedback.classList.add('text-red-400');
  }

  updateScores(); // Save and update score display
  addHistoryEntry(selectedOptionText, isCorrect); // Add to history
  elements.nextBtn.disabled = false; // Enable next button (already enabled, but this is fine)
}

// Implement History Management
function addHistoryEntry(userAnswerText, isCorrect) {
    // Only add if currentQuestionData is valid (not null and has essential fields)
    if (!currentQuestionData || !currentQuestionData.question || !currentQuestionData.options || !currentQuestionData.answer) {
         console.warn("Attempted to add history entry with incomplete question data.");
         return;
    }

    const historyEntry = {
        question: currentQuestionData.question,
        options: currentQuestionData.options, // Store all options
        correctAnswer: currentQuestionData.answer,
        userAnswer: userAnswerText, // Store "Timeout" if applicable
        isCorrect: userAnswerText !== "Timeout" ? isCorrect : false, // Timeout is always wrong
        timestamp: new Date().toISOString() // Add timestamp for sorting/potential future use
    };
    history.push(historyEntry);
    // Optional: Keep history size manageable? e.g., last 100 questions
    // if (history.length > 100) { history.shift(); }
    saveToStorage(); // Save state whenever history changes
}

 // Function to delete a history entry by its original index
function deleteHistoryEntry(index) {
    // Ensure index is valid and within bounds
    if (index >= 0 && index < history.length) {
        history.splice(index, 1); // Remove the item from the array
        saveToStorage(); // Save the updated history
        showHistory(); // Re-render the history modal to reflect the change
    } else {
        console.warn("Attempted to delete history entry with invalid index:", index);
    }
}

function showHistory() {
    elements.historyList.innerHTML = ''; // Clear previous history display
    if (history.length === 0) {
        elements.historyList.innerHTML = '<p class="text-gray-400 text-center py-4">History is empty. Start quizzing! 😄</p>'; // Friendly message
    } else {
        // Display history in reverse chronological order (newest first)
        // Use the original index from the non-reversed array for deletion
        history.slice().reverse().forEach((entry, reverseIndex) => {
             // Calculate the original index in the non-reversed array
             const originalIndex = history.length - 1 - reverseIndex;

            const entryElement = document.createElement('div');
            entryElement.classList.add('history-item'); // Use history-item class for layout

             const contentDiv = document.createElement('div');
             contentDiv.classList.add('history-content', 'space-y-2');

            // Question
            const qEl = document.createElement('p');
            qEl.classList.add('font-semibold', 'text-blue-300', 'text-sm'); // Text-sm for history question
            qEl.textContent = entry.question || 'Question unavailable'; // Fallback text
            contentDiv.appendChild(qEl);

            // Answers
            const answersEl = document.createElement('div');
            answersEl.classList.add('text-xs', 'space-y-1', 'ml-2'); // Text-xs for history answers, ml-2 indent

             // Find letter for correct answer
            let correctLetter = '';
            const optionLetters = ['A', 'B', 'C', 'D'];
            if (entry.options && entry.correctAnswer) { // Add null checks
                 entry.options.forEach((opt, i) => {
                     if (opt === entry.correctAnswer) correctLetter = optionLetters[i];
                 });
            }

            // User Answer
            const userFeedback = document.createElement('p');
            if (entry.userAnswer === "Timeout") {
                 userFeedback.innerHTML = '<span class="text-orange-400 font-semibold">⏳ Timed Out/Skipped.</span>'; // Orange for timeout/skip
            } else if (entry.userAnswer !== undefined && entry.userAnswer !== null && entry.userAnswer !== '') { // Check if userAnswer is not null/empty
                userFeedback.innerHTML = `<span class="${entry.isCorrect ? 'text-green-400' : 'text-red-400'} font-semibold">${entry.isCorrect ? '✅ Your Answer:' : '❌ Your Answer:'}</spa
