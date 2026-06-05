const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const createCertificatePDF = (studentName, courseName, dateStr) => {
    return new Promise((resolve, reject) => {
        try {
            // Create a document in landscape orientation, A4 size
            const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
            
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            const width = doc.page.width;
            const height = doc.page.height;
            
            // Colors
            const BRAND_BLUE = [0, 94, 184];
            const BRAND_GREEN = [135, 194, 50];
            
            // Draw outer border
            doc.rect(20, 20, width - 40, height - 40)
               .lineWidth(5)
               .strokeColor(BRAND_BLUE)
               .stroke();
               
            // Draw inner border
            doc.rect(28, 28, width - 56, height - 56)
               .lineWidth(2)
               .strokeColor(BRAND_GREEN)
               .stroke();
               
            // Draw logo if exists
            const logoPathPng = path.join(__dirname, '../../logo.png');
            const logoPathJpg = path.join(__dirname, '../../logo.jpg');
            let logoPath = fs.existsSync(logoPathPng) ? logoPathPng : (fs.existsSync(logoPathJpg) ? logoPathJpg : null);
            
            if (logoPath) {
                // Approximate 1.5 inches to points (1 inch = 72 points)
                const logoSize = 1.5 * 72;
                doc.image(logoPath, (width - logoSize) / 2, 40, { width: logoSize });
            }
            
            // Title
            doc.font('Helvetica-Bold')
               .fontSize(40)
               .fillColor(BRAND_BLUE)
               .text('CERTIFICATE', 0, 150, { align: 'center' });
               
            doc.font('Helvetica')
               .fontSize(16)
               .fillColor('black')
               .text('OF COMPLETION', 0, 200, { align: 'center' });
               
            // Student Name
            doc.font('Helvetica-Oblique') // pdfkit doesn't have Helvetica-BoldOblique natively without embedding, fallback to Oblique
               .fontSize(32)
               .fillColor('black')
               .text(studentName, 0, 300, { align: 'center' });
               
            // Course Name
            doc.font('Helvetica-Bold')
               .fontSize(24)
               .fillColor(BRAND_BLUE)
               .text(courseName, 0, 400, { align: 'center' });
               
            // Date
            doc.font('Helvetica')
               .fontSize(16)
               .fillColor('black')
               .text(dateStr, width - 200, height - 80, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    createCertificatePDF
};
