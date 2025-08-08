
let quizStartTime = null;

async function generateFlashcards() {
  const text = document.getElementById('inputText').value.trim();
  const container = document.getElementById('flashcards');

  container.innerHTML = '';
  const loader = document.createElement('p');
  loader.id = 'loadingText';
  loader.className = 'text-gray-600 animate-pulse';
  loader.textContent = '⚡ Generating flashcards...';
  container.appendChild(loader);

  if (!text) {
    container.innerHTML = `<p class="text-red-600">Please enter your study notes.</p>`;
    return;
  }

  try {
    const res = await fetch('/generate_flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const result = await res.json();

    if (result.status === 'success') {
      container.innerHTML = '';

      if (result.flashcards.length === 0) {
        container.innerHTML = `<p class="text-gray-600">No flashcards could be generated from your input.</p>`;
        return;
      }

      result.flashcards.forEach(flashcard => {
        const card = document.createElement('div');
        card.className = "flashcard relative bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-lg shadow hover:shadow-md transition";

        card.innerHTML = `
          <div class="absolute top-2 right-2 flex gap-2">
            <button onclick="enableEditing(this)" class="edit-btn text-blue-600 text-sm hover:opacity-70" title="Edit">📝</button>
            <button onclick="saveFlashcardEdit(this)" class="save-btn text-green-600 text-sm hover:opacity-70 hidden" title="Save">💾</button>
            <button onclick="deleteFlashcard(this)" class="text-red-600 text-sm hover:opacity-70" title="Delete">🗑️</button>
          </div>

          <h3 class="font-bold text-gray-700 mb-2">Question ${flashcard.id}</h3>
          <div contenteditable="false" class="question text-lg font-semibold text-gray-800 border border-transparent rounded p-1 mb-2">
            ${flashcard.question}
          </div>

          <button onclick="toggleAnswer(this)" class="mt-2 text-sm text-blue-600">👁 Show Answer</button>
          <div class="hidden mt-2">
            <div contenteditable="false" class="answer text-gray-700 border border-transparent rounded p-1">
              ${flashcard.answer}
            </div>
          </div>
        `;

        container.appendChild(card);
      });

    } else {
      // Check for login required
      if (result.message && result.message.toLowerCase().includes('login required')) {
        showLoginRequiredPopup();
        container.innerHTML = '';
        return;
      }
      container.innerHTML = `<p class="text-red-600">${result.message || 'Could not generate flashcards. Try different notes.'}</p>`;
    }
  } catch (error) {
    container.innerHTML = `<p class="text-red-600">Something went wrong. Please try again.</p>`;
  }
}

function toggleAnswer(btn) {
  const answer = btn.nextElementSibling;
  const isVisible = !answer.classList.contains('hidden');
  answer.classList.toggle('hidden');
  btn.textContent = isVisible ? "👁 Show Answer" : "🙈 Hide Answer";
}

function toggleExportMenu() {
  const menu = document.getElementById('exportMenu');
  menu.classList.toggle('hidden');
}

function enableEditing(btn) {
  const card = btn.closest('.flashcard');
  const question = card.querySelector('.question');
  const answer = card.querySelector('.answer');
  const editBtn = card.querySelector('.edit-btn');
  const saveBtn = card.querySelector('.save-btn');

  if (question && answer) {
    question.setAttribute('contenteditable', 'true');
    answer.setAttribute('contenteditable', 'true');
    question.classList.add('border-blue-400', 'outline-none');
    answer.classList.add('border-blue-400', 'outline-none');
    editBtn.classList.add('hidden');
    saveBtn.classList.remove('hidden');
    question.focus();
  }
}

function saveFlashcardEdit(btn) {
  const card = btn.closest('.flashcard');
  const question = card.querySelector('.question');
  const answer = card.querySelector('.answer');
  const editBtn = card.querySelector('.edit-btn');
  const saveBtn = card.querySelector('.save-btn');

  if (question && answer) {
    question.setAttribute('contenteditable', 'false');
    answer.setAttribute('contenteditable', 'false');
    question.innerHTML = question.innerText.trim();
    answer.innerHTML = answer.innerText.trim();
    question.classList.remove('border-blue-400');
    answer.classList.remove('border-blue-400');
    saveBtn.classList.add('hidden');
    editBtn.classList.remove('hidden');
    alert('✅ Flashcard saved!');
  }
}

function deleteFlashcard(btn) {
  const card = btn.closest('.flashcard');
  if (card) card.remove();
}

async function exportFlashcardsToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const flashcards = Array.from(document.querySelectorAll("#flashcards .flashcard"));
  const userText = document.getElementById("inputText").value.trim();

  if (flashcards.length === 0 || !userText) {
    alert("Nothing to export. Please generate flashcards first.");
    return;
  }

  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.setFont("helvetica", "bold");
  doc.text("QuizCraft Flashcard Summary", 105, 15, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(50);
  doc.setFont("helvetica", "bold");
  doc.text("User Query:", 14, 30);

  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(userText, 180);
  doc.text(lines, 14, 37);

  const yAfterQuery = 37 + lines.length * 6;
  const tableData = flashcards.map((card, index) => {
    const question = card.querySelector(".question")?.innerText.trim() || "";
    const answer = card.querySelector(".answer")?.innerText.trim() || "";
    return [`Q${index + 1}: ${question}`, `A${index + 1}: ${answer}`];
  });

  doc.autoTable({
    startY: yAfterQuery + 10,
    head: [['Question', 'Answer']],
    body: tableData,
    styles: { fontSize: 11, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, halign: "center" },
    columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 85 } },
    theme: 'striped',
    margin: { top: 10, left: 14, right: 14 },
    didDrawPage: function (data) {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, 105, 290, { align: 'center' });
    }
  });

  doc.save("QuizCraft_Flashcards.pdf");
}

