const Users = require("../models/users");
const Token = require("../models/token");
const {sendEmail, welcomeMail, emailActMail, passwordResetMail} = require("../utils/sendEmail");
const crypto = require("crypto");
const Joi = require("joi");
const express = require("express");
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");


const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login')
    }
    next();
}

const isClient = async(req, res, next) => {
    const { username, password } = req.body;
    const user = await Users.findOne({username});
    if (!user) {
        req.flash('error', 'Incorrect Username or Password!')
        return res.redirect('/login');
    } else if (user.role !== 'client') {
        req.flash('error', 'You do not have permission to access this route!')
        return res.redirect('/login')
    } 
    next();
}

const onlyClient = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    if (user.role !== 'client') {
        req.flash('error', 'You do not have permission to access this route!')
        return res.redirect('/')
    } 
    next();
}

const checkAcctStatus = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    if (user.acctstatus === 'Active') {
        return res.redirect(`/dashboard`)
    } 
    next();
}



router.get('/user/:id/activate-account', isLoggedIn,  onlyClient, checkAcctStatus, async(req, res) => {
    const id = req.params.id;
    const user = await Users.findById(id);
    if (user) {
        const token = await new Token({
            userId: user.id,
            token: crypto.randomBytes(32).toString("hex"),
        }).save();
                
        const text = `${process.env.BASE_URL}/user/${user._id}/activate-account/${token.token}`;
        const subject = `VERIFY YOUR EMAIL ADDRESS`;
    
        await emailActMail(user.email, subject, text, user.username);
        res.render('user/activate-account', {user});
    } else {
        res.redirect('/login')
    } 
});

router.post("/user/:id/activate-account", async (req, res) => {
    const id = req.params.id;
    const user = await Users.findById(id);
   
    const token = await new Token({
        userId: user.id,
        token: crypto.randomBytes(32).toString("hex"),
    }).save();
            
    const text = `${process.env.BASE_URL}/user/${user._id}/activate-account/${token.token}`;
    const subject = `VERIFY YOUR EMAIL ADDRESS`;

    await emailActMail(user.email, subject, text, user.username);
    req.flash("success", "Verification mail sent, please check your mailbox.");
    res.redirect(`/user/${user.id}/activate-account`)
           
});

router.get('/user/:id/activate-account/:tokenid', async(req, res) => {
    const { id, tokenid } = req.params;
    const tok = await Token.findOne({token: tokenid})
    const user = await Users.findById(id)
    if (!tok) {
        req.flash('error', 'Link expired! please request for a new activation link.')
        res.redirect(`/user/${user.id}/activate-account`)
    } else {
        res.render('user/activatepage', {tok, user});
        console.log(tokenid)
    }
   
});

router.put("/user/:id/activate-account/:tokenid", async (req, res) => {
    const { id, tokenid } = req.params;
    const tok = await Token.findOne({
        userId: id,
        token: tokenid,
    });
    const user = await Users.findById(id)
    if (tok) {
        await user.updateOne({acctstatus: 'Active'}, { runValidators: true, new: true })
        tok.delete();
        const message = 'Your account has successfully been activated.'
        req.flash('success', 'Account Activated!');
        res.redirect('/dashboard');
    } else {
        console.log(tokenid)
    }
    
});

module.exports = router;