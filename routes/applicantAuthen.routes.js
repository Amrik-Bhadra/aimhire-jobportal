const express = require('express');
const router = express.Router();
const {login, login_via_otp, verifyOtp, applicantRegistration, forgetPassword, verify_otp2, resetPassword, changePassword, logout} = require('../controllers/auth.controller.js');

router.get('/login', (req, res) => {
    res.render('form/login_via_password', { errorMsg: null, display: null });
});


router.post('/login', login);

// route to open the login via otp form
router.get('/login_via_otp', (req, res) => {
    res.render('form/login_via_otp', { errorMsg: null });
});

router.post('/login_via_otp', login_via_otp);

router.post('/verify_otp', verifyOtp);

router.get('/registration', (req, res) => {
    res.render('Form/applicant_registration', { errorMsg: null });
});


router.post('/registration', applicantRegistration);

router.get('/forgot_password', (req, res) => {
    res.render('form/forgetpassword', { errorMsg: null })
});

router.post('/forgot_password', forgetPassword);

router.post('/verify_otp_2', verify_otp2);

router.get('/reset_password', (req, res) => {
    res.render('form/reset_password', { errorMsg: null });
});

router.put('/reset_password', resetPassword);

// Applicant Change Password
router.get('/changePassword', (req, res) => {
    res.render('form/change_password_form', {errorMsg: null});
});

router.put('/changePassword', changePassword);


// logout route
router.get('/logout', logout);


module.exports = router;