const express = require('express');
const multer = require('multer');
const archiver = require('archiver');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'upload'); // Files will be uploaded to the 'upload' directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original filename
  }
});

const upload = multer({ storage });

app.use(express.json());

// Create upload and zip directories if they don't exist
const uploadDir = path.join(__dirname, 'upload');
const zipDir = path.join(__dirname, 'zip');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(zipDir, { recursive: true });

app.get('/hello', function (req, res) {
  res.send('Hello World');
});

app.post('/compressPPT', upload.single('pptFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }

  try {
    const fileName = req.file.originalname;
    const uploadFilePath = path.join(uploadDir, fileName);
    const zipFilePath = path.join(zipDir, `${fileName}.zip`);

    // Compress the file
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Set compression level (0-9)
    });

    archive.pipe(output);
    archive.append(fs.createReadStream(uploadFilePath), { name: fileName });
    archive.finalize();

    res.sendFile(`${fileName}.zip`, { root: zipDir });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
