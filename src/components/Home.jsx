import React, { useState, useEffect } from "react";

const Home = () => {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState("en-US"); // Default language is English

  const recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.interimResults = false; // Get only final results
  recognition.lang = language; // Set language

  let inactivityTimer;

  // Handle URL form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (url) {
      fetchContent(url);
    }
  };

  // Start speech recognition
  const startListening = () => {
    console.log("Starting recognition in language:", language);
    recognition.start();
    resetInactivityTimer(); // Start the inactivity timer
  };

  const stopListening = () => {
    console.log("Stopping recognition");
    setIsListening(false);
    recognition.stop();
    clearTimeout(inactivityTimer); // Clear the inactivity timer
  };

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log("Recognized command:", command); // Debugging log
    handleCommand(command);
    resetInactivityTimer(); // Reset the inactivity timer on command

    // Restart recognition after a short delay
    setTimeout(() => {
      console.log("Restarting recognition");
      recognition.start(); // Restart recognition to keep listening
    }, 500); // Small delay before restarting
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

  // Reset the inactivity timer
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.log("Stopping recognition after 30 seconds of inactivity");
      stopListening(); // Stop listening after 30 seconds of inactivity
    }, 30000);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value); // Change the language
  };

  // Fetch content from the Flask backend
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

  // Function to add speaker buttons after content is fetched
  const addSpeakerButtons = () => {
    const paragraphs = document.querySelectorAll("#content p");
    paragraphs.forEach((p) => {
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
            window.speechSynthesis.cancel(); // Stop any ongoing speech
            var msg = new SpeechSynthesisUtterance();
            msg.text = p.innerText; // Get the text of the paragraph
            msg.lang = "en-US"; // Set the language
            window.speechSynthesis.speak(msg); // Speak the text
          }
        };
        p.insertAdjacentElement("afterend", speakerButton); // Add button after each paragraph
        p.classList.add("speaker-added"); // Mark paragraph as having a speaker button
      }
    });
  };

  // Function to add click event listeners to every link containing an image
  const addClickListener = () => {
    const links = document.querySelectorAll("#content a"); // Select all anchor tags
    links.forEach((link) => {
      // Replace existing click event listener
      link.onclick = function (event) {
        event.preventDefault(); // Prevent the default link behavior
        console.log("clicked");
      };
    });

    // Select all images
    const images = document.querySelectorAll("#content img");
    images.forEach((img) => {
      img.onclick = function (event) {
        console.log("clicked on image"); // Log when the image is clicked
      };
    });
  };

  // useEffect to add click listeners to images after content is rendered
  useEffect(() => {
    if (content) {
      addSpeakerButtons(); // Existing function to add speaker buttons
      addClickListener(); // Function to replace the click listeners for links
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

      <div className="mt-4">
        <button
          onClick={() => {
            if (!isListening) startListening();
            else stopListening();
            setIsListening(!isListening);
          }}
          className={`${
            isListening ? "bg-red-500" : "bg-blue-500"
          } hover:bg-blue-700 text-white font-bold py-2 px-4 rounded`}
        >
          {isListening ? "Listening..." : "Start Listening"}
        </button>
      </div>

      <div
        id="content"
        className="mt-8 bg-white shadow-md p-4 rounded w-full px-4 overflow-auto"
      >
        <div dangerouslySetInnerHTML={{ __html: content }}></div>
      </div>
    </div>
  );
};

export default Home;
