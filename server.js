// Required dependencies
const express = require("express");
const multer = require("multer"); // Middleware for handling file uploads
const fs = require("fs"); // File system module for reading/writing files
const path = require("path"); // Helps build file paths
const cors = require("cors"); // Cross-origin support
const libre = require("libreoffice-convert"); // DOCX → PDF conversion
const PizZip = require("pizzip"); // Zips/unzips DOCX files (they're ZIP files)
const Docxtemplater = require("docxtemplater"); // For filling template DOCX files



// Initialize express app
const app = express();
app.use(express.static(path.join(__dirname)));

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: "10mb" })); // Parse incoming JSON (up to 10MB)

// Path to the template used in DOCX generation
const TEMPLATE_PATH = path.join(__dirname, "Assets", "template.docx");

// File upload config — multer stores uploaded files in /uploads
const upload = multer({ dest: "uploads/" });

// Serve frontend HTML when visiting root URL (useful for testing)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


// ========== [ POST /generate-docx ] ==========
// Accepts JSON data and fills a Word (DOCX) template with it
// Responds with a downloadable .docx file

const axios = require("axios");
const DEFAULT_TEMPLATE_PATH = path.join(__dirname, "Assets", "template.docx");

app.post("/generate-docx", upload.single("template"), async (req, res) => {
  try {
    // Parse incoming data depending on content type
    let jsonData;
    let templateBuffer;
    let templateSource = '';

    const hasFile = req.file != null;
    const hasUrl = req.body.templateUrl;
    const hasData = req.body.data;

    // 📌 Parse `data` safely
    try {
      jsonData = typeof req.body.data === "string"
        ? JSON.parse(req.body.data)
        : req.body.data;
    } catch (e) {
      return res.status(400).json({ error: "❌ Invalid JSON in 'data'" });
    }

    // 🧩 Choose template source: uploaded file > templateUrl > default
    if (hasFile) {
      templateSource = `📎 Uploaded: ${req.file.originalname}`;
      templateBuffer = fs.readFileSync(req.file.path);
      fs.unlinkSync(req.file.path); // Clean up temp file
    } else if (hasUrl) {
      templateSource = `🌐 From URL: ${req.body.templateUrl}`;
      const response = await axios.get(req.body.templateUrl, { responseType: "arraybuffer" });
      templateBuffer = Buffer.from(response.data);
    } else {
      templateSource = `📁 Default template`;
      templateBuffer = fs.readFileSync(DEFAULT_TEMPLATE_PATH);
    }

    // 🧠 Render DOCX with docxtemplater
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(jsonData);
    const output = doc.getZip().generate({ type: "nodebuffer" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=result.docx");
    res.setHeader("X-Template-Source", templateSource.replace(/[^\x20-\x7E]/g, ''));
    res.send(output);
  } catch (err) {
    console.error("❌ DOCX generation error:", err);
    res.status(500).json({ error: err.message });
  }
});






// ========== [ POST /upload ] ==========
// Accepts a DOCX file and converts it to PDF using LibreOffice
// Returns a PDF file in the response
app.post("/upload", upload.single("file"), (req, res) => {
  // Ensure a file was uploaded
  if (!req.file) return res.status(400).send("No file uploaded");

  const inputPath = req.file.path;
  const inputBuffer = fs.readFileSync(inputPath);

  // Convert DOCX buffer to PDF using LibreOffice
  libre.convert(inputBuffer, ".pdf", undefined, (err, pdfBuffer) => {
    // Always remove the uploaded temp file
    fs.unlinkSync(inputPath);

    if (err) {
      console.error("❌ PDF conversion error:", err);
      return res.status(500).send("Conversion failed");
    }

    // Send the converted PDF back to the client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=converted.pdf");
    res.send(pdfBuffer);
  });
});



// ========== [ Start Server ] ==========
// Launch the Express app on specified port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📄 Using template: ${TEMPLATE_PATH}`);
  console.log("Incoming request:");

});
