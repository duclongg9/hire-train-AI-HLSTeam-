export default function HRPortalDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">HR Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h3 className="text-lg font-medium text-gray-500">Active Campaigns</h3>
          <p className="text-3xl font-bold">12</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h3 className="text-lg font-medium text-gray-500">Pending Candidates</h3>
          <p className="text-3xl font-bold">48</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h3 className="text-lg font-medium text-gray-500">Completed Interviews</h3>
          <p className="text-3xl font-bold">156</p>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Top Candidates Leaderboard</h2>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
            {/* Table rows placeholder */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">John Doe</td>
              <td className="px-6 py-4 whitespace-nowrap">95%</td>
              <td className="px-6 py-4 whitespace-nowrap text-green-500">Evaluated</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
