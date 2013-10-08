var functions = module.exports = {};
  
var nodemailer = require('nodemailer')
  , crypto = require('crypto')
  , config = require('../config.js');

functions.sendEmail = function (userEmail, subject, message) {
    console.info('sending email verification:' + JSON.stringify(config))
    var smtpTransport = nodemailer.createTransport("SMTP",{
        service: "Gmail",
        auth: {
            user: config.dev.nodemailer.authUser,
            pass: config.dev.nodemailer.authPass
        }
    });

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: "Feeds <node@example.com>",
        to: userEmail,
        subject: subject,
        html: message
    }

    // send mail with defined transport object
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){   
            console.log(error);
        }else{
            console.log("Message sent: " + response.message);
        }
        smtpTransport.close(); // shut down the connection pool, no more messages
    });
}

//functions.sendEmail = function (email, subject, message) {
    //send email function
//}