//NPM Dependencies//
const express = require('express');
const router = express.Router();
const Users = require('../models/users');
const Transaction = require('../models/transaction');
const Notification = require('../models/notification');
const Investment = require('../models/investment');
const Referral = require('../models/referral');
const Reviews = require('../models/reviews');
const Depositmethods = require('../models/depositmethod');
const InvestmentPlans = require('../models/investmentplans');
const passport = require('passport');
const {sendEmail, welcomeMail, emailActMail, passwordResetMail, verifyMail, acctVerifiedMail, depositMail, openInvestmentMail, endInvestmentMail} = require("../utils/sendEmail");
const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");
const multer  = require('multer');
const { storage, cloudinary } = require('../cloudinary');
const upload = multer({ storage });
const bcrypt = require('bcrypt');
//End of NPM Dependencies//


//Javascript Time and Date Setup//
// const today = new Date();
// const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
// const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
// const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
// const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
// const dateTime = date+' '+time+ ' ' + ampm;
//End of Javascript Time and Date Setup//

//Middlewares//
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

const paidAcctCharges = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    if (user.accountchargesStatus === 'Unpaid') {
        req.flash('error', 'You are yet to pay your investment service charge!')
        return res.redirect('/user/service-charge-payment')
    } 
    next();
}

const paidUpgradeFee = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    if (user.upgradefeeStatus === 'Unpaid') {
        req.flash('error', 'You need to upgrade your account in order to withdraw funds!')
        return res.redirect('/user/account-upgrade')
    } 
    next();
}

const validateWithdrawal = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id).populate('investment');
    if (user.investment.length === 0) {
        req.flash('error', 'You need to make a minimum of 1 investment to be qualified for withdrawals!')
        return res.redirect('/dashboard/crypto-mining')
    } 
    next();
}

const checkAcctStatus = async(req, res, next) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    if (user.acctstatus === 'Not Active') {
        return res.redirect(`/user/${user.id}/activate-account`)
    } 
    next();
}
//End of Middlewares//
    

//Routes//
// router.get('/register', (req, res) => {
//     res.render('user/register');
// });

router.get('/register', (req, res) => {
    res.render('register');
});


router.post('/register', async(req, res) => {
    try {
        const { email, country, gender, firstname, lastname, phonenumber, password, confirmpassword } = req.body;
        const registeredUser = new Users({email, country, gender, firstname, lastname, phonenumber, confirmpassword, referralincomes: 0, wallet: 30, totalprofits: 0});
        if (confirmpassword == password) {

            const hashedpassword = await bcrypt.hash(password, 12);

            registeredUser.password = hashedpassword;
            await registeredUser.save();

            // const aki = await Users.find({});
            // console.log(aki.length)
            
            // console.log(registeredUser)
            
            // console.log(hashedpassword)

            // const subject = 'WELCOME To KYGOPOOL';
            // await welcomeMail(registeredUser.email, subject, registeredUser.username);
            req.login(registeredUser, err => {
                if (err) return next(err);
                req.flash('success', 'Welcome!!');
                res.redirect('/dashboard');
            })
        } else {
            req.flash('error', 'Password and Confirm Password does not match');
            res.redirect('/register');
        }    
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
   
});

// router.get('/login', (req, res) => {
//     res.render('user/login');
// });

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', isClient, passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), (req, res) => {
    req.flash('success', 'Successfully Logged In!');
    
    res.redirect('/dashboard');
})


router.get('/password-reset', (req, res) => {
    res.render('passwordreset');
});

// router.get('/dashboard', isLoggedIn, onlyClient, checkAcctStatus, async(req, res) => {
//     const id = req.user.id;
//     const user = await Users.findById(id).populate('investment');
    
//     console.log(user.id)
//     res.render('user/dashboard', {user});
// });

