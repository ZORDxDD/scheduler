require('dotenv').config();
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');
const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const jobsFilePath = path.join(__dirname, 'jobs-email.json');

//Helper functions for file operations 
const readJobsFile = () => {
  try {
    const data = fs.readFileSync(jobsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading jobs file:", e);
    return {};
  }
};

const writeJobsFile = (data) => {
  try {
    fs.writeFileSync(jobsFilePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing jobs file:", e);
  }
};

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify((error) => {
  if (error) {
    console.error('SMTP Config Error:', error);
  } else {
    console.log('SMTP Server Ready!');
  }
});

const scheduledJobs = {};

// Send Email Function
const sendEmail = async (emails, subject, content, jobId) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: Array.isArray(emails) ? emails.join(',') : emails,
      subject,
      text: content
    });
    console.log(`Email sent successfully for job ${jobId}`);
  } catch (err) {
    console.error(`Failed to send email for job ${jobId}:`, err.message);
  }
};

//Schedule Recurring Job
const scheduleRecurringJob = (jobId, { emails, subject, content, cronTime }) => {
  const task = cron.schedule(cronTime, () => sendEmail(emails, subject, content, jobId), {
    scheduled: true,
    timezone: process.env.TIMEZONE || 'UTC'
  });
  scheduledJobs[jobId] = task;
  console.log(`Recurring Job ${jobId} scheduled with cron "${cronTime}"`);
};

// Schedule One-Time Job 
const scheduleOneTimeJob = (jobId, { emails, subject, content, sendAt }) => {
  const delay = new Date(sendAt).getTime() - Date.now();
  if (delay <= 0) {
    console.log(`Send time for job ${jobId} is in the past. Skipping.`);
    return;
  }

  const timeout = setTimeout(() => {
    sendEmail(emails, subject, content, jobId);
    delete scheduledJobs[jobId];
  }, delay);

  scheduledJobs[jobId] = { stop: () => clearTimeout(timeout) };
  console.log(`One-Time Job ${jobId} scheduled at ${sendAt}`);
};

//Load Jobs from File
if (fs.existsSync(jobsFilePath)) {
  const jobs = readJobsFile();
  console.log("Loaded jobs from file:", jobs);
  Object.entries(jobs).forEach(([jobId, jobData]) => {
    if (jobData.cronTime) {
      scheduleRecurringJob(jobId, jobData);
    } else if (jobData.sendAt) {
      scheduleOneTimeJob(jobId, jobData);
    }
  });
} else {
  writeJobsFile({});
}

//API to Schedule New Job
app.post('/schedule', (req, res) => {
  const { emails, subject, content, cronTime, sendAt, session } = req.body;

  if (!emails || !subject || !content || (!cronTime && !sendAt)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const jobId = session || `job-${Date.now()}`;
  const newJob = { emails, subject, content };

  if (cronTime) {
    newJob.cronTime = cronTime;
    scheduleRecurringJob(jobId, newJob);
  }
  
  if (sendAt) {
    newJob.sendAt = sendAt;
    scheduleOneTimeJob(jobId, newJob);
  }

  const existingJobs = readJobsFile();
  existingJobs[jobId] = newJob;
  writeJobsFile(existingJobs);

  console.log("Jobs file updated after scheduling:", readJobsFile());
  res.json({ message: 'Job scheduled successfully', jobId });
});

//Delete Job 
app.delete('/schedule/:jobId', (req, res) => {
  const { jobId } = req.params;
  console.log("Attempting to delete job:", jobId);

  const task = scheduledJobs[jobId];

  if (task) {
    if (typeof task.stop === 'function') {
      task.stop(); 
    } else {
      clearTimeout(task); 
    }

    delete scheduledJobs[jobId];

    const existingJobs = readJobsFile();
    delete existingJobs[jobId];
    writeJobsFile(existingJobs);

    console.log("Jobs file after deletion:", readJobsFile());
    res.json({ message: `Job ${jobId} cancelled successfully` });
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

// List Jobs
app.get('/schedule', (req, res) => {
  const existingJobs = readJobsFile();
  console.log("Sending jobs from GET /schedule:", existingJobs);
  res.json(existingJobs);
});

app.listen(port, () => {
  console.log(`Email Scheduler running on port ${port}`);
});
