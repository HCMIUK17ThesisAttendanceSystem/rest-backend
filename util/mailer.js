const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
exports.createLecturerEmail = async (toEmail, password, name) => {
  // // Generate test SMTP service account from ethereal.email
  // // Only needed if you don't have a real mail account for testing
  // let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "wokhug99@gmail.com", // generated ethereal user
      pass: "Thihanh76@", // generated ethereal password
    },
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: 'HCMIU Presence',
    to: toEmail,
    subject: 'Welcome to Presence :D',
    html: `
      <h4>Welcome ${name}!</h4>
      <p>We are glad to have you onboard :D</p>
      <p>You can login to <a href="https://presence.hcmiu.edu.vn">Presence</a> using:<p>
      <ul style="list-style-type: none">
        <li>Email: ${toEmail}</li>
        <li>Password: ${password}</li>
      </ul>
    `
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
};
