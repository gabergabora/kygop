const User = require("../models/users");
const Token = require("../models/token");
const {sendEmail, welcomeMail, emailActMail, passwordResetMail, verifyMail, acctVerifiedMail, depositMail, openInvestmentMail, endInvestmentMail} = require("../utils/sendEmail");
const crypto = require("crypto");
const Joi = require("joi");
const express = require("express");
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const users = require("../models/users");
const bcrypt = require("bcryptjs");

router.post("/forgot", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            req.flash("error", "user with given email doesn't exist")
            res.redirect("/password-reset")
        } else {
            console.log(user.id)
            let token = await Token.findOne({ userId: user.id });
        
            if (!token) {
                token = await new Token({
                    userId: user.id,
                    token: crypto.randomBytes(32).toString("hex"),
            }).save();
            const link = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;
                            await passwordResetMail(user.email, "PASSWORD RESET", link, user.username);

            req.flash("success", "password reset link sent to your email account");
            res.redirect("/password-reset")
            
            } else {
                const link = `${process.env.BASE_URL}/password-reset/${user._id}/${token.token}`;
                            await passwordResetMail(user.email, "PASSWORD RESET", link, user.username);

            req.flash("success", "password reset link sent to your email account");
            res.redirect("/password-reset")
            }
        }
    } catch (error) {
        req.flash("error", "An error occured");
        res.redirect("/password-reset")
    }
});

router.get('/password-reset/:id/:tokenid', async(req, res) => {
    const { id, tokenid } = req.params;
    const tok = await Token.findOne({token: tokenid})
    if (!tok) {
        req.flash('error', 'Link expired! request a new one.')
        res.redirect('/password-reset')
    }
    const user = await User.findById(id)
    console.log(user._id)
    res.render('user/passwordreset', {tok, user});
});

router.post("/password-reset/:id/:tokenid", async (req, res) => {
    const { id, tokenid } = req.params;
    const tok = await Token.findOne({token: tokenid})
    try {
        const schema = Joi.object({ password: Joi.string().required(), confirmpassword: Joi.string().required() });
        const { error } = schema.validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const user = await User.findById(id);
        if (!user) return res.status(400).send("invalid link or expired");

        const token = await Token.findOne({
            userId: id,
            token: tokenid,
        });
        if (!token) return res.status(400).send("Invalid link or expired");

        if(req.body.password === req.body.confirmpassword) {
            const hashedpassword = await bcrypt.hash(req.body.password, 12);
            await user.updateOne({password: hashedpassword, confirmpassword: req.body.confirmpassword}, { runValidators: true, new: true })
            token.delete();
        } else {
            req.flash('error', 'Passwords do not match.')
            res.redirect(`/password-reset/${id}/${tokenid}`)
        }

    } catch (error) {
        req.flash('error', 'An error.')
        res.redirect(`/password-reset/${id}/${tokenid}`)
    }

    const user = await User.findById(id)
    // const message = 'Your password has been successfully reset.'
    // await sendEmail(user.email, "PASSWORD RESET", message);
    req.login(user, function(err) {
        if (err) return next(err);
        req.flash('success', 'Password Changed!');
        res.redirect('/dashboard');
    })
});

module.exports = router;