router.get('/dashboard', isLoggedIn, onlyClient, async(req, res) => {
    const id = req.user.id;
    const user = await Users.findById(id).populate('investment');
    const investments = await Investment.find({userId: user.id, investmentstatus: 'Active'}).sort({investmentstartdate: -1});
    const lastinvestments = await Investment.find({userId: user.id, investmentstatus: 'Completed'}).sort({investmentstartdate: -1});
    const deposits = await Transaction.find({validateUser: user, transactionType: 'Deposit'}).sort({transactiondate: -1});
    const withdrawal = await Transaction.find({validateUser: user, transactionType: 'Withdraw'}).sort({transactiondate: -1});
   console.log(investments)
    res.render('user/dashboard', {user, deposits, withdrawal, investments, lastinvestments});
});

router.get('/dashboard/profile', isLoggedIn,  onlyClient, async(req, res) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    console.log(user.confirmpassword)
    res.render('user/accountprofile', {user});
});

router.get('/dashboard/changepassword', isLoggedIn,  onlyClient, async(req, res) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    res.render('user/changepassword', {user});
});

router.put('/:id/changepassword', isLoggedIn, onlyClient, async(req, res) => {
    const id = req.user.id;
    const user = await Users.findById(id)
    const {currentpassword, password, confirmpassword} = req.body;

    const validPassword = await bcrypt.compare(currentpassword, user.password);
    if(validPassword) {
        if(password === confirmpassword) {
            const hashedpassword = await bcrypt.hash(password, 12);
            await user.updateOne({password: hashedpassword, confirmpassword: confirmpassword}, { runValidators: true, new: true })

            req.login(user, function(err) {
                if (err) return next(err);
                req.flash('success', 'Password Changed!');
                res.redirect('/dashboard');
            })
        } else {
            req.flash('error', 'Passwords do not match.')
            res.redirect(`/${id}/changepassword`)
        }
    } else {
        req.flash('error', 'Incorrect Password.')
        res.redirect(`/${id}/changepassword`)
    }
});

router.put('/dashboard/profile/:id', isLoggedIn, onlyClient, async(req, res) => {
    const id = req.user.id;
    const {email, firstname, lastname, username, phonenumber, country, state, address, gender} = req.body;
    const user = { ...req.body };
    const saveUser = await Users.findByIdAndUpdate(id, user, { runValidators: true, new: true })
    console.log(saveUser);
    req.flash('success', 'Successfully Updated Profile!')
    res.redirect(`/dashboard/profile`);
});

router.put('/verify/:id', isLoggedIn, onlyClient,  upload.array('verificationdocument'), async (req, res) => {
    const id = req.user.id; 
    const {documenttype } = req.body;
    // const updateuser = {verificationstatus: 'Pending', documenttype};
    const user = await Users.findByIdAndUpdate(id, {documenttype, verificationstatus: 'Pending'}, { runValidators: true, new: true })
    user.verificationdocument =  req.files.map(f => ({url: f.path, filename: f.filename}))
    await user.save();
    const subject = 'USER VERIFICATION';
    await verifyMail(user.email, subject, user.username);
    console.log(user);
    req.flash('success', 'Successfully Submitted Document!')
    res.redirect('/dashboard/profile')
});

router.put('/upload-profile-picture', isLoggedIn, onlyClient,  upload.array('profilepicture'), async (req, res) => {
    const id = req.user.id;
    const {profilepicture } = req.body;
    const user = await Users.findByIdAndUpdate(id, {profilepicture}, { runValidators: true, new: true })
    user.profilepicture = req.files.map(f => ({url: f.path, filename: f.filename}))
    await user.save();
    req.flash('success', 'Successfully Uploaded Profile Picture!')
    res.redirect('/dashboard/profile')
});

router.put('/delete-profile-picture', isLoggedIn, onlyClient,  upload.array('profilepicture'), async (req, res) => {
    const id = req.user.id;
    const user = await Users.findById(id)
    for (let filename of user.profilepicture) {
        await cloudinary.uploader.destroy(filename);
    }
    await user.updateOne({ $pull: { profilepicture: { } } })
    await user.save();
    req.flash('success', 'Successfully Deleted Profile Picture!')
    res.redirect('/dashboard/profile')
});
router.get('/dashboard/deposit', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const deposits = await Transaction.find({validateUser: user, transactionType: 'Deposit'}).sort({transactiondate: -1});
    const depositmethods  = await Depositmethods.find({});
    res.render('user/deposit', {user, depositmethods, deposits });
});

