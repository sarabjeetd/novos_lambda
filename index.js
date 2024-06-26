const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const nodemailer = require('nodemailer');
require('dotenv').config();

const s3Client = new S3Client();

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const bucketName = event.Records[0].s3.bucket.name;
    const objectKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${objectKey}`;
    console.log('File URL:', fileUrl);

    const SENDER = "manmohan.zinreet@gmail.com";
    const RECIPIENT = "manmohan.zinreet@gmail.com";
    const SUBJECT = "AWS Lambda Email Test";
    const BODY_HTML = `
        <html>
        <head></head>
        <body>
          <h1>AWS Lambda Email Test</h1>
          <p>This email was sent with AWS Lambda using Mailtrap SMTP 1201</p>
          <p>File URL: <a href="${fileUrl}">${fileUrl}</a></p>
        </body>
        </html>
    `;

    let transporter = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: process.env.MAIL_PORT,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD
        }
    });

    let mailOptions = {
        from: SENDER,
        to: RECIPIENT,
        subject: SUBJECT,
        html: BODY_HTML
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log(`Email sent! Message ID: ${info.messageId}`);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully!', messageId: info.messageId, fileUrl: fileUrl })
        };
    } catch (err) {
        console.error(err, err.stack);
        return {
            statusCode: 500,
            body: JSON.stringify(`Error: ${err.message}`)
        };
    }
};