function exportFlashcardsToCSV() {
  const flashcards = Array.from(document.querySelectorAll("#flashcards .flashcard"));
  const userText = document.getElementById("inputText").value.trim();

  if (flashcards.length === 0 || !userText) {
    alert("Nothing to export. Please generate flashcards first.");
    return;
  }

  let csv = "User Query,\n\"" + userText.replace(/"/g, '""') + "\"\n\n";
  csv += "Question,Answer\n";

  flashcards.forEach((card, index) => {
    const question = card.querySelector(".question")?.innerText.trim() || "";
    const answer = card.querySelector(".answer")?.innerText.trim() || "";
    csv += `"${question.replace(/"/g, '""')}","${answer.replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "QuizCraft_Flashcards.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function uploadAudio() {
  const fileInput = document.getElementById('audioFile');
  const uploadStatus = document.getElementById('uploadStatus');
  const container = document.getElementById('flashcards');
  container.innerHTML = ''; // Clear old cards

  if (!fileInput.files.length) {
    alert('Please select an audio file.');
    return;
  }

  uploadStatus.textContent = '⏳ Uploading and transcribing audio...';
  uploadStatus.className = 'text-sm text-gray-600 animate-pulse';

  const formData = new FormData();
  formData.append('audio', fileInput.files[0]);

  try {
    const res = await fetch('/transcribe_audio', {
      method: 'POST',
      body: formData
    });

    const result = await res.json();

    if (result.status === 'success') {
      uploadStatus.textContent = '✅ Transcription successful! Generating flashcards...';
      document.getElementById('inputText').value = result.transcript;
      await generateFlashcards();
      uploadStatus.textContent = '';
    } else {
      uploadStatus.textContent = '❌ ' + result.message;
      uploadStatus.className = 'text-sm text-red-600';
    }
  } catch (err) {
    uploadStatus.textContent = '❌ Upload failed. Try again.';
    uploadStatus.className = 'text-sm text-red-600';
  }
}

// New: Image OCR and flashcard generation using Tesseract.js on client-side
async function uploadImage() {
  const fileInput = document.getElementById('imageFile');
  const imageStatus = document.getElementById('imageStatus');
  const container = document.getElementById('flashcards');
  container.innerHTML = ''; // Clear previous flashcards

  if (!fileInput.files.length) {
    alert('Please select an image file.');
    return;
  }

  const file = fileInput.files[0];
  imageStatus.textContent = '🔍 Scanning image for text...';
  imageStatus.className = 'text-sm text-gray-600 animate-pulse';

  try {
    // Use Tesseract.js to extract text
    const { data: { text } } = await Tesseract.recognize(
      file,
      'eng',
      { logger: m => {
          // Optional: you can update a progress bar here with m.progress
          // console.log(m);
        }
      }
    );

    if (!text.trim()) {
      imageStatus.textContent = '❌ No text found in the image.';
      imageStatus.className = 'text-sm text-red-600';
      return;
    }

    imageStatus.textContent = '✅ Text extracted! Generating flashcards...';
    document.getElementById('inputText').value = text;
    await generateFlashcards();
    imageStatus.textContent = '';
  } catch (error) {
    imageStatus.textContent = '❌ Failed to scan image. Try another one.';
    imageStatus.className = 'text-sm text-red-600';
  }
}


// 👇 Add this at the bottom of your existing script.js

async function uploadPDF() {
  const fileInput = document.getElementById('pdfFile');
  const pdfStatus = document.getElementById('pdfStatus');
  const container = document.getElementById('flashcards');
  container.innerHTML = '';

  if (!fileInput.files.length) {
    alert('Please select a PDF file.');
    return;
  }

  const file = fileInput.files[0];

  if (file.size > 10 * 1024 * 1024) {
    pdfStatus.textContent = '❌ PDF too large. Please upload < 10MB.';
    pdfStatus.className = 'text-sm text-red-600';
    return;
  }

  pdfStatus.textContent = '📄 Extracting text from PDF...';
  pdfStatus.className = 'text-sm text-gray-600 animate-pulse';

  try {
    const reader = new FileReader();
    reader.onload = async function () {
      const typedArray = new Uint8Array(reader.result);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      if (!fullText.trim()) {
        pdfStatus.textContent = '❌ No text found in PDF.';
        pdfStatus.className = 'text-sm text-red-600';
        return;
      }

      document.getElementById('inputText').value = fullText;
      pdfStatus.textContent = '✅ PDF text extracted! Generating flashcards...';
      await generateFlashcards();
      pdfStatus.textContent = '';
    };

    reader.readAsArrayBuffer(file);
  } catch (err) {
    console.error(err);
    pdfStatus.textContent = '❌ Failed to extract PDF. Please try again.';
    pdfStatus.className = 'text-sm text-red-600';
  }
}


document.getElementById("quizInputType").addEventListener("change", e => {
  const container = document.getElementById("quizInputFields");
  const type = e.target.value;

  const fields = {
    text: `<textarea id="quizText" class="w-full p-2 border rounded-md h-32" placeholder="Paste study notes..."></textarea>`,
    audio: `<input type="file" id="quizAudio" accept="audio/*" class="w-full border p-2 rounded-md" />`,
    image: `<input type="file" id="quizImage" accept="image/*" class="w-full border p-2 rounded-md" />`,
    pdf: `<input type="file" id="quizPDF" accept="application/pdf" class="w-full border p-2 rounded-md" />`
  };

  container.innerHTML = fields[type] || '';
});

// Global Quiz Variables
let quizFlashcards = [];
let quizIndex = 0;
let correctCount = 0;
let wrongCount = 0;

async function startQuizFromInput() {
  const type = document.getElementById("quizInputType").value;
  const questionCountOption = document.getElementById("questionCount").value;
  const customCountValue = document.getElementById("customQuestionCount")?.value;

  // Show loading modal
  showQuizLoader("🔍 Processing your input...");

  const flashcardTextInput = async () => document.getElementById("quizText").value.trim();

  const flashcardAudioInput = async () => {
    updateQuizLoaderMessage("🎵 Transcribing audio...");
    const file = document.getElementById("quizAudio").files[0];
    const formData = new FormData();
    formData.append('audio', file);
    const res = await fetch('/transcribe_audio', { method: 'POST', body: formData });
    const data = await res.json();
    return data.transcript || '';
  };

  const flashcardImageInput = async () => {
    updateQuizLoaderMessage("🖼️ Extracting text from image...");
    const file = document.getElementById("quizImage").files[0];
    const { data: { text } } = await Tesseract.recognize(file, 'eng');
    return text;
  };

  const flashcardPDFInput = async () => {
    updateQuizLoaderMessage("📄 Processing PDF...");
    const file = document.getElementById("quizPDF").files[0];
    const reader = new FileReader();
    return await new Promise(resolve => {
      reader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        let text = '';
        for (let i = 1; i <= Math.min(10, pdf.numPages); i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(' ') + '\n';
        }
        resolve(text);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  let rawText = '';
  try {
    if (type === 'text') rawText = await flashcardTextInput();
    if (type === 'audio') rawText = await flashcardAudioInput();
    if (type === 'image') rawText = await flashcardImageInput();
    if (type === 'pdf') rawText = await flashcardPDFInput();
  } catch (err) {
    hideQuizLoader();
    alert("❌ Failed to extract text. Try again.");
    return;
  }

  if (!rawText.trim()) {
    hideQuizLoader();
    alert("⚠️ Input is empty or invalid.");
    return;
  }

  // Determine desired question count
  let count = 0;
  if (['5', '10', '15'].includes(questionCountOption)) {
    count = parseInt(questionCountOption);
  } else if (questionCountOption === 'custom') {
    const customCount = parseInt(customCountValue);
    if (isNaN(customCount) || customCount <= 0) {
      hideQuizLoader();
      alert("⚠️ Please enter a valid custom number of questions.");
      return;
    }
    count = customCount;
  }

  // Update loader message for AI generation
  updateQuizLoaderMessage("🤖 Generating flashcards with AI...");

  // Request flashcards from backend (directly without using generateFlashcards function)
  try {
    const res = await fetch('/generate_flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText, count })
    });

    const result = await res.json();
    if (result.status !== 'success' || !result.flashcards || result.flashcards.length === 0) {
      hideQuizLoader();
      alert("❌ Could not generate flashcards. Try with better input.");
      return;
    }

    updateQuizLoaderMessage("🎯 Preparing your quiz...");

    quizFlashcards = result.flashcards;
    const maxAvailable = quizFlashcards.length;

    if (count > maxAvailable) {
      hideQuizLoader();
      alert(`⚠️ Only ${maxAvailable} questions available. Starting quiz with all available.`);
      showQuizLoader("🎯 Preparing your quiz...");
    }

    // Shuffle flashcards
    quizFlashcards = quizFlashcards.sort(() => Math.random() - 0.5);

    quizIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    quizStartTime = new Date();

    // Hide loader and show quiz
    hideQuizLoader();
    showNextQuizCard();
    enableQuizSecurity();
    document.getElementById("quizModal").classList.remove("hidden");
    
  } catch (error) {
    hideQuizLoader();
    alert("❌ Failed to generate quiz. Please try again.");
    console.error("Quiz generation error:", error);
  }
}


// ... (all your functions up to showNextQuizCard stay the same)

function showNextQuizCard() {
  if (quizIndex >= quizFlashcards.length) {
    const suggestions = wrongCount > 0
      ? `🧐 Focus on reviewing the topics you missed. Try rephrasing your answers to check understanding.`
      : `🎉 Excellent work! You answered everything correctly.`;

    const securitySummary = securityViolations > 0 ? 
      `<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p class="text-sm text-yellow-800">
          ⚠️ Security Events: ${securityViolations} violations detected<br>
          📷 Screenshot attempts: ${screenshotAttempts}<br>
          🔄 Window switches: ${windowBlurCount}
        </p>
      </div>` : 
      `<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <p class="text-sm text-green-800">✅ No security violations detected</p>
      </div>`;

    document.getElementById("quizModal").innerHTML = `
      <div class="bg-white rounded-xl p-6 max-w-xl w-full text-center">
        <h2 class="text-2xl font-bold text-green-700 mb-4">📊 Quiz Completed</h2>
        <p class="text-lg text-gray-800 mb-2">✅ Correct: ${correctCount}</p>
        <p class="text-lg text-gray-800 mb-4">❌ Incorrect: ${wrongCount}</p>
        <p class="text-gray-600 mb-4">${suggestions}</p>
        ${securitySummary}
        
        <div class="flex justify-center gap-4 mt-6">
          <button onclick="generateQuizReport()" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            📄 Download Report
          </button>
          <button onclick="closeQuiz()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>`;
    
    // Disable security after completion
    disableQuizSecurity();
    return;
  }

  const card = quizFlashcards[quizIndex];
  document.getElementById("quizQuestion").textContent = card.question;
  // document.getElementById("quizProgress").textContent = `Question ${quizIndex + 1} of ${quizFlashcards.length}`;
  document.getElementById("userAnswer").value = '';

  updateQuizProgress(quizIndex + 1, quizFlashcards.length);

}

async function submitQuizAnswer() {
  const userAnswer = document.getElementById("userAnswer").value.trim();
  const correctAnswer = quizFlashcards[quizIndex].answer;

  // Evaluate via backend
  const res = await fetch('/evaluate_answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_answer: userAnswer, correct_answer: correctAnswer })
  });

  const result = await res.json();

  // Save for report
  quizFlashcards[quizIndex].userAnswer = userAnswer;
  quizFlashcards[quizIndex].isCorrect = !!result.correct;

  if (result.correct) {
  correctCount++;
  showFeedback(true);
} else {
  wrongCount++;
  showFeedback(false, correctAnswer);
}


  quizIndex++;
  showNextQuizCard();
}

function closeQuiz() {
  document.getElementById("quizModal").classList.add("hidden");
  disableQuizSecurity(); // Clean up
}


// ✅ NEW FUNCTION: Generate Quiz Report
function generateQuizReport() {
  try {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("PDF library not loaded. Please refresh the page and try again.");
      return;
    }

    if (!quizFlashcards || !quizFlashcards.length) {
      alert("No quiz data found. Please complete a quiz first.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const userName = document.getElementById("userName")?.textContent || "Anonymous";
    const userEmail = document.getElementById("userEmail")?.textContent || "Not provided";
    const timeTaken = quizStartTime ? ((new Date() - quizStartTime) / 1000).toFixed(1) + ' sec' : "N/A";
    const totalQuestions = quizFlashcards.length;
    const accuracy = ((correctCount / totalQuestions) * 100).toFixed(1);

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text("QuizCraft - Quiz Report", 105, 20, { align: "center" });

    // User Info
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(33, 37, 41);
    let y = 30;

    const userInfo = [
      `Name: ${userName}`,
      `Email: ${userEmail}`,
      `Date: ${new Date().toLocaleString()}`,
      `Time Taken: ${timeTaken}`,
      `Total Questions: ${totalQuestions}`,
      `Correct: ${correctCount}`,
      `Incorrect: ${wrongCount}`,
      `Accuracy: ${accuracy}%`
    ];

    userInfo.forEach(line => {
      doc.text(line, 14, y);
      y += 6;
    });

    y += 4;

    // Flashcard QA section
    quizFlashcards.forEach((card, index) => {
      const question = `Q${index + 1}: ${card.question}`;
      const userAnswer = `Your Answer: ${card.userAnswer || 'Not answered'}`;
      const correctAnswer = `Correct Answer: ${card.answer}`;
      const resultText = card.isCorrect ? "Result: Correct" : "Result: Incorrect";
      const resultColor = card.isCorrect ? [34, 197, 94] : [239, 68, 68];

      const wrapText = (text) => doc.splitTextToSize(text, 180);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(wrapText(question), 14, y);
      y += wrapText(question).length * 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(55, 65, 81);
      doc.text(wrapText(userAnswer), 14, y);
      y += wrapText(userAnswer).length * 6;

      doc.text(wrapText(correctAnswer), 14, y);
      y += wrapText(correctAnswer).length * 6;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...resultColor);
      doc.text(resultText, 14, y);
      y += 10;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("QuizCraft_Quiz_Report.pdf");
  } catch (err) {
    console.error("❌ Failed to generate report:", err);
    alert("Something went wrong while generating the report.");
  }
}




async function register() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const result = await res.json();
  alert(result.message);
}

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const result = await res.json();

  if (result.status === 'success') {
    alert("✅ Login successful!");
    location.reload();
  } else {
    alert("❌ " + result.message);
  }
}

// Add this function at the end of script.js
function showLoginRequiredPopup() {
  const popup = document.getElementById('loginRequiredPopup');
  if (!popup) return;
  popup.classList.remove('hidden');
  setTimeout(() => {
    popup.classList.add('hidden');
  }, 3000);
}


function toggleProfileDropdown() {
  const dropdown = document.getElementById('profileDropdown');
  dropdown.classList.toggle('hidden');
}

// Close dropdown on click outside
document.addEventListener('click', function (e) {
  const button = e.target.closest('[onclick="toggleProfileDropdown()"]');
  const dropdown = document.getElementById('profileDropdown');
  if (!button && dropdown && !dropdown.contains(e.target)) {
    dropdown.classList.add('hidden');
  }
});


function updateQuizProgress(current, total) {
  document.getElementById("quizProgress").textContent = `Question ${current} of ${total}`;
  const percentage = (current / total) * 100;
  document.getElementById("quizProgressBar").style.width = `${percentage}%`;
}

function showFeedback(correct, correctAnswer = "") {
  const feedback = document.getElementById("quizFeedback");
  feedback.classList.remove("hidden");

  if (correct) {
    feedback.textContent = "✅ Correct!";
    feedback.className = "bg-green-500 text-white text-center py-2 rounded-lg font-semibold mb-4 transition-all duration-300";
  } else {
    feedback.textContent = `❌ Incorrect. Correct: ${correctAnswer}`;
    feedback.className = "bg-red-500 text-white text-center py-2 rounded-lg font-semibold mb-4 transition-all duration-300";
  }

  setTimeout(() => {
    feedback.classList.add("hidden");
  }, 2000);
}


// 🔒 Enhanced Anti-Cheating Security System
let securityViolations = 0;
let quizMode = false;
let windowBlurCount = 0;
let tabChangeDetected = false;
let screenshotAttempts = 0;

function enableQuizSecurity() {
  quizMode = true;
  securityViolations = 0;
  windowBlurCount = 0;
  tabChangeDetected = false;
  screenshotAttempts = 0;

  // Prevent text selection
  document.getElementById("quizModal").classList.add("select-none");

  // Add all security event listeners
  document.addEventListener("keydown", handleSecurityKeydown);
  document.addEventListener("keyup", handleSecurityKeyup);
  document.addEventListener("contextmenu", disableContextMenu);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleWindowBlur);
  window.addEventListener("focus", handleWindowFocus);
  
  // Advanced screenshot detection methods
  enableScreenshotDetection();
  
  // Monitor for screen recording indicators
  enableScreenRecordingDetection();
  
  // Disable developer tools
  disableDevTools();
  
  showNotification("🔒 Anti-cheating mode activated. Any suspicious activity will end the quiz.", "warning");
}

