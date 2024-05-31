const querystring = require("querystring")
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const express = require('express');
let port = 4200;
const root = __dirname;
const uploadedFolderFullPath = [root, path.sep, "UploadedImages", path.sep].join('');
if (!fs.existsSync(uploadedFolderFullPath)) {
  fs.mkdirSync(uploadedFolderFullPath);
}

const app = express();

app.use(express.static(root));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.post('/SaveToFile', function (req, res) {
  let form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {

    if(!fields || !files || !files.RemoteFile || files.RemoteFile.length==0) {

      if(!fields)
        res.write('no fields');

      if(!files)
        res.write('no files');
      else if(!files.RemoteFile || files.RemoteFile.length==0)
        res.write('no files.RemoteFile');

      res.statusCode = 200;
      res.end();
    }

    fs.readFile(files.RemoteFile[0].filepath, function (err, data) {

      // save file from temp dir to new dir
      let fileName = files.RemoteFile[0].originalFilename;
      let newFolderName = Date.now().toString();
      let info = fields["CustomInfo"];

      let folderPath = [uploadedFolderFullPath, newFolderName].join('');
      fs.mkdirSync(folderPath);

      let fullName = [folderPath, path.sep, fileName].join('');
      fs.writeFile(fullName, data, function (err) {
        if (err) throw err;

        let arrResponseData = ["info:", info, "|filename:", fileName, "|folder:", newFolderName];
        res.write(arrResponseData.join(''));
        res.end();
      });
    });
  });
});

app.get('/Download', function (req, res) {

  // ImageName
  let query = req.query;

  let file = query['ImageName'];
  if (file) {

    let tmpFilename = file;
    if(path.sep != '/') {
      // replace / to \
      tmpFilename = tmpFilename.replace('/', '\\');
    }

    let fullPath = uploadedFolderFullPath + tmpFilename;
    if (fs.existsSync(uploadedFolderFullPath) && fs.existsSync(fullPath)) {

      // read file
      let realFilename = file;
      if (file.indexOf('/') >= 0) {
        let arr = file.split('/');
        if (arr.length > 1) {
          realFilename = arr[arr.length - 1];
        }
      }

      const extension = path.extname(realFilename);

      let contentType = 'application/octet-stream';
      switch (extension) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
          contentType = 'image/jpg';
          break;
        case '.bmp':
          contentType = 'image/bmp';
          break;
        case '.tif':
        case '.tiff':
          contentType = 'image/tiff';
          break;
      }

      fs.createReadStream(fullPath).pipe(res);

      let encodedRealFileName = querystring.escape(realFilename);  
      encodedRealFileName = encodedRealFileName.replace("+", "%20");
  
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment; filename=' + encodedRealFileName
      });

    } else {
      res.statusCode = 200;
      res.end();
    }

  } else {
    res.statusCode = 404;
    res.end();
  }

});

app.get('/DeleteFile', function (req, res) {

  // ImageName
  let query = req.query;

  let file = query['ImageName'];
  if (file) {

    let tmpFilename = file;
    if(path.sep != '/') {
      // replace / to \
      tmpFilename = tmpFilename.replace('/', '\\');
    }

    let fullPath = uploadedFolderFullPath + tmpFilename;
    if (fs.existsSync(uploadedFolderFullPath) && fs.existsSync(fullPath)) {
      fs.rmSync(fullPath);

      let index = file.lastIndexOf("/");
      if (index > 0) {
          let tmpFolderName = file.substring(0, index);
          let strParentPath = uploadedFolderFullPath + tmpFolderName;
          fs.rmdirSync(strParentPath);
      }

      res.write('The file is removed.');
    } else {
      res.write('The file does not exist.');
    }
    res.statusCode = 200;
  } else {
    res.statusCode = 404;
  }

  res.end();
});

function openDefaultBrowser (url) {
  var exec = require('child_process').exec;
  switch (process.platform) {
    case "darwin":
      exec('open ' + url);
      break;
    case "win32":
      exec('start ' + url);
      break;
    default:
      exec('xdg-open', [url]);
  }
}

let server;

function listenOK() {
  let _url = 'http://localhost:' + port;

  console.log('Dynamic Web TWAIN sample is listening on localhost:%s,', port);
  console.log(['open your browser on ', "\x1b[32m\x1b[4m", _url, "\x1b[0m"].join(''));

  openDefaultBrowser(_url);
}

function start() {
  
  server = app.listen(port, '127.0.0.1', listenOK);
  server.on('error', (err) => {
    port++;
    setTimeout(start, 300);
  });

}

start();