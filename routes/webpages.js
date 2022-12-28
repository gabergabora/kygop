const express = require('express');
const router = express.Router();
const sendEmail = require("../utils/sendEmail");
const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");

router.get('/contact', (req, res) => {
    res.render('contact');
});

router.get('/terms', (req, res) => {
    res.render('terms');
});

router.get('/privacy-policy', (req, res) => {
    res.render('privacy');
});

// router.get('/contactus', (req, res) => {
//     res.render('contactus');
// });

// router.post('/contactus', async (req, res)  => {
//     const { email, name, subject, message} = req.body;
//     try {
//         const transporter = nodemailer.createTransport({
//             host: process.env.HOST,
//             service: process.env.SERVICE,
//             port: 587,
//             secure: true,
//             auth: {
//                 user: process.env.USER,
//                 pass: process.env.PASS,
//             },
//         });

//         ejs.renderFile("views/contactmail.ejs", {mail: email, name: name, message: message, subject: subject},function (err, data) {
//             if (err) {
//                 console.log(err);
//             } else {
//                 var mainOptions = {
//                     from: email,
//                     to: process.env.CUSTOMMAIL,
//                     subject: subject,
//                     html: data
//                 };
//                 console.log("html data ======================>", mainOptions.html);
//                 transporter.sendMail(mainOptions, function (err, info) {
//                     if (err) {
//                         console.log(err);
//                     } else {
//                         console.log('Message sent: ' + info.response);
//                     }
//                 });
//             }
//             });
//     } catch (error) {
//         console.log(error, "email not sent");
//     }
//     req.flash('success', 'Message Sent. A reply will be sent to your email shortly.')
//     res.redirect('/contactus')
// })

router.get('/faq', (req, res) => {
    res.render('faq');
});

router.get('/affiliate', (req, res) => {
    res.render('affiliate');
});

router.get('/privacypolicy', (req, res) => {
    res.render('policy');
});


module.exports = router;