const express = require('express');
const router = express.Router();
const Users = require('../models/users');
const Transaction = require('../models/transaction');
const Notification = require('../models/notification');
const Investment = require('../models/investment');
const Reviews = require('../models/reviews');
const Depositmethods = require('../models/depositmethod');
const InvestmentPlans = require('../models/investmentplans');
const Referral = require('../models/referral');
const passport = require('passport');
const {sendEmail, welcomeMail, emailActMail, passwordResetMail, verifyMail, acctVerifiedMail, depositMail, openInvestmentMail, endInvestmentMail} = require("../utils/sendEmail");
const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const multer  = require('multer');
const { storage, cloudinary } = require('../cloudinary');
const upload = multer({ storage });
const bcrypt = require('bcrypt');

const isAdminLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/secureadmin.login')
    }
    next();
}

const isAdmin = async(req, res, next) => {
    const { username, password } = req.body;
    const user = await Users.findOne({username});
    if (!user) {
        req.flash('error', 'Incorrect Username or Password!')
        return res.redirect('/secureadmin.login');
    } else if (user.role !== 'admin') {
        req.flash('error', 'You do not have permission to access this route!')
        return res.redirect('/secureadmin.login')
    } 
    next();
}

const onlyAdmin = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    if (user.role !== 'admin') {
        req.flash('error', 'You do not have permission to access this route!')
        return res.redirect('/dashboard')
    } 
    next();
}


router.get('/secureadmin.register', (req, res) => {
    res.render('admin/register');
});

router.post('/secureadmin.register', async(req, res) => {
    try {
        const { email, firstname, lastname, phonenumber, password, confirmpassword } = req.body;
        const admin = new Users({email, firstname, lastname, phonenumber, confirmpassword, role: 'admin'});
        if (confirmpassword == password) {
            // const registeredAdmin = await Users.register(admin, password);

            const hashedpassword = await bcrypt.hash(password, 12);
            admin.password = hashedpassword;
            // const admin = await Users.register(user, password);
            await admin.save();

            req.login(admin, err => {
                if (err) return next(err);
                
                req.flash('success', 'Welcome!!');

                res.redirect('/admin/admin.dashboard');
            })
        } else {
            req.flash('error', 'Password and Confirm Password does not match');
            res.redirect('/secureadmin.register');
        }    
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/secureadmin.register');
    }
   
});

router.get('/secureadmin.login', (req, res) => {
    res.render('admin/login');
});

router.post('/secureadmin.login', isAdmin, passport.authenticate('local', {failureFlash: true, failureRedirect: '/secureadmin.login'}), (req, res) => {
    req.flash('success', 'Successfully Logged In!');
    
    res.redirect('/admin/admin.dashboard');
})


router.get('/admin/admin.dashboard', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id = req.user.id;
    const admin = await Users.findById(id);
    const clients = await Users.find({role: 'client'});
    const admins = await Users.find({role: 'admin'});
    const Investments = await Investment.find({status: 'Active'});
    const verificationrequest = await Users.find({role: 'client', verificationstatus: 'Pending' });
    const deposits = await Transaction.find({status: 'Pending', transactionType: 'Deposit'});
    const withdrawals = await Transaction.find({status: 'Pending', transactionType: 'Withdraw'});
    res.render('admin/dashboard', {admin, verificationrequest, admins, Investments, clients, deposits, withdrawals});
});

router.get('/admin/admin.profile', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id = req.user.id;
    const admin = await Users.findById(id);
    console.log(admin.confirmpassword)
    res.render('admin/accountprofile', {admin});
});

router.get('/admin/admin.changepassword', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id = req.user.id;
    const admin = await Users.findById(id);
    res.render('admin/changepassword', {admin});
});

router.put('/admin/:id/changepassword', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id = req.user.id;
    const admin = await Users.findById(id)
    const {currentpassword, password, confirmpassword} = req.body;

    const validPassword = await bcrypt.compare(currentpassword, user.password);
    if(validPassword) {
        if(password === confirmpassword) {
            const hashedpassword = await bcrypt.hash(password, 12);
            await admin.updateOne({password: hashedpassword, confirmpassword: confirmpassword}, { runValidators: true, new: true })

            req.login(admin, function(err) {
                if (err) return next(err);
                req.flash('success', 'Password Changed!');
                res.redirect('/admin/admin.dashboard');
            })
        } else {
            req.flash('error', 'Passwords do not match.')
            res.redirect(`/admin/admin.profile/${id}`)
        }
    } else {
        req.flash('error', 'Incorrect Password.')
        res.redirect(`/admin/admin.profile/${id}`)
    }
});


