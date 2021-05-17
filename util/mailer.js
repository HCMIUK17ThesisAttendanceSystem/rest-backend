const path = require('path');

const ejs = require("ejs");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const {
  createError
} = require('./error-handler');

const rootDir = path.dirname(require.main.filename);

const {
  NODEMAILER_FROM_EMAIL,
  NODEMAILER_REFRESH_TOKEN,
  NODEMAILER_CLIENT_SECRET,
  NODEMAILER_CLIENT_ID
} = process.env;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    NODEMAILER_CLIENT_ID,
    NODEMAILER_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: NODEMAILER_REFRESH_TOKEN
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject();
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: NODEMAILER_FROM_EMAIL,
      accessToken,
      clientId: NODEMAILER_CLIENT_ID,
      clientSecret: NODEMAILER_CLIENT_SECRET,
      refreshToken: NODEMAILER_REFRESH_TOKEN
    }
  });

  return transporter;
};

//emailOptions - who sends what to whom
const sendEmail = async (emailOptions) => {
  const emailTransporter = await createTransporter();
  await emailTransporter.sendMail(emailOptions, (error, info) => {
    if (error) {
      console.log('Something went wrong while sending email to ' + emailOptions.to);
      console.log(error);
    }
    else
      console.log('Send to: ' + info.accepted[0] + '; Response: ' + info.response);
  });
};

exports.sendEmailWithTemplate = async (viewPath, data, toEmails, subject) => {
  const path = rootDir + '/views/templates' + viewPath;
  try {
    const html = await ejs.renderFile(
      path,
      data,
      { async: true }
    );
    const emailOptions = {
      from: process.env.NODEMAILER_FROM_EMAIL,
      to: toEmails,
      subject,
      html
    };
    await sendEmail(emailOptions);
  } catch (error) {
    throw createError('Validation failed D:', 404, error);
  }
}