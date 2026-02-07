// Mock data for the Scheduled Delivery Management System

export interface DeliveryAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'available' | 'on-delivery' | 'off-duty';
  assignedDeliveries: number;
  completedToday: number;
  avatar?: string;
}

export interface DeliveryLocation {
  id: string;
  address: string;
  lat: number;
  lng: number;
  customerName: string;
  phone: string;
  notes?: string;
}

export interface ScheduledDelivery {
  id: string;
  orderId: string;
  location: DeliveryLocation;
  scheduledDate: string;
  scheduledTime: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'failed';
  agentId?: string;
  area: string;
  priority: 'low' | 'medium' | 'high';
  packageWeight: number;
}

export interface OptimizedRoute {
  id: string;
  agentId: string;
  date: string;
  deliveries: ScheduledDelivery[];
  waypoints: { lat: number; lng: number }[];
  totalDistance: number;
  estimatedTime: number;
  optimizedDistance: number;
  optimizedTime: number;
}

// Delhi NCR coordinates for realistic demo
export const mockDeliveryAgents: DeliveryAgent[] = [
  {
    id: 'agent-001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@delivery.com',
    phone: '+91 98765 43210',
    status: 'available',
    assignedDeliveries: 8,
    completedToday: 5,
  },
  {
    id: 'agent-002',
    name: 'Priya Patel',
    email: 'priya.patel@delivery.com',
    phone: '+91 98765 43211',
    status: 'on-delivery',
    assignedDeliveries: 6,
    completedToday: 3,
  },
  {
    id: 'agent-003',
    name: 'Amit Kumar',
    email: 'amit.kumar@delivery.com',
    phone: '+91 98765 43212',
    status: 'available',
    assignedDeliveries: 7,
    completedToday: 4,
  },
  {
    id: 'agent-004',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@delivery.com',
    phone: '+91 98765 43213',
    status: 'off-duty',
    assignedDeliveries: 0,
    completedToday: 6,
  },
  {
    id: 'agent-005',
    name: 'Vikram Singh',
    email: 'vikram.singh@delivery.com',
    phone: '+91 98765 43214',
    status: 'on-delivery',
    assignedDeliveries: 9,
    completedToday: 7,
  },
];

export const mockDeliveryLocations: DeliveryLocation[] = [
  {
    id: 'loc-001',
    address: 'Connaught Place, Block A, New Delhi',
    lat: 28.6315,
    lng: 77.2167,
    customerName: 'Arun Mehta',
    phone: '+91 99887 76655',
    notes: 'Office building, 3rd floor',
  },
  {
    id: 'loc-002',
    address: 'Saket District Centre, New Delhi',
    lat: 28.5244,
    lng: 77.2066,
    customerName: 'Meera Joshi',
    phone: '+91 99887 76656',
  },
  {
    id: 'loc-003',
    address: 'Nehru Place, South Delhi',
    lat: 28.5494,
    lng: 77.2544,
    customerName: 'Rajesh Gupta',
    phone: '+91 99887 76657',
    notes: 'Electronics market, Shop 45',
  },
  {
    id: 'loc-004',
    address: 'Lajpat Nagar Market, New Delhi',
    lat: 28.5677,
    lng: 77.2433,
    customerName: 'Sunita Rao',
    phone: '+91 99887 76658',
  },
  {
    id: 'loc-005',
    address: 'Greater Kailash 1, New Delhi',
    lat: 28.5494,
    lng: 77.2344,
    customerName: 'Karan Malhotra',
    phone: '+91 99887 76659',
    notes: 'Residential apartment, B-Block',
  },
  {
    id: 'loc-006',
    address: 'India Gate, Rajpath, New Delhi',
    lat: 28.6129,
    lng: 77.2295,
    customerName: 'Pooja Verma',
    phone: '+91 99887 76660',
  },
  {
    id: 'loc-007',
    address: 'Karol Bagh, Central Delhi',
    lat: 28.6514,
    lng: 77.1907,
    customerName: 'Deepak Nair',
    phone: '+91 99887 76661',
    notes: 'Near Metro Station',
  },
  {
    id: 'loc-008',
    address: 'Dwarka Sector 21, West Delhi',
    lat: 28.5529,
    lng: 77.0583,
    customerName: 'Anita Sharma',
    phone: '+91 99887 76662',
  },
];