router.put('/admin/admin.profile/:id', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id = req.user.id;
    const {email, firstname, lastname, username, phonenumber, country, state, address, gender} = req.body;
    const admin = { ...req.body };
    const saveUser = await Users.findByIdAndUpdate(id, admin, { runValidators: true, new: true })
    console.log(saveUser);
    req.flash('success', 'Successfully Updated Profile!')
    res.redirect(`/admin/admin.profile`);
});

router.get('/admin/admin.clients', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const clients = await Users.find({role: 'client'}).sort({firstname: 1});;
    res.render('admin/clients', {admin, clients});
});

router.get('/admin/admin.clients/:id', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const client = await Users.findById(req.params.id).populate('referrals');
    const clientNotification = await Users.findById(req.params.id).populate({path: 'notifications', options: { sort: { 'notificationdate': -1 } } });
    const userTransact = await Users.findById(req.params.id).populate({path: 'transaction', options: { sort: { 'transactiondate': -1 } } });
    const userInvest = await Users.findById(req.params.id).populate('investment');
    const deposits = await Transaction.find({validateUser: client, transactionType: 'Deposit'}).sort({transactiondate: -1});
    const withdrawal = await Transaction.find({validateUser: client, transactionType: 'Withdraw'}).sort({transactiondate: -1});

    res.render('admin/clientinfo', {admin, client, userTransact, clientNotification, userInvest, deposits, withdrawal});
});

router.put('/admin/admin.change-user-password/:id', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id = req.params.id;
    const user = await Users.findById(id)
    const {currentpassword, password, confirmpassword} = req.body;

    const validPassword = await bcrypt.compare(currentpassword, user.password);
    if(validPassword) {
        if(password === confirmpassword) {
            const hashedpassword = await bcrypt.hash(password, 12);
            await user.updateOne({password: hashedpassword, confirmpassword: confirmpassword}, { runValidators: true, new: true })
            req.flash('success', 'Password Changed.')
            res.redirect(`/admin/admin.clients/${id}`) 
        } else {
            req.flash('error', 'Passwords do not match.')
            res.redirect(`/admin/admin.clients/${id}`)
        }
    } else {
        req.flash('error', 'Incorrect Password.')
        res.redirect(`/admin/admin.clients/${id}`)
    }
    
});

router.delete('/admin/admin.delete-user/:id', isAdminLoggedIn, onlyAdmin, async (req, res) => {
    const id = req.params.id;
    const user = await Users.findById(id);
    const {password} = req.body;

    const validPassword = await bcrypt.compare(password, user.password);
    if(validPassword) {
        await user.deleteOne();
        req.flash('success', 'User deleted!')
        res.redirect(`/admin/admin.clients`);
    } else {
        req.flash('error', 'Incorrect Password.')
        res.redirect(`/admin/admin.clients/${user.id}`)
    }
    // await Notification.findByIdAndDelete(nid);
});

router.post('/admin/admin.notifications/:id', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id  = req.params.id;
    const client = await Users.findById(id);
        const today = new Date();
        const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
        const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
        const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
        const dateTime = date+' '+time+ ' ' + ampm;
    const {title, message} = req.body;
    const notification = new Notification({title, message, notificationdate: dateTime});
    client.notifications.push(notification);
    await notification.save();
    await client.save()
    req.flash('success', 'Notification Sent!')
    res.redirect(`/admin/admin.clients/${client.id}`);
});

router.delete('/admin/client/:id/notifications/:nid/', isAdminLoggedIn, onlyAdmin, async (req, res) => {
    const { id, nid } = req.params;
    const client = await Users.findById(id);
    await Notification.findByIdAndDelete(nid);
    req.flash('success', 'Successfully deleted notification!')
    res.redirect(`/admin/admin.clients/${client.id}`);
});

router.post('/admin/admin.clients/findUser', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const {findUser} = req.body
    const client = await Users.findOne({username: findUser});
    if (client) {
        res.redirect(`/admin/admin.clients/${client.id}`)
    } else {
        req.flash('error', 'No user with given username found!')
        res.redirect('/admin/admin.clients')
    }
});

router.get('/admin/admin.verificationrequests', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const clients = await Users.find({role: 'client' } && {verificationstatus: 'Pending'});
    res.render('admin/verificationrequest', {admin, clients});
});


