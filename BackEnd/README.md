# DeliverEase Backend

Backend API for the DeliverEase delivery management system.

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running on localhost:27017)

### Installation

1. **Navigate to backend directory:**
```bash
cd BackEnd
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment variables:**
The `.env` file is already configured with defaults. You can modify it if needed:
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/deliveryDB
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout user

### Agents Management

- `GET /api/agents` - Get all delivery agents
- `GET /api/agents/:id` - Get agent by ID
- `POST /api/agents` - Create new agent (admin only)
- `PUT /api/agents/:id` - Update agent details (admin only)
- `PUT /api/agents/:id/status` - Update agent status (admin only)
- `PUT /api/agents/:id/assignments` - Update agent assignments (admin only)
- `DELETE /api/agents/:id` - Delete agent (admin only)

### Deliveries Management

- `GET /api/deliveries` - Get all deliveries (with filters)
- `GET /api/deliveries/:id` - Get delivery by ID
- `GET /api/deliveries/agent/:agentId` - Get deliveries for an agent
- `GET /api/deliveries/stats` - Get delivery statistics
- `POST /api/deliveries` - Create new delivery (admin only)
- `PUT /api/deliveries/:id` - Update delivery details (admin only)
- `PUT /api/deliveries/:id/status` - Update delivery status
- `PUT /api/deliveries/:id/assign` - Assign delivery to agent (admin only)
- `DELETE /api/deliveries/:id` - Delete delivery (admin only)

## Test Credentials

### Admin Account
- Email: `admin@deliverease.com`
- Password: `admin123`

### Agent Account
- Email: `agent@deliverease.com`
- Password: `agent123`

## Database Models

### DeliveryAgent
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  status: 'available' | 'on-delivery' | 'off-duty',
  assignedDeliveries: Number,
  completedToday: Number,
  avatar: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Delivery
```javascript
{
  _id: ObjectId,
  orderId: String (unique),
  location: {
    address: String,
    lat: Number,
    lng: Number,
    customerName: String,
    phone: String,
    notes: String (optional)
  },
  scheduledDate: String,
  scheduledTime: String,
  status: 'pending' | 'in-transit' | 'delivered' | 'failed',
  agentId: ObjectId (ref: DeliveryAgent),
  area: String,
  priority: 'low' | 'medium' | 'high',
  packageWeight: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## API Request Examples

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@deliverease.com",
    "password": "admin123"
  }'
```

### Get All Agents
```bash
curl -X GET http://localhost:5000/api/agents \
  -H "Authorization: Bearer <token>"
```

### Create New Agent
```bash
curl -X POST http://localhost:5000/api/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 98765 43210",
    "status": "available"
  }'
```

### Create New Delivery
```bash
curl -X POST http://localhost:5000/api/deliveries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "orderId": "ORD-2024-001",
    "location": {
      "address": "123 Main St",
      "lat": 28.6315,
      "lng": 77.2167,
      "customerName": "John Doe",
      "phone": "+91 98765 43210"
    },
    "scheduledDate": "2024-01-15",
    "scheduledTime": "10:00 AM",
    "area": "Central Delhi",
    "priority": "high",
    "packageWeight": 2.5,
    "agentId": "agent-001"
  }'
```

### Update Delivery Status
```bash
curl -X PUT http://localhost:5000/api/deliveries/:id/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "status": "delivered"
  }'
```

## Architecture

```
BackEnd/
├── controllers/       # Business logic
│   ├── authController.js
│   ├── agentController.js
│   └── deliveryController.js
├── routes/           # API routes
│   ├── authRoutes.js
│   ├── agentRoutes.js
│   └── deliveryRoutes.js
├── models/          # MongoDB schemas
│   ├── DeliveryAgent.js
│   └── Delivery.js
├── middleware/      # Custom middleware
│   └── auth.js
├── utils/          # Utility functions
│   └── mockUsers.js
├── server.js       # Main server file
├── .env           # Environment variables
├── package.json   # Dependencies
└── README.md      # Documentation
```

## Notes

- JWT tokens expire after 24 hours
- All admin routes require admin role authentication
- Database uses MongoDB with Mongoose ODM
- CORS is enabled for frontend communication
- The system uses mock user authentication for demo purposes

## Future Enhancements

- [ ] Add real user registration and password hashing
- [ ] Implement route optimization algorithm on backend
- [ ] Add WebSocket for real-time updates
- [ ] Add request validation middleware
- [ ] Add comprehensive error logging
- [ ] Add unit and integration tests
- [ ] Add API documentation with Swagger
- [ ] Implement caching with Redis
- [ ] Add rate limiting