router.post('/dashboard/deposits', isLoggedIn, onlyClient, async(req, res) => {
    const id  = req.user.id;
    const user = await Users.findById(id);
        const today = new Date();
        const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
        const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
        const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
        const dateTime = date+' '+time+ ' ' + ampm;
    const {transactionmethod, amount} = req.body;
    const deposit = new Transaction({transactionmethod, amount, transactiondate: dateTime, transactionType: 'Deposit', validateUser: user});
    user.transaction.push(deposit);
    await deposit.save();
    await user.save()
    res.redirect(`/dashboard/deposits/payment/${deposit.id}`);
});

router.get('/dashboard/deposits/payment/:id', isLoggedIn,  onlyClient, async(req, res) => {
    const userid = req.user.id;
    const transactionid = req.params.id;
    const deposit = await Transaction.findById(transactionid);
    const user = await Users.findById(userid);
    const transactionMethod = deposit.transactionmethod;
    const depositmethod  = await Depositmethods.findOne({depositmethodname: `${transactionMethod}`});
    res.render('user/payment', {user, deposit, depositmethod});
});

router.get('/dashboard/deposits/upload/:id', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const deposit = await Transaction.findById(req.params.id);
    res.render('user/depositupload', {user, deposit});
});

router.put('/dashboard/deposits/payment/:id', isLoggedIn, onlyClient,  upload.array('depositproof'), async (req, res) => {
    const id = req.params.id; 
    const {transactionproof } = req.body;
    const deposit = await Transaction.findByIdAndUpdate(id, {transactionproof}, { runValidators: true, new: true })
    deposit.transactionproof =  req.files.map(f => ({url: f.path, filename: f.filename}))
    await deposit.save();
    
    if (deposit.transactionType === 'Deposit') {
        req.flash('success', 'Successfully Submitted Proof!')
        res.redirect('/dashboard/deposit')
    } else if (deposit.transactionType === 'Payment') {
        if (deposit.narration === 'Account Upgrade') {
            req.flash('success', 'Successfully Submitted Proof!')
            res.redirect('/user/account-upgrade')
        } else if (deposit.narration === 'Service Charge') {
            req.flash('success', 'Successfully Submitted Proof!')
            res.redirect('/user/payment/servicechargepayment')
        }
    }
});

router.get('/dashboard/withdrawal', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const withdrawal = await Transaction.find({validateUser: user, transactionType: 'Withdraw'})
    console.log(withdrawal)
    res.render('user/withdrawal', {user, withdrawal});
});

router.post('/dashboard/withdrawal', isLoggedIn, onlyClient, validateWithdrawal, paidAcctCharges, paidUpgradeFee, async(req, res) => {
    const id  = req.user.id;
    const user = await Users.findById(id);
        const today = new Date();
        const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
        const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
        const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
        const dateTime = date+' '+time+ ' ' + ampm;
    const {transactionmethod, amount} = req.body;
    const withdraw = new Transaction({transactionmethod, transactiondate: dateTime, transactionType: 'Withdraw', validateUser: user, amount});
    if (amount <= user.wallet) {
        user.transaction.push(withdraw);
        await withdraw.save();
        await user.save()
        res.redirect(`/dashboard/withdrawal/${withdraw.id}`);
    } else {
        req.flash('error', 'Insufficient Balance');
        res.redirect('/dashboard/withdrawal');
    }
    
});

router.get('/dashboard/withdrawal/:id', isLoggedIn,  onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const withdraw = await Transaction.findById(req.params.id);
    res.render('user/withdraw2', {user, withdraw});
});

router.put('/dashboard/withdrawal/:id', isLoggedIn, onlyClient, async (req, res) => {
    const id = req.params.id; 
    const withdraw = await Transaction.findByIdAndUpdate(id, req.body, { runValidators: true, new: true })
    await withdraw.save();
    req.flash('success', 'Withdrawal Request Submitted')
    res.redirect('/dashboard/withdrawal')
});

