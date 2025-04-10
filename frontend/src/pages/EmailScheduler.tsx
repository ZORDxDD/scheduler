import React, { useState, useEffect } from 'react';
import { Clock, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailJob {
  jobId: string;
  emails: string[];
  subject: string;
  content: string;
  cronTime?: string;
  sendAt?: string;
}

const EmailScheduler = () => {
  const [emails, setEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [scheduleType, setScheduleType] = useState<'onetime' | 'periodic'>('onetime');
  const [cronTime, setCronTime] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [scheduledJobs, setScheduledJobs] = useState<EmailJob[]>([]);

  useEffect(() => {
    fetchScheduledJobs();
  }, []);

  //useEffect to log scheduledJobs whenever they change
  useEffect(() => {
    console.log('Scheduled Jobs:', scheduledJobs);
  }, [scheduledJobs]);

  const fetchScheduledJobs = async () => {
    try {
      const response = await fetch('http://localhost:5000/schedule');
      const data = await response.json();

      const jobsArray = Object.entries(data).map(([jobId, jobData]) => ({
        jobId,
        ...(jobData as Omit<EmailJob, 'jobId'>)
      }));

      setScheduledJobs(jobsArray);
    } catch (error) {
      toast.error('Failed to fetch scheduled jobs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailList = emails.split(',').map(email => email.trim());
    
    const payload = {
      emails: emailList,
      subject,
      content,
      ...(scheduleType === 'periodic' ? { cronTime } : { sendAt })
    };

    try {
      const response = await fetch('http://localhost:5000/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to schedule email');
      
      toast.success('Email scheduled successfully');
      fetchScheduledJobs();
      
      // Reset form
      setEmails('');
      setSubject('');
      setContent('');
      setCronTime('');
      setSendAt('');
    } catch (error) {
      toast.error('Failed to schedule email');
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/schedule/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete job');

      toast.success('Job deleted successfully');
      fetchScheduledJobs();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Email Scheduler</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Emails (comma-separated)</label>
            <input
              type="text"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="email1@example.com, email2@example.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Schedule Type</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as 'onetime' | 'periodic')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="onetime">One-time</option>
              <option value="periodic">Periodic</option>
            </select>
          </div>

          {scheduleType === 'periodic' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Cron Expression</label>
              <input
                type="text"
                value={cronTime}
                onChange={(e) => setCronTime(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="*/5 * * * *"
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Send At</label>
              <input
                type="datetime-local"
                value={sendAt}
                onChange={(e) => setSendAt(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Send className="h-5 w-5 mr-2" />
            Schedule Email
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Jobs</h2>
        <div className="space-y-4">
          {scheduledJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No scheduled jobs found</p>
          ) : (
            scheduledJobs.map((job) => (
              <div key={job.jobId} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{job.subject}</h3>
                    <p className="text-sm text-gray-500">{job.emails.join(', ')}</p>
                    <p className="text-sm text-gray-500 mt-1">{job.content}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {job.cronTime 
                        ? `Cron: ${job.cronTime}` 
                        : `Send at: ${new Date(job.sendAt!).toLocaleString()}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(job.jobId)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailScheduler;
