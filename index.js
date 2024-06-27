const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { LambdaClient, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const s3 = new S3Client({ region: 'eu-north-1' });
const lambda = new LambdaClient({ region: 'eu-north-1' });

exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));

    const bucketName = process.env.BUCKET_NAME;
    const keyName = 'sample.csv';
    const filePath = path.resolve(__dirname, 'temp/sample.csv');

    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return {
            statusCode: 500,
            body: JSON.stringify('File not found in /temp directory.'),
        };
    }

    const fileContent = fs.readFileSync(filePath);

    const params = {
        Bucket: bucketName,
        Key: keyName,
        Body: fileContent,
    };

    try {
      
        await s3.send(new PutObjectCommand(params));
        console.log(`File uploaded successfully to ${bucketName}/${keyName}`);

        const fileUrl = `https://${bucketName}.s3.amazonaws.com/${keyName}`;

        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            auth: {
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASS,
            },
            authMethod: 'PLAIN',
        });

        const mailOptions = {
            from: 'your@email.com',
            to: 'recipient@email.com',
            subject: 'File Uploaded Successfully',
            text: `File uploaded successfully to S3. Here is the file URL: ${fileUrl}`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully.');

        // Delete file from temp folder
        // fs.unlinkSync(filePath);
        // console.log('File deleted from temp folder.');

        // await fs.promises.unlink(filePath);
        // console.log('File deleted from temp folder.');

        // Disable Lambda function
        const updateParams = {
            FunctionName: 'S3-trigger-function',
            Enabled: false,
        };
        await lambda.send(new UpdateFunctionConfigurationCommand(updateParams));
        console.log('Lambda function disabled successfully.');

        return {
            statusCode: 200,
            body: JSON.stringify('File uploaded successfully, email sent, and Lambda function disabled.'),
        };
    } catch (error) {
        console.error('Error uploading file, sending email, or disabling Lambda function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Error uploading file, sending email, or disabling Lambda function.'),
        };
    }
};