// Enhanced keyboard event handling
function handleSecurityKeydown(e) {
  const quizVisible = !document.getElementById("quizModal").classList.contains("hidden");
  if (!quizVisible || !quizMode) return;

  // Block dangerous key combinations
  const dangerousKeys = [
    // Screenshot keys
    { key: 'PrintScreen', ctrl: false, alt: false, shift: false },
    { key: 'F12', ctrl: false, alt: false, shift: false }, // Dev tools
    { key: 'I', ctrl: true, alt: false, shift: true }, // Dev tools
    { key: 'J', ctrl: true, alt: false, shift: true }, // Console
    { key: 'U', ctrl: true, alt: false, shift: false }, // View source
    { key: 'S', ctrl: true, alt: false, shift: false }, // Save page
    { key: 'P', ctrl: true, alt: false, shift: false }, // Print
    { key: 'C', ctrl: true, alt: false, shift: false }, // Copy
    { key: 'X', ctrl: true, alt: false, shift: false }, // Cut
    { key: 'V', ctrl: true, alt: false, shift: false }, // Paste
    { key: 'A', ctrl: true, alt: false, shift: false }, // Select all
    { key: 'R', ctrl: true, alt: false, shift: false }, // Refresh
    { key: 'F5', ctrl: false, alt: false, shift: false }, // Refresh
    // Tab switching
    { key: 'Tab', ctrl: true, alt: false, shift: false },
    { key: 'Tab', ctrl: true, alt: false, shift: true },
    // Window switching
    { key: 'Tab', ctrl: false, alt: true, shift: false },
  ];

  const isDangerous = dangerousKeys.some(dk => 
    e.key === dk.key && 
    e.ctrlKey === dk.ctrl && 
    e.altKey === dk.alt && 
    e.shiftKey === dk.shift
  );

  if (isDangerous) {
    e.preventDefault();
    e.stopPropagation();
    recordSecurityViolation(`Blocked key combination: ${e.key}${e.ctrlKey ? '+Ctrl' : ''}${e.altKey ? '+Alt' : ''}${e.shiftKey ? '+Shift' : ''}`);
    return false;
  }
}

