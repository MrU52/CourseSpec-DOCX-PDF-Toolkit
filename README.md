# CourseSpec - DOCX & PDF Toolkit

A web application designed to process old course specification files through n8n workflows and generate new formatted documents using templates.

## Main Purpose

Upload your old course specification files (DOCX/PDF) to an n8n workflow that:
1. Extracts data from your old file
2. Maps it to a new template structure
3. Returns a newly formatted document

## Features

1. **n8n Upload & Processing** 
   - Preview of the new template structure
   - Upload old DOCX/PDF files to n8n webhook
   - n8n workflow extracts and processes the data
   - Returns a new document with data in the new template format
   

2. **Manual DOCX Generator** 
   - Create DOCX files from JSON data manually
   - Support for default template, URL-based templates, or uploaded templates

3. **PDF Converter** 
   - Convert DOCX files to PDF format

## Prerequisites

- Node.js (v14 or higher)
- LibreOffice installed on your system (for PDF conversion)

## Installation

1. Clone this repository
2. Install dependencies:
```bash
npm install express multer cors libreoffice-convert pizzip docxtemplater axios
```

3. Create an `Assets` folder and add your DOCX template file named `template.docx`

## How It Works

1. **Upload Old File**: Use the first card to upload your old course specification file
2. **n8n Processing**: The file is sent to the n8n webhook where:
   - Data is extracted from the old format
   - Mapped to the new template structure
   - A new DOCX file is generated
3. **Download Result**: The processed file with the new format is automatically downloaded

## Usage

1. Start the server:
```bash
node server.js
```

2. Open your browser and navigate to `http://localhost:3000`

3. Use the web interface:
   - **n8n Upload (Main Feature)**: 
     - Drop or select your old course specification file
     - Click "Send File" to process through n8n
     - Preview shows the template that will be used for the new format
     - Download the processed file with data in the new template
   - **Manual DOCX Generator**: 
     - For creating DOCX files from scratch with JSON data
   - **PDF Converter**: 
     - Convert any DOCX file to PDF

## Project Structure

```
├── index.html      # Main UI
├── style.css       # Styling
├── script.js       # Client-side JavaScript
├── server.js       # Express server
├── Assets/         # Template folder
│   └── template.docx
└── uploads/        # Temporary upload folder (auto-created)
```

## API Endpoints

- `POST /generate-docx` - Generate DOCX from JSON data
- `POST /upload` - Convert DOCX to PDF

## Configuration

- Default port: 3000 (change with `PORT` environment variable)
- **n8n webhook URL**: Update in `script.js` to point to your n8n workflow
- Template path: `Assets/template.docx`
- The n8n workflow should:
  - Accept the uploaded file
  - Extract data from the old format
  - Apply the data to the new template
  - Return the processed DOCX file

## Dependencies

- **express** - Web server framework
- **multer** - File upload handling
- **cors** - Cross-origin resource sharing
- **libreoffice-convert** - DOCX to PDF conversion
- **pizzip** - ZIP file manipulation for DOCX
- **docxtemplater** - Template-based DOCX generation

## Notes

- Ensure LibreOffice is installed for PDF conversion to work
- The n8n webhook URL in the client code needs to be updated to your own webhook
- Template DOCX files should use docxtemplater syntax for variable placeholders (e.g., `{CourseTitle}`)

