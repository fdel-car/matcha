var nodemailer = require('nodemailer');

// var transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'email',
//     pass: 'password'
//   }
// });

// var mailOptions = {
//   from: 'matcha@gmail.com',
//   to: 'fabien.delcarmen@gmail.com',
//   subject: 'Sending Email using Node.js',
//   text: 'That was easy!'
// };

// transporter.sendMail(mailOptions, function(error, info) {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });

let transporter = nodemailer.createTransport({
  sendmail: true
});
transporter.sendMail(
  {
    from: 'matcha@42.fr',
    to: 'impossibru@gg9000.to',
    subject: 'Message',
    text: 'Should not be sent.'
  },
  (err, info) => {
    if (err) console.log(err);
    console.log(info.envelope);
    console.log(info.messageId);
  }
);
