var conn = require('../database/dbConnect.js');
const fs = require('fs');
const dbgetter = require('../database/dbGetter.js');

const applicantHomePage = (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/jobSeeker/login');
    } else {
        const applicantID = req.session.applicantId;
        const query1 = `SELECT profile_pic_code FROM job_applicant ja JOIN applicant_credentials ac ON ja.applicant_id = ac.applicant_id WHERE ja.applicant_id = ?`;

        conn.query(query1, [applicantID], (err, result1) => {
            if (err) console.log(err);
            else {

                const query2 = `SELECT jd.*
                            FROM job_details jd
                                JOIN (
                                    SELECT job_id, COUNT(application_id) AS application_count
                                        FROM job_applications
                                    GROUP BY job_id
                                        ORDER 
                                            BY application_count DESC
                                        LIMIT 6
                            ) top_jobs ON jd.job_id = top_jobs.job_id;`;

                conn.query(query2, (err, result2) => {
                    if (err) {
                        console.log(err);

                    } else {
                        const notificationquery = "SELECT japp.job_id, company, application_status, job_role from job_details jd join job_applications japp on jd.job_id = japp.job_id where applicant_id = ? and japp.isViewed = 1 and not application_status = 'pending';";

                        conn.query(notificationquery, [req.session.applicantId], (err, result3) => {
                            if (err) {
                                console.log(err);
                                return;
                            } else {
                                req.session.profilePic = result1[0].profile_pic_code;
                                res.render('applicant/applicant_homepage', { profilePic: result1[0].profile_pic_code, r2: result2, isLogged: req.session.loggedIn, notiResult: result3, toastNotification: req.query.toastNotification });
                            }
                        });
                    }
                });
            }
        });
    }
}

const displayJobs = (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/jobSeeker/login');
    }
    else {
        const notificationquery = "SELECT japp.job_id, company, application_status, job_role from job_details jd join job_applications japp on jd.job_id = japp.job_id where applicant_id = ? and japp.isViewed = 1 and not application_status = 'pending';";

        conn.query(notificationquery, [req.session.applicantId], (err, result3) => {
            if (err) {
                console.log(err);
                return;
            } else {

                res.render('applicant/jobList', { isLogged: req.session.loggedIn, profilePic: req.session.profilePic, notiResult: result3, toastNotification: req.query.toastNotification });
            }
        });
    }
};

const filterJobs = (req, res) => {
    const city = req.body.city;
    const skills = req.body.skills_req;
    const job_role = req.body.job_role;
    console.log(job_role);
    const job_type = req.body.job_type;
    const company = req.body.company;
    const work_type = req.body.work_type;
    const work_mode = req.body.work_mode;
    const sort_by = req.body.sort_by;
    console.log(sort_by);

    var query = 'SELECT * FROM job_details WHERE 1=1';

    if (city) {
        query += ` AND city LIKE '%${city}%'`;
    }
    if (skills) {
        query += ` AND skills_req LIKE '%${skills}%'`;
    }
    if (job_role) {
        query += ` AND job_role LIKE '%${job_role}%'`;
    }
    if (job_type) {
        query += ` AND job_type LIKE '%${job_type}%'`;
    }
    if (company) {
        query += ` AND company LIKE '%${company}%'`;
    }
    if (work_type) {
        query += ` AND work_type LIKE '%${work_type}%'`;
    }
    if (work_mode) {
        query += ` AND work_mode LIKE '%${work_mode}%'`;
    }

    // Apply sorting
    if (sort_by) {
        if (sort_by === 'salaryHighToLow') {
            query += ' ORDER BY min_salary DESC';
        } else if (sort_by === 'salaryLowToHigh') {
            query += ' ORDER BY min_salary ASC';
        }
    }

    dbgetter.dbgetData(req, res, query);
}

const jobDetails = (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/jobSeeker/login');
    }
    
    const profilePic = req.session.profilePic;
    const id = req.query.jobid;
    const query1 = `select * from job_details where job_id = ?`;
    conn.query(query1, [id], (err, result1) => {
        if (err) {
            console.log(err);
        }
        else {
            const jobrole = result1[0].job_role
            const query2 = `select * from job_details where job_role = ?`;
            conn.query(query2, [jobrole], (err, result2) => {
                if (err) {
                    console.log(err);
                }
                else {
                    const notificationquery = "SELECT japp.job_id, company, application_status, job_role from job_details jd join job_applications japp on jd.job_id = japp.job_id where applicant_id = ? and japp.isViewed = 1 and not application_status = 'pending';";

                    conn.query(notificationquery, [req.session.applicantId], (err, result3) => {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            const checkApplied = 'select count(*) from job_applications where job_id = ? and applicant_id = ?';
                            conn.query(checkApplied, [id, req.session.applicantId], (error, result4) => {
                                if (error) {
                                    console.log(error);
                                    return;
                                } else {
                                    let isApplied;
                                    if (result4[0]['count(*)'] > 0) {
                                        isApplied = true;
                                    } else {
                                        isApplied = false;
                                    }
                                    res.render('applicant/job_details', { jobID: id, profilePic: profilePic, job: result1[0], simjobs: result2, isLogged: req.session.loggedIn, notiResult: result3, isApplied: isApplied });
                                }
                            });
                        }
                    });
                }
            })
        }
    })
}

