# Canteen Management System

A web-based application for managing canteen operations — browsing an e-menu, ordering food (including cakes), tracking real-time stock, and following an order through to completion. Built with a Node.js/Express + MongoDB backend and a plain HTML/CSS/JavaScript frontend.

## Live Demo
_(Add your deployed link here once hosted)_

## Features

- E-menu with categories (Cakes, Snacks, Beverages, Meals), search, and images
- Quantity selector capped at live stock availability
- Cart with running total, add/remove items
- Checkout with mock payment methods (Cash, UPI, Card) including a simulated payment-processing state
- Server-side stock validation and atomic inventory deduction on order
- Order history view with status tracking (Pending → Preparing → Ready → Completed)
- Add, edit, and delete menu items, including image replacement

## Tech Stack

**Frontend**
- HTML5, CSS3
- Vanilla JavaScript

**Backend**
- Node.js, Express.js
- RESTful API design

**Database**
- MongoDB (via Mongoose schemas)
- Multer for image upload handling

## Project Structure

```
canteen-management-system/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── MenuItem.js        # Menu item schema
│   │   └── Order.js           # Order + order-item schema
│   ├── routes/
│   │   ├── menu.js            # Menu CRUD routes
│   │   └── orders.js          # Order placement & status routes
│   ├── uploads/                # Uploaded menu item images (gitignored)
│   ├── server.js               # Express app entry point
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

## API Endpoints

| Method | Endpoint          | Description                              |
|--------|-------------------|-------------------------------------------|
| GET    | `/api/menu`       | List menu items (supports `category`, `search` query params) |
| POST   | `/api/menu`       | Add a new menu item (supports image upload) |
| PATCH  | `/api/menu/:id`   | Edit a menu item (details, stock, or image) |
| DELETE | `/api/menu/:id`   | Remove a menu item |
| GET    | `/api/orders`     | List all orders |
| POST   | `/api/orders`     | Place a new order (validates & deducts stock) |
| PATCH  | `/api/orders/:id` | Update order status or payment info |

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local install via Homebrew, or MongoDB Atlas cloud)

### 1. Clone the repo
```bash
git clone https://github.com/ramcharan6801/canteen-management-system.git
cd canteen-management-system
```

### 2. Backend setup
```bash
cd backend
npm install
```
Create a `.env` file:
```
PORT=5002
MONGO_URI=mongodb://localhost:27017/canteen
```
Run the server:
```bash
node server.js
```

### 3. Frontend setup
No build step needed — served as static files:
```bash
cd ../frontend
python3 -m http.server 5173
```
Visit `http://localhost:5173`

## Key Design Notes
- **Stock deduction is atomic**, using MongoDB's `$inc` operator, to avoid race conditions when multiple orders come in close together
- **Order line items snapshot** the item's name and price at order time, so historical orders stay accurate even if a menu item's price changes later
- **Payment is simulated** (Cash / UPI / Card) with a mock processing delay for UPI/Card — no real payment gateway is integrated, which keeps the project self-contained and free to run
- Uploaded images are stored on local disk via Multer; a production deployment would typically move this to cloud storage (e.g. S3, Cloudinary, or Supabase Storage)

## Future Improvements
- Real payment gateway integration (e.g. Razorpay test mode)
- User authentication for staff/admin vs. customer views
- Order notifications (email/SMS) on status change
- Analytics dashboard (popular items, daily revenue)

## Author
Ram Charan Ayyala
