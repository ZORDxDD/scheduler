import React, { useState, useEffect } from 'react';
import { Clock, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SmsJob {
  jobId: string;
  number: string;
  message: string;
  cronTime?: string;
  dateTime?: string;
}

const SmsScheduler = () => {
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleType, setScheduleType] = useState<'onetime' | 'periodic'>('onetime');
  const [cronTime, setCronTime] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [scheduledJobs, setScheduledJobs] = useState<SmsJob[]>([]);

  useEffect(() => {
    fetchScheduledJobs();
  }, []);

  useEffect(() => {
    console.log('Scheduled SMS Jobs:', scheduledJobs);
  }, [scheduledJobs]);

  const fetchScheduledJobs = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/scheduled-sms');
      const data = await response.json();
      setScheduledJobs(data.jobs);
    } catch (error) {
      toast.error('Failed to fetch scheduled jobs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      number,
      message,
      ...(scheduleType === 'periodic' ? { cronTime } : { dateTime })
    };

    try {
      const response = await fetch('http://localhost:4000/api/schedule-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to schedule SMS');

      toast.success('SMS scheduled successfully');
      fetchScheduledJobs();
      
      // Reset form
      setNumber('');
      setMessage('');
      setCronTime('');
      setDateTime('');
    } catch (error) {
      toast.error('Failed to schedule SMS');
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/delete-sms/${jobId}`, {
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">SMS Scheduler</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="10 digit phone number"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
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
            Schedule SMS
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Jobs</h2>
        <div className="space-y-4">
          {scheduledJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No scheduled jobs found</p>
          ) : (
            scheduledJobs.map((job, index) => (
              <div key={job.jobId || index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{job.number}</h3>
                    <p className="text-sm text-gray-500 mt-1">{job.message}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {job.cronTime
                        ? `Cron: ${job.cronTime}`
                        : `Send at: ${new Date(job.dateTime!).toLocaleString()}`}
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

export default SmsScheduler;