const applyForJob = (req, res) => {
    // console.log(req.session.applicantId)
    const applicant_id = req.session.applicantId;
    const job_id = req.query.jobID;
    const date = new Date();

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let currentDate = `${year}-${month}-${day}`;
    const query = `INSERT INTO job_applications (applicant_id, job_id, applied_date, isSaved) VALUES (?,?,?, 0)`;
    conn.query(query, [applicant_id, job_id, currentDate], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/jobSeeker/jobList?toastNotification=Applied Successfully');
        }
    });
}


const applicantDashboard = (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/jobSeeker/login');
    }

    const id = req.session.applicantId;

    const applicantQuery = `
        SELECT * FROM job_applicant ja
        JOIN applicant_credentials ac ON ja.applicant_id = ac.applicant_id
        WHERE ja.applicant_id = ?
    `;

    conn.query(applicantQuery, [id], (err, applicantResult) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Server Error');
        }

        if (applicantResult.length === 0) {
            return res.status(404).send('Applicant not found');
        }

        const applicant = applicantResult[0];

        if (applicant.skills) {
            applicant.skills = applicant.skills.split(',');
        } else {
            applicant.skills = [];
        }

        const applicationsQuery = `
            SELECT * FROM job_applications ja
            JOIN job_details jd ON ja.job_id = jd.job_id
            WHERE ja.applicant_id = ? ORDER BY ja.application_id DESC;
        `;

        conn.query(applicationsQuery, [id], (err, applicationsResult) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Server Error');
            }

            const uniqueJobsQuery = `
                SELECT DISTINCT job_role
                FROM job_details jd 
                JOIN job_applications japp ON jd.job_id = japp.job_id 
                WHERE japp.applicant_id = ?;
            `;

            conn.query(uniqueJobsQuery, [id], (err, uniqueJobsResult) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Server Error');
                }

                res.json({
                    user: applicant,
                    applications: applicationsResult,
                    uniqueJobs: uniqueJobsResult
                });
            });
        });
    });
}


const openDashboard = (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/jobSeeker/login');
    }

    const id = req.session.applicantId;
    // console.log("Applicant Dashboard: " + id);

    const applicantQuery = `
        SELECT * FROM job_applicant ja
        JOIN applicant_credentials ac ON ja.applicant_id = ac.applicant_id
        WHERE ja.applicant_id = ?
    `;

    conn.query(applicantQuery, [id], (err, applicantResult) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Server Error');
        }

        if (applicantResult.length === 0) {
            return res.status(404).send('Applicant not found');
        }

        const applicant = applicantResult[0];

        if (applicant.skills) {
            applicant.skills = applicant.skills.split(',');
        } else {
            applicant.skills = [];
        }

        const notificationQuery = `
            SELECT japp.job_id,japp.application_id, company, application_status, job_role 
            FROM job_details jd 
            JOIN job_applications japp ON jd.job_id = japp.job_id 
            WHERE japp.applicant_id = ? AND japp.isViewed = 1 AND NOT japp.application_status = 'pending';
        `;
        conn.query(notificationQuery, [id], (err, notificationResult) => {
            if (err) {
                return console.log(err);
            }
            res.render('applicant/applicant_dashboard', {
                isLogged: req.session.loggedIn,
                profilePic: req.session.profilePic,
                notifications: notificationResult
            });
        })
    });
}