router.put('/admin/admin.verificationrequests/:id', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id = req.params.id; 
    const user = await Users.findByIdAndUpdate(id, {verificationstatus: 'Verified'}, { runValidators: true, new: true });
    const subject = 'USER VERIFICATION';
    await acctVerifiedMail(user.email, subject, user.username);
    req.flash('success', 'Successfully Verified Client!')
    res.redirect('/admin/admin.verificationrequests')
});

router.get('/admin/admin.deposit-req', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const clients = await Users.find({role: 'client' }).populate({path: 'transaction', options: { sort: { 'transactiondate': -1 } } });
    const deposits = await Transaction.find({status: 'Pending', transactionType: 'Deposit'});
    const payments = await Transaction.find({status: 'Pending', transactionType: 'Payment'});
    res.render('admin/deposit', {admin, clients, deposits, payments});
});

router.put('/admin/admin.deposit-req/:id/verify/:depositid', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const { id, depositid } = req.params; 
    const deposit = await Transaction.findByIdAndUpdate(depositid, {status: 'Successful'}, { runValidators: true, new: true });
    const client = await Users.findById(id);
    const ref = await Users.findOne({username: client.referredby})
    await client.updateOne({wallet: client.wallet + deposit.amount}, { runValidators: true, new: true });
    const subject = 'DEPOSIT';
    await depositMail(client.email, subject, client.username, deposit.amount);

    if (ref) {
        const refPercent = (deposit.amount / 100) * 10;
        await ref.updateOne({referralincomes: ref.referralincomes + refPercent}, { runValidators: true, new: true });
        req.flash('success', 'Successfully Verified Deposit!')
        res.redirect('/admin/admin.deposit-req')
    } else {
        req.flash('success', 'Successfully Verified Deposit!')
        res.redirect('/admin/admin.deposit-req')
    }
});

router.put('/admin/service-charge-payment-req/:id/verify/:depositid', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const { id, depositid } = req.params; 
    const deposit = await Transaction.findByIdAndUpdate(depositid, {status: 'Successful'}, { runValidators: true, new: true });
    const client = await Users.findById(id);
    if (deposit.narration === 'Account Upgrade') {
        await client.updateOne({upgradefeeStatus: 'Paid', accountType: 'Pro'}, { runValidators: true, new: true });
    } else if (deposit.narration === 'Service Charge') {
        await client.updateOne({accountchargesStatus: 'Paid'}, { runValidators: true, new: true });
    }
   
    req.flash('success', 'Successfully Verified Payment!')
    res.redirect('/admin/admin.deposit-req')
});

router.get('/admin/admin.depositmethods', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const clients = await Users.find({role: 'client' });
    const deposits = await Depositmethods.find({});
    res.render('admin/depositmethod', {admin, clients, deposits});
});

router.post('/admin/admin.depositmethods',isAdminLoggedIn, onlyAdmin, upload.array('depositqrcode'), async(req, res) => {
    const id  = req.user.id;
    const admin = await Users.findById(id);
    const depositmethod = new Depositmethods(req.body);
    depositmethod.depositqrcode = req.files.map(f => ({url: f.path, filename: f.filename}));
    await depositmethod.save()
    req.flash('success', 'Successfully added a deposit method.')
    res.redirect('/admin/admin.depositmethods');
});

router.get('/admin/admin.depositmethods/:id/edit', isAdminLoggedIn, onlyAdmin, upload.array('depositqrcode'), async(req, res) => {
    const id  = req.user.id;
    const depositid = req.params.id;
    const admin = await Users.findById(id);
    const depositmethod = await Depositmethods.findById(depositid);
    res.render('admin/editdepositmethod', {admin, depositmethod});
});

router.put('/admin/admin.depositmethods/:id', isAdminLoggedIn, onlyAdmin, upload.array('depositqrcode'), async(req, res) => {
    const id = req.params.id;
    const depositmethod = await Depositmethods.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });
    depositmethod.depositqrcode = req.files.map(f => ({url: f.path, filename: f.filename}));
    await depositmethod.save()
    req.flash('success', 'Successfully updated deposit method.')
    res.redirect('/admin/admin.depositmethods')
});

router.delete('/admin/admin.depositmethods/:id', isAdminLoggedIn, onlyAdmin, async (req, res) => {
    const  id  = req.params.id;
    await Depositmethods.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted deposit method!')
    res.redirect('/admin/admin.depositmethods')
});

