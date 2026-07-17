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
