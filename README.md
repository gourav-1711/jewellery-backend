# Jewellery Walla API

This is the backend API for the Jewellery Walla e-commerce platform, built with Node.js, Express, and MongoDB.

## Project Structure

```
src/
├── models/               # Database models
│   ├── user.js          # User model
│   ├── product.js       # Product model
│   ├── category.js      # Category model
│   ├── subCategory.js   # Sub-category model
│   ├── subSubCategory.js # Sub-sub-category model
│   ├── wishlist.js      # Wishlist model
│   ├── cart.js          # Shopping cart model
│   ├── order.js         # Order model
│   ├── review.js        # Product reviews
│   ├── testimonial.js   # Customer testimonials
│   ├── whyChooseUs.js   # "Why Choose Us" content
│   ├── faq.js           # Frequently asked questions
│   ├── banner.js        # Homepage banners
│   ├── logo.js          # Website logo
│   ├── material.js      # Product materials
│   └── color.js         # Product colors
├── routes/
│   ├── web/             # Public API routes
│   └── admin/           # Admin API routes
└── views/emails/        # Email templates
```

## Models and Their Fields

### 1. User Model

- `name`: String (required, 3-20 chars)
- `gender`: String (enum: ["male", "female", "other"], default: "male")
- `address`: String (optional)
- `role`: String (enum: ["user", "admin"], default: "user")
- `avatar`: String (URL to avatar image)
- `email`: String (required, must be valid email format)
- `isEmailVerified`: Boolean (default: false)
- `password`: String (required, min 6 chars)
- `mobile`: Number (optional)
- `status`: Boolean (default: true)
- `order`: Number (default: 0, min: 0, max: 1000)
- `deletedAt`: Date (default: null)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 2. Product Model

- `name`: String (required, unique, 3-20 chars)
- `slug`: String (required, URL-friendly name)
- `image`: String (required, main product image URL)
- `images`: [String] (array of additional image URLs)
- `colors`: [ObjectId] (references Color model)
- `material`: [ObjectId] (references Material model)
- `category`: [ObjectId] (references Category model)
- `subCategory`: [ObjectId] (references SubCategory model)
- `subSubCategory`: [ObjectId] (references SubSubCategory model)
- `description`: String (required)
- `short_description`: String (required)
- `dimensions`: String (required)
- `code`: String (required, product code)
- `price`: Number (required)
- `discount_price`: Number (required)
- `stock`: Number (required)
- `estimated_delivery_time`: String (required)
- `isFeatured`: Boolean (default: false)
- `status`: Boolean (default: true)
- `deletedAt`: Date (default: null)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 3. Cart Model

- `user`: ObjectId (references User model, required, unique)
- `items`: [{
  - `product`: ObjectId (references Product model, required)
  - `quantity`: Number (required, min: 1, default: 1)
  - `color`: ObjectId (references Color model, required)
    }]
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 4. Wishlist Model

- `user`: ObjectId (references User model, required, unique)
- `products`: [ObjectId] (references Product model)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 5. Category Model

- `name`: String (required, unique)
- `image`: String (required, category image URL)
- `status`: Boolean (default: true)
- `deletedAt`: Date (default: null)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### SubCategory Model

- `name`: String (required, unique)
- `category`: ObjectId (references Category model)
- `status`: Boolean (default: true)
- `deletedAt`: Date (default: null)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### SubSubCategory Model

- `name`: String (required, unique)
- `subCategory`: ObjectId (references SubCategory model)
- `status`: Boolean (default: true)
- `deletedAt`: Date (default: null)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 6. Review Model

- `user`: ObjectId (references User model, required)
- `product`: ObjectId (references Product model, required)
- `rating`: Number (required, min: 1, max: 5)
- `comment`: String (required)
- `status`: String (enum: ["pending", "approved", "rejected"], default: "pending")
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 7. Testimonial Model

- `name`: String (required)
- `designation`: String (optional)
- `message`: String (required)
- `image`: String (URL to testimonial image)
- `rating`: Number (min: 1, max: 5)
- `status`: Boolean (default: true)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 8. WhyChooseUs Model

- `title`: String (required)
- `description`: String (required)
- `icon`: String (icon class or URL)
- `status`: Boolean (default: true)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 9. FAQ Model

- `question`: String (required)
- `answer`: String (required)
- `category`: String (e.g., "general", "shipping", "returns")
- `status`: Boolean (default: true)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 10. Banner Model

- `title`: String (required)
- `subtitle`: String (optional)
- `image`: String (required, banner image URL)
- `link`: String (URL to redirect to)
- `status`: Boolean (default: true)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 11. Logo Model

- `image`: String (required, logo image URL)
- `type`: String (e.g., "main", "footer", "favicon")
- `status`: Boolean (default: true)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 12. Material Model

- `name`: String (required, unique, e.g., "Gold", "Silver", "Platinum")
- `description`: String (optional)
- `status`: Boolean (default: true)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### 13. Color Model

- `name`: String (required, unique, e.g., "Rose Gold", "White Gold")
- `code`: String (required, hex color code e.g., "#FFD700")
- `status`: Boolean (default: true)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

## API Endpoints (Protected Routes)

All admin routes require a valid JWT token in the Authorization header: Authorization: Bearer <your_jwt_token>

## ADMIN API

### Admin - Product Management
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/products` - List all products (with filters)

### Admin - Category Management
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/categories` - List all categories

### Admin - Sub Category Management
- `POST /api/admin/subcategories` - Create sub category
- `PUT /api/admin/subcategories/:id` - Update sub category
- `DELETE /api/admin/subcategories/:id` - Delete sub category
- `GET /api/admin/subcategories` - List all sub categories

### Admin - Sub Sub Category Management
- `POST /api/admin/subsubcategories` - Create sub sub category
- `PUT /api/admin/subsubcategories/:id` - Update sub sub category
- `DELETE /api/admin/subsubcategories/:id` - Delete sub sub category
- `GET /api/admin/subsubcategories` - List all sub sub categories

### Admin - User Management
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Admin - Order Management
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/:id` - Get order details
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/orders/stats` - Get order statistics

### Admin - Content Management
- `POST /api/admin/banners` - Create banner
- `PUT /api/admin/banners/:id` - Update banner
- `DELETE /api/admin/banners/:id` - Delete banner
- `POST /api/admin/testimonials` - Create testimonial
- `PUT /api/admin/testimonials/:id` - Update testimonial
- `DELETE /api/admin/testimonials/:id` - Delete testimonial
- `POST /api/admin/faqs` - Create FAQ
- `PUT /api/admin/faqs/:id` - Update FAQ
- `DELETE /api/admin/faqs/:id` - Delete FAQ

### Admin - System Settings
- `POST /api/admin/upload` - Upload file
- `PUT /api/admin/settings` - Update system settings
- `GET /api/admin/dashboard` - Get dashboard statistics

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Products

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Categories

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Users

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `GET /api/users` - Get all users (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
NODE_ENV=development
```

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the server: `npm start`

## Development

- Run in development mode: `npm run dev`
- Run tests: `npm test`

## License

MIT