function handleSecurityKeyup(e) {
  if (!quizMode) return;
  
  // PrintScreen detection
  if (e.key === "PrintScreen") {
    screenshotAttempts++;
    recordSecurityViolation("Screenshot attempt detected (PrintScreen key)");
    
    // Try to clear clipboard
    try {
      navigator.clipboard.writeText("⚠️ Screenshot disabled during quiz.");
    } catch (err) {
      console.log("Clipboard access denied");
    }
  }
}

// Enhanced screenshot detection
function enableScreenshotDetection() {
  // Monitor clipboard changes (indirect screenshot detection)
  if (navigator.clipboard && navigator.clipboard.read) {
    const checkClipboard = async () => {
      if (!quizMode) return;
      
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
            recordSecurityViolation("Potential screenshot detected in clipboard");
          }
        }
      } catch (err) {
        // Clipboard access denied - this is normal
      }
    };
    
    // Check clipboard periodically
    setInterval(checkClipboard, 2000);
  }
  
  // Monitor for screen sharing (MediaDevices API)
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
    navigator.mediaDevices.getDisplayMedia = function(...args) {
      recordSecurityViolation("Screen sharing/recording attempt detected");
      return Promise.reject(new Error("Screen sharing blocked during quiz"));
    };
  }
}

// Screen recording detection
function enableScreenRecordingDetection() {
  // Monitor for screen recording APIs
  if (window.MediaRecorder) {
    const originalMediaRecorder = window.MediaRecorder;
    window.MediaRecorder = function(...args) {
      recordSecurityViolation("Screen recording attempt detected (MediaRecorder)");
      throw new Error("Recording blocked during quiz");
    };
  }
  
  // Monitor getUserMedia for screen capture
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = function(constraints) {
      if (constraints && constraints.video && constraints.video.mediaSource === 'screen') {
        recordSecurityViolation("Screen capture attempt detected");
        return Promise.reject(new Error("Screen capture blocked during quiz"));
      }
      return originalGetUserMedia.call(this, constraints);
    };
  }
}

