var conn = require('../database/dbConnect.js');
const md5 = require('md5');
const mailFunc = require('../function/mailSetup.js');

const recruiterLogin = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const encPass = md5(password);

    const query = `SELECT * FROM job_creator WHERE emailID = ? LIMIT 1`;

    conn.query(query, [email], (err, result) => {
        if (err) {
            res.status(500).send('Server error');
            return;
        }else{
            if (result.length > 0) {
                if(result[0].isActive == 1){
                    if(encPass === result[0].password){
                        req.session.loggedIn = true;
                        req.session.creator_id = result[0].creator_id;
                        req.session.creator_username = result[0].creator_fname + ' ' + result[0].creator_lname;
                        req.session.profilePic = result[0].profile_photo;
                        req.session.company_name = result[0].company;
                        res.redirect('/jobCreator?toastNotification=Logged In Successfully!');
                    }else{
                        res.render('recruiter/recruiter_forms/recruiter_login', {errorMsg: 'Wrong Password', display: null});
                    }
                }else{
                    res.render('recruiter/recruiter_forms/recruiter_login', {errorMsg: null, display:true});
                }
            } else {
                res.redirect('/jobCreator/login');
            }
        }
    });
};

const recruiterRegister = (req, res) => {
    const fname = req.body.fname,
          lname = req.body.lname,
          email = req.body.email,
          password = req.body.password,
          company = req.body.company,
          phno = req.body.phno,
          confirmPassword = req.body.confirmpassword;

    const profilePic = `${company}.png`;
    const encPassword = md5(password);


    if (password === confirmPassword) {
        const addCreator = `INSERT INTO job_creator (creator_fname, creator_lname, company, emailID, contact_number, password, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [fname, lname, company, email, phno, encPassword, profilePic];

        conn.query(addCreator, values, (err, result) => {
            if (err) {
                res.status(500).send('Server error');
                console.log(err);
                return;
            } else {
                res.redirect('/jobCreator/login');
            }
        });
    } else {
        res.render('recruiter/recruiter_forms/recruiter_registration', { errorMsg: 'Passwords do not match' });
    }
};

const recruiterForgetPassword = (req, res)=>{
    const email = req.body.email;
    const query = 'SELECT * FROM job_creator WHERE emailID = ?';
    conn.query(query, [email], async (err, result)=>{
        if(err){
            console.log(err);
            res.redirect('/jobCreator/login');
        }else{
            if(result.length > 0){
                try{
                    const mailResult = await mailFunc.sendOtp(email);
                    if(mailResult.success){
                        req.session.creator_email = email;
                        req.session.creator_otp = mailResult.otp;
                        res.redirect('/jobCreator/verifyotp');
                    }
                }catch(error){
                    res.send('Error while sending email');
                }
            }else{
                res.render('recruiter/recruiter_forms/recruiter_forgot_password', {errorMsg: 'Email doesnot exists'});
            }
        }
    });
};

const resendOtp = async(req, res)=>{
    const email = req.session.creator_email;
    try{
        const mailResult = await mailFunc.sendOtp(email);
        if(mailResult.success){
            req.session.creator_otp = mailResult.otp;
            res.render('recruiter/recruiter_forms/recruiter_verify_otp', {errorMsg: null});
        }
    }catch(error){
        res.send('Error while sending email');
    }
};

const recruiterVerifyOtp = (req, res)=>{
    const otp = req.body.otp1 + req.body.otp2 + req.body.otp3 + req.body.otp4;
    if(otp == req.session.creator_otp){
        res.render('recruiter/recruiter_forms/recruiter_reset_password', {errorMsg: null});
    }else{
        res.render('recruiter/recruiter_forms/recruiter_verify_otp', {errorMsg: 'Invalid OTP'});
    }
};

const recruiterResetPassword = (req, res)=>{
    const newPass = md5(req.body.new_password);
    const confirmPass = md5(req.body.confirm_password);

    if(newPass === confirmPass){
        const query = 'UPDATE job_creator SET password = ? WHERE emailID = ?';
        conn.query(query, [newPass, req.session.creator_email], (err, result)=>{
            if(err){
                console.log(err);
               return;
            }else{
                res.redirect('/jobCreator/login');
            }
        });
    }else{
        res.render('recruiter/recruiter_forms/recruiter_reset_password', {errorMsg: 'Password Does not Match'});
    }
};


const recruiterLogOut = (req, res)=>{
    req.session.destroy();
    res.redirect('/home');
};


module.exports = {
    recruiterLogin,
    recruiterRegister,
    recruiterForgetPassword,
    resendOtp,
    recruiterVerifyOtp,
    recruiterResetPassword,
    recruiterLogOut
}