router.get('/activity', isLoggedIn,  onlyClient, async(req, res) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    
    res.render('user/activity', {user});
});

router.get('/dashboard/affiliateprogram', isLoggedIn,  onlyClient, async(req, res) => {
    const id = req.user.id;
    const user = await Users.findById(id).populate('referrals');
    res.render('user/affiliate', {user});
});

router.put('/dashboard/affiliateprogram', isLoggedIn, onlyClient, async (req, res) => {
    const user = await Users.findById(req.user.id);
    if (user.referralincomes > 0 ) {
        await user.updateOne({wallet: user.wallet + user.referralincomes, referralincomes: 0, wallet: 0,}, { runValidators: true, new: true });
        req.flash('success', `Successfully transferred referral incomes to main wallet.`)
        res.redirect(`/user/affiliateprogram`)
    } else {
        req.flash('error', `Referral wallet is empty!`)
        res.redirect(`/dashboard/affiliateprogram`)
    }
    
});

router.get('/dashboard/notification', isLoggedIn,  onlyClient, async(req, res) => {
    const id = req.user.id;
    const user = await Users.findById(id).populate({path: 'notifications', options: { sort: { 'notificationdate': -1 } } });
    res.render('user/notification', {user});
});

router.get('/register/:id', async(req, res) => {
    const user = await Users.findById(req.params.id);
    res.render('user/refregister', {user});
});

router.post('/register/:id', async(req, res) => {
    const referedid = await Users.findById(req.params.id);
    try {
        const { email, country, gender, firstname, lastname, phonenumber, password, confirmpassword } = req.body;
        const registeredUser = new Users({email, country, gender, firstname, lastname, phonenumber, confirmpassword, referralincomes: 0, wallet: 30, totalprofits: 0});
        if (confirmpassword == password) {
            const hashedpassword = await bcrypt.hash(password, 12);
            registeredUser.password = hashedpassword;
            await registeredUser.save

            
            await referedid.updateOne({referralincomes: referedid.referralincomes + 50}, { runValidators: true, new: true })
            const referral = new Referral({firstname: registeredUser.firstname, lastname: registeredUser.lastname, email: registeredUser.email});
            referedid.referrals.push(referral);
            await referral.save();
            await referedid.save()

            const subject = 'WELCOME To KYGOPOOL';
            await welcomeMail(registeredUser.email, subject, registeredUser.username);
            
            req.login(registeredUser, err => {
                if (err) return next(err);
                console.log(registeredUser)
                req.flash('success', 'Welcome!!');
                res.redirect('/dashboard');
            })
        } else {
            req.flash('error', 'Password and Confirm Password does not match');
            res.redirect('/register');
        }    
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
});

router.get('/dashboard/support', isLoggedIn,  onlyClient, async(req, res) => {
    const id = req.user.id;
    const user = await Users.findById(id);
    res.render('user/support', {user});
});

router.post('/dashboard/review', isLoggedIn, onlyClient, async(req, res) => {
    const user = await Users.findById(req.user.id);
    const today = new Date();
    const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    const hours = today.getHours() > 12 ? today.getHours() - 12 : today.getHours();
    const time = hours + ":" + today.getMinutes() + ":" + today.getSeconds();
    const ampm = today.getHours() >= 12 ? 'PM' : 'AM';
    const dateTime = date+' '+time+ ' ' + ampm;
    const {comment} = req.body;
    const review = new Reviews({comment, reviewdate: dateTime, username: user.username});
    user.reviews.push(review);
    await review.save();
    await user.save()
    req.flash('success', 'Review Submitted')
    res.redirect(`/dashboard/review/`);
});

router.delete('/dashboard/review/:id',  isLoggedIn, onlyClient, async (req, res) => {
    const  id  = req.params.id;
    await Reviews.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted review.')
    res.redirect('/dashboard/review')
});

router.get('/logout',(req, res) => {
    req.logout();
    res.redirect('/login')
})



module.exports = router;

//End of Routes//