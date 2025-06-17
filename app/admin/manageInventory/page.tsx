'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  AlertCircle,
  Image,
  Loader2,
} from 'lucide-react';
import { fetchInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '@/lib/services/inventoryService';

// Define the InventoryItem type for the frontend
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

// Define form data type for add/edit
type FormData = {
  name: string;
  quantity: number;
  available: number;
  category: string;
  price: number;
  image: string;
};

const AdminInventoryPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [newItemImagePreview, setNewItemImagePreview] = useState<string | null>(null);
  const [editItemImagePreview, setEditItemImagePreview] = useState<string | null>(null);
  const [filterPriceMin, setFilterPriceMin] = useState<number | ''>('');
  const [filterPriceMax, setFilterPriceMax] = useState<number | ''>('');
  const [filterStockStatus, setFilterStockStatus] = useState<string>('all');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [editFormData, setEditFormData] = useState<FormData>({
    name: '',
    quantity: 0,
    available: 0,
    category: '',
    price: 0,
    image: '',
  });
  const [newItemData, setNewItemData] = useState<FormData>({
    name: '',
    quantity: 0,
    available: 0,
    category: 'Rims',
    price: 0,
    image: '',
  });

  const itemsPerPage = 5;

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
          image: item.image,
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

  // Ensure dialog states are synchronized
  useEffect(() => {
    if (!isEditDialogOpen) {
      setCurrentItem(null);
      setEditFormData({
        name: '',
        quantity: 0,
        available: 0,
        category: '',
        price: 0,
        image: '',
      });
      setEditItemImagePreview(null);
    }
    if (!isDeleteDialogOpen) {
      setItemToDelete(null);
    }
  }, [isEditDialogOpen, isDeleteDialogOpen]);

  // Filter inventory
  const filteredInventory: InventoryItem[] = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesPrice =
      (filterPriceMin === '' || item.price >= filterPriceMin) &&
      (filterPriceMax === '' || item.price <= filterPriceMax);
    const matchesStock =
      filterStockStatus === 'all' ||
      (filterStockStatus === 'inStock' && item.available / item.quantity > 0.5) ||
      (filterStockStatus === 'lowStock' &&
        item.available / item.quantity <= 0.5 &&
        item.available / item.quantity > 0.2) ||
      (filterStockStatus === 'critical' && item.available / item.quantity <= 0.2);
    return matchesSearch && matchesCategory && matchesPrice && matchesStock;
  });

  // Paginated inventory
  const paginatedInventory: InventoryItem[] = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate inventory stats
  const totalItems: number = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const availableItems: number = inventory.reduce((sum, item) => sum + item.available, 0);
  const categories: string[] = [...new Set(inventory.map((item) => item.category))];
  const lowStockItems: number = inventory.filter((item) => item.available / item.quantity < 0.3).length;
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  // Show alert
  const showAlert = useCallback((type: 'success' | 'error', message: string): void => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  // Validate form data
  // 1. Fix the validation function to properly handle form data
  const validateForm = useCallback((formData: FormData): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Item name is required.';
    }

    if (formData.quantity < 0) {
      errors.quantity = 'Quantity cannot be negative.';
    }

    if (formData.available < 0) {
      errors.available = 'Available cannot be negative.';
    }

    // Ensure both values are numbers before comparison
    const quantity = Number(formData.quantity);
    const available = Number(formData.available);

    if (available > quantity) {
      errors.available = 'Available cannot exceed quantity.';
    }

    if (!formData.category) {
      errors.category = 'Category is required.';
    }

    if (formData.price < 0) {
      errors.price = 'Price cannot be negative.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  // Handle adding new item
  const handleAddItem = useCallback(async (): Promise<void> => {
    // Ensure all numeric fields are properly converted to numbers
    const sanitizedFormData = {
      ...newItemData,
      quantity: Number(newItemData.quantity),
      available: Number(newItemData.available),
      price: Number(newItemData.price)
    };

    if (!validateForm(sanitizedFormData)) {
      showAlert('error', 'Please fix the form errors.');
      return;
    }

    try {
      setLoading(true);
      const addedItem = await addInventoryItem(sanitizedFormData);
      // Transform backend data to match frontend InventoryItem type
      const transformedItem: InventoryItem = {
        id: addedItem._id?.toString() || addedItem.id?.toString(), // Handle both _id and id
        name: addedItem.name,
        quantity: Number(addedItem.quantity),
        available: Number(addedItem.available),
        image: addedItem.image,
        category: addedItem.category,
        price: Number(addedItem.price),
        adminId: addedItem.adminId.toString(),
        createdAt: addedItem.createdAt instanceof Date ? addedItem.createdAt.toISOString() : addedItem.createdAt,
        updatedAt: addedItem.updatedAt instanceof Date ? addedItem.updatedAt.toISOString() : addedItem.updatedAt,
      };
      setInventory((prev) => [...prev, transformedItem]);
      setNewItemData({
        name: '',
        quantity: 0,
        available: 0,
        category: 'Rims',
        price: 0,
        image: '',
      });
      setNewItemImagePreview(null);
      setIsAddDialogOpen(false);
      showAlert('success', 'Item added successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add inventory item. Please try again.';
      showAlert('error', errorMessage);
      console.error('Error adding inventory item:', err);
    } finally {
      setLoading(false);
    }
  }, [newItemData, showAlert, validateForm]);

  // Handle editing item
  const startEdit = useCallback((item: InventoryItem): void => {
    setCurrentItem(item);
    setEditFormData({
      name: item.name,
      quantity: item.quantity,
      available: item.available,
      category: item.category,
      price: item.price,
      image: item.image,
    });
    setEditItemImagePreview(item.image);
    setIsEditDialogOpen(true);
  }, []);

  // 2. Fix the handleUpdateItem function to ensure proper data types
  const handleUpdateItem = useCallback(async (): Promise<void> => {
    if (!currentItem) {
      showAlert('error', 'No item selected for editing.');
      return;
    }

    // Ensure all numeric fields are properly converted to numbers
    const sanitizedFormData = {
      ...editFormData,
      quantity: Number(editFormData.quantity),
      available: Number(editFormData.available),
      price: Number(editFormData.price)
    };

    if (!validateForm(sanitizedFormData)) {
      showAlert('error', 'Please fix the form errors.');
      return;
    }

    try {
      setLoading(true);
      const updatedItem = await updateInventoryItem(currentItem.id, sanitizedFormData);

      // Transform backend data to match frontend InventoryItem type
      const transformedItem: InventoryItem = {
        id: updatedItem._id?.toString() || updatedItem.id?.toString(), // Handle both _id and id
        name: updatedItem.name,
        quantity: Number(updatedItem.quantity),
        available: Number(updatedItem.available),
        image: updatedItem.image,
        category: updatedItem.category,
        price: Number(updatedItem.price),
        adminId: updatedItem.adminId.toString(),
        createdAt: updatedItem.createdAt instanceof Date ? updatedItem.createdAt.toISOString() : updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt instanceof Date ? updatedItem.updatedAt.toISOString() : updatedItem.updatedAt,
      };

      setInventory((prev) =>
        prev.map((item) => (item.id === currentItem.id ? transformedItem : item))
      );
      setIsEditDialogOpen(false);
      showAlert('success', 'Item updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update inventory item. Please try again.';
      showAlert('error', errorMessage);
      console.error('Error updating inventory item:', err);
    } finally {
      setLoading(false);
    }
  }, [currentItem, editFormData, showAlert, validateForm]);

  // Handle deleting item
  const handleConfirmDelete = useCallback((id: string): void => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async (): Promise<void> => {
    if (itemToDelete === null) return;

    try {
      setLoading(true);
      await deleteInventoryItem(itemToDelete);
      setInventory((prev) => prev.filter((item) => item.id !== itemToDelete));
      setIsDeleteDialogOpen(false);
      showAlert('success', 'Item deleted successfully!');
    } catch (err) {
      showAlert('error', 'Failed to delete inventory item. Please try again.');
      console.error('Error deleting inventory item:', err);
    } finally {
      setLoading(false);
    }
  }, [itemToDelete, showAlert]);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (isEdit) {
          setEditFormData((prev) => ({ ...prev, image: base64 }));
          setEditItemImagePreview(base64);
        } else {
          setNewItemData((prev) => ({ ...prev, image: base64 }));
          setNewItemImagePreview(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // 3. Fix the input handlers to ensure proper number conversion
  const handleQuantityChange = useCallback((value: string, isEdit: boolean) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isEdit) {
      setEditFormData((prev) => ({ ...prev, quantity: numValue }));
    } else {
      setNewItemData((prev) => ({ ...prev, quantity: numValue }));
    }
  }, []);

  const handleAvailableChange = useCallback((value: string, isEdit: boolean) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (isEdit) {
      setEditFormData((prev) => ({ ...prev, available: numValue }));
    } else {
      setNewItemData((prev) => ({ ...prev, available: numValue }));
    }
  }, []);

  const handlePriceChange = useCallback((value: string, isEdit: boolean) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (isEdit) {
      setEditFormData((prev) => ({ ...prev, price: numValue }));
    } else {
      setNewItemData((prev) => ({ ...prev, price: numValue }));
    }
  }, []);

  // Handle export
  const handleExport = useCallback((): void => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Quantity', 'Available', 'Status'];
    const rows = inventory.map((item) => [
      item.id,
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.price.toFixed(2),
      item.quantity,
      item.available,
      item.available / item.quantity > 0.5
        ? 'In Stock'
        : item.available / item.quantity > 0.2
          ? 'Low Stock'
          : 'Critical',
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
    showAlert('success', 'Inventory exported successfully!');
  }, [inventory, showAlert]);

  // Handle pagination
  const handlePrevious = useCallback((): void => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }, [currentPage]);

  const handleNext = useCallback((): void => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  }, [currentPage, totalPages]);

  // Handle filters
  const applyFilters = useCallback((): void => {
    setIsFilterDialogOpen(false);
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback((): void => {
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterStockStatus('all');
    setIsFilterDialogOpen(false);
    setCurrentPage(1);
  }, []);

  // Handle dialog close
  const handleCloseAddDialog = useCallback((): void => {
    setNewItemData({
      name: '',
      quantity: 0,
      available: 0,
      category: 'Rims',
      price: 0,
      image: '',
    });
    setNewItemImagePreview(null);
    setFormErrors({});
    setIsAddDialogOpen(false);
  }, []);

  const handleCloseEditDialog = useCallback((): void => {
    setIsEditDialogOpen(false);
    setFormErrors({});
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto py-12">
        <Alert className="bg-yellow-50 border-yellow-500">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-600">Authentication Required</AlertTitle>
          <AlertDescription>Please sign in to access the inventory management.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-500">Manage your car modification parts inventory</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add New Item
        </Button>
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
            <div className="flex flex-wrap gap-1 mt-1">
              {categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
              {categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{categories.length - 3} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-gray-500">
              {inventory.length ? Math.round((lowStockItems / inventory.length) * 100) : 0}% of inventory items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alert && (
        <Alert
          className={`${alert.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
            }`}
        >
          <AlertCircle
            className={`h-4 w-4 ${alert.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
          />
          <AlertTitle
            className={`${alert.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
          >
            {alert.type === 'success' ? 'Success' : 'Error'}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 border-red-500">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-600">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex space-x-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Category" />
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
          <Button
            variant="outline"
            onClick={() => setIsFilterDialogOpen(true)}
            className="flex items-center"
          >
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInventory.length > 0 ? (
                paginatedInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="w-12 h-12 overflow-hidden rounded border bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.available}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.available / item.quantity > 0.5
                            ? 'default'
                            : item.available / item.quantity > 0.2
                              ? 'outline'
                              : 'destructive'
                        }
                        className={
                          item.available / item.quantity > 0.5
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : item.available / item.quantity > 0.2
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                              : 'bg-red-100 text-red-800 hover:bg-red-100'
                        }
                      >
                        {item.available / item.quantity > 0.5
                          ? 'In Stock'
                          : item.available / item.quantity > 0.2
                            ? 'Low Stock'
                            : 'Critical'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConfirmDelete(item.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                    No inventory items found. {searchQuery && 'Try adjusting your search.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredInventory.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredInventory.length)} of{' '}
            {filteredInventory.length} items
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Add New Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleCloseAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                placeholder="Enter item name"
                value={newItemData.name}
                onChange={(e) =>
                  setNewItemData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Total Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newItemData.quantity || ''}
                  onChange={(e) => handleQuantityChange(e.target.value, false)}
                />
                {formErrors.quantity && (
                  <p className="text-sm text-red-500">{formErrors.quantity}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="available">Available</Label>
                <Input
                  id="available"
                  type="number"
                  min="0"
                  max={newItemData.quantity || 0}
                  placeholder="0"
                  value={newItemData.available || ''}
                  onChange={(e) => handleAvailableChange(e.target.value, false)}
                />
                {formErrors.available && (
                  <p className="text-sm text-red-500">{formErrors.available}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newItemData.category}
                  onValueChange={(value) =>
                    setNewItemData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rims">Rims</SelectItem>
                    <SelectItem value="Paint">Paint</SelectItem>
                    <SelectItem value="HeadLight">HeadLight</SelectItem>
                    <SelectItem value="Spoilers">Spoilers</SelectItem>
                    <SelectItem value="SideMirror">Side Mirror</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-sm text-red-500">{formErrors.category}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newItemData.price || ''}
                    onChange={(e) => handlePriceChange(e.target.value, false)}
                    className="pl-7"
                  />
                </div>
                {formErrors.price && (
                  <p className="text-sm text-red-500">{formErrors.price}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Item Image</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                  {newItemImagePreview ? (
                    <img
                      src={newItemImagePreview}
                      alt="Item preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload an image of the item (optional)
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAddDialog}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                'Add Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter item name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Total Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editFormData.quantity || ''}
                  onChange={(e) => handleQuantityChange(e.target.value, true)}
                />
                {formErrors.quantity && (
                  <p className="text-sm text-red-500">{formErrors.quantity}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-available">Available</Label>
                <Input
                  id="edit-available"
                  type="number"
                  min="0"
                  max={editFormData.quantity || 0}
                  placeholder="0"
                  value={editFormData.available || ''}
                  onChange={(e) => handleAvailableChange(e.target.value, true)}
                />
                {formErrors.available && (
                  <p className="text-sm text-red-500">{formErrors.available}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editFormData.category}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rims">Rims</SelectItem>
                    <SelectItem value="Tires">Tires</SelectItem>
                    <SelectItem value="Exhaust">Exhaust</SelectItem>
                    <SelectItem value="Suspension">Suspension</SelectItem>
                    <SelectItem value="Body Kits">Body Kits</SelectItem>
                    <SelectItem value="Lighting">Lighting</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Interior">Interior</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-sm text-red-500">{formErrors.category}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    id="edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={editFormData.price || ''}
                    onChange={(e) => handlePriceChange(e.target.value, true)}
                    className="pl-7"
                  />
                </div>
                {formErrors.price && (
                  <p className="text-sm text-red-500">{formErrors.price}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-image">Item Image</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                  {editItemImagePreview ? (
                    <img
                      src={editItemImagePreview}
                      alt="Item preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a new image to replace current one (optional)
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                'Update Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this inventory item? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={filterPriceMin}
                    onChange={(e) =>
                      setFilterPriceMin(e.target.value ? parseFloat(e.target.value) : '')
                    }
                    className="pl-7"
                  />
                </div>
                <span>to</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5">$</span>
                  <Input
                    type="number"
                    min={filterPriceMin || 0}
                    placeholder="Max"
                    value={filterPriceMax}
                    onChange={(e) =>
                      setFilterPriceMax(e.target.value ? parseFloat(e.target.value) : '')
                    }
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stock Status</Label>
              <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="inStock">In Stock (&gt; 50%)</SelectItem>
                  <SelectItem value="lowStock">Low Stock (20-50%)</SelectItem>
                  <SelectItem value="critical">Critical (&lt; 20%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInventoryPage;