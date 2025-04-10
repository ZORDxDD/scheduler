import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, MessageSquare, Home } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <Home className="h-6 w-6 text-indigo-600" />
              <span className="ml-2 font-semibold text-gray-900">Scheduler</span>
            </Link>
          </div>
          
          <div className="flex space-x-4">
            <Link
              to="/email"
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/email'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <Mail className="h-5 w-5 mr-1" />
              Email
            </Link>
            
            <Link
              to="/sms"
              className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/sms'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <MessageSquare className="h-5 w-5 mr-1" />
              SMS
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;