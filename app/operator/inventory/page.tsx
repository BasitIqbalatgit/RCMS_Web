'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { fetchInventory } from '@/lib/services/inventoryService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Type definition for Inventory Items (aligned with backend)
interface InventoryItem {
  id: string;
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

// Type for filter options
interface FilterOptions {
  stockStatus: 'all' | 'inStock' | 'lowStock';
  priceMin: number | '';
  priceMax: number | '';
}

const OperatorInventoryPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewItemDialog, setViewItemDialog] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [filterDialog, setFilterDialog] = useState<boolean>(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    stockStatus: 'all',
    priceMin: '',
    priceMax: '',
  });

  // Fetch inventory data on component mount
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        const data = await fetchInventory();
        // Transform backend data to match frontend InventoryItem type
        const transformedData = data.map((item: any) => ({
          id: item._id.toString(), // Map _id to id
          name: item.name,
          quantity: item.quantity,
          available: item.available,
          image: item.image || '/api/placeholder/100/100',
          category: item.category,
          price: item.price,
          adminId: item.adminId.toString(), // Convert ObjectId to string
          createdAt: new Date(item.createdAt).toISOString(), // Convert Date to string
          updatedAt: new Date(item.updatedAt).toISOString(), // Convert Date to string
        }));
        setInventory(transformedData);
        setError(null);
      } catch (err) {
        setError('Failed to load inventory data. Please try again.');
        console.error('Error loading inventory:', err);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadInventory();
    }
  }, [status]);

  // Filtered inventory based on search, category, and filter options
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStockStatus =
      filterOptions.stockStatus === 'all' ||
      (filterOptions.stockStatus === 'inStock' && item.available / item.quantity >= 0.3) ||
      (filterOptions.stockStatus === 'lowStock' && item.available / item.quantity < 0.3);
    const matchesPriceMin = filterOptions.priceMin === '' || item.price >= Number(filterOptions.priceMin);
    const matchesPriceMax = filterOptions.priceMax === '' || item.price <= Number(filterOptions.priceMax);
    return matchesSearch && matchesCategory && matchesStockStatus && matchesPriceMin && matchesPriceMax;
  });

  // Calculate stats
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const availableItems = inventory.reduce((sum, item) => sum + item.available, 0);
  const categories = [...new Set(inventory.map((item) => item.category))];
  const lowStockItems = inventory.filter((item) => item.available / item.quantity < 0.3).length;

  // Handle view item
  const handleViewItem = useCallback((item: InventoryItem) => {
    setCurrentItem(item);
    setViewItemDialog(true);
  }, []);

  // Handle apply filters
  const applyFilters = useCallback(() => {
    setFilterDialog(false);
  }, []);

  // Handle reset filters
  const resetFilters = useCallback(() => {
    setFilterOptions({
      stockStatus: 'all',
      priceMin: '',
      priceMax: '',
    });
  }, []);

  // Handle export to CSV
  const exportToCSV = useCallback(() => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Quantity', 'Available'];
    const rows = filteredInventory.map((item) => [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.price.toFixed(2),
      item.quantity,
      item.available,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredInventory]);

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Unauthenticated state
  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-12">
        <Alert className="bg-yellow-50 border-yellow-500">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-600">Authentication Required</AlertTitle>
          <AlertDescription>Please sign in to access the inventory overview.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Define tab categories that are available in the UI
  const tabCategories = ['Rims', 'Spoilers', 'Paint', 'HeadLight', 'SideMirror'];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Inventory Overview</h1>
        <p className="text-gray-500">View and use available car modification parts inventory</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableItems}</div>
            <p className="text-xs text-gray-500">
              {totalItems ? Math.round((availableItems / totalItems) * 100) : 0}% of total inventory
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-red-500">Items below 30% availability</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-50 border-red-500">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-600">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Inventory by Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-6 mb-4">
          <TabsTrigger value="all">All Items</TabsTrigger>
          {tabCategories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category === 'SideMirror' ? 'Side Mirror' : category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Inventory Items</CardTitle>
              <CardDescription>Browse all available car modification parts.</CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search inventory..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-1" onClick={() => setFilterDialog(true)}>
                  <Filter className="h-4 w-4" /> Filter
                </Button>
                <Button variant="outline" className="gap-1" onClick={exportToCSV}>
                  <Download className="h-4 w-4" /> Export List
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                        No inventory items found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded"
                            onError={(e) => (e.currentTarget.src = '/api/placeholder/100/100')}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.available}</TableCell>
                        <TableCell className="text-right">
                          {item.available / item.quantity < 0.3 ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge variant="outline">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleViewItem(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Showing {filteredInventory.length} of {inventory.length} items
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Category Tab Contents */}
        {tabCategories.map((category) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle>{category === 'SideMirror' ? 'Side Mirror' : category} Inventory</CardTitle>
                <CardDescription>Browse available {category === 'SideMirror' ? 'side mirrors' : category.toLowerCase()}.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.filter((item) => item.category === category).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                          No {category === 'SideMirror' ? 'side mirrors' : category.toLowerCase()} found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory
                        .filter((item) => item.category === category)
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded"
                                onError={(e) => (e.currentTarget.src = '/api/placeholder/100/100')}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{item.available}</TableCell>
                            <TableCell className="text-right">
                              {item.available / item.quantity < 0.3 ? (
                                <Badge variant="destructive">Low Stock</Badge>
                              ) : (
                                <Badge variant="outline">In Stock</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleViewItem(item)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                Showing {filteredInventory.filter((item) => item.category === category).length} items
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* View Item Dialog */}
      <Dialog open={viewItemDialog} onOpenChange={setViewItemDialog}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {currentItem?.name}
            </DialogTitle>
          </DialogHeader>

          {currentItem && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={currentItem.image}
                  alt={currentItem.name}
                  className="w-40 h-40 rounded-xl object-cover shadow-sm border"
                  onError={(e) => (e.currentTarget.src = '/api/placeholder/100/100')}
                />
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium">Category:</span>
                  <span>{currentItem.category}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Price:</span>
                  <span className="text-green-600 font-semibold">${currentItem.price.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Stock:</span>
                  <span>
                    {currentItem.available} / {currentItem.quantity}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <Badge
                    variant={currentItem.available / currentItem.quantity < 0.3 ? 'destructive' : 'default'}
                    className="flex items-center gap-1"
                  >
                    {currentItem.available / currentItem.quantity < 0.3 ? (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Low Stock
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        In Stock
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setViewItemDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialog} onOpenChange={setFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Stock Status</label>
              <Select
                value={filterOptions.stockStatus}
                onValueChange={(value) =>
                  setFilterOptions({ ...filterOptions, stockStatus: value as 'all' | 'inStock' | 'lowStock' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="inStock">In Stock</SelectItem>
                  <SelectItem value="lowStock">Low Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Price Range</label>
              <div className="flex gap-4">
                <Input
                  type="number"
                  placeholder="Min Price"
                  value={filterOptions.priceMin}
                  onChange={(e) =>
                    setFilterOptions({ ...filterOptions, priceMin: e.target.value ? Number(e.target.value) : '' })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max Price"
                  value={filterOptions.priceMax}
                  onChange={(e) =>
                    setFilterOptions({ ...filterOptions, priceMax: e.target.value ? Number(e.target.value) : '' })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperatorInventoryPage;