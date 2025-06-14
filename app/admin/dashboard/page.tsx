// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import {
//   Activity,
//   Package,
//   Users,
//   BarChart,
//   Settings,
//   AlertCircle,
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import {
//   LineChart,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   Line,
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
// } from 'recharts';

// // Define interfaces for data structures
// interface ChartDataPoint {
//   name: string;
//   tasksCompleted?: number;
//   efficiency?: number;
//   value?: number;
//   color?: string;
// }

// interface AnalyticsData {
//   operatorActivityData: ChartDataPoint[];
//   inventoryStatusData: ChartDataPoint[];
//   operatorPerformanceData: ChartDataPoint[];
//   inventoryCategoryData: ChartDataPoint[];
//   activeOperators: number;
//   inventoryTurnover: number;
//   lowStockItems: number;
//   operatorEfficiency: number;
// }

// type TimeRange = '7' | '30' | '90' | '365';

// const AdminDashboard: React.FC = () => {
//   const router = useRouter();
//   const [timeRange, setTimeRange] = useState<TimeRange>('30');
//   const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
//     operatorActivityData: [],
//     inventoryStatusData: [],
//     operatorPerformanceData: [],
//     inventoryCategoryData: [],
//     activeOperators: 0,
//     inventoryTurnover: 0,
//     lowStockItems: 0,
//     operatorEfficiency: 0,
//   });

//   // Mock data variations for different time ranges
//   const mockData: Record<TimeRange, AnalyticsData> = {
//     '7': {
//       operatorActivityData: [
//         { name: 'Day 1', tasksCompleted: 20 },
//         { name: 'Day 2', tasksCompleted: 25 },
//         { name: 'Day 3', tasksCompleted: 30 },
//         { name: 'Day 4', tasksCompleted: 22 },
//         { name: 'Day 5', tasksCompleted: 28 },
//         { name: 'Day 6', tasksCompleted: 26 },
//         { name: 'Day 7', tasksCompleted: 24 },
//       ],
//       inventoryStatusData: [
//         { name: 'In Stock', value: 75, color: '#10b981' },
//         { name: 'Low Stock', value: 15, color: '#f59e0b' },
//         { name: 'Out of Stock', value: 10, color: '#ef4444' },
//       ],
//       operatorPerformanceData: [
//         { name: 'Day 1', efficiency: 90 },
//         { name: 'Day 2', efficiency: 91 },
//         { name: 'Day 3', efficiency: 92 },
//         { name: 'Day 4', efficiency: 89 },
//         { name: 'Day 5', efficiency: 93 },
//         { name: 'Day 6', efficiency: 91 },
//         { name: 'Day 7', efficiency: 90 },
//       ],
//       inventoryCategoryData: [
//         { name: 'Rims', value: 25, color: '#3b82f6' },
//         { name: 'Paint', value: 20, color: '#ef4444' },
//         { name: 'Spoiler', value: 15, color: '#8b5cf6' },
//         { name: 'Headlights', value: 20, color: '#10b981' },
//         { name: 'Side Mirrors', value: 20, color: '#f59e0b' },
//       ],
//       activeOperators: 10,
//       inventoryTurnover: 1.2,
//       lowStockItems: 5,
//       operatorEfficiency: 91,
//     },
//     '30': {
//       operatorActivityData: [
//         { name: 'Week 1', tasksCompleted: 120 },
//         { name: 'Week 2', tasksCompleted: 150 },
//         { name: 'Week 3', tasksCompleted: 180 },
//         { name: 'Week 4', tasksCompleted: 140 },
//       ],
//       inventoryStatusData: [
//         { name: 'In Stock', value: 70, color: '#10b981' },
//         { name: 'Low Stock', value: 20, color: '#f59e0b' },
//         { name: 'Out of Stock', value: 10, color: '#ef4444' },
//       ],
//       operatorPerformanceData: [
//         { name: 'Week 1', efficiency: 88 },
//         { name: 'Week 2', efficiency: 90 },
//         { name: 'Week 3', efficiency: 92 },
//         { name: 'Week 4', efficiency: 89 },
//       ],
//       inventoryCategoryData: [
//         { name: 'Rims', value: 30, color: '#3b82f6' },
//         { name: 'Paint', value: 25, color: '#ef4444' },
//         { name: 'Spoiler', value: 15, color: '#8b5cf6' },
//         { name: 'Headlights', value: 15, color: '#10b981' },
//         { name: 'Side Mirrors', value: 15, color: '#f59e0b' },
//       ],
//       activeOperators: 12,
//       inventoryTurnover: 6.8,
//       lowStockItems: 15,
//       operatorEfficiency: 92,
//     },
//     '90': {
//       operatorActivityData: [
//         { name: 'Month 1', tasksCompleted: 400 },
//         { name: 'Month 2', tasksCompleted: 450 },
//         { name: 'Month 3', tasksCompleted: 420 },
//       ],
//       inventoryStatusData: [
//         { name: 'In Stock', value: 65, color: '#10b981' },
//         { name: 'Low Stock', value: 25, color: '#f59e0b' },
//         { name: 'Out of Stock', value: 10, color: '#ef4444' },
//       ],
//       operatorPerformanceData: [
//         { name: 'Month 1', efficiency: 87 },
//         { name: 'Month 2', efficiency: 90 },
//         { name: 'Month 3', efficiency: 91 },
//       ],
//       inventoryCategoryData: [
//         { name: 'Rims', value: 35, color: '#3b82f6' },
//         { name: 'Paint', value: 20, color: '#ef4444' },
//         { name: 'Spoiler', value: 20, color: '#8b5cf6' },
//         { name: 'Headlights', value: 15, color: '#10b981' },
//         { name: 'Side Mirrors', value: 10, color: '#f59e0b' },
//       ],
//       activeOperators: 11,
//       inventoryTurnover: 20.4,
//       lowStockItems: 20,
//       operatorEfficiency: 90,
//     },
//     '365': {
//       operatorActivityData: [
//         { name: 'Q1', tasksCompleted: 1200 },
//         { name: 'Q2', tasksCompleted: 1400 },
//         { name: 'Q3', tasksCompleted: 1300 },
//         { name: 'Q4', tasksCompleted: 1500 },
//       ],
//       inventoryStatusData: [
//         { name: 'In Stock', value: 60, color: '#10b981' },
//         { name: 'Low Stock', value: 30, color: '#f59e0b' },
//         { name: 'Out of Stock', value: 10, color: '#ef4444' },
//       ],
//       operatorPerformanceData: [
//         { name: 'Q1', efficiency: 85 },
//         { name: 'Q2', efficiency: 88 },
//         { name: 'Q3', efficiency: 90 },
//         { name: 'Q4', efficiency: 92 },
//       ],
//       inventoryCategoryData: [
//         { name: 'Rims', value: 40, color: '#3b82f6' },
//         { name: 'Paint', value: 20, color: '#ef4444' },
//         { name: 'Spoiler', value: 15, color: '#8b5cf6' },
//         { name: 'Headlights', value: 15, color: '#10b981' },
//         { name: 'Side Mirrors', value: 10, color: '#f59e0b' },
//       ],
//       activeOperators: 13,
//       inventoryTurnover: 81.6,
//       lowStockItems: 25,
//       operatorEfficiency: 89,
//     },
//   };

//   // Update analytics data when timeRange changes
//   useEffect(() => {
//     setAnalyticsData(mockData[timeRange]);
//   }, [timeRange]);

 

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       <header className="flex justify-between items-center mb-8">
//         <div>
//           <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
//           <p className="text-gray-500">Summary of business operations</p>
//         </div>
//         <div className="flex items-center space-x-4">
//           <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
//             <SelectTrigger className="w-[180px]">
//               <SelectValue placeholder="Select Time Range" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectGroup>
//                 <SelectItem value="7">Last 7 Days</SelectItem>
//                 <SelectItem value="30">Last 30 Days</SelectItem>
//                 <SelectItem value="90">Last 90 Days</SelectItem>
//                 <SelectItem value="365">Last Year</SelectItem>
//               </SelectGroup>
//             </SelectContent>
//           </Select>
         
//           <Avatar>
//             <AvatarImage src="/api/placeholder/100/100" alt="Admin" />
//             <AvatarFallback>AD</AvatarFallback>
//           </Avatar>
//         </div>
//       </header>

//       <div className="space-y-6">
//         {/* Key Metrics */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium flex items-center">
//                 <Users className="h-4 w-4 mr-2" />
//                 Active Operators
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{analyticsData.activeOperators}</div>
//               <p className="text-xs text-green-500">
//                 {timeRange === '7' ? '+1' : timeRange === '30' ? '+2' : timeRange === '90' ? '+1' : '+3'} from last period
//               </p>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium flex items-center">
//                 <Package className="h-4 w-4 mr-2" />
//                 Inventory Turnover
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{analyticsData.inventoryTurnover}</div>
//               <p className="text-xs text-gray-500">
//                 Times per {timeRange === '7' ? 'week' : timeRange === '30' ? 'month' : 'period'}
//               </p>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium flex items-center">
//                 <AlertCircle className="h-4 w-4 mr-2" />
//                 Low Stock Items
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{analyticsData.lowStockItems}</div>
//               <p className="text-xs text-yellow-500">Requires attention</p>
//             </CardContent>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium flex items-center">
//                 <BarChart className="h-4 w-4 mr-2" />
//                 Operator Efficiency
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold">{analyticsData.operatorEfficiency}%</div>
//               <p className="text-xs text-green-500">
//                 {timeRange === '7' ? '+2%' : timeRange === '30' ? '+5%' : timeRange === '90' ? '+3%' : '+4%'} from last
//                 period
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Visualizations */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Operator Activity Trend</CardTitle>
//               <CardDescription>Tasks completed over time</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={analyticsData.operatorActivityData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="name" />
//                     <YAxis />
//                     <Tooltip />
//                     <Legend />
//                     <Line type="monotone" dataKey="tasksCompleted" stroke="#3b82f6" strokeWidth={2} />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Inventory Status</CardTitle>
//               <CardDescription>Current stock distribution</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={analyticsData.inventoryStatusData}
//                       cx="50%"
//                       cy="50%"
//                       innerRadius={60}
//                       outerRadius={80}
//                       dataKey="value"
//                       label
//                     >
//                       {analyticsData.inventoryStatusData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Pie>
//                     <Tooltip />
//                     <Legend />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Operator Performance</CardTitle>
//               <CardDescription>Efficiency over time</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={analyticsData.operatorPerformanceData}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="name" />
//                     <YAxis />
//                     <Tooltip />
//                     <Legend />
//                     <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={2} />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Inventory Category Distribution</CardTitle>
//               <CardDescription>Stock by category</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={analyticsData.inventoryCategoryData}
//                       cx="50%"
//                       cy="50%"
//                       innerRadius={60}
//                       outerRadius={80}
//                       dataKey="value"
//                       label
//                     >
//                       {analyticsData.inventoryCategoryData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Pie>
//                     <Tooltip />
//                     <Legend />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

        
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  TrendingUp,
  DollarSign,
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
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts';

// Define interfaces for data structures
interface InventoryItem {
  _id: string;
  name: string;
  quantity: number;
  available: number;
  image: string;
  category: string;
  price: number;
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

interface Operator {
  _id: string;
  name: string;
  email: string;
  centreName: string;
  location: string;
  adminId: string;
  createdAt: string;
  emailVerified: boolean;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  count?: number;
  totalValue?: number;
}

interface DashboardMetrics {
  totalOperators: number;
  totalInventoryItems: number;
  totalInventoryValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  inventoryTurnover: number;
  averageItemValue: number;
}

type TimeRange = '7' | '30' | '90' | '365';

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for real data
  const [operators, setOperators] = useState<Operator[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalOperators: 0,
    totalInventoryItems: 0,
    totalInventoryValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    inventoryTurnover: 0,
    averageItemValue: 0,
  });

  // Chart data
  const [categoryDistribution, setCategoryDistribution] = useState<ChartDataPoint[]>([]);
  const [stockStatusData, setStockStatusData] = useState<ChartDataPoint[]>([]);
  const [operatorActivityData, setOperatorActivityData] = useState<ChartDataPoint[]>([]);
  const [inventoryValueData, setInventoryValueData] = useState<ChartDataPoint[]>([]);

  // Fetch operators data
  const fetchOperators = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/operator?adminId=${session.user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch operators');
      }
      const operatorsData = await response.json();
      setOperators(operatorsData);
    } catch (error) {
      console.error('Error fetching operators:', error);
      setError('Failed to load operators data');
    }
  };

  // Fetch inventory data
  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const result = await response.json();
      if (result.success) {
        setInventory(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch inventory');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory data');
    }
  };

  // Calculate metrics from real data
  const calculateMetrics = () => {
    const totalInventoryItems = inventory.length;
    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStockItems = inventory.filter(item => item.available <= 5 && item.available > 0).length;
    const outOfStockItems = inventory.filter(item => item.available === 0).length;
    const averageItemValue = totalInventoryItems > 0 ? totalInventoryValue / totalInventoryItems : 0;
    
    // Simple inventory turnover calculation (this would be more complex with actual sales data)
    const inventoryTurnover = totalInventoryItems > 0 ? 
      inventory.reduce((sum, item) => sum + ((item.quantity - item.available) / item.quantity), 0) / totalInventoryItems * 100 : 0;

    setMetrics({
      totalOperators: operators.length,
      totalInventoryItems,
      totalInventoryValue,
      lowStockItems,
      outOfStockItems,
      inventoryTurnover,
      averageItemValue,
    });
  };

  // Calculate chart data
  const calculateChartData = () => {
    // Category distribution
    const categoryMap = new Map<string, { count: number; value: number }>();
    inventory.forEach(item => {
      const existing = categoryMap.get(item.category) || { count: 0, value: 0 };
      categoryMap.set(item.category, {
        count: existing.count + 1,
        value: existing.value + (item.price * item.quantity)
      });
    });

    const colors = ['#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#f97316'];
    const categoryData = Array.from(categoryMap.entries()).map(([category, data], index) => ({
      name: category,
      value: data.count,
      totalValue: data.value,
      color: colors[index % colors.length]
    }));
    setCategoryDistribution(categoryData);

    // Stock status data
    const inStock = inventory.filter(item => item.available > 5).length;
    const lowStock = inventory.filter(item => item.available <= 5 && item.available > 0).length;
    const outOfStock = inventory.filter(item => item.available === 0).length;
    
    setStockStatusData([
      { name: 'In Stock', value: inStock, color: '#10b981' },
      { name: 'Low Stock', value: lowStock, color: '#f59e0b' },
      { name: 'Out of Stock', value: outOfStock, color: '#ef4444' },
    ]);

    // Operator activity (mock data based on operator count and time range)
    const generateOperatorActivity = () => {
      const periods = timeRange === '7' ? 7 : timeRange === '30' ? 4 : timeRange === '90' ? 3 : 4;
      const baseActivity = operators.length * 20; // Base tasks per operator
      
      return Array.from({ length: periods }, (_, i) => ({
        name: timeRange === '7' ? `Day ${i + 1}` : 
              timeRange === '30' ? `Week ${i + 1}` : 
              timeRange === '90' ? `Month ${i + 1}` : `Q${i + 1}`,
        value: Math.floor(baseActivity + (Math.random() * baseActivity * 0.3))
      }));
    };
    setOperatorActivityData(generateOperatorActivity());

    // Inventory value by category
    setInventoryValueData(categoryData.map(item => ({
      name: item.name,
      value: item.totalValue,
      color: item.color
    })));
  };

  // Load all data
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchOperators(), fetchInventory()]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session, status, router]);

  // Recalculate metrics and charts when data changes
  useEffect(() => {
    if (operators.length >= 0 && inventory.length >= 0) {
      calculateMetrics();
      calculateChartData();
    }
  }, [operators, inventory, timeRange]);

  if (status === 'loading' || loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
          <p className="text-gray-500">
            {session?.user?.centreName || 'Business Operations'} - {operators.length} operators, {inventory.length} items
          </p>
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
            <AvatarFallback>{session?.user?.name?.charAt(0) || 'A'}</AvatarFallback>
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
              <div className="text-2xl font-bold">{metrics.totalOperators}</div>
              <p className="text-xs text-green-500">
                {operators.filter(op => op.emailVerified).length} verified
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Total Inventory Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalInventoryItems}</div>
              <p className="text-xs text-gray-500">
                ${metrics.totalInventoryValue.toLocaleString()} total value
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.lowStockItems}</div>
              <p className="text-xs text-red-500">
                {metrics.outOfStockItems} out of stock
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Inventory Turnover
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.inventoryTurnover.toFixed(1)}%</div>
              <p className="text-xs text-gray-500">
                Avg. item value: ${metrics.averageItemValue.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Operator Activity Trend</CardTitle>
              <CardDescription>Estimated tasks completed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={operatorActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Tasks" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Stock Status</CardTitle>
              <CardDescription>Current stock distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({name, value}) => `${name}: ${value}`}
                    >
                      {stockStatusData.map((entry, index) => (
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
              <CardTitle>Inventory by Category</CardTitle>
              <CardDescription>Item count by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={categoryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" name="Items" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Value Distribution</CardTitle>
              <CardDescription>Total value by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryValueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({name, value}) => `${name}: $${value.toLocaleString()}`}
                    >
                      {inventoryValueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Operators</CardTitle>
              <CardDescription>Latest registered operators</CardDescription>
            </CardHeader>
            <CardContent>
              {operators.length === 0 ? (
                <p className="text-gray-500">No operators registered yet</p>
              ) : (
                <div className="space-y-3">
                  {operators.slice(0, 5).map((operator) => (
                    <div key={operator._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{operator.name}</p>
                        <p className="text-sm text-gray-500">{operator.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(operator.createdAt).toLocaleDateString()}
                        </p>
                        <p className={`text-xs ${operator.emailVerified ? 'text-green-500' : 'text-orange-500'}`}>
                          {operator.emailVerified ? 'Verified' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alert</CardTitle>
              <CardDescription>Inventory items requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {inventory.filter(item => item.available <= 5).length === 0 ? (
                <p className="text-gray-500">All items are well stocked</p>
              ) : (
                <div className="space-y-3">
                  {inventory
                    .filter(item => item.available <= 5)
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            item.available === 0 ? 'text-red-500' : 'text-orange-500'
                          }`}>
                            {item.available} / {item.quantity}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;