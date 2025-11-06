const nodemailer = require('nodemailer');

// Create transporter for Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'thajiratechworks@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD || 'crwz begq pjpg gbla'
  }
});

// Verify connection
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    return false;
  }
};

// Send OTP email
const sendOTPEmail = async (email, otp, purpose) => {
  try {
    const subject = purpose === 'login' ? 'Login OTP - ArtStop' : 'Signup Verification - ArtStop';
    const purposeText = purpose === 'login' ? 'login' : 'account verification';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo-container { margin-bottom: 15px; }
          .logo { width: 60px; height: 60px; border-radius: 50%; border: 3px solid white; display: block; margin: 0 auto; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; letter-spacing: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <img src="cid:artstoplogo" alt="ArtStop Logo" class="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
              <div style="display: none; font-size: 32px; color: white; margin-bottom: 10px;">🎨</div>
            </div>
            <h1>ArtStop</h1>
            <p>Your One-Stop Shop for Artistic Creations</p>
          </div>
          <div class="content">
            <h2>${purpose === 'login' ? 'Welcome Back!' : 'Welcome to ArtStop!'}</h2>
            <p>Use the following OTP code to complete your ${purposeText}:</p>

            <div class="otp-code">${otp}</div>

            <p><strong>Important:</strong></p>
            <ul>
              <li>This code will expire in 10 minutes</li>
              <li>Do not share this code with anyone</li>
              <li>This code can only be used once</li>
            </ul>

            <p>If you didn't request this code, please ignore this email.</p>

            <p>Best regards,<br>The ArtStop Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; <span id="currentYear"></span> ArtStop. All rights reserved.</p>
            <script>document.getElementById('currentYear').textContent = new Date().getFullYear();</script>
          </div>
        </div>
      </body>
      </html>
    `;

    // Try to attach logo, but make it optional
    let attachments = [];
    try {
      const fs = require('fs');
      const path = require('path');

      // Check if logo file exists
      const logoPath = path.join(__dirname, '../frontend/public/artstoplogo.png');
      if (fs.existsSync(logoPath)) {
        attachments = [
          {
            filename: 'artstoplogo.png',
            path: logoPath,
            cid: 'artstoplogo'
          }
        ];
        console.log('✅ Logo attachment found and added');
      } else {
        console.log('⚠️ Logo file not found, sending email without logo');
      }
    } catch (attachmentError) {
      console.log('⚠️ Logo attachment failed, sending email without logo:', attachmentError.message);
    }

    const mailOptions = {
      from: `"ArtStop" <${process.env.EMAIL_USER || 'thajiratechworks@gmail.com'}>`,
      to: email,
      subject: subject,
      html: html,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 OTP email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    console.error('❌ Full error details:', error);

    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check email credentials.');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Email service connection refused. Please check network connectivity.');
    } else {
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }
};


module.exports = {
  sendOTPEmail,
  verifyConnection
};