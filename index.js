const nodemailer = require('nodemailer');
require('dotenv').config();

exports.handler = async (event) => {
    console.log(event);

    const SENDER = "manmohan.zinreet@gmail.com";
    const RECIPIENT = "manmohan.zinreet@gmail.com";
    const SUBJECT = "AWS Lambda Email Test";
    const BODY_HTML = `
        <html>
        <head></head>
        <body>
          <h1>AWS Lambda Email Test</h1>
          <p>This email was sent with AWS Lambda using Mailtrap SMTP 120112</p>
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
            body: `Email sent! Message ID: ${info.messageId}`
        };
    } catch (err) {
        console.error(err, err.stack);
        return {
            statusCode: 500,
            body: JSON.stringify(`Error: ${err.message}`)
        };
    }
};
