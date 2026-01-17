import { Component, signal, computed, inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Abstract class
abstract class BaseEntity {
  id!: string;
  createdAt!: Date;
  updatedAt?: Date;
}

// Interfaces
interface Supplier extends BaseEntity {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  category: string;
  status: 'active' | 'inactive';
  contactPerson?: string;
}

interface Product extends BaseEntity {
  name: string;
  sku: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  stockLevel: number;
  minStockLevel: number;
  maxStockLevel?: number;
  supplierId: string;
  category: string;
  unit: string;
  barcode?: string;
  status: 'active' | 'discontinued';
}

interface Order extends BaseEntity {
  type: 'IN' | 'OUT';
  productId: string;
  quantity: number;
  totalValue: number;
  status: 'pending' | 'completed' | 'cancelled';
  orderNumber: string;
  notes?: string;
  processedBy: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  details: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Service
class InventoryService {
  private suppliers = signal<Supplier[]>([
    {
      id: '1',
      createdAt: new Date(),
      name: 'TechCorp Electronics',
      email: 'orders@techcorp.com',
      phone: '+1-555-0123',
      address: '123 Tech Street, Silicon Valley, CA',
      category: 'Electronics',
      status: 'active',
      contactPerson: 'John Smith'
    },
    {
      id: '2',
      createdAt: new Date(),
      name: 'Global Supplies Ltd',
      email: 'sales@globalsupplies.com',
      phone: '+1-555-0456',
      address: '456 Commerce Ave, New York, NY',
      category: 'Office Supplies',
      status: 'active',
      contactPerson: 'Sarah Johnson'
    }
  ]);

  private products = signal<Product[]>([
    {
      id: '1',
      createdAt: new Date(),
      name: 'Wireless Bluetooth Headphones',
      sku: 'WBH-001',
      description: 'High-quality wireless headphones with noise cancellation',
      costPrice: 45.00,
      sellingPrice: 89.99,
      stockLevel: 150,
      minStockLevel: 20,
      maxStockLevel: 300,
      supplierId: '1',
      category: 'Electronics',
      unit: 'pieces',
      barcode: '123456789012',
      status: 'active'
    },
    {
      id: '2',
      createdAt: new Date(),
      name: 'Office Chair - Ergonomic',
      sku: 'CHR-002',
      description: 'Adjustable ergonomic office chair with lumbar support',
      costPrice: 120.00,
      sellingPrice: 249.99,
      stockLevel: 45,
      minStockLevel: 10,
      maxStockLevel: 100,
      supplierId: '2',
      category: 'Furniture',
      unit: 'pieces',
      barcode: '123456789013',
      status: 'active'
    },
    {
      id: '3',
      createdAt: new Date(),
      name: 'A4 Paper - 500 sheets',
      sku: 'PAP-003',
      description: 'Premium quality A4 copy paper, 80gsm',
      costPrice: 8.50,
      sellingPrice: 15.99,
      stockLevel: 8,
      minStockLevel: 20,
      maxStockLevel: 200,
      supplierId: '2',
      category: 'Office Supplies',
      unit: 'packs',
      barcode: '123456789014',
      status: 'active'
    }
  ]);

  private orders = signal<Order[]>([
    {
      id: '1',
      createdAt: new Date(),
      type: 'OUT',
      productId: '1',
      quantity: 5,
      totalValue: 449.95,
      status: 'completed',
      orderNumber: 'ORD-2026-001',
      notes: 'Customer order #12345',
      processedBy: 'admin'
    }
  ]);

  private activityLogs = signal<ActivityLog[]>([
    {
      id: '1',
      userId: 'admin',
      action: 'created',
      entityType: 'product',
      entityId: '1',
      timestamp: new Date(),
      details: 'Created new product: Wireless Bluetooth Headphones'
    }
  ]);

  private notifications = signal<Notification[]>([]);

  // Current user
  private currentUser = signal<User>({
    id: 'admin',
    name: 'Admin User',
    email: 'admin@company.com',
    role: 'admin'
  });

  // Search and filter states
  private productSearchTerm = signal('');
  private supplierSearchTerm = signal('');
  private orderSearchTerm = signal('');

  // Pagination
  private currentPage = signal(1);
  private itemsPerPage = signal(10);

  addSupplier(supplier: Supplier) {
    const newSupplier = { ...supplier, id: Date.now().toString(), createdAt: new Date() };
    this.suppliers.update(s => [...s, newSupplier]);
    this.addActivityLog('created', 'supplier', newSupplier.id, `Created supplier: ${newSupplier.name}`);
    this.addNotification('success', 'Supplier Added', `Supplier ${newSupplier.name} has been added successfully.`);
  }

  updateSupplier(id: string, updates: Partial<Supplier>) {
    this.suppliers.update(s => s.map(sup => sup.id === id ? { ...sup, ...updates, updatedAt: new Date() } : sup));
    this.addActivityLog('updated', 'supplier', id, 'Updated supplier information');
    this.addNotification('success', 'Supplier Updated', 'Supplier information has been updated successfully.');
  }

  deleteSupplier(id: string) {
    const supplier = this.suppliers().find(s => s.id === id);
    this.suppliers.update(s => s.filter(sup => sup.id !== id));
    if (supplier) {
      this.addActivityLog('deleted', 'supplier', id, `Deleted supplier: ${supplier.name}`);
      this.addNotification('warning', 'Supplier Deleted', `Supplier ${supplier.name} has been deleted.`);
    }
  }

  addProduct(product: Product) {
    const newProduct = { ...product, id: Date.now().toString(), createdAt: new Date() };
    this.products.update(p => [...p, newProduct]);
    this.addActivityLog('created', 'product', newProduct.id, `Created product: ${newProduct.name}`);
    this.addNotification('success', 'Product Added', `Product ${newProduct.name} has been added successfully.`);
  }

  updateProduct(id: string, updates: Partial<Product>) {
    this.products.update(p => p.map(prod => prod.id === id ? { ...prod, ...updates, updatedAt: new Date() } : prod));
    this.addActivityLog('updated', 'product', id, 'Updated product information');
    this.addNotification('success', 'Product Updated', 'Product information has been updated successfully.');
  }

  deleteProduct(id: string) {
    const product = this.products().find(p => p.id === id);
    this.products.update(p => p.filter(prod => prod.id !== id));
    if (product) {
      this.addActivityLog('deleted', 'product', id, `Deleted product: ${product.name}`);
      this.addNotification('warning', 'Product Deleted', `Product ${product.name} has been deleted.`);
    }
  }

  addOrder(order: Order) {
    const product = this.products().find(p => p.id === order.productId);
    if (order.type === 'OUT') {
      if (product && product.stockLevel >= order.quantity) {
        this.products.update(p => p.map(pr => pr.id === order.productId ? { ...pr, stockLevel: pr.stockLevel - order.quantity } : pr));
        const newOrder = { ...order, id: Date.now().toString(), createdAt: new Date(), orderNumber: `ORD-${new Date().getFullYear()}-${String(this.orders().length + 1).padStart(3, '0')}` };
        this.orders.update(o => [...o, newOrder]);
        this.addActivityLog('created', 'order', newOrder.id, `Processed ${order.type} order for ${order.quantity} units`);
        this.addNotification('success', 'Order Processed', `Order ${newOrder.orderNumber} has been processed successfully.`);
      } else {
        throw new Error('Insufficient stock');
      }
    } else if (order.type === 'IN') {
      if (product) {
        this.products.update(p => p.map(pr => pr.id === order.productId ? { ...pr, stockLevel: pr.stockLevel + order.quantity } : pr));
        const newOrder = { ...order, id: Date.now().toString(), createdAt: new Date(), orderNumber: `ORD-${new Date().getFullYear()}-${String(this.orders().length + 1).padStart(3, '0')}` };
        this.orders.update(o => [...o, newOrder]);
        this.addActivityLog('created', 'order', newOrder.id, `Processed ${order.type} order for ${order.quantity} units`);
        this.addNotification('success', 'Order Processed', `Order ${newOrder.orderNumber} has been processed successfully.`);
      }
    }
  }

  // Getters with filtering and pagination
  getSuppliers(searchTerm?: string, page?: number, limit?: number) {
    let filtered = this.suppliers();
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    const start = ((page || 1) - 1) * (limit || this.itemsPerPage());
    const end = start + (limit || this.itemsPerPage());
    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page: page || 1,
      totalPages: Math.ceil(filtered.length / (limit || this.itemsPerPage()))
    };
  }

  getProducts(searchTerm?: string, page?: number, limit?: number) {
    let filtered = this.products();
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    const start = ((page || 1) - 1) * (limit || this.itemsPerPage());
    const end = start + (limit || this.itemsPerPage());
    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page: page || 1,
      totalPages: Math.ceil(filtered.length / (limit || this.itemsPerPage()))
    };
  }

  getOrders(searchTerm?: string, page?: number, limit?: number) {
    let filtered = this.orders();
    if (searchTerm) {
      filtered = filtered.filter(o => o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    const start = ((page || 1) - 1) * (limit || this.itemsPerPage());
    const end = start + (limit || this.itemsPerPage());
    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page: page || 1,
      totalPages: Math.ceil(filtered.length / (limit || this.itemsPerPage()))
    };
  }

  getActivityLogs() { return this.activityLogs; }
  getNotifications() { return this.notifications; }
  getCurrentUser() { return this.currentUser; }

  // Bulk operations
  bulkDeleteProducts(ids: string[]) {
    ids.forEach(id => this.deleteProduct(id));
    this.addNotification('warning', 'Bulk Delete', `${ids.length} products have been deleted.`);
  }

  bulkUpdateProductStatus(ids: string[], status: 'active' | 'discontinued') {
    this.products.update(p => p.map(prod => ids.includes(prod.id) ? { ...prod, status, updatedAt: new Date() } : prod));
    this.addNotification('success', 'Bulk Update', `${ids.length} products status updated to ${status}.`);
  }

  // Helper methods
  private addActivityLog(action: string, entityType: string, entityId: string, details: string) {
    const log: ActivityLog = {
      id: Date.now().toString(),
      userId: this.currentUser().id,
      action,
      entityType,
      entityId,
      timestamp: new Date(),
      details
    };
    this.activityLogs.update(logs => [log, ...logs.slice(0, 99)]); // Keep last 100 logs
  }

  private addNotification(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    };
    this.notifications.update(n => [notification, ...n.slice(0, 49)]); // Keep last 50 notifications
  }

  markNotificationAsRead(id: string) {
    this.notifications.update(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif));
  }

  // Chart data methods
  getSalesTrendData() {
    // Generate last 12 months of sales data
    const months = [];
    const sales = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date.toLocaleDateString('en-US', { month: 'short' }));

      // Calculate sales for this month from orders
      const monthOrders = this.orders().filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
      });

      const monthSales = monthOrders.reduce((sum, order) => sum + order.totalValue, 0);
      sales.push(Math.round(monthSales));
    }

    return { months, sales };
  }

  getInventoryDistributionData() {
    // Group products by category and calculate total value
    const categoryData: { [key: string]: number } = {};

    this.products().forEach(product => {
      const value = product.stockLevel * product.costPrice;
      if (categoryData[product.category]) {
        categoryData[product.category] += value;
      } else {
        categoryData[product.category] = value;
      }
    });

    const categories = Object.keys(categoryData);
    const values = Object.values(categoryData);

    // Calculate percentages
    const total = values.reduce((sum, val) => sum + val, 0);
    const percentages = values.map(val => Math.round((val / total) * 100));

    return { categories, values, percentages };
  }

  // Computed signals
  totalRevenue = computed(() => {
    return this.orders().filter(o => o.type === 'OUT' && o.status === 'completed').reduce((sum, o) => sum + o.totalValue, 0);
  });

  totalProducts = computed(() => this.products().length);

  lowStockAlerts = computed(() => this.products().filter(p => p.stockLevel <= p.minStockLevel));

  totalInventoryValue = computed(() => {
    return this.products().reduce((sum, p) => sum + (p.costPrice * p.stockLevel), 0);
  });

  recentOrders = computed(() => this.orders().slice(0, 5));

  unreadNotifications = computed(() => this.notifications().filter(n => !n.read));
}

