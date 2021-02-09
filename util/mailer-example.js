const nodemailer = require('nodemailer');

exports.transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your email',
    pass: 'your password'
  }
});

exports.createLecturerEmail = (toEmail, password, name) => {
  return {
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
  };
};