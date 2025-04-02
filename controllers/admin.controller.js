var conn = require('../database/dbConnect.js');

const openAdminDashboard = (req, res) => {
    if (!req.session.isAdminLoggedIn) {
        res.render('admin/admin_login_form', { errorMsg: null });
    } else {
        res.render('admin/admin_home', { profilePic: req.session.profilePic, username: req.session.username, toastNotification: req.query.toastNotification });
    }
};

const adminLogin = (req, res) => {
    const emailid = req.body.email;
    const password = req.body.password;
    const hashedPassword = md5(password);
    const query = `SELECT * FROM portal_admin WHERE emailID = ? LIMIT 1`;

    conn.query(query, [emailid], (error, result) => {
        if (error) {
            console.log(error);
            return;
        } else {
            if (result.length > 0) {
                if (result[0].password == hashedPassword) {
                    req.session.isAdminLoggedIn = true;
                    req.session.username = result[0].admin_fname + " " + result[0].admin_lname;
                    req.session.profilePic = result[0].profile_pic;
                    res.redirect('/admin?toastNotification=Logged In Successfully!!');
                } else {
                    res.render('admin/admin_login_form', { errorMsg: "Wrong Password" });
                }
            } else {
                res.render('admin/admin_login_form', { errorMsg: "Email ID not found" });
            }
        }
    });
};

const displayRecruiterList = (req, res) => {
    const getRecruiter = 'SELECT * from job_creator';
    conn.query(getRecruiter, (error, result) => {
        if (error) {
            console.log(error);
            return;
        } else {
            const data = {};
            data.rows = result;
            console.log(result);
            res.json(data);
        }
    });
};

const filterRecruiterList = (req, res) => {
    const company = req.body.company;
    const status = req.body.status;
    console.log("company: " + company);
    console.log("status: " + status);
    let filteredRecruiter = 'SELECT * FROM job_creator';
    let value = [];
    if (company != "" && status == "") {
        filteredRecruiter += " WHERE company = ?";
        value = [company];
    } else if (company == "" && status != "") {
        filteredRecruiter += " WHERE isActive = ?";
        value = [status];
    } else {
        value = [];
    }
    conn.query(filteredRecruiter, value, (error, result) => {
        if (error) {
            console.log(error);
            return;
        } else {
            const data = {};
            data.rows = result;
            res.send(data);
        }
    });
};


const updateBlocking = (req, res) => {
    const creatorId = req.query.creator_id;
    const isActive = req.query.isActive;
    const updateStatus = `UPDATE job_creator SET isActive = ? WHERE creator_id = ?`;

    conn.query(updateStatus, [isActive, creatorId], (error, result) => {
        if (error) {
            console.log(error);
            return;
        } else {
            res.redirect('/admin/');
        }
    });
};

const deleteRecruiter = (req, res) => {
    const creatorId = req.query.creator_id;
    const updateQuery = `update job_creator set creator_fname=null, creator_lname=null, contact_number=null, emailID = null, password=null, isActive = 0 where creator_id = ?`;
    conn.query(updateQuery, [creatorId], (err, results) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/admin?toastNotification=Deleted Successfully!!');
        }
    });
};

const getApplicantList = (req, res) => {
    const applicantList = `SELECT DISTINCT * FROM applicant_credentials ac join job_applicant ja on
                            ac.applicant_id = ja.applicant_id`;
    conn.query(applicantList, (error, result) => {
        if (error) {
            console.log(error);
            return;
        } else {
            const data = {};
            data.rows = result;
            res.json(data);
        }
    });
};

const getFilteredApplicantList = (req, res) => {
    const status = req.body.status;
    let filteredApplicant = 'SELECT * FROM job_creator';
    let value = [];
    if (company == "" && status != "") {
        filteredApplicant += " WHERE isActive = ?";
        value = [status];
    } else {
        value = [];
    }
    conn.query(filteredApplicant, value, (error, result) => {
        if (error) {
            console.log(error);
            return;
        } else {
            const data = {};
            data.rows = result;
            res.send(data);
        }
    });
};

const applicantBlocking = (req, res) => {
    const applicantId = req.query.applicant_id;
    const isActive = req.query.isActive;
    const updateStatus = `UPDATE applicant_credentials SET isActive = ? WHERE applicant_id = ?`;
    conn.query(updateStatus, [isActive, applicantId], (error, result) => {
        if (error) {
            console.log(error);
            return;
        } else {
            res.redirect('/admin/applicant_page');
        }
    });
};

const openEditRecruiter = (req, res) => {
    if (!req.session.isAdminLoggedIn) {
        res.redirect('/admin/login');
    } else {
        req.session.creatorID = req.query.creator_id;
        res.render('admin/admin_recruiter_details', { profilePic: req.session.profilePic, username: req.session.username })
    }
};

const getRecruiterData = (req, res) => {
    const creatorId = req.session.creatorID;
    const data = {};

    // First query to get the recruiter list
    const recruiterQuery = 'SELECT * FROM job_creator WHERE creator_id = ?';
    conn.query(recruiterQuery, [creatorId], (recruiterError, recruiterResult) => {
        if (recruiterError) {
            console.log(recruiterError);
            res.status(500).json({ error: 'An error occurred while fetching recruiter list.' });
            return;
        }
        data.recruiterList = recruiterResult;

        // Second query to get the job list
        const jobQuery = 'SELECT * FROM job_details WHERE creator_id = ?';
        conn.query(jobQuery, [creatorId], (jobError, jobResult) => {
            if (jobError) {
                console.log(jobError);
                res.status(500).json({ error: 'An error occurred while fetching job list.' });
                return;
            }
            data.jobList = jobResult;

            // Send the combined data as a response
            console.log(data);
            res.json(data);
        });
    });
};


