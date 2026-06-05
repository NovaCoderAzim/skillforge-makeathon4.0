const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const uploadFileToDrive = async (fileBuffer, filename, folderLink, mimeType) => {
    try {
        let folderId = folderLink;
        if (folderLink.includes("drive.google.com")) {
            folderId = folderLink.split("/").pop().split("?")[0];
        }

        const TOKEN_PATH = path.join(__dirname, '../../token.json');
        const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json'); // assuming it exists
        
        if (!fs.existsSync(TOKEN_PATH)) {
            console.error("❌ Error: Valid token.json not found!");
            return null;
        }

        const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH));
        const oAuth2Client = new google.auth.OAuth2();
        oAuth2Client.setCredentials(tokenData);

        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        const fileMetadata = {
            name: filename,
            parents: [folderId]
        };

        const media = {
            mimeType: mimeType || 'application/pdf',
            body: Readable.from(fileBuffer)
        };

        const file = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });

        console.log(`✅ Google Drive Upload Success! File ID: ${file.data.id}`);
        return file.data.id;
    } catch (error) {
        console.error(`🔥 Google Drive Upload Failed: ${error.message}`);
        return null;
    }
};

module.exports = {
    uploadFileToDrive
};
