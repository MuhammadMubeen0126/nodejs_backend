const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // Email address
    pass: process.env.EMAIL_PASS   // Email password or app-specific password
  }
});
/**
 * Send email
 * @param {Object} mailData - Email data containing recipient, subject, and message.
 * @returns {Promise} - Resolves if email is sent successfully, rejects if there's an error.
 */
function sendEmail(mailData) {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender's email
    to: mailData.to,             // Receiver's email
    subject: mailData.subject,   // Email subject
    text: mailData.message       // Email body
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error);
      }
      resolve(info);
    });
  });
}
module.exports =  sendEmail ;