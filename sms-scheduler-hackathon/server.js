require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(cors({
  origin: '*',  // Adjust if frontend URL is fixed
}));
app.use(express.json());

// Twilio Setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Jobs Storage
const jobsFile = path.join(__dirname, 'jobs-sms.json');
const scheduledSMS = {};

// Create file if not exists
if (!fs.existsSync(jobsFile)) {
  fs.writeFileSync(jobsFile, JSON.stringify({ jobs: [] }, null, 2));
}

// Utility: Save Job
const saveJob = (jobData) => {
  const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
  jobs.jobs.push(jobData);
  fs.writeFileSync(jobsFile, JSON.stringify(jobs, null, 2));
};

// Utility: Remove Job
const removeJob = (jobId) => {
  const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
  const updatedJobs = jobs.jobs.filter(job => job.jobId !== jobId);
  fs.writeFileSync(jobsFile, JSON.stringify({ jobs: updatedJobs }, null, 2));
};

// Utility: Format Number
const formatPhoneNumber = (number) => {
  if (!number.startsWith('+')) {
    return '+91' + number;  // Change according to your country code
  }
  return number;
};

// Send SMS
const sendSMS = async (number, message, jobId) => {
  try {
    const formattedNumber = formatPhoneNumber(number);
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber,
    });
    console.log(` SMS sent to ${formattedNumber} | Job ID: ${jobId}`);
  } catch (error) {
    console.error(` Failed to send SMS | Job ID: ${jobId} | Error: ${error.message}`);
  }
};

// Schedule Job
const scheduleJob = (job) => {
  const { jobId, number, message, cronTime, dateTime } = job;

  if (cronTime) {
    const task = cron.schedule(cronTime, async () => {
      await sendSMS(number, message, jobId);
    }, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'UTC',
    });

    scheduledSMS[jobId] = task;
    console.log(` Periodic Job Scheduled | Job ID: ${jobId}`);

  } else if (dateTime) {
    const delay = new Date(dateTime).getTime() - Date.now();

    if (delay > 0) {
      const timeout = setTimeout(async () => {
        await sendSMS(number, message, jobId);
        removeJob(jobId);  // Remove after one-time execution
      }, delay);

      scheduledSMS[jobId] = { stop: () => clearTimeout(timeout) };
      console.log(`One-Time Job Scheduled | Job ID: ${jobId}`);
    }
  }
};

// Auto-load jobs on startup
const existingJobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
existingJobs.jobs.forEach(scheduleJob);

// API: Schedule SMS
app.post('/api/schedule-sms', (req, res) => {
  const { number, message, cronTime, dateTime, jobId } = req.body;

  if (!number || !message || (!cronTime && !dateTime)) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const id = jobId || `sms-job-${Date.now()}`;

  const jobData = {
    jobId: id,
    number,
    message,
    ...(cronTime && { cronTime }),
    ...(dateTime && { dateTime }),
  };

  scheduleJob(jobData);
  saveJob(jobData);

  return res.json({ success: true, message: 'SMS job scheduled successfully', jobId: id });
});

// API: List Scheduled SMS
app.get('/api/scheduled-sms', (req, res) => {
  const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
  res.json({ success: true, jobs: jobs.jobs });
});

// API: Cancel SMS Job
app.delete('/api/delete-sms/:jobId', (req, res) => {
  const { jobId } = req.params;
  const task = scheduledSMS[jobId];

  if (task) {
    task.stop();
    delete scheduledSMS[jobId];
    removeJob(jobId);
    return res.json({ success: true, message: `SMS job ${jobId} cancelled successfully` });
  } else {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
});

app.listen(port, () => {
  console.log(`SMS Scheduler running on port ${port}`);
});
