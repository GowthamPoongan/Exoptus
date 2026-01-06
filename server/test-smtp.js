/**
 * Test SMTP configuration
 */
const nodemailer = require("nodemailer");

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;
const SMTP_USER = "kidslaughing200@gmail.com";
const SMTP_PASS = "bhooozshfpmpykkx";

console.log("Testing SMTP connection...");
console.log(`Host: ${SMTP_HOST}`);
console.log(`Port: ${SMTP_PORT}`);
console.log(`User: ${SMTP_USER}`);
console.log(`Pass length: ${SMTP_PASS.length}`);
console.log(`Pass: ${SMTP_PASS}`);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

transporter
  .verify()
  .then((result) => {
    console.log("✅ SMTP connection verified:", result);

    // Try to send a test email
    return transporter.sendMail({
      from: `Exoptus <${SMTP_USER}>`,
      to: "test@example.com",
      subject: "Test Email",
      text: "This is a test email",
      html: "<h1>Test Email</h1>",
    });
  })
  .then((info) => {
    console.log("✅ Test email sent:", info.messageId);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
    });
    process.exit(1);
  });
