import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to <span className="text-indigo-600">Scheduler</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Schedule your communications effortlessly with our powerful scheduling system.
        </p>
      </div>

      <div className="mt-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Link
            to="/email"
            className="relative group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out"
          >
            <div className="px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
              <div className="text-center">
                <Mail className="h-12 w-12 text-indigo-600 mx-auto" />
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  Email Scheduler
                </h2>
                <p className="mt-4 max-w-sm mx-auto text-sm text-gray-500">
                  Schedule emails to be sent at specific times or on a recurring basis.
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/sms"
            className="relative group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out"
          >
            <div className="px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-indigo-600 mx-auto" />
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  SMS Scheduler
                </h2>
                <p className="mt-4 max-w-sm mx-auto text-sm text-gray-500">
                  Schedule SMS messages to be sent at your preferred time.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;