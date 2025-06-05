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
app.post("/generate-docx", async (req, res) => {
  try {
    const { data } = req.body;

    // Reject if no data provided
    if (!data) return res.status(400).json({ error: "Missing 'data' field" });

    // Read and load the fixed template file
    const buffer = fs.readFileSync(TEMPLATE_PATH);
    const zip = new PizZip(buffer);

    // Create templater and render with provided data
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });
    doc.render(data);

    // Generate final DOCX buffer
    const output = doc.getZip().generate({ type: "nodebuffer" });

    // Send response with correct headers to prompt file download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=result.docx");
    res.send(output);

  } catch (err) {
    // Log error and return generic message
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
});
