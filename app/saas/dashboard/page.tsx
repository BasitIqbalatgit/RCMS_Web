
// 'use client';
// import React, { useState, useEffect } from 'react';
// import {
//   LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
//   PieChart, Pie, Cell, AreaChart, Area, ComposedChart, ScatterChart, Scatter
// } from 'recharts';
// import { TrendingUp, TrendingDown, Users, CreditCard, DollarSign, Activity, AlertCircle, Calendar } from 'lucide-react';

// interface AdminData {
//   id: string;
//   name: string;
//   email: string;
//   centreName: string;
//   location: string;
//   creditBalance: number;
//   createdAt: string;
// }

// interface TransactionData {
//   _id: string;
//   userId: string;
//   type: string;
//   status: string;
//   amount: number;
//   credits: number;
//   description: string;
//   createdAt: string;
// }

// const AnalyticsDashboard = () => {
//   const [admins, setAdmins] = useState<AdminData[]>([]);
//   const [transactions, setTransactions] = useState<TransactionData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [dateRange, setDateRange] = useState('monthly');
//   const [selectedMetric, setSelectedMetric] = useState('revenue');

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [adminsRes, transactionsRes] = await Promise.all([
//           fetch('/api/admins'),
//           fetch('/api/transactions') // Fetch more data for better analytics
//         ]);

//         const adminsData = await adminsRes.json();
//         const transactionsData = await transactionsRes.json();

//         console.log("Admin Data : ", adminsData.length, " and Transaction Data : ", transactionsData);
//         setAdmins(Array.isArray(adminsData) ? adminsData : []);
//         setTransactions(Array.isArray(transactionsData.transactions) ? transactionsData.transactions : []);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//         setAdmins([]);
//         setTransactions([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   });

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading analytics...</p>
//         </div>
//       </div>
//     );
//   }

//   // Core Metrics Calculations
//   const totalAdmins = admins.length;
//   const totalCreditBalance = admins.reduce((sum, a) => sum + (a.creditBalance || 0), 0);
//   const avgCreditBalance = totalAdmins ? totalCreditBalance / totalAdmins : 0;

//   const completedTransactions = transactions.filter(t => t.status === 'completed');
//   const totalRevenue = completedTransactions
//     .filter(t => t.type === 'credit_purchase')
//     .reduce((sum, t) => sum + (t.amount || 0), 0);

//   const totalCreditsUsed = transactions
//     .filter(t => t.type === 'credit_usage')
//     .reduce((sum, t) => sum + (t.credits || 0), 0);

//   const totalRefunds = transactions
//     .filter(t => t.type === 'refund')
//     .reduce((sum, t) => sum + (t.amount || 0), 0);

//   const failedTransactions = transactions.filter(t => t.status === 'failed').length;
//   const successRate = transactions.length ? ((completedTransactions.length / transactions.length) * 100) : 0;

//   // Time-based Data Processing
//   const getTimeSeriesData = () => {
//     const grouped: Record<string, {
//       revenue: number;
//       credits: number;
//       transactions: number;
//       refunds: number;
//       newAdmins: number;
//     }> = {};

//     transactions.forEach(t => {
//       const date = new Date(t.createdAt);
//       let key = formatDateKey(date);

//       if (!grouped[key]) {
//         grouped[key] = { revenue: 0, credits: 0, transactions: 0, refunds: 0, newAdmins: 0 };
//       }

//       grouped[key].transactions++;

//       if (t.type === 'credit_purchase' && t.status === 'completed') {
//         grouped[key].revenue += t.amount || 0;
//       }
//       if (t.type === 'credit_usage') {
//         grouped[key].credits += t.credits || 0;
//       }
//       if (t.type === 'refund') {
//         grouped[key].refunds += t.amount || 0;
//       }
//     });

//     // Add new admin registrations
//     admins.forEach(admin => {
//       const date = new Date(admin.createdAt);
//       let key = formatDateKey(date);

//       if (!grouped[key]) {
//         grouped[key] = { revenue: 0, credits: 0, transactions: 0, refunds: 0, newAdmins: 0 };
//       }
//       grouped[key].newAdmins++;
//     });

//     return Object.entries(grouped)
//       .map(([name, values]) => ({ name, ...values }))
//       .sort((a, b) => a.name.localeCompare(b.name));
//   };

//   const formatDateKey = (date: Date): string => {
//     switch (dateRange) {
//       case 'daily':
//         return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
//       case 'weekly':
//         const weekStart = new Date(date);
//         weekStart.setDate(date.getDate() - date.getDay());
//         return `${weekStart.getFullYear()}-W${String(Math.ceil(weekStart.getDate() / 7)).padStart(2, '0')}`;
//       case 'monthly':
//         return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
//       default:
//         return date.toISOString().split('T')[0];
//     }
//   };

//   // Location-based Analytics
//   const getLocationData = () => {
//     const locationStats: Record<string, {
//       admins: number;
//       totalCredits: number;
//       revenue: number;
//     }> = {};

//     admins.forEach(admin => {
//       const location = admin.location || 'Unknown';
//       if (!locationStats[location]) {
//         locationStats[location] = { admins: 0, totalCredits: 0, revenue: 0 };
//       }
//       locationStats[location].admins++;
//       locationStats[location].totalCredits += admin.creditBalance || 0;
//     });

//     transactions.forEach(t => {
//       const admin = admins.find(a => a.id === t.userId);
//       const location = admin?.location || 'Unknown';

//       if (!locationStats[location]) {
//         locationStats[location] = { admins: 0, totalCredits: 0, revenue: 0 };
//       }

//       if (t.type === 'credit_purchase' && t.status === 'completed') {
//         locationStats[location].revenue += t.amount || 0;
//       }
//     });

//     return Object.entries(locationStats).map(([location, stats]) => ({
//       location,
//       ...stats
//     }));
//   };

//   // Transaction Status Distribution
//   const getStatusDistribution = () => {
//     const statusCounts: Record<string, number> = {};
//     transactions.forEach(t => {
//       statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
//     });

//     return Object.entries(statusCounts).map(([status, count]) => ({
//       name: status.charAt(0).toUpperCase() + status.slice(1),
//       value: count,
//       percentage: ((count / transactions.length) * 100).toFixed(1)
//     }));
//   };

//   // Admin Performance Metrics
//   const getAdminPerformance = () => {
//     return admins.map(admin => {
//       const adminTransactions = transactions.filter(t => t.userId === admin.id);
//       const revenue = adminTransactions
//         .filter(t => t.type === 'credit_purchase' && t.status === 'completed')
//         .reduce((sum, t) => sum + (t.amount || 0), 0);

//       const creditsUsed = adminTransactions
//         .filter(t => t.type === 'credit_usage')
//         .reduce((sum, t) => sum + (t.credits || 0), 0);

//       return {
//         name: admin.name,
//         email: admin.email,
//         location: admin.location || 'Unknown',
//         creditBalance: admin.creditBalance || 0,
//         revenue,
//         creditsUsed,
//         transactionCount: adminTransactions.length,
//         avgTransactionValue: adminTransactions.length ? revenue / adminTransactions.length : 0
//       };
//     }).sort((a, b) => b.revenue - a.revenue);
//   };

//   const timeSeriesData = getTimeSeriesData();
//   const locationData = getLocationData();
//   const statusDistribution = getStatusDistribution();
//   const adminPerformance = getAdminPerformance();

//   const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

//   const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue' }: any) => (
//     <div className="bg-white rounded-lg shadow-sm border p-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm font-medium text-gray-600">{title}</p>
//           <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
//         </div>
//         <div className={`p-3 bg-${color}-100 rounded-full`}>
//           <Icon className={`h-6 w-6 text-${color}-600`} />
//         </div>
//       </div>
//       {trend && (
//         <div className="mt-4 flex items-center">
//           {trend.isPositive ? (
//             <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
//           ) : (
//             <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
//           )}
//           <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
//             {trend.value}% vs last period
//           </span>
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Header */}
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
//           <p className="text-gray-600 mt-2">Comprehensive insights into your platform performance</p>
//         </div>

//         {/* Time Range Selector */}
//         <div className="mb-6">
//           <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
//             {['daily', 'weekly', 'monthly'].map((range) => (
//               <button
//                 key={range}
//                 onClick={() => setDateRange(range)}
//                 className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dateRange === range
//                   ? 'bg-white text-gray-900 shadow-sm'
//                   : 'text-gray-600 hover:text-gray-900'
//                   }`}
//               >
//                 {range.charAt(0).toUpperCase() + range.slice(1)}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Key Metrics */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <MetricCard
//             title="Total Revenue"
//             value={`$${totalRevenue.toLocaleString()}`}
//             icon={DollarSign}
//             color="green"
//           />
//           <MetricCard
//             title="Active Admins"
//             value={totalAdmins.toLocaleString()}
//             icon={Users}
//             color="blue"
//           />
//           <MetricCard
//             title="Credits in Circulation"
//             value={totalCreditBalance.toLocaleString()}
//             icon={CreditCard}
//             color="purple"
//           />
//           <MetricCard
//             title="Success Rate"
//             value={`${successRate.toFixed(1)}%`}
//             icon={Activity}
//             color="indigo"
//           />
//         </div>

//         {/* Charts Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//           {/* Revenue Trend */}
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Usage Trends</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <ComposedChart data={timeSeriesData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="name" />
//                 <YAxis yAxisId="left" />
//                 <YAxis yAxisId="right" orientation="right" />
//                 <Tooltip />
//                 <Legend />
//                 <Area yAxisId="left" type="monotone" dataKey="revenue" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Revenue ($)" />
//                 <Line yAxisId="right" type="monotone" dataKey="credits" stroke="#10B981" strokeWidth={2} name="Credits Used" />
//               </ComposedChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Transaction Status Distribution */}
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status Distribution</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <PieChart>
//                 <Pie
//                   data={statusDistribution}
//                   cx="50%"
//                   cy="50%"
//                   labelLine={false}
//                   label={({ name, percentage }) => `${name} (${percentage}%)`}
//                   outerRadius={80}
//                   fill="#8884d8"
//                   dataKey="value"
//                 >
//                   {statusDistribution.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Location Performance */}
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Location</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={locationData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="location" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Bar dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
//                 <Bar dataKey="admins" fill="#10B981" name="Admin Count" />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           {/* Transaction Volume */}
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <AreaChart data={timeSeriesData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="name" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Area type="monotone" dataKey="transactions" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Total Transactions" />
//                 <Area type="monotone" dataKey="newAdmins" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="New Admins" />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Admin Performance Table */}
//         <div className="bg-white rounded-lg shadow-sm border">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h3 className="text-lg font-semibold text-gray-900">Top Performing Admins</h3>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits Used</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Balance</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {adminPerformance.slice(0, 10).map((admin, index) => (
//                   <tr key={admin.email} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div>
//                         <div className="text-sm font-medium text-gray-900">{admin.name}</div>
//                         <div className="text-sm text-gray-500">{admin.email}</div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.location}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${admin.revenue.toFixed(2)}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.creditsUsed.toLocaleString()}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.creditBalance.toLocaleString()}</td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.transactionCount}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Additional Metrics */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h4 className="text-sm font-medium text-gray-600 mb-2">Average Credit Balance</h4>
//             <p className="text-2xl font-bold text-blue-600">{avgCreditBalance.toFixed(0)}</p>
//             <p className="text-sm text-gray-500 mt-1">Per admin</p>
//           </div>
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h4 className="text-sm font-medium text-gray-600 mb-2">Total Refunds</h4>
//             <p className="text-2xl font-bold text-red-600">${totalRefunds.toFixed(2)}</p>
//             {totalRevenue > 0 ?

//               <p className="text-sm text-gray-500 mt-1">{((totalRefunds / totalRevenue) * 100).toFixed(1)}% of revenue</p>
//               : (
//                 <p className="text-sm text-gray-500 mt-1">--% of total</p>
//               )}
//           </div>
//           <div className="bg-white rounded-lg shadow-sm border p-6">
//             <h4 className="text-sm font-medium text-gray-600 mb-2">Failed Transactions</h4>
//             <p className="text-2xl font-bold text-orange-600">{failedTransactions}</p>
//             {transactions.length > 0 ? (
//               <p className="text-sm text-gray-500 mt-1">
//                 {((failedTransactions / transactions.length) * 100).toFixed(1)}% of total
//               </p>
//             ) : (
//               <p className="text-sm text-gray-500 mt-1">--% of total</p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AnalyticsDashboard;


'use client';
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart, ScatterChart, Scatter
} from 'recharts';
import { TrendingUp, TrendingDown, Users, CreditCard, DollarSign, Activity, AlertCircle, Calendar } from 'lucide-react';

interface AdminData {
  id: string;
  name: string;
  email: string;
  centreName: string;
  location: string;
  creditBalance: number;
  createdAt: string;
}

interface TransactionData {
  _id: string;
  userId: string;
  type: string;
  status: string;
  amount: number;
  credits: number;
  description: string;
  createdAt: string;
}

const AnalyticsDashboard = () => {
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('monthly');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [adminsRes, transactionsRes] = await Promise.all([
          fetch('/api/admins'),
          fetch('/api/transactions?limit=1000') // Fetch more data for analytics
        ]);

        if (!adminsRes.ok) {
          throw new Error(`Failed to fetch admins: ${adminsRes.status}`);
        }
        if (!transactionsRes.ok) {
          throw new Error(`Failed to fetch transactions: ${transactionsRes.status}`);
        }

        const adminsData = await adminsRes.json();
        const transactionsData = await transactionsRes.json();

        console.log("Fetched Data - Admins:", adminsData?.length || 0, "Transactions:", transactionsData?.transactions?.length || 0);

        // Handle different response structures
        const adminsList = Array.isArray(adminsData) ? adminsData : (adminsData?.admins || []);
        const transactionsList = Array.isArray(transactionsData) ? transactionsData : (transactionsData?.transactions || []);

        setAdmins(adminsList);
        setTransactions(transactionsList);

        if (transactionsList.length === 0) {
          console.warn("No transactions found. Check API permissions and data.");
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch data');
        setAdmins([]);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Fixed: Added empty dependency array to prevent infinite loop

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Error loading data</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Core Metrics Calculations
  const totalAdmins = admins.length;
  const totalCreditBalance = admins.reduce((sum, a) => sum + (a.creditBalance || 0), 0);
  const avgCreditBalance = totalAdmins ? totalCreditBalance / totalAdmins : 0;

  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const totalRevenue = completedTransactions
    .filter(t => t.type === 'credit_purchase')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalCreditsUsed = transactions
    .filter(t => t.type === 'credit_usage')
    .reduce((sum, t) => sum + (t.credits || 0), 0);

  const totalRefunds = transactions
    .filter(t => t.type === 'refund')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const failedTransactions = transactions.filter(t => t.status === 'failed').length;
  const successRate = transactions.length ? ((completedTransactions.length / transactions.length) * 100) : 0;

  // Time-based Data Processing
  const getTimeSeriesData = () => {
    const grouped: Record<string, {
      revenue: number;
      credits: number;
      transactions: number;
      refunds: number;
      newAdmins: number;
    }> = {};

    transactions.forEach(t => {
      const date = new Date(t.createdAt);
      let key = formatDateKey(date);

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, credits: 0, transactions: 0, refunds: 0, newAdmins: 0 };
      }

      grouped[key].transactions++;

      if (t.type === 'credit_purchase' && t.status === 'completed') {
        grouped[key].revenue += t.amount || 0;
      }
      if (t.type === 'credit_usage') {
        grouped[key].credits += t.credits || 0;
      }
      if (t.type === 'refund') {
        grouped[key].refunds += t.amount || 0;
      }
    });

    // Add new admin registrations
    admins.forEach(admin => {
      const date = new Date(admin.createdAt);
      let key = formatDateKey(date);

      if (!grouped[key]) {
        grouped[key] = { revenue: 0, credits: 0, transactions: 0, refunds: 0, newAdmins: 0 };
      }
      grouped[key].newAdmins++;
    });

    return Object.entries(grouped)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const formatDateKey = (date: Date): string => {
    switch (dateRange) {
      case 'daily':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-W${String(Math.ceil(weekStart.getDate() / 7)).padStart(2, '0')}`;
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  };

  // Location-based Analytics
  const getLocationData = () => {
    const locationStats: Record<string, {
      admins: number;
      totalCredits: number;
      revenue: number;
    }> = {};

    admins.forEach(admin => {
      const location = admin.location || 'Unknown';
      if (!locationStats[location]) {
        locationStats[location] = { admins: 0, totalCredits: 0, revenue: 0 };
      }
      locationStats[location].admins++;
      locationStats[location].totalCredits += admin.creditBalance || 0;
    });

    transactions.forEach(t => {
      const admin = admins.find(a => a.id === t.userId);
      const location = admin?.location || 'Unknown';

      if (!locationStats[location]) {
        locationStats[location] = { admins: 0, totalCredits: 0, revenue: 0 };
      }

      if (t.type === 'credit_purchase' && t.status === 'completed') {
        locationStats[location].revenue += t.amount || 0;
      }
    });

    return Object.entries(locationStats).map(([location, stats]) => ({
      location,
      ...stats
    }));
  };

  // Transaction Status Distribution
  const getStatusDistribution = () => {
    if (transactions.length === 0) return [];
    
    const statusCounts: Record<string, number> = {};
    transactions.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      percentage: ((count / transactions.length) * 100).toFixed(1)
    }));
  };

  // Admin Performance Metrics
  const getAdminPerformance = () => {
    return admins.map(admin => {
      const adminTransactions = transactions.filter(t => t.userId === admin.id);
      const revenue = adminTransactions
        .filter(t => t.type === 'credit_purchase' && t.status === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const creditsUsed = adminTransactions
        .filter(t => t.type === 'credit_usage')
        .reduce((sum, t) => sum + (t.credits || 0), 0);

      return {
        name: admin.name,
        email: admin.email,
        location: admin.location || 'Unknown',
        creditBalance: admin.creditBalance || 0,
        revenue,
        creditsUsed,
        transactionCount: adminTransactions.length,
        avgTransactionValue: adminTransactions.length ? revenue / adminTransactions.length : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };

  const timeSeriesData = getTimeSeriesData();
  const locationData = getLocationData();
  const statusDistribution = getStatusDistribution();
  const adminPerformance = getAdminPerformance();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue' }: any) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        </div>
        <div className={`p-3 bg-${color}-100 rounded-full`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          {trend.isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}% vs last period
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your platform performance</p>
          {transactions.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No transaction data found. This could be due to:
                  </p>
                  <ul className="mt-1 text-sm text-yellow-600 list-disc list-inside">
                    <li>No transactions have been created yet</li>
                    <li>API permission issues</li>
                    <li>Database connection problems</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {['daily', 'weekly', 'monthly'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${dateRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Active Admins"
            value={totalAdmins.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Credits in Circulation"
            value={totalCreditBalance.toLocaleString()}
            icon={CreditCard}
            color="purple"
          />
          <MetricCard
            title="Success Rate"
            value={`${successRate.toFixed(1)}%`}
            icon={Activity}
            color="indigo"
          />
        </div>

        {/* Charts Grid - Only show if we have data */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Trend */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Usage Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="credits" stroke="#10B981" strokeWidth={2} name="Credits Used" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Transaction Status Distribution */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Location Performance */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Location</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
                  <Bar dataKey="admins" fill="#10B981" name="Admin Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Transaction Volume */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="transactions" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Total Transactions" />
                  <Area type="monotone" dataKey="newAdmins" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="New Admins" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Admin Performance Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Admins</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits Used</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminPerformance.slice(0, 10).map((admin, index) => (
                  <tr key={admin.email} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${admin.revenue.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.creditsUsed.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.creditBalance.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Average Credit Balance</h4>
            <p className="text-2xl font-bold text-blue-600">{avgCreditBalance.toFixed(0)}</p>
            <p className="text-sm text-gray-500 mt-1">Per admin</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Refunds</h4>
            <p className="text-2xl font-bold text-red-600">${totalRefunds.toFixed(2)}</p>
            {totalRevenue > 0 ? (
              <p className="text-sm text-gray-500 mt-1">{((totalRefunds / totalRevenue) * 100).toFixed(1)}% of revenue</p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">--% of total</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Failed Transactions</h4>
            <p className="text-2xl font-bold text-orange-600">{failedTransactions}</p>
            {transactions.length > 0 ? (
              <p className="text-sm text-gray-500 mt-1">
                {((failedTransactions / transactions.length) * 100).toFixed(1)}% of total
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">--% of total</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;