// Navigation Component
const navigationTemplate = `
<div class="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-slate-200 z-30">
  <div class="flex flex-col h-full">
    <!-- Logo -->
    <div class="flex items-center justify-center h-20 bg-white border-b border-slate-200">
      <div class="text-center">
        <div class="flex items-center justify-center mb-2">
          <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-lg">SF</span>
          </div>
        </div>
        <h2 class="text-lg font-semibold text-slate-800">StockFlow</h2>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 px-4 py-6 space-y-1">
      <a href="#" (click)="setActiveView('dashboard'); $event.preventDefault()"
         [class.active]="activeView() === 'dashboard'"
         class="nav-item group flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200">
        <span class="mr-3 text-lg">📊</span>
        <span class="font-medium">Dashboard</span>
      </a>

      <a href="#" (click)="setActiveView('products'); $event.preventDefault()"
         [class.active]="activeView() === 'products'"
         class="nav-item group flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200">
        <span class="mr-3 text-lg">📦</span>
        <span class="font-medium">Products</span>
      </a>

      <a href="#" (click)="setActiveView('suppliers'); $event.preventDefault()"
         [class.active]="activeView() === 'suppliers'"
         class="nav-item group flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200">
        <span class="mr-3 text-lg">🏢</span>
        <span class="font-medium">Suppliers</span>
      </a>

      <a href="#" (click)="setActiveView('orders'); $event.preventDefault()"
         [class.active]="activeView() === 'orders'"
         class="nav-item group flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200">
        <span class="mr-3 text-lg">📋</span>
        <span class="font-medium">Orders</span>
      </a>

      <a href="#" (click)="setActiveView('reports'); $event.preventDefault()"
         [class.active]="activeView() === 'reports'"
         class="nav-item group flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200">
        <span class="mr-3 text-lg">📈</span>
        <span class="font-medium">Reports</span>
      </a>

      <a href="#" (click)="setActiveView('settings'); $event.preventDefault()"
         [class.active]="activeView() === 'settings'"
         class="nav-item group flex items-center px-4 py-3 text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors duration-200">
        <span class="mr-3 text-lg">⚙️</span>
        <span class="font-medium">Settings</span>
      </a>
    </nav>

    <!-- User Info -->
    <div class="p-4 border-t border-slate-200">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
          {{ currentUser().name.charAt(0) }}
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-medium text-slate-800">{{ currentUser().name }}</p>
          <p class="text-xs text-slate-500 capitalize">{{ currentUser().role }}</p>
        </div>
      </div>
    </div>
  </div>
</div>
`;

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule],
  template: navigationTemplate,
  outputs: ['activeViewChange']
})
class NavigationComponent {
  service = inject(InventoryService);
  activeView = signal('dashboard');
  currentUser = this.service.getCurrentUser();
  activeViewChange = new EventEmitter<string>();

