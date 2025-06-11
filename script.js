// Helper functions
const $ = s => document.querySelector(s);
const download = (blob, name) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

// Setup Ace Editor
const editor = ace.edit('editor');
editor.setTheme('ace/theme/tomorrow_night_bright');
editor.session.setMode('ace/mode/json');
editor.setOptions({ fontSize: '14px', wrap: true });
editor.setValue(JSON.stringify({CourseTitle:"Sample Course",CourseCode:"CS101"}, null, 2), -1);

// Template preview in n8n card
const templateUrl = "https://github.com/MrU52/GitHubBasics/raw/refs/heads/main/Assets/template.docx";
$('#templatePreview').src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(templateUrl)}`;
$('#currentTemplate').textContent = 'Default (GitHub)';

// Setup dropzones
function setupDropzone(dropId, fileId, infoId, onFile) {
  const drop = $(dropId);
  const file = $(fileId);
  const info = $(infoId);
  
  drop.onclick = () => file.click();
  file.onchange = e => {
    const f = e.target.files[0];
    if (f) {
      info.textContent = `📄 ${f.name}`;
      onFile(f);
    }
  };
  
  ['dragover', 'dragenter'].forEach(e => 
    drop.addEventListener(e, evt => {
      evt.preventDefault();
      drop.classList.add('drag');
    })
  );
  
  ['dragleave', 'drop'].forEach(e => 
    drop.addEventListener(e, () => drop.classList.remove('drag'))
  );
  
  drop.ondrop = e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      info.textContent = `📄 ${f.name}`;
      onFile(f);
    }
  };
}

// n8n Upload with Template Preview
let n8nUploadFile;
setupDropzone('#n8nDrop', '#n8nFile', '#n8nInfo', f => n8nUploadFile = f);

$('#n8nBtn').onclick = async () => {
  if (!n8nUploadFile) {
    $('#n8nStatus').textContent = '❌ No file selected';
    return;
  }
  
  const fd = new FormData();
  fd.append('file', n8nUploadFile);
  $('#n8nStatus').textContent = '⏳ Processing with n8n...';
  
  try {
    const res = await fetch('https://sarulo.app.n8n.cloud/webhook/699ce86b-374a-4eaf-bbd8-23e18801e84d', {
      method: 'POST',
      body: fd
    });
    
    if (!res.ok) throw Error('Upload failed');
    const blob = await res.blob();
    download(blob, 'processed_course_spec.docx');
    $('#n8nStatus').textContent = '✅ File processed and downloaded!';
  } catch (err) {
    $('#n8nStatus').textContent = '❌ ' + err.message;
  }
};

// Template mode switching
const samples = {
  default: { CourseTitle: 'Sample Course', CourseCode: 'CS101' },
  url: { templateUrl: 'https://example.com/template.docx', data: { CourseTitle: 'Web Dev' } },
  upload: { CourseTitle: 'Uploaded Template', CourseCode: 'UPLOAD123' }
};

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const mode = btn.dataset.mode;
    $('#urlField').style.display = mode === 'url' ? 'block' : 'none';
    $('#fileField').style.display = mode === 'upload' ? 'block' : 'none';
    
    editor.setValue(JSON.stringify(samples[mode], null, 2), -1);
  });
});

// DOCX Generator
$('#genBtn').onclick = async () => {
  let data;
  try {
    data = JSON.parse(editor.getValue());
  } catch {
    $('#genStatus').textContent = '❌ Invalid JSON';
    return;
  }
  
  const tplFile = $('#templateFile').files[0];
  const tplURL = $('#templateUrl')?.value.trim() || '';
  
  $('#genStatus').textContent = '⏳ Generating...';
  $('#genBtn').disabled = true;
  
  try {
    let body, headers = {};
    
    if (tplFile) {
      const fd = new FormData();
      fd.append('template', tplFile);
      fd.append('data', JSON.stringify(data));
      body = fd;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(Object.assign({ data }, tplURL ? { templateUrl: tplURL } : {}));
    }
    
    const res = await fetch('/generate-docx', {
      method: 'POST',
      headers,
      body
    });
    
    if (!res.ok) throw Error('Generation failed');
    const blob = await res.blob();
    download(blob, 'course-spec.docx');
    $('#genStatus').textContent = '✅ Generated!';
  } catch (err) {
    $('#genStatus').textContent = '❌ ' + err.message;
  }
  
  $('#genBtn').disabled = false;
};

// Template preview
const defaultTemplateUrl = "https://github.com/MrU52/GitHubBasics/raw/refs/heads/main/Assets/template.docx";
$('#templatePreview').src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(defaultTemplateUrl)}`;
$('#currentTemplate').textContent = 'Default (GitHub)';

// PDF Converter
let pdfConvertFile;
setupDropzone('#pdfDrop', '#pdfFile', '#pdfInfo', f => {
  pdfConvertFile = f;
  $('#pdfBtn').disabled = false;
});

$('#pdfBtn').onclick = async () => {
  if (!pdfConvertFile) return;
  
  $('#pdfStatus').textContent = '⏳ Converting...';
  $('#pdfBtn').disabled = true;
  
  const fd = new FormData();
  fd.append('file', pdfConvertFile);
  
  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: fd
    });
    
    if (!res.ok) throw Error('Conversion failed');
    const blob = await res.blob();
    download(blob, 'converted.pdf');
    $('#pdfStatus').textContent = '✅ Converted!';
  } catch (err) {
    $('#pdfStatus').textContent = '❌ ' + err.message;
  }
  
  $('#pdfBtn').disabled = false;
};