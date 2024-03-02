const express = require('express');
const fileUpload = require('express-fileupload');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.Port || 3000;

app.use(express.json());
app.use(fileUpload());

app.get('/hello', function (req, res) {
  res.send('Hello World')
})

app.post('/compressPPT', async (req, res) => {
  if (!req.files || !req.files.pptFile) {
    return res.status(400).send('No files were uploaded.');
  }

  try {
    const pptFile = req.files.pptFile;
    const fileName = pptFile.name;
    const filePath = path.join(__dirname, fileName);

    // Save the uploaded file
    await pptFile.mv(filePath);

    // Compress the file
    const output = fs.createWriteStream(`${fileName}.zip`);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Set compression level (0-9)
    });

    archive.pipe(output);
    archive.append(fs.createReadStream(filePath), { name: fileName });
    archive.finalize();


    // to send compressed file with user
    res.sendFile(`${fileName}.zip`, { root: __dirname });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
