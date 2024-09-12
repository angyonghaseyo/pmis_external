import React, { useState, useEffect } from 'react';
import { Bell, Globe } from 'lucide-react';
import { getLeaveStatistics, getTimeLog, getServiceOperations } from '../services/api';

const UserWorkspace = ({ user }) => {
  const [leaveStats, setLeaveStats] = useState([]);
  const [timeLog, setTimeLog] = useState({});
  const [serviceOperations, setServiceOperations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leaveStatsData = await getLeaveStatistics();
        setLeaveStats(leaveStatsData);

        const timeLogData = await getTimeLog();
        setTimeLog(timeLogData);

        const serviceOpsData = await getServiceOperations();
        setServiceOperations(serviceOpsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <div className="flex items-center space-x-4">
          <Globe size={20} />
          <span>EN</span>
          <Bell size={20} />
          <img src={user.photoURL || "/api/placeholder/40/40"} alt="User" className="w-8 h-8 rounded-full" />
        </div>
      </header>

      {/* Dashboard content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-6">Good to see you, {user.displayName} 👋</h3>

        {/* Leave statistics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {leaveStats.map((stat, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <h4 className="text-sm font-medium text-gray-500 mb-2">{stat.title}</h4>
              <p className="text-2xl font-bold text-indigo-600">{stat.value}</p>
              <div className="text-sm mt-2">
                <span className="text-green-500">Paid: {stat.paid}</span>
                <span className="text-red-500 ml-2">Unpaid: {stat.unpaid}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Time Log */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h4 className="text-lg font-semibold mb-4">Time Log</h4>
          <div className="flex justify-between">
            <div>
              <h5 className="font-medium mb-2">Today</h5>
              {timeLog.today && Object.entries(timeLog.today).map(([key, value], index) => (
                <p key={index} className="text-sm">
                  <span className="font-medium">{value}</span> {key}
                </p>
              ))}
            </div>
            <div>
              <h5 className="font-medium mb-2">This month</h5>
              {timeLog.month && Object.entries(timeLog.month).map(([key, value], index) => (
                <p key={index} className="text-sm">
                  {key}: <span className="font-medium">{value}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Latest Service Operations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h4 className="text-lg font-semibold mb-4">Latest Service Operations</h4>
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Title</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Latest Update</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {serviceOperations.map((operation, index) => (
                <tr key={index} className="border-b last:border-b-0">
                  <td className="py-3">{operation.title}</td>
                  <td className="py-3">{operation.status}</td>
                  <td className="py-3">{operation.latestUpdate}</td>
                  <td className="py-3">{operation.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserWorkspace;