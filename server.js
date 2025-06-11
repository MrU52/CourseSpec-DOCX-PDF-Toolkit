const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const libre = require("libreoffice-convert");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const axios = require("axios");

const app = express();
const upload = multer({ dest: "uploads/" });
const DEFAULT_TEMPLATE_PATH = path.join(__dirname, "Assets", "template.docx");

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname));

// Generate DOCX from JSON data
app.post("/generate-docx", upload.single("template"), async (req, res) => {
  try {
    let jsonData;
    let templateBuffer;
    
    // Parse data - handle both JSON body and multipart form data
    if (req.file) {
      // File upload mode - data is in req.body as string
      jsonData = JSON.parse(req.body.data);
    } else {
      // JSON mode - check if data exists
      if (!req.body || !req.body.data) {
        return res.status(400).json({ error: "No data provided" });
      }
      jsonData = typeof req.body.data === "string" 
        ? JSON.parse(req.body.data) 
        : req.body.data;
    }
    
    // Get template: uploaded file > URL > default
    if (req.file) {
      templateBuffer = fs.readFileSync(req.file.path);
      fs.unlinkSync(req.file.path);
    } else if (req.body && req.body.templateUrl) {
      const response = await axios.get(req.body.templateUrl, { responseType: "arraybuffer" });
      templateBuffer = Buffer.from(response.data);
    } else {
      templateBuffer = fs.readFileSync(DEFAULT_TEMPLATE_PATH);
    }
    
    // Generate DOCX
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    doc.render(jsonData);
    const output = doc.getZip().generate({ type: "nodebuffer" });
    
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=result.docx");
    res.send(output);
  } catch (err) {
    console.error("DOCX generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Convert DOCX to PDF
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  
  const inputPath = req.file.path;
  const inputBuffer = fs.readFileSync(inputPath);
  
  libre.convert(inputBuffer, ".pdf", undefined, (err, pdfBuffer) => {
    fs.unlinkSync(inputPath);
    
    if (err) {
      console.error("PDF conversion error:", err);
      return res.status(500).send("Conversion failed");
    }
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=converted.pdf");
    res.send(pdfBuffer);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});