const updateRecruiterDetails = (req, res) => {
    const creatorId = req.session.creatorID;
    const { creator_fname, creator_lname, company, emailID, contact_number, password, status} = req.body;
    const encPass= md5(password)

    const query = `UPDATE job_creator SET creator_fname = ?, creator_lname = ?, company = ?, emailID = ?, contact_number = ?, password = ?, isActive = ? WHERE creator_id = ?`;

    conn.query(query, [creator_fname, creator_lname, company, emailID, contact_number, encPass, status, creatorId], (error, result) => {
        if (error) {
            console.log(error);
        } else {
            res.redirect('/admin?toastNotification=Updated Successfully!');
        }
    });
};

const openApplicantDetailsPage = (req, res) => {
    if (!req.session.isAdminLoggedIn) {
        res.redirect('/admin/login');
    } else {
        req.session.applicantId = req.query.applicant_id;
        res.render('admin/admin_applicant_details', { profilePic: req.session.profilePic, username: req.session.username, toastNotification: null });
    }
};

const getApplicantData = (req, res) => {
    const applicant_id = req.session.applicantId;
    const data = {};

    // first query for aplicant details
    const applicantDetails = 'SELECT * FROM job_applicant ja JOIN applicant_credentials ac ON ja.applicant_id = ac.applicant_id WHERE ja.applicant_id = ?';
    conn.query(applicantDetails, [applicant_id], (error, applicantResult) => {
        if (error) {
            console.log(error);
            return;
        } else {
            data.applicantList = applicantResult;
            const applicationDetails = 'SELECT jd.job_role, jd.company, jd.city, jd.min_salary, jd.max_salary, japp.application_status, japp.applied_date FROM job_applications japp JOIN job_details jd ON japp.job_id  = jd.job_id WHERE japp.applicant_id = ?';
            conn.query(applicationDetails, [applicant_id], (error, applicationResult) => {
                if (error) {
                    console.log(error);
                    return;
                } else {
                    data.applicationList = applicationResult;
                    console.log(data);
                    res.json(data);
                }
            });
        }
    });
};

const updateApplicantDetails = (req, res) => {
    const applicant_id = req.session.applicantId;
    const { first_name, last_name, age, mobile_no, gender, exp_level, email_id, password, username,  status } = req.body;
    const encPass = md5(password)
    // Update query for job_applicant table
    const updateJobApplicantQuery = `
        UPDATE job_applicant
        SET 
            first_name = ?, 
            last_name = ?, 
            age = ?, 
            mobile_no = ?, 
            gender = ?, 
            exp_level = ?, 
            email_id = ?
        WHERE applicant_id = ?
    `;

    const jobApplicantValues = [first_name, last_name, age, mobile_no, gender, exp_level, email_id, applicant_id];

    // Update query for applicant_credentials table
    const updateCredentialsQuery = `
        UPDATE applicant_credentials
        SET 
            username = ?, 
            emailID = ?, 
            password = ?,
            isActive = ?
        WHERE applicant_id = ?
    `;

    const credentialsValues = [username, email_id, encPass, status, applicant_id];

    // Execute the updates in sequence
    conn.query(updateJobApplicantQuery, jobApplicantValues, (error, results) => {
        if (error) {
            console.log('Error updating job applicant details:', error);
            return res.send('Error updating details');
        }
        // After updating job_applicant, update applicant_credentials
        conn.query(updateCredentialsQuery, credentialsValues, (error, results) => {
            if (error) {
                console.log('Error updating applicant credentials:', error);
                return res.send('Error updating credentials');
            }
            res.redirect('/admin/applicant_page?toastNotification=Updated Successfully!!');
        });
    });
};

const deleteApplicant = (req, res) => {
    const applicant_id = req.query.applicant_id;
    const emailID = req.query.email_id;

    const deleteApplicationsQuery = `DELETE FROM job_applications WHERE applicant_id = ?`;
    const deleteCredentialsQuery = `DELETE FROM applicant_credentials WHERE applicant_id = ?`;
    const deleteJobApplicantQuery = `DELETE FROM job_applicant WHERE applicant_id = ?`;

    conn.query(deleteApplicationsQuery, [applicant_id], (error, results) => {
        if (error) {
            console.log('Error deleting job applications:', error);
            return res.send('Error deleting job applications');
        }
        conn.query(deleteJobApplicantQuery, [applicant_id], (error, results) => {
            if (error) {
                console.log('Error deleting job applicant details:', error);
                return res.send('Error deleting job applicant details');
            }
            conn.query(deleteCredentialsQuery, [applicant_id], (error, results) => {
                if (error) {
                    console.log('Error deleting applicant credentials:', error);
                    return res.send('Error deleting applicant credentials');
                }
                conn.query(`INSERT INTO ex_applicants (emailID) VALUES (?)`, [emailID], (err, results) => {
                    if (err) {
                        console.log('Error inserting into ex_applicants:', err);
                        return res.send('Error inserting into ex_applicants');
                    }

                    res.redirect('/admin/applicant_page?toastNotification=Deleted Successfully!!');
                });
            });
        });
    });
};

const adminLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(400).send(err);
        } else {
            res.redirect('/admin');
        }
    });
}


module.exports = {
    openAdminDashboard,
    adminLogin,
    displayRecruiterList,
    filterRecruiterList,
    updateBlocking,
    deleteRecruiter,
    getApplicantList,
    getFilteredApplicantList,
    applicantBlocking,
    openEditRecruiter,
    getRecruiterData,
    updateRecruiterDetails,
    openApplicantDetailsPage,
    getApplicantData,
    updateApplicantDetails,
    deleteApplicant,
    adminLogout
}