const express = require('express');
const fileUpload = require('express-fileupload');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(fileUpload());

// Create upload and zip directories if they don't exist
const uploadDir = path.join(__dirname, 'upload');
const zipDir = path.join(__dirname, 'zip');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(zipDir, { recursive: true });

app.get('/hello', function (req, res) {
  res.send('Hello World');
});

app.post('/compressPPT', async (req, res) => {
  if (!req.files || !req.files.pptFile) {
    return res.status(400).send('No files were uploaded.');
  }

  try {
    const pptFile = req.files.pptFile;
    const fileName = pptFile.name;
    const uploadFilePath = path.join(uploadDir, fileName);
    const zipFilePath = path.join(zipDir, `${fileName}.zip`);

    // Save the uploaded file to the upload directory
    await pptFile.mv(uploadFilePath);

    // Compress the file
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Set compression level (0-9)
    });

    output.on('close', () => {
      console.log('Archive finalized');
      res.sendFile(`${fileName}.zip`, { root: zipDir });
    });

    archive.pipe(output);
    archive.append(fs.createReadStream(uploadFilePath), { name: fileName });
    archive.finalize();
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
