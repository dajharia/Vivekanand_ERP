export default function SuperAdminDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Total Schools</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">1</p>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Total Students</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">1,250</p>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-500 text-sm font-medium uppercase">Active Staff</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">45</p>
        </div>
      </div>
    </div>
  );
}