  setActiveView(view: string) {
    this.activeView.set(view);
    this.activeViewChange.emit(view);
  }
}

export { NavigationComponent };

// Header Component
const headerTemplate = `
<div class="fixed top-0 left-64 right-0 h-16 bg-white border-b border-slate-200 z-20">
  <div class="flex items-center justify-between h-full px-8">
    <!-- Logo/Brand -->
    <div class="flex items-center space-x-4">
      <div class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">SF</span>
        </div>
        <div>
          <h1 class="text-lg font-semibold text-slate-800">StockFlow</h1>
        </div>
      </div>
      <div class="h-6 w-px bg-slate-300"></div>
      <!-- Breadcrumbs -->
      <div class="flex items-center text-sm">
        <span class="text-slate-600">Dashboard</span>
        <span class="mx-2 text-slate-400">></span>
        <span class="font-medium text-indigo-600 capitalize">{{ activeView }}</span>
      </div>
    </div>

    <!-- Header Actions -->
    <div class="flex items-center space-x-6">
      <!-- Search -->
      <div class="relative">
        <input type="text" placeholder="Search..."
               class="w-72 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
               (input)="onSearch($event)">
        <span class="absolute left-3 top-2.5 text-slate-400">🔍</span>
      </div>

      <!-- Notifications -->
      <div class="relative">
        <button (click)="toggleNotifications()" class="p-2 text-slate-600 hover:text-slate-900 relative">
          <span class="text-xl">🔔</span>
          <span *ngIf="unreadCount() > 0"
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {{ unreadCount() }}
          </span>
        </button>
        <div *ngIf="showNotifications()" class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 max-h-96 overflow-y-auto z-50">
          <div class="p-4 border-b border-slate-200">
            <h3 class="font-semibold text-slate-800">Notifications</h3>
          </div>
          <div *ngIf="notifications().length === 0" class="p-4 text-center text-slate-500">
            No notifications
          </div>
          <div *ngFor="let notification of notifications().slice(0, 5)" class="p-4 border-b border-slate-100 hover:bg-slate-50">
            <div class="flex items-start">
              <span class="text-lg mr-3" [class]="getNotificationIcon(notification.type)"></span>
              <div class="flex-1">
                <p class="font-medium text-slate-800">{{ notification.title }}</p>
                <p class="text-sm text-slate-600">{{ notification.message }}</p>
                <p class="text-xs text-slate-400 mt-1">{{ notification.timestamp | date:'short' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="relative">
        <button (click)="toggleQuickActions()" class="p-2 text-slate-600 hover:text-slate-900">
          <span class="text-xl">⚡</span>
        </button>
        <div *ngIf="showQuickActions()" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
          <button class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" (click)="quickAction.emit('add-product')">
            ➕ Add Product
          </button>
          <button class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" (click)="quickAction.emit('add-supplier')">
            ➕ Add Supplier
          </button>
          <button class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" (click)="quickAction.emit('export')">
            📤 Export Data
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
`;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: headerTemplate,
  outputs: ['search', 'quickAction'],
  inputs: ['activeView']
})
class HeaderComponent {
  @Input() activeView!: string;
  service = inject(InventoryService);
  showNotifications = signal(false);
  showQuickActions = signal(false);
  notifications = this.service.getNotifications();
  unreadCount = computed(() => this.service.unreadNotifications().length);
  search = new EventEmitter<string>();
  quickAction = new EventEmitter<string>();

