const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const s3Client = new S3Client({ region: process.env.AWS_REGION });

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.handler = async (event) => {
    const bucketName = process.env.BUCKET_NAME;
    const filePath = path.join(__dirname, 'tmp', 'sample.csv');
    const objectKey = 'sample.csv';
    const flagFilePath = path.join(__dirname, 'tmp', 'emailSent.flag');

    if (fs.existsSync(flagFilePath)) {
        console.log('Email has already been sent. Skipping email sending.');
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email has already been sent.' })
        };
    }

    try {
        // Read the file from the local system
        const fileContent = fs.readFileSync(filePath);

        // Upload the file to S3
       const putObjectParams = {
            Bucket: bucketName,
            Key: objectKey,
            Body: fileContent,
        };

        await s3Client.send(new PutObjectCommand(putObjectParams));
        console.log(`File uploaded successfully at ${bucketName}/${objectKey}`);

        // Get the file URL
        const fileUrl = `https://${bucketName}.s3.amazonaws.com/${objectKey}`;
        console.log('File URL:', fileUrl);

        // Sleep for 1 second to avoid hitting Mailtrap rate limit
        await sleep(1000);

        // Email details
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

        // Send the email
        let info = await transporter.sendMail(mailOptions);
        console.log(`Email sent! Message ID: ${info.messageId}`);

        // Create a flag file to indicate that the email has been sent
        // fs.writeFileSync(flagFilePath, 'Email sent');
        // console.log(`Flag file created: ${flagFilePath}`);

        // Delete the local file
        fs.unlinkSync(filePath);
        console.log(`Local file deleted: ${filePath}`);

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
