const express = require('express');
const { recruiterLogin, recruiterRegister, recruiterForgetPassword, resendOtp, recruiterVerifyOtp, recruiterResetPassword, recruiterLogOut } = require('../controllers/recruiterAuth.controler');
const router = express.Router();

// login route for recruiter coming from the login button clicked
router.get('/login', (req, res) => {
    res.render('recruiter/recruiter_forms/recruiter_login', { errorMsg: null, display: null });
});

// login route for recruiter coming from form
router.post('/login', recruiterLogin);


// registration route from button
router.get('/register', (req, res)=>{
    res.render('recruiter/recruiter_forms/recruiter_registration', {errorMsg: null});
});


// registration route from form
router.post('/register', recruiterRegister);

// route to render the forget password form
router.get('/forgotPassword', (req, res)=>{
    res.render('recruiter/recruiter_forms/recruiter_forgot_password', {errorMsg: null});
});


// route to perform forget password operations
router.post('/forgotPassword', recruiterForgetPassword);


// route for resending the otp
router.get('/resend_otp', resendOtp);


// verify otp 
router.get('/verifyotp', (req, res)=>{
    res.render('recruiter/recruiter_forms/recruiter_verify_otp', {errorMsg: null});
});


// route to verify otp
router.post('/verifyotp', recruiterVerifyOtp);

// route to perform reset password operations
router.post('/reset_password', recruiterResetPassword);


// route to logout from the site
router.get('/logout', recruiterLogOut);

module.exports = router;