var conn = require('../database/dbConnect.js');
const md5 = require('md5');
const mailFunc  = require('../function/mailSetup.js');


const login = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const encPass = md5(password);
    console.log(email, password);

    const query = `SELECT * FROM applicant_credentials WHERE emailID = ? and password = ? LIMIT 1`;

    conn.query(query, [email, encPass], (err, result) => {
        if (err) {
            console.log(err)
            return;
        }
        if (result.length > 0) {
            if (result[0].isActive == 1) {
                req.session.loggedIn = true;
                req.session.applicantId = result[0].applicant_id;
                console.log('applicant logged in');
                res.redirect('/jobSeeker?toastNotification=Logged In Successfully!');
            } else {
                res.render('form/login_via_password', { errorMsg: null, display: true });
            }
        } else {
            res.render('form/login_via_password', { errorMsg: 'Invalid credentials', display: null });
        }
    });
};


const login_via_otp = (req, res) => {
    const emailID = req.body.emailID;
    const query = `SELECT * FROM applicant_credentials WHERE emailID = ?`;
    conn.query(query, [emailID], async (err, result) => {
        if (err) {
            console.log(err);
        } else {
            if (result.length > 0) {
                if (result[0].isActive == 1) {
                    try {
                        const mailResult = await mailFunc.sendOtp(emailID);
                        if (mailResult.success) {
                            console.log(mailResult.otp);
                            req.session.otp = mailResult.otp;
                            req.session.applicantId = result[0].applicant_id;
                            res.render('form/verify_otp')
                        }
                    } catch (error) {
                        console.log(error);
                        res.send('Error sending email');
                    }
                } else {
                    res.render('form/login_via_otp', { errorMsg: null, display: true });
                }
            } else {
                res.render('form/login_via_otp', { errorMsg: 'Email not Found', display: null });
            }
        }
    });
};


const verifyOtp = (req, res) => {
    const otp = req.session.otp;
    const enteredOtp = req.body.otp;

    console.log('verify_otp_route_main_part');

    if (otp === enteredOtp) {
        console.log('verify_otp_route_if_part');
        req.session.loggedIn = true;
        res.redirect('/jobSeeker?toastNotification=Logged In Successfully!');
    } else {
        console.log('verify_otp_route_else_part');
        res.render('form/login_via_otp', { errorMsg: 'Invalid OTP' });
    }
}


const applicantRegistration = (req, res) => {
    // const emailID = req.body.emailID;
    // const username = req.body.username;
    // const password = req.body.password;
    // const con_password = req.body.con_password;

    const { emailID, username, password, con_password } = req.body;
    const encPass = md5(password);

    const exApplicantQuery = `SELECT * FROM ex_applicants WHERE emailID = ?`;

    // First, check if the emailID is in the ex_applicants table
    conn.query(exApplicantQuery, [emailID], (err, exResults) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Internal server error');
        }

        if (exResults.length > 0) {
            // Email is blocked
            return res.render('Form/applicant_registration', { errorMsg: 'EmailID blocked' });
        } else {
            const emailAreadyExistsQuery = `SELECT * FROM applicant_credentials WHERE emailID = ?`
            // Check if the emailID already exists in the applicant_credentials table
            conn.query(emailAreadyExistsQuery, [emailID], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal server error');
                }

                if (results.length > 0) {
                    res.render('Form/applicant_registration', { errorMsg: 'Email already exists' });
                } else {
                    if (password === con_password) {
                        const insertCredentialQuery = `INSERT INTO applicant_credentials (username, emailID, password) VALUES (?, ?, ?)`;
                        conn.query(insertCredentialQuery, [username, emailID, encPass], (err, result) => {
                            if (err) {
                                console.log(err);
                                return res.status(500).send('Internal server error');
                            } else {
                                const getApplicantQuery = `SELECT * FROM applicant_credentials WHERE emailID = ? AND password = ? LIMIT 1`;
                                conn.query(getApplicantQuery, [emailID, encPass], (err, result) => {
                                    if (err) {
                                        console.log(err);
                                        return res.status(500).send('Internal server error');
                                    }

                                    if (result.length > 0) {
                                        req.session.applicantId = result[0].applicant_id;
                                        req.session.email = result[0].emailID;
                                        res.render('form/complete_form');
                                    }
                                });
                            }
                        });
                    } else {
                        res.render('Form/applicant_registration', { errorMsg: 'Password and Confirm Password do not match' });
                    }
                }
            });
        }
    });
}


const forgetPassword = (req, res) => {
    const emailID = req.body.emailID;
    const getCredentialsQuery = `SELECT * FROM applicant_credentials WHERE emailID = ?`

    conn.query(getCredentialsQuery, [emailID], async (err, result) => {
        if (err) {
            console.log(err);
            res.redirect('/jobSeeker/login');
        } else {
            if (result.length > 0) {
                try {
                    const mailResult = await mailFunc.sendOtp(emailID);
                    if (mailResult.success) {
                        req.session.femailID = emailID;
                        req.session.fotp = mailResult.otp;
                        res.render('form/verify_otp2');
                    }
                } catch (error) {
                    console.log(error);
                    res.send('Error sending email');
                }
            } else {
                res.render('form/forgetpassword', { errorMsg: 'Email does not exist' });
            }
        }
    });
}


const verify_otp2 = (req, res) => {
    const fotp = req.session.fotp;
    const enteredOtp = req.body.otp;

    if (fotp === enteredOtp) {
        res.redirect('/jobSeeker/reset_password');
    } else {
        res.render('form/forgetpassword', { errorMsg: 'Invalid OTP' });
    }
}

const resetPassword = (req, res) => {
    var email = req.session.femailID;
    var con_password = req.body.con_password;
    var password = req.body.password;
    var encPass = md5(password);
    if (password === con_password) {
        const updatePassQuery = 'update applicant_credentials SET password = ? where emailID = ?';
        conn.query(updatePassQuery, [encPass, email], function (error, results, fields) {
            if (error) {
                console.error("Error in reseting password");
                res.redirect('/jobSeeker/forgot_password');
            } else {
                res.redirect('/jobSeeker/login');
            }
        });
    } else {
        res.render('form/reset_password', { errorMsg: 'Password and Confirm Password do not match' });
    }
}

const changePassword = (req, res) => {
    let oldPass = md5(req.body.oldPassword);
    const checkOldPass = 'SELECT password FROM applicant_credentials WHERE applicant_id = ?';
    conn.query(checkOldPass, [req.session.applicantId], (error, results)=>{
        if(error){
            console.log(err);
            return;
        }else{
            if(oldPass === results[0].password){
                let newPass = md5(req.body.newPassword);
                let confirmPass = md5(req.body.con_password);
                if(newPass === confirmPass){
                    const updatePass = 'UPDATE applicant_credentials SET password = ? WHERE applicant_id = ?';
                    conn.query(updatePass, [newPass, req.session.applicantId], (error, result2)=>{
                        if(error){
                            console.log(error);
                            return;
                        }else{
                            res.redirect('/jobSeeker/login');
                        }
                    });
                }else{
                    res.render('form/change_password_form', {errorMsg: 'passwords doesnot match'})
                }
            }else{
                res.render('form/change_password_form', {errorMsg: 'current Password is incorrect'});
            }
        }
    });
}

const logout = (req, res)=>{
    req.session.destroy();
    res.redirect('/home');
}

module.exports = { login_via_otp, login, verifyOtp, applicantRegistration, forgetPassword, verify_otp2, resetPassword, changePassword, logout };