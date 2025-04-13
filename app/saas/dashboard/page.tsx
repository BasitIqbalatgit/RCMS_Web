'use client';

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import jsPDF from 'jspdf';

// Define interfaces for data structures
interface DataPoint {
  month?: string;
  week?: string;
  quarter?: string;
  year: number | string;
  fullDate: Date;
  dateStr: string;
  revenue?: number;
  users?: number;
  rate?: number;
}

interface PlanDistributionData {
  name: string;
  value: number;
  color: string;
}

interface RevenueByPlanData {
  plan: string;
  revenue: number;
}

interface FeatureUsageData {
  feature: string;
  usage: number;
}

interface DashboardData {
  weekly: {
    revenueData: DataPoint[];
    userGrowthData: DataPoint[];
    churnRateData: DataPoint[];
  };
  monthly: {
    revenueData: DataPoint[];
    userGrowthData: DataPoint[];
    churnRateData: DataPoint[];
  };
  quarterly: {
    revenueData: DataPoint[];
    userGrowthData: DataPoint[];
    churnRateData: DataPoint[];
  };
  yearly: {
    revenueData: DataPoint[];
    userGrowthData: DataPoint[];
    churnRateData: DataPoint[];
  };
  planDistributionData: PlanDistributionData[];
  revenueByPlanData: RevenueByPlanData[];
  featureUsageData: FeatureUsageData[];
}