export const mockScheduledDeliveries: ScheduledDelivery[] = [
  {
    id: 'del-001',
    orderId: 'ORD-2024-001',
    location: mockDeliveryLocations[0],
    scheduledDate: '2024-01-15',
    scheduledTime: '10:00 AM',
    status: 'pending',
    agentId: 'agent-001',
    area: 'Central Delhi',
    priority: 'high',
    packageWeight: 2.5,
  },
  {
    id: 'del-002',
    orderId: 'ORD-2024-002',
    location: mockDeliveryLocations[1],
    scheduledDate: '2024-01-15',
    scheduledTime: '11:00 AM',
    status: 'in-transit',
    agentId: 'agent-001',
    area: 'South Delhi',
    priority: 'medium',
    packageWeight: 1.2,
  },
  {
    id: 'del-003',
    orderId: 'ORD-2024-003',
    location: mockDeliveryLocations[2],
    scheduledDate: '2024-01-15',
    scheduledTime: '12:00 PM',
    status: 'delivered',
    agentId: 'agent-002',
    area: 'South Delhi',
    priority: 'low',
    packageWeight: 3.0,
  },
  {
    id: 'del-004',
    orderId: 'ORD-2024-004',
    location: mockDeliveryLocations[3],
    scheduledDate: '2024-01-15',
    scheduledTime: '02:00 PM',
    status: 'pending',
    agentId: 'agent-001',
    area: 'South Delhi',
    priority: 'high',
    packageWeight: 0.8,
  },
  {
    id: 'del-005',
    orderId: 'ORD-2024-005',
    location: mockDeliveryLocations[4],
    scheduledDate: '2024-01-15',
    scheduledTime: '03:00 PM',
    status: 'pending',
    agentId: 'agent-003',
    area: 'South Delhi',
    priority: 'medium',
    packageWeight: 4.5,
  },
  {
    id: 'del-006',
    orderId: 'ORD-2024-006',
    location: mockDeliveryLocations[5],
    scheduledDate: '2024-01-15',
    scheduledTime: '04:00 PM',
    status: 'in-transit',
    agentId: 'agent-002',
    area: 'Central Delhi',
    priority: 'low',
    packageWeight: 1.5,
  },
  {
    id: 'del-007',
    orderId: 'ORD-2024-007',
    location: mockDeliveryLocations[6],
    scheduledDate: '2024-01-15',
    scheduledTime: '05:00 PM',
    status: 'pending',
    agentId: 'agent-003',
    area: 'Central Delhi',
    priority: 'high',
    packageWeight: 2.0,
  },
  {
    id: 'del-008',
    orderId: 'ORD-2024-008',
    location: mockDeliveryLocations[7],
    scheduledDate: '2024-01-16',
    scheduledTime: '10:00 AM',
    status: 'pending',
    area: 'West Delhi',
    priority: 'medium',
    packageWeight: 5.0,
  },
];

// Warehouse/Hub location
export const warehouseLocation = {
  lat: 28.5921,
  lng: 77.2194,
  address: 'Central Warehouse, South Extension, New Delhi',
};

// Mock route waypoints for visualization
export const mockOptimizedRoute: OptimizedRoute = {
  id: 'route-001',
  agentId: 'agent-001',
  date: '2024-01-15',
  deliveries: mockScheduledDeliveries.filter(d => d.agentId === 'agent-001'),
  waypoints: [
    warehouseLocation,
    { lat: 28.6315, lng: 77.2167 }, // Connaught Place
    { lat: 28.5677, lng: 77.2433 }, // Lajpat Nagar
    { lat: 28.5244, lng: 77.2066 }, // Saket
    warehouseLocation,
  ],
  totalDistance: 45.2,
  estimatedTime: 180,
  optimizedDistance: 32.8,
  optimizedTime: 120,
};

// Statistics for dashboard
export const dashboardStats = {
  totalAgents: mockDeliveryAgents.length,
  availableAgents: mockDeliveryAgents.filter(a => a.status === 'available').length,
  totalDeliveries: mockScheduledDeliveries.length,
  completedDeliveries: mockScheduledDeliveries.filter(d => d.status === 'delivered').length,
  pendingDeliveries: mockScheduledDeliveries.filter(d => d.status === 'pending').length,
  inTransitDeliveries: mockScheduledDeliveries.filter(d => d.status === 'in-transit').length,
  optimizedRoutes: 12,
  avgDistanceSaved: 27.4,
  avgTimeSaved: 33.3,
};

// Mock users for authentication
export const mockUsers = {
  admin: {
    email: 'admin@delivery.com',
    password: 'admin123',
    role: 'admin' as const,
    name: 'Admin User',
  },
  agent: {
    email: 'agent@delivery.com',
    password: 'agent123',
    role: 'agent' as const,
    name: 'Rahul Sharma',
    agentId: 'agent-001',
  },
};
