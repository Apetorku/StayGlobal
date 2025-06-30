# Frontend-Backend Integration

This document describes how the React frontend is integrated with the Node.js backend API.

## 🔐 Authentication Flow

### Clerk Integration
- **Frontend**: Uses `@clerk/clerk-react` for authentication UI and user management
- **Backend**: Uses `@clerk/express` middleware for token verification
- **User Sync**: Automatic user synchronization between Clerk and backend database

### Authentication Flow:
1. User clicks any button on landing page → Sign up/Sign in modal appears
2. After authentication → User is automatically synced with backend database
3. Protected routes require authentication → Redirect to sign-in if not authenticated
4. API calls include JWT token from Clerk for authorization

## 🔌 API Integration

### Services
- **`apartmentService.ts`**: Handles apartment CRUD operations
- **`bookingService.ts`**: Manages booking creation, cancellation, and retrieval
- **`userService.ts`**: User profile management and sync

### API Endpoints Used:
- `GET /api/apartments` - Fetch apartments with filtering
- `GET /api/apartments/:id` - Get single apartment
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/my` - Get user's bookings
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `POST /api/users/sync` - Sync user with backend

## 🎯 Key Features Implemented

### Landing Page
- **Unauthenticated**: Shows sign-up buttons for all actions
- **Authenticated**: Shows direct navigation to dashboard/features
- **Header**: Dynamic sign-in/sign-up buttons or user menu

### Protected Routes
- `/search` - Apartment search and booking (requires auth)
- `/owner` - Property management (requires auth)
- `/admin` - Admin dashboard (requires auth)

### Real-time Data
- **React Query**: Caching and synchronization with backend
- **Loading States**: Proper loading indicators for API calls
- **Error Handling**: User-friendly error messages with retry options

## 🛠️ Setup Instructions

### Environment Variables
Create `.env` file with:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
VITE_API_URL=http://localhost:5000/api
```

### Backend Requirements
- Backend server running on `http://localhost:5000`
- MongoDB database connected
- Clerk authentication configured

### Frontend Dependencies
- `@clerk/clerk-react` - Authentication
- `@tanstack/react-query` - API state management
- React Router - Navigation

## 🔄 Data Flow

### Apartment Search
1. User enters search criteria
2. Frontend calls `apartmentService.getApartments(filters)`
3. Backend queries MongoDB with filters
4. Results displayed with pagination

### Booking Creation
1. User selects apartment and dates
2. Frontend validates input and calls `bookingService.createBooking()`
3. Backend validates availability and creates booking
4. Success/error feedback to user

### User Management
1. User signs in via Clerk
2. `UserSync` component automatically syncs user data
3. Backend creates/updates user record
4. User can access protected features

## 🚀 Current Status

✅ **Completed:**
- Clerk authentication integration
- Protected route system
- API service layer
- Real apartment data fetching
- Booking management
- User synchronization
- Error handling and loading states

🔄 **Next Steps:**
- Add Clerk credentials to environment
- Connect to MongoDB database
- Test full booking flow
- Add payment integration
- Implement real-time notifications

## 🧪 Testing

### Frontend Testing
```bash
npm run dev  # Start development server
npm run build  # Test production build
```

### Backend Testing
```bash
curl http://localhost:5000/api/health  # Test backend health
curl http://localhost:5000/api/apartments  # Test apartment API
```

### Integration Testing
1. Start backend server
2. Start frontend development server
3. Open `http://localhost:5173`
4. Test sign-up flow and protected routes
