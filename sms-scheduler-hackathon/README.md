# SMS Scheduler Hackathon Project

## Features
- Schedule SMS using Cron Jobs
- List all Scheduled SMS
- Cancel Scheduled SMS

## Setup
1. Install dependencies:
```
npm install
```

2. Create `.env` file from `.env.example`

3. Run the server:
```
npm start
```

## API Endpoints
- POST /api/schedule-sms
- GET /api/scheduled-sms
- DELETE /api/scheduled-sms/:jobId