const generateMockData = (): DashboardData => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  const twoYearsAgo = currentYear - 2;

  let baseRevenue = 8000;
  let baseUsers = 150;
  let baseChurnRate = 3.5;

  const revenueData: DataPoint[] = [];
  const userGrowthData: DataPoint[] = [];
  const churnRateData: DataPoint[] = [];

  for (let year = twoYearsAgo; year <= currentYear; year++) {
    for (let m = 0; m < 12; m++) {
      if (year === currentYear && m > new Date().getMonth()) {
        continue;
      }

      const dateStr = `${months[m]} ${year}`;
      const fullDate = new Date(year, m, 15);

      const seasonalFactor = 1 + Math.sin(m / 11 * Math.PI) * 0.1;
      const growthFactor = 1 + (year - twoYearsAgo + m / 12) * 0.1;
      const randomFactor = 0.9 + Math.random() * 0.2;

      const revenue = Math.round(baseRevenue * seasonalFactor * growthFactor * randomFactor);
      const users = Math.round(baseUsers * growthFactor * (0.95 + Math.random() * 0.1));
      const churnRate = Math.max(0.8, baseChurnRate * (1 - (year - twoYearsAgo + m / 12) * 0.15) * (0.9 + Math.random() * 0.2));

      revenueData.push({ 
        month: months[m], 
        year, 
        fullDate,
        dateStr,
        revenue 
      });

      userGrowthData.push({ 
        month: months[m], 
        year, 
        fullDate,
        dateStr,
        users 
      });

      churnRateData.push({ 
        month: months[m], 
        year, 
        fullDate,
        dateStr,
        rate: parseFloat(churnRate.toFixed(1)) 
      });

      baseRevenue = revenue;
      baseUsers = users;
      baseChurnRate = churnRate;
    }
  }

  const weeklyRevenueData: DataPoint[] = [];
  const weeklyUserGrowthData: DataPoint[] = [];
  const weeklyChurnRateData: DataPoint[] = [];

  const today = new Date();
  const lastRevenue = revenueData[revenueData.length - 1].revenue ?? 0;
  const lastUsers = userGrowthData[userGrowthData.length - 1].users ?? 0;
  const lastChurn = churnRateData[churnRateData.length - 1].rate ?? 0;

  for (let i = 11; i >= 0; i--) {
    const weekDate = new Date(today);
    weekDate.setDate(today.getDate() - (i * 7));
    const weekStr = `Week ${12-i}`;
    const year = weekDate.getFullYear();

    const weekVariance = 0.95 + Math.random() * 0.1;

    weeklyRevenueData.push({
      week: weekStr,
      year,
      fullDate: new Date(weekDate),
      dateStr: `${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      revenue: Math.round(lastRevenue / 4 * weekVariance)
    });

    weeklyUserGrowthData.push({
      week: weekStr,
      year,
      fullDate: new Date(weekDate),
      dateStr: `${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      users: Math.round(lastUsers + (Math.random() * 10 - 5))
    });

    weeklyChurnRateData.push({
      week: weekStr,
      year,
      fullDate: new Date(weekDate),
      dateStr: `${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      rate: parseFloat((lastChurn * (0.9 + Math.random() * 0.2)).toFixed(1))
    });
  }

  const quarterlyRevenueData: DataPoint[] = [];
  const quarterlyUserGrowthData: DataPoint[] = [];
  const quarterlyChurnRateData: DataPoint[] = [];

  for (let year = twoYearsAgo; year <= currentYear; year++) {
    for (let q = 0; q < 4; q++) {
      if (year === currentYear && q > Math.floor(new Date().getMonth() / 3)) {
        continue;
      }

      const quarterStr = `Q${q+1} ${year}`;
      const monthIndices = [q*3, q*3+1, q*3+2];

      const quarterRevenue = revenueData.filter(item => 
        item.year === year && monthIndices.includes(months.indexOf(item.month ?? ''))
      );

      const quarterUsers = userGrowthData.filter(item => 
        item.year === year && monthIndices.includes(months.indexOf(item.month ?? ''))
      );

      const quarterChurn = churnRateData.filter(item => 
        item.year === year && monthIndices.includes(months.indexOf(item.month ?? ''))
      );

      if (quarterRevenue.length > 0) {
        const totalQuarterRevenue = quarterRevenue.reduce((sum, item) => sum + (item.revenue ?? 0), 0);
        const lastMonthUsers = quarterUsers[quarterUsers.length - 1]?.users ?? 0;
        const avgChurnRate = quarterChurn.length > 0 ? quarterChurn.reduce((sum, item) => sum + (item.rate ?? 0), 0) / quarterChurn.length : 0;

        quarterlyRevenueData.push({
          quarter: quarterStr,
          year,
          fullDate: new Date(year, q*3+2, 15),
          dateStr: quarterStr,
          revenue: totalQuarterRevenue
        });

        quarterlyUserGrowthData.push({
          quarter: quarterStr,
          year,
          fullDate: new Date(year, q*3+2, 15),
          dateStr: quarterStr,
          users: lastMonthUsers
        });

        quarterlyChurnRateData.push({
          quarter: quarterStr,
          year,
          fullDate: new Date(year, q*3+2, 15),
          dateStr: quarterStr,
          rate: parseFloat(avgChurnRate.toFixed(1))
        });
      }
    }
  }

  const yearlyRevenueData: DataPoint[] = [];
  const yearlyUserGrowthData: DataPoint[] = [];
  const yearlyChurnRateData: DataPoint[] = [];

  for (let year = twoYearsAgo; year <= currentYear; year++) {
    if (year > currentYear) continue;

    const yearRevenue = revenueData.filter(item => 
      item.year === year && (year !== currentYear || new Date(item.fullDate) <= new Date())
    );

    const yearUsers = userGrowthData.filter(item => 
      item.year === year && (year !== currentYear || new Date(item.fullDate) <= new Date())
    );

    const yearChurn = churnRateData.filter(item => 
      item.year === year && (year !== currentYear || new Date(item.fullDate) <= new Date())
    );

    if (yearRevenue.length > 0) {
      const totalYearRevenue = yearRevenue.reduce((sum, item) => sum + (item.revenue ?? 0), 0);
      const lastMonthUsers = yearUsers[yearUsers.length - 1]?.users ?? 0;
      const avgChurnRate = yearChurn.length > 0 ? yearChurn.reduce((sum, item) => sum + (item.rate ?? 0), 0) / yearChurn.length : 0;

      yearlyRevenueData.push({
        year: year.toString(),
        fullDate: new Date(year, 11, 31),
        dateStr: year.toString(),
        revenue: totalYearRevenue
      });

      yearlyUserGrowthData.push({
        year: year.toString(),
        fullDate: new Date(year, 11, 31),
        dateStr: year.toString(),
        users: lastMonthUsers
      });

      yearlyChurnRateData.push({
        year: year.toString(),
        fullDate: new Date(year, 11, 31),
        dateStr: year.toString(),
        rate: parseFloat(avgChurnRate.toFixed(1))
      });
    }
  }

  const planDistributionData: PlanDistributionData[] = [
    { name: 'Basic', value: 35, color: '#8884d8' },
    { name: 'Pro', value: 45, color: '#82ca9d' },
    { name: 'Enterprise', value: 20, color: '#ffc658' },
  ];

  const revenueByPlanData: RevenueByPlanData[] = [
    { plan: 'Basic', revenue: Math.round((revenueData[revenueData.length - 1].revenue ?? 0) * 0.25) },
    { plan: 'Pro', revenue: Math.round((revenueData[revenueData.length - 1].revenue ?? 0) * 0.45) },
    { plan: 'Enterprise', revenue: Math.round((revenueData[revenueData.length - 1].revenue ?? 0) * 0.3) },
  ];

  const featureUsageData: FeatureUsageData[] = [
    { feature: 'Analytics', usage: 87 },
    { feature: 'Reporting', usage: 63 },
    { feature: 'User Mgmt', usage: 92 },
    { feature: 'Billing', usage: 45 },
    { feature: 'Integration', usage: 71 },
  ];

  return {
    weekly: {
      revenueData: weeklyRevenueData,
      userGrowthData: weeklyUserGrowthData,
      churnRateData: weeklyChurnRateData,
    },
    monthly: {
      revenueData: revenueData,
      userGrowthData: userGrowthData,
      churnRateData: churnRateData,
    },
    quarterly: {
      revenueData: quarterlyRevenueData,
      userGrowthData: quarterlyUserGrowthData,
      churnRateData: quarterlyChurnRateData,
    },
    yearly: {
      revenueData: yearlyRevenueData,
      userGrowthData: yearlyUserGrowthData,
      churnRateData: yearlyChurnRateData,
    },
    planDistributionData,
    revenueByPlanData,
    featureUsageData
  };
};

const SaasProviderDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadData = setTimeout(() => {
      const data = generateMockData();
      setDashboardData(data);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(loadData);
  }, []);

  const getCurrentData = () => {
    if (!dashboardData) return { revenueData: [], userGrowthData: [], churnRateData: [] };
    return dashboardData[dateRange];
  };

  const handleExportReport = () => {
    setExportLoading(true);

    setTimeout(() => {
      const currentData = getCurrentData();
      const date = new Date().toLocaleDateString('en-US');
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text('SaaS Provider Dashboard Report', 20, 20);
      
      // Date and Range
      doc.setFontSize(12);
      doc.text(`Generated on: ${date}`, 20, 30);
      doc.text(`Date Range: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`, 20, 40);

      // Revenue Section
      doc.setFontSize(14);
      doc.text('Revenue Data', 20, 50);
      doc.setFontSize(10);
      doc.text('Date', 20, 60);
      doc.text('Revenue ($)', 100, 60);
      doc.line(20, 62, 180, 62);

      let yPos = 70;
      currentData.revenueData.forEach((item, index) => {
        doc.text(item.dateStr, 20, yPos);
        doc.text(`$${Number(item.revenue ?? 0).toLocaleString()}`, 100, yPos);
        yPos += 10;
        if (yPos > 270 && index < currentData.revenueData.length - 1) {
          doc.addPage();
          yPos = 20;
        }
      });

      // New page for User Growth
      doc.addPage();
      doc.setFontSize(14);
      doc.text('User Growth Data', 20, 20);
      doc.setFontSize(10);
      doc.text('Date', 20, 30);
      doc.text('Users', 100, 30);
      doc.line(20, 32, 180, 32);

      yPos = 40;
      currentData.userGrowthData.forEach((item, index) => {
        doc.text(item.dateStr, 20, yPos);
        doc.text(Number(item.users ?? 0).toLocaleString(), 100, yPos);
        yPos += 10;
        if (yPos > 270 && index < currentData.userGrowthData.length - 1) {
          doc.addPage();
          yPos = 20;
        }
      });

      // New page for Churn Rate
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Churn Rate Data', 20, 20);
      doc.setFontSize(10);
      doc.text('Date', 20, 30);
      doc.text('Rate (%)', 100, 30);
      doc.line(20, 32, 180, 32);

      yPos = 40;
      currentData.churnRateData.forEach((item, index) => {
        doc.text(item.dateStr, 20, yPos);
        doc.text(`${Number(item.rate ?? 0).toFixed(1)}%`, 100, yPos);
        yPos += 10;
        if (yPos > 270 && index < currentData.churnRateData.length - 1) {
          doc.addPage();
          yPos = 20;
        }
      });

      // Key Metrics
      const totalRevenue = currentData.revenueData.reduce((sum, item) => sum + (item.revenue ?? 0), 0);
      const currentPeriodRevenue = currentData.revenueData[currentData.revenueData.length - 1]?.revenue ?? 0;
      const totalUsers = currentData.userGrowthData[currentData.userGrowthData.length - 1]?.users ?? 0;
      const currentChurnRate = currentData.churnRateData[currentData.churnRateData.length - 1]?.rate ?? 0;

      doc.addPage();
      doc.setFontSize(14);
      doc.text('Key Metrics', 20, 20);
      doc.setFontSize(10);
      doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, 20, 30);
      doc.text(`Current Period Revenue: $${currentPeriodRevenue.toLocaleString()}`, 20, 40);
      doc.text(`Total Users: ${totalUsers.toLocaleString()}`, 20, 50);
      doc.text(`Current Churn Rate: ${currentChurnRate.toFixed(1)}%`, 20, 60);

      // Save the PDF
      doc.save(`saas_dashboard_report_${dateRange}_${date.replace(/\//g, '-')}.pdf`);
      setExportLoading(false);
    }, 1500);
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading dashboard data...</div>
      </div>
    );
  }

  const currentData = getCurrentData();

  const getXAxisKey = () => {
    switch(dateRange) {
      case 'weekly': return 'week';
      case 'quarterly': return 'quarter';
      case 'yearly': return 'year';
      default: return 'month';
    }
  };

  const revenueData = currentData.revenueData;
  const userGrowthData = currentData.userGrowthData;
  const churnRateData = currentData.churnRateData;

  const totalRevenue = revenueData.reduce((sum, item) => sum + (item.revenue ?? 0), 0);
  const currentPeriodRevenue = revenueData[revenueData.length - 1]?.revenue ?? 0;
  const previousPeriodRevenue = revenueData[revenueData.length - 2]?.revenue ?? 0;
  const revenueGrowth = previousPeriodRevenue ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : 0;

  const totalUsers = userGrowthData[userGrowthData.length - 1]?.users ?? 0;
  const previousUsers = userGrowthData[userGrowthData.length - 2]?.users ?? 0;
  const newUsers = totalUsers - previousUsers;

  const averageRevenuePerUser = totalUsers ? totalRevenue / totalUsers : 0;
  const currentChurnRate = churnRateData[churnRateData.length - 1]?.rate ?? 0;
  const previousChurnRate = churnRateData[churnRateData.length - 2]?.rate ?? 0;

  const newSubscriptionsRevenue = Math.round(currentPeriodRevenue * 0.2);
  const customerLifetimeValue = averageRevenuePerUser * (1 / (currentChurnRate / 100)) || 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">SaaS Provider Dashboard</h1>
        <p className="text-gray-600">Overview of platform revenue and growth metrics</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button 
            type="button" 
            className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${dateRange === 'weekly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setDateRange('weekly')}
          >
            Weekly
          </button>
          <button 
            type="button" 
            className={`px-4 py-2 text-sm font-medium border border-l-0 ${dateRange === 'monthly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setDateRange('monthly')}
          >
            Monthly
          </button>
          <button 
            type="button" 
            className={`px-4 py-2 text-sm font-medium border border-l-0 ${dateRange === 'quarterly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setDateRange('quarterly')}
          >
            Quarterly
          </button>
          <button 
            type="button" 
            className={`px-4 py-2 text-sm font-medium border border-l-0 rounded-r-lg ${dateRange === 'yearly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => setDateRange('yearly')}
          >
            Yearly
          </button>
        </div>

        <div>
          <button 
            className={`px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center ${exportLoading ? 'opacity-75 cursor-wait' : ''}`}
            onClick={handleExportReport}
            disabled={exportLoading}
          >
            {exportLoading ? 'Generating...' : 'Export PDF Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Revenue</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-800">${totalRevenue.toLocaleString()}</span>
          </div>
          <div className="mt-2">
            <span className={`text-sm ${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}% from previous period
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Current Period Revenue</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-800">${currentPeriodRevenue.toLocaleString()}</span>
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">vs ${previousPeriodRevenue.toLocaleString()} last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Users</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-800">{totalUsers.toLocaleString()}</span>
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-500">+{newUsers} new users this period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Current Churn Rate</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-800">{currentChurnRate}%</span>
          </div>
          <div className="mt-2">
            <span className={`text-sm ${currentChurnRate <= previousChurnRate ? 'text-green-500' : 'text-red-500'}`}>
              {currentChurnRate <= previousChurnRate ? '↓' : '↑'} 
              {Math.abs(currentChurnRate - previousChurnRate).toFixed(1)}% from last period
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Average Revenue Per User</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-800">${averageRevenuePerUser.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium mb-1">New Subscriptions Revenue</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-800">${newSubscriptionsRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm font-medium mb-1">Customer Lifetime Value</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-800">${customerLifetimeValue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-700 font-semibold mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={revenueData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={getXAxisKey()} />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-700 font-semibold mb-4">User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={userGrowthData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={getXAxisKey()} />
                <YAxis />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#10B981" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-700 font-semibold mb-4">Churn Rate Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={churnRateData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={getXAxisKey()} />
                <YAxis domain={[0, 'dataMax + 1']} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Line type="monotone" dataKey="rate" stroke="#EF4444" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-700 font-semibold mb-4">Revenue by Plan</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.revenueByPlanData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-700 font-semibold mb-4">User Plan Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.planDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {dashboardData.planDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-700 font-semibold mb-4">Feature Usage (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.featureUsageData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="feature" type="category" />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Bar dataKey="usage" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaasProviderDashboard;

