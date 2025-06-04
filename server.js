const express = require("express");
const multer = require("multer");
const fs = require("fs");
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const cors = require("cors");
const path = require("path");
const mammoth = require("mammoth");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve the frontend HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Use relative path - this will work in both local and tunnel environments
const TEMPLATE_PATH = path.join(__dirname, "Assets", "template.docx");

// Alternative paths to try
const POSSIBLE_PATHS = [
  path.join(__dirname, "Assets", "template.docx"),
  path.join(__dirname, "template.docx"),
  path.join(process.cwd(), "Assets", "template.docx"),
  path.join(process.cwd(), "template.docx")
];

function findTemplateFile() {
  for (const templatePath of POSSIBLE_PATHS) {
    if (fs.existsSync(templatePath)) {
      console.log(`✅ Found template at: ${templatePath}`);
      return templatePath;
    }
  }
  return null;
}




// DOCX → PDF conversion
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const inputPath = req.file.path;
  const file = fs.readFileSync(inputPath);
  const outputExt = ".pdf";

  libre.convert(file, outputExt, undefined, (err, done) => {
    if (err) {
      console.error("❌ Conversion failed:", err);
      return res.status(500).send("Conversion failed");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=converted.pdf");
    res.send(done);

    // Cleanup
    fs.unlinkSync(inputPath);
  });
});





app.post("/generate-docx", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Missing 'data' field in request body" });
    }

    // Find the template file
    const templatePath = findTemplateFile();
    
    if (!templatePath) {
      console.error("❌ Template file not found in any of these locations:");
      POSSIBLE_PATHS.forEach(p => console.error(`   - ${p}`));
      console.error("📁 Current working directory:", process.cwd());
      console.error("📁 __dirname:", __dirname);
      
      return res.status(500).json({ 
        error: "Template file not found",
        searchedPaths: POSSIBLE_PATHS,
        currentDir: process.cwd(),
        dirname: __dirname
      });
    }

    // Check file stats
    const stats = fs.statSync(templatePath);
    console.log(`📄 Template file size: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      console.error("❌ Template file is empty");
      return res.status(500).json({ error: "Template file is empty" });
    }

    // Load the template file
    const buffer = fs.readFileSync(templatePath);
    console.log(`📥 Read buffer size: ${buffer.length} bytes`);

    // Create PizZip instance
    const zip = new PizZip(buffer);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    // Render with data
    console.log("🔄 Rendering document with data:", Object.keys(data));
    doc.render(data);

    const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });
    console.log("✅ Document generated successfully");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Disposition", "attachment; filename=result.docx");
    res.send(docxBuffer);

  } catch (err) {
    console.error("❌ Docx generation failed:", err.message);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ 
      error: err.message,
      details: "Check server logs for more information"
    });
  }
});





// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📁 Current working directory: ${process.cwd()}`);
  console.log(`📁 __dirname: ${__dirname}`);
  
  const templatePath = findTemplateFile();
  if (templatePath) {
    console.log(`✅ Template found at: ${templatePath}`);
  } else {
    console.log("❌ Template file not found!");
  }
});
