'use client'

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Filter, Download, Eye, ShoppingCart, Package
} from "lucide-react";

// Type definition for Inventory Items
type InventoryItem = {
  id: number;
  name: string;
  quantity: number;
  available: number;
  image: string;
  category: string;
  price: number;
};

// ✅ New type for filter options
type FilterOptions = {
  stockStatus: 'all' | 'inStock' | 'lowStock';
  priceMin: number | '';
  priceMax: number | '';
};

export default function OperatorInventoryPage() {
  const [inventory] = useState<InventoryItem[]>([
    { id: 1, name: "Rim - Sport Alloy 18\"", quantity: 24, available: 18, image: "/api/placeholder/100/100", category: "Rims", price: 249.99 },
    { id: 2, name: "Spoiler - Carbon Fiber", quantity: 10, available: 7, image: "/api/placeholder/100/100", category: "Spoilers", price: 399.99 },
    { id: 3, name: "Paint - Deep Blue Metallic", quantity: 15, available: 12, image: "/api/placeholder/100/100", category: "Paint", price: 149.99 },
    { id: 4, name: "Rim - Classic Chrome 17\"", quantity: 16, available: 8, image: "/api/placeholder/100/100", category: "Rims", price: 199.99 },
    { id: 5, name: "Spoiler - Adjustable Aluminum", quantity: 5, available: 3, image: "/api/placeholder/100/100", category: "Spoilers", price: 299.99 },
    { id: 6, name: "Paint - Ruby Red Pearl", quantity: 8, available: 5, image: "/api/placeholder/100/100", category: "Paint", price: 179.99 },
    { id: 7, name: "Rim - Off-road 20\"", quantity: 12, available: 6, image: "/api/placeholder/100/100", category: "Rims", price: 349.99 },
    { id: 8, name: "Hood Scoop - Black Matte", quantity: 7, available: 4, image: "/api/placeholder/100/100", category: "Body Kits", price: 129.99 },
  ]);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewItemDialog, setViewItemDialog] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  // ✅ New state for filter dialog and options
  const [filterDialog, setFilterDialog] = useState<boolean>(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    stockStatus: 'all',
    priceMin: '',
    priceMax: '',
  });

  // ✅ Updated filteredInventory to include filterOptions
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesStockStatus =
      filterOptions.stockStatus === 'all' ||
      (filterOptions.stockStatus === 'inStock' && item.available / item.quantity >= 0.3) ||
      (filterOptions.stockStatus === 'lowStock' && item.available / item.quantity < 0.3);
    const matchesPriceMin = filterOptions.priceMin === '' || item.price >= Number(filterOptions.priceMin);
    const matchesPriceMax = filterOptions.priceMax === '' || item.price <= Number(filterOptions.priceMax);
    return matchesSearch && matchesCategory && matchesStockStatus && matchesPriceMin && matchesPriceMax;
  });

  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const availableItems = inventory.reduce((sum, item) => sum + item.available, 0);
  const categories = [...new Set(inventory.map(item => item.category))];
  const lowStockItems = inventory.filter(item => item.available / item.quantity < 0.3).length;

  const handleViewItem = (item: InventoryItem) => {
    setCurrentItem(item);
    setViewItemDialog(true);
  };

  // ✅ Handler for applying filters
  const applyFilters = () => {
    setFilterDialog(false);
  };

  // ✅ Handler for resetting filters
  const resetFilters = () => {
    setFilterOptions({
      stockStatus: 'all',
      priceMin: '',
      priceMax: '',
    });
  };

  // ✅ Handler for exporting inventory to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Quantity', 'Available'];
    const rows = filteredInventory.map(item => [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`, // Escape quotes in CSV
      item.category,
      item.price.toFixed(2),
      item.quantity,
      item.available,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
              {Math.round((availableItems / totalItems) * 100)}% of total inventory
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

      {/* Inventory by Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="rims">Rims</TabsTrigger>
          <TabsTrigger value="spoilers">Spoilers</TabsTrigger>
          <TabsTrigger value="paint">Paint</TabsTrigger>
          <TabsTrigger value="bodykits">Body Kits</TabsTrigger>
        </TabsList>

        {/* ALL Items Tab */}
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
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* ✅ Updated Filter Button to open dialog */}
                <Button variant="outline" className="gap-1" onClick={() => setFilterDialog(true)}>
                  <Filter className="h-4 w-4" /> Filter
                </Button>
                {/* ✅ Updated Export List Button to trigger CSV download */}
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
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded" />
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
      </Tabs>

      {/* Dialog for Viewing Item Details */}
      <Dialog open={viewItemDialog} onOpenChange={setViewItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentItem?.name}</DialogTitle>
          </DialogHeader>
          {currentItem && (
            <div className="space-y-4">
              <img src={currentItem.image} alt={currentItem.name} className="w-32 h-32 rounded" />
              <p><strong>Category:</strong> {currentItem.category}</p>
              <p><strong>Price:</strong> ${currentItem.price.toFixed(2)}</p>
              <p><strong>Available:</strong> {currentItem.available} / {currentItem.quantity}</p>
              <p><strong>Status:</strong> {currentItem.available / currentItem.quantity < 0.3 ? "Low Stock" : "In Stock"}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewItemDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ New Dialog for Filter Options */}
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
}