// Tab/Window change detection
function handleVisibilityChange() {
  if (!quizMode) return;
  
  if (document.hidden) {
    tabChangeDetected = true;
    recordSecurityViolation("Tab/window switched away from quiz");
  }
}

function handleWindowBlur() {
  if (!quizMode) return;
  
  windowBlurCount++;
  recordSecurityViolation(`Window lost focus (count: ${windowBlurCount})`);
}

function handleWindowFocus() {
  if (!quizMode || !tabChangeDetected) return;
  
  showNotification("⚠️ Window switching detected. This is suspicious behavior.", "error");
}

// Disable developer tools
function disableDevTools() {
  // Monitor console access
  let devtools = {open: false, orientation: null};
  const threshold = 160;
  
  setInterval(() => {
    if (!quizMode) return;
    
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        recordSecurityViolation("Developer tools opened");
      }
    } else {
      devtools.open = false;
    }
  }, 500);
  
  // Detect console usage
  let element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      recordSecurityViolation("Console access detected");
      return '';
    }
  });
  console.log(element);
}

// Security violation handler
function recordSecurityViolation(violation) {
  securityViolations++;
  console.warn(`Security Violation #${securityViolations}: ${violation}`);
  
  // Show warning for first few violations
  if (securityViolations <= 3) {
    showNotification(`⚠️ Security Warning: ${violation}. ${3 - securityViolations + 1} warnings remaining before quiz termination.`, "error");
  }
  
  // Auto-end quiz after multiple violations
  if (securityViolations >= 3) {
    endQuizDueToViolation(violation);
  }
}

