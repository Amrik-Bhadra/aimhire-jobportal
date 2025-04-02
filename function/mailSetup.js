require('dotenv').config();
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

function sendOtp(emailID, subject) {
    return new Promise((resolve, reject) => {
        const otp = randomstring.generate({
            length: 4,
            charset: 'numeric'
        });


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailID,
            subject: subject,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AimHire OTP Verification</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { width: 100%; max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; }
                .logo-box{ display: flex; justify-content: center; align-items:center }
                .logo { width: 150px; margin-bottom: 20px; }
                .otp-box { font-size: 24px; font-weight: bold; background: #007bff; color: white; display: inline-block; padding: 10px 20px; border-radius: 5px; margin-top: 20px; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; }
                .footer a { color: #007bff; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>${subject}</h2>
                <p>Hello,</p>
                <p>You have requested to reset your password on <strong>AimHire</strong>. Please use the following OTP to proceed:</p>
                <div class="otp-box">${otp}</div>
                <p>This OTP is valid for only 10 minutes. Do not share it with anyone.</p>
                
                <div class="footer">
                    <p>Need help? <a href="https://aimhire.com/contact">Contact Support</a></p>
                    <p>&copy; 2025 AimHire. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
                reject('Error sending email');
            } else {
                console.log('Email sent: ' + info.response);
                resolve({ success: true, otp: otp });
            }
        });
    });
}

// function to send status emails to the applicant
function statusMailFunc(emailID, status, job_role, company) {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailID,
            subject: 'Application Status Notification',
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Status Update</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); text-align: center; }
        .logo-box { display: flex; justify-content: center; align-items: center; margin-bottom: 20px; }
        .logo { width: 150px; }
        .content { text-align: left; padding: 0 20px; }
        .status-box { font-size: 18px; font-weight: bold; background: #007bff; color: white; padding: 10px; border-radius: 5px; display: inline-block; margin: 15px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
        .footer a { color: #007bff; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        
        <h2>Application Status Update</h2>
        <div class="content">
            <p>Dear Applicant,</p>
            <p>Your application status for the job role <strong>${job_role}</strong> at <strong>${company}</strong> is:</p>
            <div class="status-box">${status}</div>
            <p>Thank you for applying. If you have any questions, feel free to contact us.</p>
        </div>
        <div class="footer">
            <p>Need help? <a href="">Contact Support</a></p>
            <p>&copy; 2025 AimHire. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
                reject('Error sending email');
            } else {
                console.log('Email sent: ' + info.response);
                resolve({ success: true });
            }
        });
    });
}

module.exports = { sendOtp, statusMailFunc };