router.get('/admin/admin.deposit-history', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const clients = await Users.find({role: 'client' }).populate({path: 'transaction', options: { sort: { 'transactiondate': -1 } } });
    const deposits = await Transaction.find({transactionType: 'Deposit'});
    res.render('admin/deposithistory', {admin, clients, deposits});
});

router.get('/admin/admin.withdrawal-history', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const clients = await Users.find({role: 'client' }).populate({path: 'transaction', options: { sort: { 'transactiondate': -1 } } });
    const withdrawals = await Transaction.find({transactionType: 'Withdraw'});
    res.render('admin/withdrawalhistory', {admin, clients, withdrawals});
});

router.get('/admin/admin.withdrawal-req', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const clients = await Users.find({role: 'client' }).populate({path: 'transaction', options: { sort: { 'transactiondate': -1 } } });
    const withdrawals = await Transaction.find({status: 'Pending', transactionType: 'Withdraw'});
    res.render('admin/withdraw', {admin, clients, withdrawals});
});

router.put('/admin/admin.withdrawal-req/:id/verify/:withdrawalid', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const { id, withdrawalid } = req.params;    
    const withdrawal = await Transaction.findByIdAndUpdate(withdrawalid, {status: 'Successful'}, { runValidators: true, new: true });
    const client = await Users.findById(id);
    if (client.wallet > 0) {
        await client.updateOne({wallet: client.wallet - withdrawal.amount}, { runValidators: true, new: true });
    } else {
        req.flash('error', 'Insufficient Balance!')
        res.redirect('/admin/admin.withdrawal-req')
    }
    req.flash('success', 'Successfully Verified Withdrawal!')
    res.redirect('/admin/admin.withdrawal-req')
});

router.get('/admin/admin.investment', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const clients = await Users.find({role: 'client' }).populate({path: 'investment', options: { sort: { 'investmentdate': -1 } } });
    const activeinvestments = await Investment.find({status: 'Active'});
    const inactiveinvestments = await Investment.find({status: 'Completed'});
    res.render('admin/investment', {admin, clients, activeinvestments, inactiveinvestments });
});

router.get('/admin/admin.investment/:id/:investmentid', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const { id, investmentid } = req.params; 
    const admin = await Users.findById(req.user.id);
    const client = await Users.findById(id).populate('investment');
    const investment = await Investment.findById(investmentid);
    const totalincome = parseInt(investment.investedamount) + parseInt(investment.investmentprofit);   
    res.render('admin/investment-show', {admin, client, investment, totalincome});
});

router.put('/admin/admin.investment/:id/:investmentid', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const { id, investmentid } = req.params;   
    const {addprofits} = req.body;
    const client = await Users.findById(id).populate('investment');
    const investment = await Investment.findById(investmentid);
    const profits = parseInt(addprofits)
    await investment.updateOne({investmentprofit: investment.investmentprofit + profits }, { runValidators: true, new: true });

    req.flash('success', `Successfully added ${profits} USD to investment.`)
    res.redirect(`/admin/admin.investment/${client.id}/${investment.id}`)
});

router.put('/admin/admin.investment/:id/:investmentid/endinvestment',  isAdminLoggedIn, onlyAdmin, async (req, res) => {
    const { id, investmentid } = req.params;  
    const client = await Users.findById(id).populate('investment');
    const investment = await Investment.findById(investmentid);
    const totalprofit = parseInt(investment.investedamount) + parseInt(investment.investmentprofit);

    await client.updateOne({wallet: client.wallet + totalprofit, totalprofits: client.totalprofits + totalprofit}, { runValidators: true, new: true });
    await investment.updateOne({status: 'Completed'}, { runValidators: true, new: true });
    const subject = 'INVESTMENT COMPLETED';
    await endInvestmentMail(client.email, subject, client.username, investment.packagetype, investment.investedamount, investment.investmentprofit);
    req.flash('success', `Successfully ended current investment.`)
    res.redirect(`/admin/admin.investment/${client.id}/${investment.id}`)
});

router.get('/admin/admin.investmentplans', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const cryptominingplans = await InvestmentPlans.find({}).sort({minimumamount: 1});
    res.render('admin/investmentplan', {admin, cryptominingplans});
});

// router.post('/admin/admin.investmentplans/forex',isAdminLoggedIn, onlyAdmin, async(req, res) => {
//     const id  = req.user.id;
//     const admin = await Users.findById(id);
//     const {packagename, minimumamount, maximumamount, duration, profitpercentage, charges} = req.body;
//     const investmentplans = new InvestmentPlans({packagename, minimumamount, maximumamount, duration, profitpercentage, charges, investmentType: 'Forex'});
//     await investmentplans.save()
//     req.flash('success', 'Successfully added a new investment package.')
//     res.redirect('/admin/admin.investmentplans');
// });

