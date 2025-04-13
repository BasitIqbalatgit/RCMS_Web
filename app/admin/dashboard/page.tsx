'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  Package,
  Users,
  BarChart,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Define interfaces for data structures
interface ChartDataPoint {
  name: string;
  tasksCompleted?: number;
  efficiency?: number;
  value?: number;
  color?: string;
}

interface AnalyticsData {
  operatorActivityData: ChartDataPoint[];
  inventoryStatusData: ChartDataPoint[];
  operatorPerformanceData: ChartDataPoint[];
  inventoryCategoryData: ChartDataPoint[];
  activeOperators: number;
  inventoryTurnover: number;
  lowStockItems: number;
  operatorEfficiency: number;
}

type TimeRange = '7' | '30' | '90' | '365';

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    operatorActivityData: [],
    inventoryStatusData: [],
    operatorPerformanceData: [],
    inventoryCategoryData: [],
    activeOperators: 0,
    inventoryTurnover: 0,
    lowStockItems: 0,
    operatorEfficiency: 0,
  });

  // Mock data variations for different time ranges
  const mockData: Record<TimeRange, AnalyticsData> = {
    '7': {
      operatorActivityData: [
        { name: 'Day 1', tasksCompleted: 20 },
        { name: 'Day 2', tasksCompleted: 25 },
        { name: 'Day 3', tasksCompleted: 30 },
        { name: 'Day 4', tasksCompleted: 22 },
        { name: 'Day 5', tasksCompleted: 28 },
        { name: 'Day 6', tasksCompleted: 26 },
        { name: 'Day 7', tasksCompleted: 24 },
      ],
      inventoryStatusData: [
        { name: 'In Stock', value: 75, color: '#10b981' },
        { name: 'Low Stock', value: 15, color: '#f59e0b' },
        { name: 'Out of Stock', value: 10, color: '#ef4444' },
      ],
      operatorPerformanceData: [
        { name: 'Day 1', efficiency: 90 },
        { name: 'Day 2', efficiency: 91 },
        { name: 'Day 3', efficiency: 92 },
        { name: 'Day 4', efficiency: 89 },
        { name: 'Day 5', efficiency: 93 },
        { name: 'Day 6', efficiency: 91 },
        { name: 'Day 7', efficiency: 90 },
      ],
      inventoryCategoryData: [
        { name: 'Rims', value: 25, color: '#3b82f6' },
        { name: 'Paint', value: 20, color: '#ef4444' },
        { name: 'Spoiler', value: 15, color: '#8b5cf6' },
        { name: 'Headlights', value: 20, color: '#10b981' },
        { name: 'Side Mirrors', value: 20, color: '#f59e0b' },
      ],
      activeOperators: 10,
      inventoryTurnover: 1.2,
      lowStockItems: 5,
      operatorEfficiency: 91,
    },
    '30': {
      operatorActivityData: [
        { name: 'Week 1', tasksCompleted: 120 },
        { name: 'Week 2', tasksCompleted: 150 },
        { name: 'Week 3', tasksCompleted: 180 },
        { name: 'Week 4', tasksCompleted: 140 },
      ],
      inventoryStatusData: [
        { name: 'In Stock', value: 70, color: '#10b981' },
        { name: 'Low Stock', value: 20, color: '#f59e0b' },
        { name: 'Out of Stock', value: 10, color: '#ef4444' },
      ],
      operatorPerformanceData: [
        { name: 'Week 1', efficiency: 88 },
        { name: 'Week 2', efficiency: 90 },
        { name: 'Week 3', efficiency: 92 },
        { name: 'Week 4', efficiency: 89 },
      ],
      inventoryCategoryData: [
        { name: 'Rims', value: 30, color: '#3b82f6' },
        { name: 'Paint', value: 25, color: '#ef4444' },
        { name: 'Spoiler', value: 15, color: '#8b5cf6' },
        { name: 'Headlights', value: 15, color: '#10b981' },
        { name: 'Side Mirrors', value: 15, color: '#f59e0b' },
      ],
      activeOperators: 12,
      inventoryTurnover: 6.8,
      lowStockItems: 15,
      operatorEfficiency: 92,
    },
    '90': {
      operatorActivityData: [
        { name: 'Month 1', tasksCompleted: 400 },
        { name: 'Month 2', tasksCompleted: 450 },
        { name: 'Month 3', tasksCompleted: 420 },
      ],
      inventoryStatusData: [
        { name: 'In Stock', value: 65, color: '#10b981' },
        { name: 'Low Stock', value: 25, color: '#f59e0b' },
        { name: 'Out of Stock', value: 10, color: '#ef4444' },
      ],
      operatorPerformanceData: [
        { name: 'Month 1', efficiency: 87 },
        { name: 'Month 2', efficiency: 90 },
        { name: 'Month 3', efficiency: 91 },
      ],
      inventoryCategoryData: [
        { name: 'Rims', value: 35, color: '#3b82f6' },
        { name: 'Paint', value: 20, color: '#ef4444' },
        { name: 'Spoiler', value: 20, color: '#8b5cf6' },
        { name: 'Headlights', value: 15, color: '#10b981' },
        { name: 'Side Mirrors', value: 10, color: '#f59e0b' },
      ],
      activeOperators: 11,
      inventoryTurnover: 20.4,
      lowStockItems: 20,
      operatorEfficiency: 90,
    },
    '365': {
      operatorActivityData: [
        { name: 'Q1', tasksCompleted: 1200 },
        { name: 'Q2', tasksCompleted: 1400 },
        { name: 'Q3', tasksCompleted: 1300 },
        { name: 'Q4', tasksCompleted: 1500 },
      ],
      inventoryStatusData: [
        { name: 'In Stock', value: 60, color: '#10b981' },
        { name: 'Low Stock', value: 30, color: '#f59e0b' },
        { name: 'Out of Stock', value: 10, color: '#ef4444' },
      ],
      operatorPerformanceData: [
        { name: 'Q1', efficiency: 85 },
        { name: 'Q2', efficiency: 88 },
        { name: 'Q3', efficiency: 90 },
        { name: 'Q4', efficiency: 92 },
      ],
      inventoryCategoryData: [
        { name: 'Rims', value: 40, color: '#3b82f6' },
        { name: 'Paint', value: 20, color: '#ef4444' },
        { name: 'Spoiler', value: 15, color: '#8b5cf6' },
        { name: 'Headlights', value: 15, color: '#10b981' },
        { name: 'Side Mirrors', value: 10, color: '#f59e0b' },
      ],
      activeOperators: 13,
      inventoryTurnover: 81.6,
      lowStockItems: 25,
      operatorEfficiency: 89,
    },
  };

  // Update analytics data when timeRange changes
  useEffect(() => {
    setAnalyticsData(mockData[timeRange]);
  }, [timeRange]);

 

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
          <p className="text-gray-500">Summary of business operations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="365">Last Year</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
         
          <Avatar>
            <AvatarImage src="/api/placeholder/100/100" alt="Admin" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Active Operators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.activeOperators}</div>
              <p className="text-xs text-green-500">
                {timeRange === '7' ? '+1' : timeRange === '30' ? '+2' : timeRange === '90' ? '+1' : '+3'} from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Inventory Turnover
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.inventoryTurnover}</div>
              <p className="text-xs text-gray-500">
                Times per {timeRange === '7' ? 'week' : timeRange === '30' ? 'month' : 'period'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.lowStockItems}</div>
              <p className="text-xs text-yellow-500">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Operator Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.operatorEfficiency}%</div>
              <p className="text-xs text-green-500">
                {timeRange === '7' ? '+2%' : timeRange === '30' ? '+5%' : timeRange === '90' ? '+3%' : '+4%'} from last
                period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Operator Activity Trend</CardTitle>
              <CardDescription>Tasks completed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.operatorActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tasksCompleted" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Current stock distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.inventoryStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                      {analyticsData.inventoryStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operator Performance</CardTitle>
              <CardDescription>Efficiency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.operatorPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Category Distribution</CardTitle>
              <CardDescription>Stock by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.inventoryCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                      {analyticsData.inventoryCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        
      </div>
    </div>
  );
};

export default AdminDashboard;