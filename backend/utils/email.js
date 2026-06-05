const nodemailer = require('nodemailer');

const sendCredentialsEmail = async (toEmail, name, password) => {
    try {
        const senderEmail = process.env.EMAIL_USER || "nithishss48@gmail.com";
        const senderPassword = process.env.EMAIL_PASS || "zzgh jbao mhvv qfxm";

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: senderEmail,
                pass: senderPassword,
            },
        });

        const info = await transporter.sendMail({
            from: `"SkillForge LMS" <${senderEmail}>`,
            to: toEmail,
            subject: "Welcome to SkillForge! Here are your credentials",
            text: `
    Welcome to SkillForge ${name} !,
    
    User ID: ${toEmail}
    Password: ${password}

    "Education is the passport to the future,
    for tomorrow belongs to those who prepare for it today."
            `,
        });

        console.log(`✅ Email sent successfully to ${toEmail}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send email: ${error.message}`);
        return false;
    }
};

module.exports = {
    sendCredentialsEmail
};