// router.post('/admin/admin.investmentplans/stock',isAdminLoggedIn, onlyAdmin, async(req, res) => {
//     const id  = req.user.id;
//     const admin = await Users.findById(id);
//     const {packagename, minimumamount, maximumamount, duration, profitpercentage, charges} = req.body;
//     const investmentplans = new InvestmentPlans({packagename, minimumamount, maximumamount, duration, profitpercentage, charges, investmentType: 'Stocks'});
//     await investmentplans.save()
//     req.flash('success', 'Successfully added a new investment package.')
//     res.redirect('/admin/admin.investmentplans');
// });

router.post('/admin/admin.investmentplans/crypto-mining',isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id  = req.user.id;
    const admin = await Users.findById(id);
    const {packagename, minimumamount, maximumamount, duration, profitpercentage, charges, power, storage} = req.body;
    const investmentplans = new InvestmentPlans({packagename, minimumamount, maximumamount, duration, profitpercentage, charges, power, storage, investmentType: 'Crypto Mining'});
    await investmentplans.save()
    req.flash('success', 'Successfully added a new investment package.')
    res.redirect('/admin/admin.investmentplans');
});

router.put('/admin/admin.investmentplans/:id', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id = req.params.id;    
    const investmentplan = await InvestmentPlans.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });
    req.flash('success', 'Successfully edited investment package')
    res.redirect('/admin/admin.investmentplans')
});

router.delete('/admin/admin.investmentplans/:id', isAdminLoggedIn, onlyAdmin, async (req, res) => {
    const  id  = req.params.id;
    await InvestmentPlans.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted investment package.')
    res.redirect('/admin/admin.investmentplans')
});

router.get('/admin/admin.affiliateprogram', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id = req.user.id;
    const admin = await Users.findById(id);
    const clients = await Users.find({role: 'client' }).populate('referrals');
    res.render('admin/affiliate', {admin, clients});
});


router.get('/admin/admin.reviews', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const id = req.user.id;
    const admin = await Users.findById(id);
    const allreviews = await Reviews.find({}).sort({reviewdate: -1});
    res.render('admin/reviews', {admin, allreviews});
});

router.post('/admin/admin.reviews', isAdminLoggedIn, onlyAdmin, async(req, res) => {
    const admin = await Users.findById(req.user.id);
    const today = new Date();
    const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
    const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
    const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
    const dateTime = date+' '+time+ ' ' + ampm;
    const {username, comment} = req.body;
    const review = new Reviews({username, comment, reviewdate: dateTime, status: 'Verified'});
    await review.save();
    req.flash('success', 'Review Submitted')
    res.redirect(`/admin/admin.reviews/`);
});

router.delete('/admin/admin.reviews/:id',  isAdminLoggedIn, onlyAdmin, async (req, res) => {
    const  id  = req.params.id;
    await Reviews.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted review.')
    res.redirect('/admin/admin.reviews')
});

// router.post('/admin/admin.email', async(req, res) => {
//     const { recipientEmail, mailSubject, mailBody } = req.body;
//     var transporter = nodemailer.createTransport({
//         host: process.env.HOST,
//         service: process.env.SERVICE,
//         port: 587,
//         secure: true,
//         auth: {
//             user: process.env.USER,
//             pass: process.env.PASS,
//         },
//     });
    
//     ejs.renderFile("views/admin/mailview.ejs", {mail: mailBody, subject: mailSubject},function (err, data) {
//     if (err) {
//         console.log(err);
//     } else {
//         var mainOptions = {
//             from: process.env.CUSTOMMAIL,
//             to: recipientEmail,
//             subject: mailSubject,
//             html: data
//         };
//         console.log("html data ======================>", mainOptions.html);
//         transporter.sendMail(mainOptions, function (err, info) {
//             if (err) {
//                 console.log(err);
//             } else {
//                 console.log('Message sent: ' + info.response);
//             }
//         });
//     }
//     });
//     req.flash('success', 'Successfully Sent Mail!');
//     res.redirect(`/admin/admin.dashboard`);
// });

//end email//



router.get('/admin.logout', onlyAdmin, (req, res) => {
    req.logout();
    res.redirect('/secureadmin.login')
})


module.exports = router;