// Force end quiz due to security violation
function endQuizDueToViolation(finalViolation) {
  quizMode = false;
  
  document.getElementById("quizModal").innerHTML = `
    <div class="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg w-full text-center">
      <div class="text-6xl mb-4">🚫</div>
      <h2 class="text-2xl font-bold text-red-700 mb-4">Quiz Terminated</h2>
      <p class="text-red-600 mb-4">
        <strong>Reason:</strong> Multiple security violations detected
      </p>
      <p class="text-gray-600 mb-4">
        <strong>Final violation:</strong> ${finalViolation}
      </p>
      <p class="text-sm text-gray-500 mb-6">
        Total violations: ${securityViolations}<br>
        Quiz progress lost due to suspicious activity.
      </p>
      <button onclick="closeQuiz()" class="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700">
        Close Quiz
      </button>
    </div>`;
  
  disableQuizSecurity();
  showNotification("🚫 Quiz terminated due to security violations!", "error");
}

// 🔓 Re-enable after quiz
function disableQuizSecurity() {
  quizMode = false;
  
  document.getElementById("quizModal").classList.remove("select-none");
  
  // Remove all security event listeners
  document.removeEventListener("keydown", handleSecurityKeydown);
  document.removeEventListener("keyup", handleSecurityKeyup);
  document.removeEventListener("contextmenu", disableContextMenu);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("blur", handleWindowBlur);
  window.removeEventListener("focus", handleWindowFocus);
  
  // Reset security counters
  securityViolations = 0;
  windowBlurCount = 0;
  tabChangeDetected = false;
  screenshotAttempts = 0;
  
  showNotification("🔓 Anti-cheating mode deactivated", "success");
}

