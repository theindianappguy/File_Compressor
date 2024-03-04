const express = require('express');
const fileUpload = require('express-fileupload');
const archiver = require('archiver');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();
app.use(express.json());
app.use(fileUpload());

// Create upload and zip directories if they don't exist
const uploadDir = path.join(__dirname, 'upload');
const zipDir = path.join(__dirname, 'zip');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(zipDir, { recursive: true });
} catch (error) {
  console.error("Error creating directories:", error);
}

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

    archive.pipe(output);
    archive.append(fs.createReadStream(uploadFilePath), { name: fileName });
    archive.finalize();

    output.on('close', function () {
      res.download(zipFilePath, `${fileName}.zip`, function (err) {
        if (err) {
          console.error("Error sending zip file:", err);
          res.status(500).end();
        } else {
          // Clean up uploaded file after sending
          fs.unlinkSync(uploadFilePath);
        }
      });
    });
  } catch (error) {
    console.error("Error compressing PPT:", error);
    res.status(500).json(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
