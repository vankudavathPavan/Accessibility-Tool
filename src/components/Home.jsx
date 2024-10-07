import React, { useState, useEffect } from "react";

const Home = () => {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [translations, setTranslations] = useState({}); // State to store translations
  const [popupContent, setPopupContent] = useState(""); // State to manage popup content
  const [isPopupVisible, setIsPopupVisible] = useState(false); // State for popup visibility

  const recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.interimResults = false; // Get only final results
  recognition.lang = language; // Set language

  let inactivityTimer;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url) {
      fetchContent(url);
    }
  };

  const startListening = () => {
    console.log("Starting recognition in language:", language);
    recognition.start();
    resetInactivityTimer();
  };

  const stopListening = () => {
    console.log("Stopping recognition");
    setIsListening(false);
    recognition.stop();
    clearTimeout(inactivityTimer);
  };

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log("Recognized command:", command);
    handleCommand(command);
    resetInactivityTimer();

    // Restart recognition after a short delay
    setTimeout(() => {
      console.log("Restarting recognition");
      recognition.start(); // Restart recognition to keep listening
    }, 500);
  };

  const handleCommand = (command) => {
    const currentLanguage = recognition.lang;

    // Handle commands in English
    if (currentLanguage === "en-US") {
      if (command.includes("scroll down")) {
        window.scrollBy(0, 100); // Scroll down
      } else if (command.includes("scroll up")) {
        window.scrollBy(0, -100); // Scroll up
      }
    }

    // Handle commands in Hindi
    else if (currentLanguage === "hi-IN") {
      if (command.includes("नीचे स्क्रॉल करें") || command.includes("नीचे")) {
        window.scrollBy(0, 100); // Scroll down
      } else if (
        command.includes("ऊपर स्क्रॉल करें") ||
        command.includes("ऊपर")
      ) {
        window.scrollBy(0, -100); // Scroll up
      }
    }

    // Handle commands in Telugu
    else if (currentLanguage === "te-IN") {
      if (
        command.includes("క్రిందకు స్క్రోల్ చేయి") ||
        command.includes("క్రిందకి")
      ) {
        window.scrollBy(0, 100); // Scroll down
      } else if (
        command.includes("పైకి స్క్రోల్ చేయి") ||
        command.includes("పైకి")
      ) {
        window.scrollBy(0, -100); // Scroll up
      }
    }
  };

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.log("Stopping recognition after 30 seconds of inactivity");
      stopListening();
    }, 30000);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  const fetchContent = async (url) => {
    try {
      const response = await fetch("http://localhost:5000/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      const html = await response.text();
      setContent(html);
    } catch (error) {
      console.error("Error fetching content:", error);
    }
  };

  const translateParagraph = async (text, targetLang, index) => {
    try {
      const response = await fetch("http://localhost:5000/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, target_lang: targetLang }),
      });
      const translatedText = await response.text();
      setTranslations((prev) => ({
        ...prev,
        [index]: translatedText,
      }));

      // Show popup after translation
      setPopupContent(translatedText); // Set the content for the popup
      setIsPopupVisible(true); // Show the popup
    } catch (error) {
      console.error("Error translating text:", error);
    }
  };

  const addSpeakerButtons = () => {
    const paragraphs = document.querySelectorAll("#content p");
    paragraphs.forEach((p, index) => {
      if (!p.classList.contains("speaker-added")) {
        const speakerButton = document.createElement("button");
        speakerButton.innerHTML = "🔊";
        speakerButton.classList.add(
          "speaker",
          "ml-2",
          "cursor-pointer",
          "text-blue-600",
          "hover:text-blue-800"
        );
        speakerButton.onclick = function () {
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            var msg = new SpeechSynthesisUtterance();
            msg.text = p.innerText;
            msg.lang = "en-US";
            window.speechSynthesis.speak(msg);
          }
        };
        p.insertAdjacentElement("afterend", speakerButton);
        p.classList.add("speaker-added");

        const translateButton = document.createElement("button");
        translateButton.innerHTML = "🌐 Translate";
        translateButton.classList.add(
          "translate",
          "ml-2",
          "cursor-pointer",
          "text-green-600",
          "hover:text-green-800"
        );
        translateButton.onclick = async function () {
          const targetLang = prompt("Enter target language code (e.g., 'en', 'hi', 'te'):");
          if (targetLang) {
            await translateParagraph(p.innerText, targetLang, index);
          }
        };
        p.insertAdjacentElement("afterend", translateButton);
      }
    });
  };

  const closePopup = () => {
    setIsPopupVisible(false); // Close the popup
  };

  const addClickListener = () => {
    const links = document.querySelectorAll("#content a");
    links.forEach((link) => {
      link.onclick = function (event) {
        event.preventDefault();
        console.log("clicked");
      };
    });

    const images = document.querySelectorAll("#content img");
    images.forEach((img) => {
      img.onclick = function (event) {
        console.log("clicked on image");
      };
    });
  };

  useEffect(() => {
    if (content) {
      addSpeakerButtons();
      addClickListener();
    }
  }, [content]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Fetch and Speak Webpage Content
      </h1>

      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        <div className="flex items-center border-b border-teal-500 py-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
            placeholder="Enter URL"
          />
          <button
            type="submit"
            className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 text-sm text-white py-2 px-4 rounded"
          >
            Fetch
          </button>
        </div>
      </form>


      <div className="mt-4">
        <label htmlFor="language" className="mr-2">
          Select Language:
        </label>
        <select
          id="language"
          value={language}
          onChange={handleLanguageChange}
          className="p-2 rounded bg-white border"
        >
          <option value="en-US">English (US)</option>
          <option value="hi-IN">Hindi</option>
          <option value="te-IN">Telugu</option>
        </select>
      </div>
      <button
        onClick={() => {
          setIsListening(!isListening);
          if (!isListening) {
            startListening();
            setIsListening(true);
          } else {
            stopListening();
          }
        }}
        className={`mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
      >
        {isListening ? "Stop Listening" : "Start Listening"}
      </button>

      <div
        id="content"
        className="mt-8 p-4 bg-white rounded shadow-md w-full px-4 overflow-auto"
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>

      {/* Popup for translation */}
      {isPopupVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-red-500"
              onClick={closePopup}
            >
              ✖️
            </button>
            <h2 className="text-xl font-semibold">Translation</h2>
            <p className="mt-4">{popupContent}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