const editProfile = (req, res) => {
    if (!req.session.loggedIn) {
        res.redirect('/jobSeeker/login');
    } else {
        const id = req.session.applicantId;
        const query = `SELECT 
        ja.*, 
        ac.username, 
        ac.password 
        FROM 
            job_applicant ja
        JOIN 
            applicant_credentials ac 
        ON 
            ja.applicant_id = ac.applicant_id 
        WHERE 
            ja.applicant_id = ?`;

        conn.query(query, [id], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Server error');
            } else {
                const notificationquery = "SELECT japp.job_id, company, application_status, job_role from job_details jd join job_applications japp on jd.job_id = japp.job_id where applicant_id = ? and japp.isViewed = 1 and not application_status = 'pending';";

                conn.query(notificationquery, [req.session.applicantId], (err, result3) => {
                    if (err) {
                        console.log(err);
                        return;
                    } else {
                        res.render('applicant/editprofile', { applicant: result[0], isLogged: req.session.loggedIn, profilePic: req.session.profilePic, notiResult: result3 });
                    }
                });
            }

        });
    }
}


const deleteNotification = (req, res) => {
    const jobid = parseInt(req.query.jobid);
    
    const query = 'UPDATE job_applications SET isViewed = 0 WHERE job_id = ? and applicant_id = ?';

    conn.query(query, [jobid, req.session.applicantId], (err, result) => {
        if (err) {
            console.log(err);
            return;
        } else {
            res.redirect('/jobSeeker/');
        }
    });
}

const deleteProfilePic = (req, res) => {
    const applicantId = req.session.applicantId;
    const profilePic = req.session.profilePic;
    const filePath = `PUBLIC/ASSETS/UPLOADS/profile_images/${profilePic}`;
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log(err);
            return;
        } else {
            const deleteProfilePic = 'UPDATE job_applicant SET profile_pic_code = ? WHERE applicant_id = ?';
            const values = [null, applicantId];
            conn.query(deleteProfilePic, values, (error, result) => {
                if (error) {
                    console.log(error);
                    return;
                } else {
                    req.session.profilePic = null;
                    res.redirect('/jobSeeker/editprofile');
                }
            });
        }
    });
};


const uploadProfilePic = (req, res) => {
    // Extract form data
    const { applicant_id, first_name, last_name, age, mobile_no, email_id, exp, gender, profile_pic_code, skills } = req.body;
    const file = req.file;

    // Validate and process form data
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    // Prepare SQL insert query
    const query = `
    INSERT INTO profiles (applicant_id, first_name, last_name, age, mobile_no, email_id, exp, gender, profile_pic_code, skills, file_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    conn.query(query, [applicant_id, first_name, last_name, age, mobile_no, email_id, exp, gender, profile_pic_code, skills, file.originalname], (err, result) => {
        if (err) {
            console.log(err);
            return;
        } else {
            res.redirect("/jobSeeker/login")
        }
    });

}


const profileComplete = (req, res) => {
    const applicant_id = req.session.appID;
    const email_id = req.session.email;
    console.log(applicant_id)
    const first_name = req.body.fname;
    const last_name = req.body.lname;
    const age = req.body.age;
    const mobile_no = req.body.phoneno;
    const exp = req.body.exp;
    const gender = req.body.gender;
    const profile_pic_code = req.file.filename;

    const profileData = {
        applicant_id: applicant_id,
        first_name: first_name,
        last_name: last_name,
        age: age,
        mobile_no: mobile_no,
        email_id: email_id,
        exp: exp,
        gender: gender,
        profile_pic_code: profile_pic_code
    }
    res.render('form/uploadForm', { pd: profileData })
}


const updateProfile = (req, res) => {
    const applicant_id = req.body.applicant_id;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const age = req.body.age;
    const mobile_no = req.body.mobile_no;
    const email_id = req.body.email_id;
    const exp = req.body.exp;
    const gender = req.body.gender;
    const skills = req.body.skills;
    const profilePic = req.body.profilePic;
    let profile_pic_code;
    if(profilePic === "uploaded"){
        profile_pic_code = req.files['prof-image'][0].filename;
    }else{
        profile_pic_code = profilePic;
    }

    const cv = req.files['prof-pdf'][0].filename;

    const query = 'UPDATE job_applicant SET first_name = ?, last_name = ?, age = ?, mobile_no = ?, email_id = ?, skills = ?, exp_level = ?, gender = ?, cv = ?, profile_pic_code = ? WHERE applicant_id = ?';
    const values = [first_name, last_name, age, mobile_no, email_id, skills, exp, gender, cv, profile_pic_code, applicant_id];

    conn.query(query, values, (err, results) => {
        if (err) return res.send(err);
        res.redirect('/jobSeeker/applicant-dashboard');
    });
}

module.exports = {
    applicantHomePage,
    displayJobs,
    filterJobs,
    jobDetails,
    applyForJob,
    applicantDashboard,
    openDashboard,
    editProfile,
    deleteNotification,
    deleteProfilePic,
    uploadProfilePic,
    profileComplete,
    updateProfile,
    
}