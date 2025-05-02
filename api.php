<?php
// api.php

// --- Load Environment Variables from .env file ---
// This is a simple manual way to load a .env file.
// For more robust solutions in larger projects, consider libraries like vlucas/phpdotenv.
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Only process lines with a '='
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);

        // Set environment variable if not already set
        if (!isset($_SERVER[$name]) && !isset($_ENV[$name])) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}
// --- End Load Environment Variables ---


// Get API key from environment variables
// Use $_ENV or getenv()
$api_key = $_ENV['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY');


// Handle API request (only POST requests will trigger this)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');

    // Get prompt from POST, or use default
    $userPrompt = $_POST['prompt'] ?? '';

    // Validate or sanitize userPrompt if necessary (omitted for brevity)

    // Default prompt
    $defaultPrompt = "Generate 1 multiple choice question on a random general knowledge topic hard, funny, etc different types .";

    // If user provides a prompt, use that, otherwise use the default
    $finalPrompt = !empty($userPrompt) ? "Generate 1 multiple choice question on the topic, must unique and different types: " . $userPrompt : $defaultPrompt;

    // Append the strict format instruction
    // Ensured the format instruction is clear about prefixes and the final Answer line
    $finalPrompt .= "\n\nUse the following strict format (include 'Question:', 'A)', 'B)', 'C)', 'D)', and 'Answer:' prefixes):\n\nQuestion: <question text>\nA) <option A text>\nB) <option B text>\nC) <option C text>\nD) <option D text>\nAnswer: <correct option letter: A/B/C/D>";

    $data = [
        "contents" => [
            [
                "parts" => [["text" => $finalPrompt]]
            ]
        ],
        // Optional: Add safety settings to filter harmful content. Adjust thresholds as needed.
        // Refer to Gemini API documentation for latest categories and thresholds:
        // https://ai.google.dev/tutorials/rest_quickstart#safety_settings
        // ["category" => "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold" => "BLOCK_ONLY_HIGH"],
    ];

    // Check if API key is set or is the placeholder
    if (empty($api_key) || $api_key === 'YOUR_API_KEY') { // Check against empty and the old placeholder just in case
         echo json_encode(["error" => "API key not configured. Please create a '.env' file in the same directory and set the GEMINI_API_KEY variable, or set it via web server configuration."]);
         exit;
    }

    // API Endpoint
    $apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$api_key";

    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true); // Explicitly set POST method
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    // Add connection timeout (e.g., 10 seconds) and response timeout (e.g., 30 seconds)
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // Always verify SSL in production
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2); // Always verify hostname in production


    $response = curl_exec($ch);
    $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    // --- Parsing and Error Handling ---
    $json = json_decode($response, true);
    $text = '';
    $error_message = null; // Primary error message
    $parse_error_detail = null; // Detail specifically about parsing failure

    if ($response === false) {
        $error_message = "cURL error: " . $curl_error;
    } elseif ($http_status >= 400) {
        $error_message = "API error: HTTP status " . $http_status;
        if (isset($json['error']['message'])) {
             $error_message .= " - " . $json['error']['message'];
        } else {
             // Attempt to capture error details even if not in standard format
              $error_message .= " - Raw Response: " . (is_string($response) ? $response : json_encode($response));
        }
    } elseif (isset($json['candidates'][0]['content']['parts'][0]['text'])) {
        $text = $json['candidates'][0]['content']['parts'][0]['text'];

        // --- Robust Parsing ---
        $qMatch = [];
        $a = []; $b = []; $c = []; $d = [];
        $answerMatch = [];

        // Use DOTALL (. matches newline) and non-greedy matching (`.*?`)
        // Match Question
        preg_match("/Question:\s*(.*?)\n/is", $text, $qMatch);
        // Match Options A-D (non-greedy) - ensure they are followed by newline or end of string for robustness
         preg_match("/A\)\s*(.*?)\n/is", $text, $a);
         preg_match("/B\)\s*(.*?)\n/is", $text, $b);
         preg_match("/C\)\s*(.*?)\n/is", $text, $c);
         // Ensure D matches until the end of the string or the Answer line
         preg_match("/D\)\s*(.*?)(?=\nAnswer:|$)/is", $text, $d);

        // Match Answer (case-insensitive, single letter [A-D])
        // FIXED REGEX: Matches "Answer:", optional whitespace, then captures [A-D].
        // Allows for optional characters (like ')') after the letter before newline or end.
        preg_match("/Answer:\s*([A-D]).*?(?:\n|$)/i", $text, $answerMatch);


        // Check if all essential parts were successfully parsed
        // Use !empty($match[1]) to ensure the captured group is not empty
        if (empty($qMatch[1]) || empty($a[1]) || empty($b[1]) || empty($c[1]) || empty($d[1]) || empty($answerMatch[1])) {
             $parse_error_detail = "Failed to extract all essential parts (Question, Options A-D, Answer Letter) from response text. Response may not follow format.";
             // Log the raw response text for debugging
             error_log("QuizMaster Parse Error: " . $parse_error_detail . "\nResponse text:\n" . $text);

             // Provide fallback data with parsed parts if available
             $question = $qMatch[1] ?? "Error parsing question text.";
             $options = [
                 $a[1] ?? "Error option A.",
                 $b[1] ?? "Error option B.",
                 $c[1] ?? "Error option C.",
                 $d[1] ?? "Error option D."
             ];
             $correctAnswer = ""; // Cannot determine correct answer if parsing failed

        } else {
             // Successful parsing
             $question = trim($qMatch[1]);
             $options = [trim($a[1]), trim($b[1]), trim($c[1]), trim($d[1])];
             $correctOptionLetter = strtoupper(trim($answerMatch[1]));

             // Find the correct answer text based on the letter
             $correctAnswer = "";
             $letter_to_index = ['A' => 0, 'B' => 1, 'C' => 2, 'D' => 3];
             $correctIndex = $letter_to_index[$correctOptionLetter] ?? -1;

             if ($correctIndex !== -1 && isset($options[$correctIndex])) {
                  $correctAnswer = $options[$correctIndex];
             } else {
                 // This case should ideally not be hit if parsing $answerMatch[1] was successful as [A-D],
                 // but as a final safeguard if somehow the letter didn't map to an index or option is missing.
                 $parse_error_detail = "Parsed answer letter '" . $correctOptionLetter . "' does not map to valid option index or option text is missing.";
                 $correctAnswer = ""; // Cannot determine correct answer
             }
        }

    } else {
        // Unexpected API response structure (e.g., no 'candidates' or 'parts') or empty text response
        $error_message = "Unexpected API response structure or empty content in response.";
        // Log the raw response for debugging
        error_log("QuizMaster Unexpected Response: " . (is_string($response) ? $response : json_encode($response)));
    }


    // Combine error messages if both API and parsing failed
    if ($error_message && $parse_error_detail) {
         $final_error_message = "API Error: " . $error_message . "\n---\nParsing Error: " . $parse_error_detail;
    } elseif ($error_message) {
        $final_error_message = $error_message;
    } elseif ($parse_error_detail) {
         // If only parsing failed, but API call was 200 OK
         $final_error_message = "Parsing Error: " . $parse_error_detail . "\n---\nRaw text:\n" . $text; // Include raw text for parsing errors
    } else {
         $final_error_message = null; // No error
    }


    echo json_encode([
        "error" => $final_error_message,
        "question" => $question ?? "Could not load question.", // Use parsed or fallback question
        "options" => $options ?? [], // Use parsed or fallback options
        "answer" => $correctAnswer ?? "" // Use parsed or fallback correct answer (empty on error)
    ]);

    exit; // Stop script execution after sending JSON response
}

// If it's not a POST request, do nothing. index.html will handle the display.
// No closing ?> tag is needed in files containing only PHP code.
