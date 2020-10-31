const apikey = process.env.MAILGUN_API_KEY;
const domain = `sandbox${process.env.MAILGUN_DOMAIN_SECRET}.mailgun.org`;
const mailgun = require("mailgun-js")({ apiKey: apikey, domain: domain });

const sendMessage = (
  res,
  successResponse,
  failureResponse,
  subject,
  message,
  recipientEmail,
  fromEmail = process.env.MAILGUN_MAIN_EMAIL
) => {
  /* CREATION DE L'OBJET DATA */
  const data = {
    from: fromEmail,
    to: recipientEmail,
    subject: subject,
    text: message,
  };

  /* ENVOI DE L'OBJET VIA MAILGUN */
  mailgun.messages().send(data, (error, body) => {
    if (!error) {
      return res.status(200).json(successResponse);
    }
    console.log("sendMessage : " + error);
    return res.status(200).json(failureResponse);
  });
};

const isValidRecipient = (email) => {
  const emails = process.env.MAILGUN_AUTHORIZED_EMAILS.split(",");
  return emails.includes(email);
};

module.exports = { sendMessage, isValidRecipient };
