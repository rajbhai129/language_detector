import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import fs from 'fs';

const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static("public"));

const config = {
  headers: { Authorization: `Bearer ${process.env.API_KEY}` },
};

// Load API key from a file instead of hardcoding it
const apiKey = fs.readFileSync('apiKey.txt', 'utf-8').trim();
process.env.API_KEY = apiKey; // Store it as an environment variable for easy access

// Global variable to store language codes and their full names
let languageMapping = {};

// Function to fetch and map language list
async function fetchLanguageList() {
  try {
    const response = await axios.get("https://ws.detectlanguage.com/0.2/languages", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    response.data.forEach((lang) => {
      languageMapping[lang.code] = lang.name; // Map code to full name
    });
    console.log("Language mapping fetched successfully!");
  } catch (error) {
    console.error("Error fetching language list:", error.message);
  }
}

// Fetch language mapping once when the server starts
fetchLanguageList();

app.get("/", (req, res) => {
  res.render("index.ejs", { language: "" });
});

app.post("/submit", async (req, res) => {
  const text = req.body['input-text']; // Correctly reading input
  try {
    const params = new URLSearchParams(); // To send data as 'application/x-www-form-urlencoded'
    params.append('q', text);

    const apiOutput = await axios.post(
      "https://ws.detectlanguage.com/0.2/detect",
      params, 
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    // Extract detected language
    const detectedLangCode = apiOutput.data.data.detections[0]?.language;

    // Convert language code to full name
    const languageFullName = languageMapping[detectedLangCode] || detectedLangCode || "Unknown";

    res.render("index.ejs", { language: languageFullName });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.render("index.ejs", { language: "Error detecting language" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
