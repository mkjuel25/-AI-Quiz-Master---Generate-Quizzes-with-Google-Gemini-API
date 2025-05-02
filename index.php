<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI Quiz Master</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Link to Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Link to your separate CSS file -->
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-gradient-to-br from-gray-950 to-gray-800 min-h-screen flex items-center justify-center p-4 text-white font-sans">
  <div class="w-full max-w-2xl bg-gray-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-gray-700">
    <!-- Custom Prompt Section -->
    <div class="mb-8 space-y-4 p-4 bg-gray-800 rounded-xl border border-gray-700 shadow-inner">
      <div class="flex flex-col md:flex-row gap-4">
        <input id="customPrompt" type="text" placeholder="Enter a fun topic!"
               class="w-full md:flex-grow bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 border border-gray-600 focus:border-blue-500 text-sm">
        <button id="submitPrompt" class="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white px-6 py-2 rounded-lg font-semibold transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 active:scale-95 text-sm">
          Set Topic! ✨
        </button>
      </div>
      <div class="text-xs text-gray-400 text-center">Or leave empty for a random question! 😉</div>
    </div>

    <!-- Header & Score -->
    <div class="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
      <h1 class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">🧠 AI Quiz Master</h1>
      <div class="flex items-center space-x-3 sm:space-x-4">
        <div class="bg-gray-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-gray-700">
          <span class="text-green-400 text-sm sm:text-base">✅</span>
          <span id="correctCount" class="font-semibold text-sm sm:text-base">0</span>
          <span class="mx-1 sm:mx-2 text-gray-500 text-sm sm:text-base">|</span>
          <span class="text-red-400 text-sm sm:text-base">❌</span>
          <span id="wrongCount" class="font-semibold text-sm sm:text-base">0</span>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="h-1.5 bg-gray-700 mb-6 rounded-full overflow-hidden">
      <div id="progressBar" class="progress-bar h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full w-0"></div>
    </div>

    <!-- Question Container -->
    <div id="questionContainer" class="relative min-h-[300px] p-4 sm:p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
      <div id="skeletonLoader" class="absolute inset-0 space-y-6 p-4 sm:p-6 animate-pulse">
        <div class="h-6 sm:h-8 shimmer rounded-lg w-3/4"></div>
        <div class="h-10 sm:h-12 shimmer rounded-xl"></div>
        <div class="h-10 sm:h-12 shimmer rounded-xl"></div>
        <div class="h-10 sm:h-12 shimmer rounded-xl"></div>
        <div class="h-10 sm:h-12 shimmer rounded-xl"></div>
      </div>
      <div id="content" class="relative opacity-0 transition-opacity duration-300 space-y-4 sm:space-y-6">
         <!-- Error message area -->
         <div id="errorMessage" class="text-red-400 text-center hidden text-xs sm:text-sm mb-4 whitespace-pre-wrap p-3 sm:p-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-700"></div>
        <div id="question" class="text-base sm:text-xl font-medium mb-4 sm:mb-6 text-blue-300 leading-relaxed"></div>
        <div id="options" class="grid gap-3 sm:gap-4">
          <!-- Options will be populated here -->
        </div>
      </div>
    </div>

    <!-- Feedback & Controls -->
    <div id="feedback" class="mt-6 text-center text-base sm:text-lg font-semibold min-h-[1.5em] text-purple-400"></div>
    <div class="mt-6 flex flex-col md:flex-row justify-between gap-4">
      <button id="historyBtn" class="w-full md:flex-1 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 active:scale-95 font-semibold text-gray-300 text-sm sm:text-base">
        📜 History
      </button>
      <button id="nextBtn" class="w-full md:flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95 text-sm sm:text-base">
        Next Question! 👉
      </button>
    </div>
  </div>

  <!-- History Modal -->
  <div id="historyModal" class="hidden fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50">
    <div class="history-modal-panel absolute right-0 top-0 h-full w-full max-w-full md:max-w-md bg-gray-900 p-6 shadow-xl transform translate-x-full rounded-l-xl border-l border-gray-700">
      <div class="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h2 class="text-xl font-bold text-blue-300">📚 Quiz History</h2>
        <button id="closeHistory" class="text-3xl text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-md px-2 leading-none">×</button>
      </div>
      <div id="historyList" class="history-list space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 text-sm">
        <!-- History items will be populated here -->
      </div>
    </div>
  </div>

  <!-- Link to your separate JavaScript file -->
  <!-- Place this just before the closing </body> tag -->
  <script src="scripts.js"></script>

</body>
</html>