  onSearch(event: any) {
    this.search.emit(event.target.value);
  }

  toggleNotifications() {
    this.showNotifications.update(show => !show);
    this.showQuickActions.set(false);
  }

  toggleQuickActions() {
    this.showQuickActions.update(show => !show);
    this.showNotifications.set(false);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  }
}

export { HeaderComponent };

// Sales Trend Chart Component
const salesTrendChartTemplate = `
<div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-xl font-bold text-slate-800 flex items-center">
      <span class="text-2xl mr-3">📈</span> Sales Trend
    </h3>
    <div class="flex items-center space-x-2">
      <div class="w-3 h-3 bg-indigo-500 rounded-full"></div>
      <span class="text-sm text-slate-600">Last 12 Months</span>
    </div>
  </div>
  <div class="relative h-64">
    <svg viewBox="0 0 400 200" class="w-full h-full">
      <!-- Grid lines -->
      <defs>
        <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <!-- Y-axis labels -->
      <text x="10" y="15" class="text-xs fill-gray-500" text-anchor="start">\${{ maxSales() }}</text>
      <text x="10" y="105" class="text-xs fill-gray-500" text-anchor="start">\${{ midSales() }}</text>
      <text x="10" y="195" class="text-xs fill-gray-500" text-anchor="start">$0</text>

      <!-- Chart line -->
      <polyline
        fill="none"
        stroke="#3b82f6"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        [attr.points]="chartPoints()">
      </polyline>

      <!-- Data points -->
      <circle *ngFor="let point of dataPoints(); let i = index"
        [attr.cx]="point.x"
        [attr.cy]="point.y"
        r="4"
        fill="#3b82f6"
        stroke="#ffffff"
        stroke-width="2"
        class="hover:r-6 transition-all cursor-pointer">
      </circle>
      <text *ngFor="let point of dataPoints(); let i = index"
        [attr.x]="point.x"
        [attr.y]="point.y - 10"
        class="text-xs fill-gray-600"
        text-anchor="middle"
        opacity="0"
        class="hover:opacity-100 transition-opacity">
        \${{ point.value }}
      </text>

      <!-- X-axis labels -->
      <text *ngFor="let month of months(); let i = index"
        [attr.x]="50 + i * 30"
        y="220"
        class="text-xs fill-gray-500"
        text-anchor="middle">
        {{ month }}
      </text>
    </svg>
  </div>
  <div class="mt-4 flex justify-between text-sm text-gray-600">
    <span>Total Sales: <strong class="text-blue-600">\${{ totalSales() }}</strong></span>
    <span>Growth: <strong class="text-green-600">{{ growth() }}%</strong></span>
  </div>
</div>
`;

@Component({
  selector: 'app-sales-trend-chart',
  standalone: true,
  imports: [CommonModule],
  template: salesTrendChartTemplate
})
class SalesTrendChartComponent {
  service = inject(InventoryService);

  salesData = computed(() => this.service.getSalesTrendData());
  months = computed(() => this.salesData().months);
  sales = computed(() => this.salesData().sales);

  maxSales = computed(() => Math.max(...this.sales(), 1000));
  totalSales = computed(() => this.sales().reduce((sum, val) => sum + val, 0));

  midSales = computed(() => Math.round(this.maxSales() / 2));

  growth = computed(() => {
    const sales = this.sales();
    if (sales.length < 2) return 0;
    const first = sales[0];
    const last = sales[sales.length - 1];
    return Math.round(((last - first) / first) * 100);
  });

  chartPoints = computed(() => {
    const sales = this.sales();
    const max = this.maxSales();
    return sales.map((value, index) => {
      const x = 50 + index * 30;
      const y = 200 - (value / max) * 180;
      return `${x},${y}`;
    }).join(' ');
  });

  dataPoints = computed(() => {
    const sales = this.sales();
    const max = this.maxSales();
    return sales.map((value, index) => ({
      x: 50 + index * 30,
      y: 200 - (value / max) * 180,
      value: value
    }));
  });
}

export { SalesTrendChartComponent };

// Inventory Distribution Chart Component
const inventoryDistributionChartTemplate = `
<div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
  <div class="flex items-center justify-between mb-6">
    <h3 class="text-xl font-bold text-slate-800 flex items-center">
      <span class="text-2xl mr-3">🥧</span> Inventory Distribution
    </h3>
    <div class="text-sm text-slate-600">
      By Category Value
    </div>
  </div>
  <div class="relative h-64 flex items-center justify-center">
    <svg viewBox="0 0 300 300" class="w-48 h-48">
      <!-- Pie chart segments -->
      <path *ngFor="let segment of segments(); let i = index"
        [attr.d]="segment.path"
        [attr.fill]="segment.color"
        stroke="#ffffff"
        stroke-width="2"
        class="hover:opacity-80 transition-opacity cursor-pointer">
      </path>
      <!-- Segment labels -->
      <text *ngFor="let segment of segments(); let i = index"
        [attr.x]="segment.labelX"
        [attr.y]="segment.labelY"
        class="text-xs font-medium fill-white"
        text-anchor="middle"
        dominant-baseline="middle">
        {{ segment.percentage }}%
      </text>

      <!-- Center circle for donut effect -->
      <circle cx="150" cy="150" r="60" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/>
      <text x="150" y="145" class="text-sm font-bold fill-gray-800" text-anchor="middle">Total</text>
      <text x="150" y="160" class="text-xs fill-gray-600" text-anchor="middle">\${{ totalValue() }}</text>
    </svg>
  </div>
  <div class="mt-6 space-y-2">
    <div *ngFor="let item of legendItems()" class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded-full" [style.background-color]="item.color"></div>
        <span class="text-sm text-gray-700">{{ item.category }}</span>
      </div>
      <div class="text-right">
        <span class="text-sm font-medium text-gray-900">\${{ item.value }}</span>
        <span class="text-xs text-gray-500 ml-1">({{ item.percentage }}%)</span>
      </div>
    </div>
  </div>
</div>
`;