function disableContextMenu(e) {
  const quizVisible = !document.getElementById("quizModal").classList.contains("hidden");
  if (quizVisible && quizMode) {
    e.preventDefault();
    recordSecurityViolation("Right-click attempted during quiz");
  }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existing = document.querySelector('.security-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `security-notification fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
    type === 'error' ? 'bg-red-500 text-white' :
    type === 'warning' ? 'bg-yellow-500 text-black' :
    type === 'success' ? 'bg-green-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Handle paste attempts in answer field
function handleAnswerPaste(event) {
  if (quizMode) {
    event.preventDefault();
    recordSecurityViolation("Paste attempt in answer field");
    showNotification("❌ Pasting is not allowed during the quiz!", "error");
    return false;
  }
}

// Quiz Loader Functions
function showQuizLoader(message = "⚡ Generating quiz...") {
  // Hide any existing loaders from flashcard generation
  const existingLoader = document.getElementById('loadingText');
  if (existingLoader) {
    existingLoader.style.display = 'none';
  }
  
  // Remove any existing quiz loader
  const existingQuizLoader = document.getElementById("quizLoader");
  if (existingQuizLoader) {
    existingQuizLoader.remove();
  }
  
  // Create new loader modal
  const loaderModal = document.createElement("div");
  loaderModal.id = "quizLoader";
  loaderModal.className = "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50";
  
  loaderModal.innerHTML = `
    <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
      <div class="mb-6">
        <div class="loader-spinner mx-auto mb-4"></div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">Creating Your Quiz</h3>
        <p id="loaderMessage" class="text-gray-600">${message}</p>
      </div>
      <div class="bg-gray-200 rounded-full h-2 mb-4">
        <div class="loader-progress bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-1000"></div>
      </div>
      <p class="text-sm text-gray-500">Please wait while we process your content...</p>
    </div>
  `;
  
  document.body.appendChild(loaderModal);
  
  // Add CSS for spinner and progress bar if not already added
  if (!document.querySelector('#loaderStyles')) {
    const style = document.createElement('style');
    style.id = 'loaderStyles';
    style.textContent = `
      .loader-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f4f6;
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loader-progress {
        width: 0%;
        animation: progress 3s ease-in-out infinite;
      }
      
      @keyframes progress {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }
}

function updateQuizLoaderMessage(message) {
  const loaderMessage = document.getElementById("loaderMessage");
  if (loaderMessage) {
    loaderMessage.textContent = message;
  }
}

function hideQuizLoader() {
  const loaderModal = document.getElementById("quizLoader");
  if (loaderModal) {
    loaderModal.remove();
  }
  
  // Restore any hidden flashcard loaders
  const existingLoader = document.getElementById('loadingText');
  if (existingLoader) {
    existingLoader.style.display = '';
  }
}