@Component({
  selector: 'app-inventory-distribution-chart',
  standalone: true,
  imports: [CommonModule],
  template: inventoryDistributionChartTemplate
})
class InventoryDistributionChartComponent {
  service = inject(InventoryService);

  distributionData = computed(() => this.service.getInventoryDistributionData());
  categories = computed(() => this.distributionData().categories);
  values = computed(() => this.distributionData().values);
  percentages = computed(() => this.distributionData().percentages);

  totalValue = computed(() => this.values().reduce((sum, val) => sum + val, 0));

  colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  segments = computed(() => {
    const values = this.values();
    const percentages = this.percentages();
    const total = values.reduce((sum, val) => sum + val, 0);

    let currentAngle = -90; // Start from top
    return values.map((value, index) => {
      const percentage = percentages[index];
      const angle = (value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Convert to radians
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      // Calculate path
      const x1 = 150 + 100 * Math.cos(startRad);
      const y1 = 150 + 100 * Math.sin(startRad);
      const x2 = 150 + 100 * Math.cos(endRad);
      const y2 = 150 + 100 * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const path = `M 150 150 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      // Label position
      const labelAngle = startAngle + angle / 2;
      const labelRad = (labelAngle * Math.PI) / 180;
      const labelX = 150 + 70 * Math.cos(labelRad);
      const labelY = 150 + 70 * Math.sin(labelRad);

      currentAngle = endAngle;

      return {
        path,
        color: this.colors[index % this.colors.length],
        percentage,
        labelX,
        labelY
      };
    });
  });

  legendItems = computed(() => {
    const categories = this.categories();
    const values = this.values();
    const percentages = this.percentages();

    return categories.map((category, index) => ({
      category,
      value: values[index],
      percentage: percentages[index],
      color: this.colors[index % this.colors.length]
    }));
  });
}

export { InventoryDistributionChartComponent };

// Components
// Components
const dashboardTemplate = `
<div class="p-8 bg-slate-50 rounded-xl border border-slate-200 mb-8">
  <h2 class="text-4xl font-bold mb-8 text-slate-800 flex items-center">
    <span class="text-3xl mr-4">📊</span> Dashboard Overview
  </h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-600 text-sm font-medium mb-2">Total Revenue</p>
          <p class="text-4xl font-bold text-slate-800">\${{ totalRevenue() }}</p>
          <p class="text-slate-500 text-sm mt-2">Monthly earnings</p>
        </div>
        <div class="text-6xl text-slate-300">💰</div>
      </div>
    </div>
    <div class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-600 text-sm font-medium mb-2">Total Products</p>
          <p class="text-4xl font-bold text-slate-800">{{ totalProducts() }}</p>
          <p class="text-slate-500 text-sm mt-2">In inventory</p>
        </div>
        <div class="text-6xl text-slate-300">📦</div>
      </div>
    </div>
    <div class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-slate-600 text-sm font-medium mb-2">Low Stock Alerts</p>
          <p class="text-4xl font-bold text-slate-800">{{ lowStockAlerts().length }}</p>
          <p class="text-slate-500 text-sm mt-2">Need attention</p>
        </div>
        <div class="text-6xl text-slate-300">⚠️</div>
      </div>
    </div>
  </div>
</div>
`;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: dashboardTemplate
})
class DashboardComponent {
  service = inject(InventoryService);
  totalRevenue = this.service.totalRevenue;
  totalProducts = this.service.totalProducts;
  lowStockAlerts = this.service.lowStockAlerts;
}

export { DashboardComponent };

const productDetailTemplate = `
<div class="p-6 bg-white rounded-xl mt-6 border border-slate-200 shadow-sm">
  <h3 class="text-2xl font-bold text-slate-800 mb-4 flex items-center">
    <span class="text-xl mr-2">📋</span> {{ product.name }}
  </h3>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <p class="text-sm text-gray-600 mb-1">SKU</p>
      <p class="font-semibold text-gray-800">{{ product.sku }}</p>
    </div>
    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <p class="text-sm text-gray-600 mb-1">Cost Price</p>
      <p class="font-semibold text-red-600">\${{ product.costPrice }}</p>
    </div>
    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <p class="text-sm text-gray-600 mb-1">Selling Price</p>
      <p class="font-semibold text-green-600">\${{ product.sellingPrice }}</p>
    </div>
    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <p class="text-sm text-gray-600 mb-1">Margin</p>
      <p class="font-semibold text-blue-600">{{ ((product.sellingPrice - product.costPrice) / product.costPrice * 100).toFixed(2) }}%</p>
    </div>
    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <p class="text-sm text-gray-600 mb-1">Stock Level</p>
      <p class="font-semibold text-gray-800">{{ product.stockLevel }}</p>
    </div>
    <div class="bg-white p-4 rounded-lg shadow-sm border">
      <p class="text-sm text-gray-600 mb-1">Min Stock Level</p>
      <p class="font-semibold text-orange-600">{{ product.minStockLevel }}</p>
    </div>
  </div>
</div>
`;

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: productDetailTemplate
})
class ProductDetailComponent {
  @Input() product!: Product;
}

export { ProductDetailComponent };

const productListTemplate = `
<div class="p-8 bg-white rounded-xl shadow-sm mb-8 border border-slate-200">
  <h2 class="text-3xl font-bold mb-8 text-slate-800 flex items-center">
    <span class="text-2xl mr-3">📦</span> Products
  </h2>
  <div class="overflow-x-auto">
    <table class="w-full table-auto border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
      <thead class="bg-slate-100 text-slate-700">
        <tr>
          <th class="px-6 py-4 text-left font-semibold">Name</th>
          <th class="px-6 py-4 text-left font-semibold">SKU</th>
          <th class="px-6 py-4 text-left font-semibold">Stock</th>
          <th class="px-6 py-4 text-left font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let product of products(); let i = index" 
            class="hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100"
            [class.bg-red-50]="product.stockLevel <= product.minStockLevel">
          <td class="px-6 py-4 font-medium text-slate-800">{{ product.name }}</td>
          <td class="px-6 py-4 text-slate-600">{{ product.sku }}</td>
          <td class="px-6 py-4">
            <span class="px-3 py-1 rounded-full text-sm font-medium"
                  [class.bg-emerald-100]="product.stockLevel > product.minStockLevel * 1.5"
                  [class.bg-amber-100]="product.stockLevel <= product.minStockLevel * 1.5 && product.stockLevel > product.minStockLevel"
                  [class.bg-red-100]="product.stockLevel <= product.minStockLevel">
              {{ product.stockLevel }}
            </span>
          </td>
          <td class="px-6 py-4">
            <button (click)="toggleDetails(product)" 
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200">
              <span class="mr-2">👁️</span> Details
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <app-product-detail *ngIf="selectedProduct" [product]="selectedProduct"></app-product-detail>
</div>
`;

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductDetailComponent],
  template: productListTemplate
})
class ProductListComponent {
  service = inject(InventoryService);
  products = computed(() => this.service.getProducts().data);
  selectedProduct: Product | null = null;

  toggleDetails(product: Product) {
    this.selectedProduct = this.selectedProduct?.id === product.id ? null : product;
  }
}

export { ProductListComponent };

const supplierListTemplate = `
<div class="p-8 bg-white rounded-xl shadow-sm mb-8 border border-slate-200">
  <h2 class="text-3xl font-bold mb-8 text-slate-800 flex items-center">
    <span class="text-2xl mr-3">🏢</span> Suppliers
  </h2>
  <form [formGroup]="supplierForm" (ngSubmit)="addSupplier()" 
        class="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Name</label>
        <input formControlName="name" placeholder="Supplier Name" 
               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Email</label>
        <input formControlName="email" placeholder="supplier@example.com" type="email"
               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Category</label>
        <input formControlName="category" placeholder="Category"
               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm">
      </div>
    </div>
    <button type="submit" [disabled]="!supplierForm.valid" 
            class="w-full md:w-auto bg-teal-600 text-white px-8 py-3 rounded-lg hover:bg-teal-700 disabled:bg-slate-400 transition-colors duration-200 font-medium">
      <span class="mr-2">➕</span> Add Supplier
    </button>
  </form>
  <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 bg-slate-100 text-slate-700">
      <h3 class="font-semibold">Supplier List</h3>
    </div>
    <ul class="divide-y divide-slate-200">
      <li *ngFor="let supplier of suppliers()" class="px-6 py-4 hover:bg-slate-50 transition-colors duration-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold text-slate-800">{{ supplier.name }}</p>
            <p class="text-sm text-slate-600">{{ supplier.email }}</p>
          </div>
          <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
            {{ supplier.category }}
          </span>
        </div>
      </li>
    </ul>
    <div *ngIf="suppliers().length === 0" class="px-6 py-8 text-center text-slate-500">
      <span class="text-4xl mb-2 block">🏢</span>
      No suppliers added yet
    </div>
  </div>
</div>
`;

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: supplierListTemplate
})
class SupplierListComponent implements OnInit {
  service = inject(InventoryService);
  fb = inject(FormBuilder);
  supplierForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: [''],
    category: ['', Validators.required],
    contactPerson: ['']
  });
  suppliers = computed(() => this.service.getSuppliers().data);

  ngOnInit() {}

  addSupplier() {
    if (this.supplierForm.valid) {
      const value = this.supplierForm.value;
      const supplier: Supplier = {
        id: Date.now().toString(),
        createdAt: new Date(),
        name: value.name!,
        email: value.email!,
        phone: value.phone || '',
        address: value.address || '',
        category: value.category!,
        status: 'active',
        contactPerson: value.contactPerson || ''
      };
      this.service.addSupplier(supplier);
      this.supplierForm.reset();
    }
  }
}

export { SupplierListComponent };

const orderTrackerTemplate = `
<div class="p-8 bg-white rounded-xl shadow-sm border border-slate-200">
  <h2 class="text-3xl font-bold mb-8 text-slate-800 flex items-center">
    <span class="text-2xl mr-3">📋</span> Order Tracker
  </h2>
  <form [formGroup]="orderForm" (ngSubmit)="addOrder()" 
        class="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Order Type</label>
        <select formControlName="type" 
                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm bg-white">
          <option value="IN">📥 Stock In</option>
          <option value="OUT">📤 Stock Out</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Product</label>
        <select formControlName="productId" 
                class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm bg-white">
          <option value="">Select Product</option>
          <option *ngFor="let product of products()" [value]="product.id">{{ product.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
        <input formControlName="quantity" type="number" placeholder="Quantity" min="1"
               class="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm">
      </div>
    </div>
    <button type="submit" [disabled]="!orderForm.valid" 
            class="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 transition-colors duration-200 font-medium">
      <span class="mr-2">🚀</span> Process Order
    </button>
  </form>
  <div *ngIf="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center">
    <span class="text-xl mr-3">⚠️</span>
    <span>{{ error }}</span>
  </div>
  <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 bg-slate-100 text-slate-700">
      <h3 class="font-semibold">Order History</h3>
    </div>
    <ul class="divide-y divide-slate-200">
      <li *ngFor="let order of orders()" class="px-6 py-4 hover:bg-slate-50 transition-colors duration-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <span class="text-2xl mr-4" [class]="order.type === 'IN' ? '📥' : '📤'"></span>
            <div>
              <p class="font-semibold text-slate-800">{{ order.type === 'IN' ? 'Stock In' : 'Stock Out' }} - {{ order.quantity }} units</p>
              <p class="text-sm text-slate-600">Status: <span class="font-medium text-emerald-600">{{ order.status }}</span></p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-slate-800">\${{ order.totalValue }}</p>
            <p class="text-xs text-slate-500">{{ order.createdAt | date:'short' }}</p>
          </div>
        </div>
      </li>
    </ul>
    <div *ngIf="orders().length === 0" class="px-6 py-8 text-center text-slate-500">
      <span class="text-4xl mb-2 block">📋</span>
      No orders processed yet
    </div>
  </div>
</div>
`;

@Component({
  selector: 'app-order-tracker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: orderTrackerTemplate
})
class OrderTrackerComponent implements OnInit {
  service = inject(InventoryService);
  fb = inject(FormBuilder);
  orderForm = this.fb.group({
    type: ['IN', Validators.required],
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });
  products = computed(() => this.service.getProducts().data);
  orders = computed(() => this.service.getOrders().data);
  error = '';

  ngOnInit() {}

  addOrder() {
    if (this.orderForm.valid) {
      const value = this.orderForm.value;
      const type = value.type as 'IN' | 'OUT';
      const productId = value.productId as string;
      const quantity = value.quantity as number;
      const product = this.products().find(p => p.id === productId);
      if (!product) {
        this.error = 'Product not found';
        return;
      }
      const totalValue = type === 'OUT' ? product.sellingPrice * quantity : product.costPrice * quantity;
      const order: Order = {
        id: Date.now().toString(),
        createdAt: new Date(),
        type,
        productId,
        quantity,
        totalValue,
        status: 'pending',
        orderNumber: `ORD-${Date.now()}`,
        processedBy: 'System'
      };
      try {
        this.service.addOrder(order);
        this.orderForm.reset({ type: 'IN', quantity: 1 });
        this.error = '';
      } catch (e: any) {
        this.error = e.message;
      }
    }
  }
}

export { OrderTrackerComponent };

const appTemplate = `
<div class="min-h-screen bg-slate-50">
  <!-- Navigation -->
  <app-navigation (activeViewChange)="onActiveViewChange($event)"></app-navigation>

  <!-- Header -->
  <app-header [activeView]="activeView()" (search)="onSearch($event)" (quickAction)="onQuickAction($event)"></app-header>

  <!-- Main Content -->
  <div class="ml-64 mt-16 p-8">
    <!-- Dashboard View -->
    <div *ngIf="activeView() === 'dashboard'" class="animate-fade-in">
      <app-dashboard></app-dashboard>
    </div>

    <!-- Products View -->
    <div *ngIf="activeView() === 'products'" class="animate-fade-in">
      <div class="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-slate-800 flex items-center">
            <span class="text-2xl mr-3">📦</span> Products Management
          </h2>
          <div class="flex space-x-4">
            <button (click)="openBulkActions()" class="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700">
              Bulk Actions
            </button>
            <button (click)="openAddProductModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              ➕ Add Product
            </button>
          </div>
        </div>

        <!-- Filters and Search -->
        <div class="flex flex-wrap gap-6 mb-8">
          <select class="px-4 py-2 border border-slate-300 rounded-lg">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Furniture</option>
            <option>Office Supplies</option>
          </select>
          <select class="px-4 py-2 border border-slate-300 rounded-lg">
            <option>All Status</option>
            <option>Active</option>
            <option>Discontinued</option>
          </select>
          <select class="px-4 py-2 border border-slate-300 rounded-lg">
            <option>Sort by Name</option>
            <option>Sort by Stock</option>
            <option>Sort by Price</option>
          </select>
        </div>

        <app-product-list></app-product-list>
      </div>
    </div>

    <!-- Suppliers View -->
    <div *ngIf="activeView() === 'suppliers'" class="animate-fade-in">
      <div class="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-slate-800 flex items-center">
            <span class="text-2xl mr-3">🏢</span> Suppliers Management
          </h2>
          <button (click)="openAddSupplierModal()" class="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
            ➕ Add Supplier
          </button>
        </div>
        <app-supplier-list></app-supplier-list>
      </div>
    </div>

    <!-- Orders View -->
    <div *ngIf="activeView() === 'orders'" class="animate-fade-in">
      <div class="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-slate-800 flex items-center">
            <span class="text-2xl mr-3">📋</span> Orders Management
          </h2>
          <button (click)="openNewOrderModal()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            ➕ New Order
          </button>
        </div>

        <!-- Order Filters -->
        <div class="flex flex-wrap gap-6 mb-8">
          <select class="px-4 py-2 border border-slate-300 rounded-lg">
            <option>All Types</option>
            <option>Stock In</option>
            <option>Stock Out</option>
          </select>
          <select class="px-4 py-2 border border-slate-300 rounded-lg">
            <option>All Status</option>
            <option>Pending</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
          <input type="date" class="px-4 py-2 border border-slate-300 rounded-lg" placeholder="From Date">
          <input type="date" class="px-4 py-2 border border-slate-300 rounded-lg" placeholder="To Date">
        </div>

        <app-order-tracker></app-order-tracker>
      </div>
    </div>

    <!-- Reports View -->
    <div *ngIf="activeView() === 'reports'" class="animate-fade-in">
      <div class="space-y-8">
        <div class="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
          <h2 class="text-3xl font-bold text-slate-800 flex items-center mb-8">
            <span class="text-2xl mr-3">📈</span> Reports & Analytics
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-slate-600 text-sm font-medium mb-1">Total Products</p>
                  <p class="text-3xl font-bold text-slate-800">{{ totalProducts() }}</p>
                  <p class="text-slate-500 text-xs mt-1">Active inventory</p>
                </div>
                <div class="text-5xl text-slate-300">📦</div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-slate-600 text-sm font-medium mb-1">Total Revenue</p>
                  <p class="text-3xl font-bold text-slate-800">\${{ totalRevenue() }}</p>
                  <p class="text-slate-500 text-xs mt-1">This month</p>
                </div>
                <div class="text-5xl text-slate-300">💰</div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-slate-600 text-sm font-medium mb-1">Inventory Value</p>
                  <p class="text-3xl font-bold text-slate-800">\${{ totalInventoryValue() }}</p>
                  <p class="text-slate-500 text-xs mt-1">Total worth</p>
                </div>
                <div class="text-5xl text-slate-300">🏭</div>
              </div>
            </div>

            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-slate-600 text-sm font-medium mb-1">Low Stock Items</p>
                  <p class="text-3xl font-bold text-slate-800">{{ lowStockAlerts().length }}</p>
                  <p class="text-slate-500 text-xs mt-1">Need attention</p>
                </div>
                <div class="text-5xl text-slate-300">⚠️</div>
              </div>
            </div>
          </div>

          <!-- Charts -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <app-sales-trend-chart></app-sales-trend-chart>
            <app-inventory-distribution-chart></app-inventory-distribution-chart>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
          <h3 class="text-xl font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div class="space-y-4">
            <div *ngFor="let log of activityLogs().slice(0, 10)" class="flex items-center p-4 bg-slate-50 rounded-lg">
              <span class="text-2xl mr-4">📝</span>
              <div class="flex-1">
                <p class="font-medium text-slate-800">{{ log.details }}</p>
                <p class="text-sm text-slate-600">{{ log.timestamp | date:'short' }}</p>
              </div>
              <span class="text-xs text-slate-500 capitalize">{{ log.action }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings View -->
    <div *ngIf="activeView() === 'settings'" class="animate-fade-in">
      <div class="max-w-4xl mx-auto space-y-6">
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-3xl font-bold text-gray-800 flex items-center mb-6">
            <span class="text-2xl mr-3">⚙️</span> System Settings
          </h2>

          <div class="space-y-6">
            <div class="border-b border-gray-200 pb-6">
              <h3 class="text-lg font-semibold mb-4">General Settings</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input type="text" value="Your Company Ltd" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                  <select class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="border-b border-gray-200 pb-6">
              <h3 class="text-lg font-semibold mb-4">Inventory Settings</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold (%)</label>
                  <input type="number" value="20" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Auto-reorder</label>
                  <select class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option>Enabled</option>
                    <option>Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Backdrop -->
  <div *ngIf="showModal()" class="modal-backdrop" (click)="closeModal()"></div>

  <!-- Add Product Modal -->
  <div *ngIf="showModal() && modalType() === 'add-product'" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-xl font-bold text-gray-900">Add New Product</h3>
      </div>
      <div class="p-6">
        <form [formGroup]="productForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input formControlName="name" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter product name">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input formControlName="sku" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter SKU">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select formControlName="category" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Unit</label>
              <select formControlName="unit" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="pieces">pieces</option>
                <option value="packs">packs</option>
                <option value="boxes">boxes</option>
                <option value="kg">kg</option>
                <option value="liters">liters</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
              <input formControlName="costPrice" type="number" step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Selling Price</label>
              <input formControlName="sellingPrice" type="number" step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0.00">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Stock Level</label>
              <input formControlName="stockLevel" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Min Stock Level</label>
              <input formControlName="minStockLevel" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Max Stock Level</label>
              <input formControlName="maxStockLevel" type="number" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
              <input formControlName="barcode" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Optional barcode">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
            <select formControlName="supplierId" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Select Supplier</option>
              <option *ngFor="let supplier of service.getSuppliers().data" [value]="supplier.id">{{ supplier.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea formControlName="description" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Product description"></textarea>
          </div>
        </form>
      </div>
      <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
        <button (click)="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
        <button (click)="addProduct()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add Product
        </button>
      </div>
    </div>
  </div>
</div>
`;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DashboardComponent, ProductListComponent, SupplierListComponent, OrderTrackerComponent, NavigationComponent, HeaderComponent, SalesTrendChartComponent, InventoryDistributionChartComponent],
  providers: [InventoryService],
  template: appTemplate,
  styles: []
})
export class App {
  service = inject(InventoryService);
  fb = inject(FormBuilder);
  activeView = signal('dashboard');
  showModal = signal(false);
  modalType = signal('');

  productForm = this.fb.group({
    name: ['', Validators.required],
    sku: ['', Validators.required],
    description: [''],
    costPrice: [0, [Validators.required, Validators.min(0)]],
    sellingPrice: [0, [Validators.required, Validators.min(0)]],
    stockLevel: [0, [Validators.required, Validators.min(0)]],
    minStockLevel: [0, [Validators.required, Validators.min(0)]],
    maxStockLevel: [0],
    supplierId: ['', Validators.required],
    category: ['', Validators.required],
    unit: ['pieces', Validators.required],
    barcode: ['']
  });

  // Computed signals
  totalProducts = this.service.totalProducts;
  totalRevenue = this.service.totalRevenue;
  totalInventoryValue = this.service.totalInventoryValue;
  lowStockAlerts = this.service.lowStockAlerts;
  activityLogs = this.service.getActivityLogs();

  onActiveViewChange(view: string) {
    this.activeView.set(view);
  }

  onSearch(searchTerm: string) {
    // Implement search logic based on active view
    console.log('Search:', searchTerm, 'in view:', this.activeView());
  }

  onQuickAction(action: string) {
    switch (action) {
      case 'add-product':
        this.openAddProductModal();
        break;
      case 'add-supplier':
        this.openAddSupplierModal();
        break;
      case 'export':
        this.exportData();
        break;
    }
  }

  openAddProductModal() {
    this.modalType.set('add-product');
    this.showModal.set(true);
  }

  openAddSupplierModal() {
    this.modalType.set('add-supplier');
    this.showModal.set(true);
  }

  openNewOrderModal() {
    this.modalType.set('new-order');
    this.showModal.set(true);
  }

  openBulkActions() {
    this.modalType.set('bulk-actions');
    this.showModal.set(true);
  }

  addProduct() {
    if (this.productForm.valid) {
      const value = this.productForm.value;
      const product: Product = {
        id: Date.now().toString(),
        createdAt: new Date(),
        name: value.name!,
        sku: value.sku!,
        description: value.description || '',
        costPrice: value.costPrice!,
        sellingPrice: value.sellingPrice!,
        stockLevel: value.stockLevel!,
        minStockLevel: value.minStockLevel!,
        maxStockLevel: value.maxStockLevel || undefined,
        supplierId: value.supplierId!,
        category: value.category!,
        unit: value.unit!,
        barcode: value.barcode || undefined,
        status: 'active'
      };
      this.service.addProduct(product);
      this.productForm.reset();
      this.closeModal();
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.modalType.set('');
  }

  exportData() {
    // Implement export functionality
    console.log('Exporting data...');
  }
}
