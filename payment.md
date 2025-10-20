# Order API Testing Guide

## Prerequisites
- Server running on `http://localhost:5000`
- Valid JWT token (replace `YOUR_JWT_TOKEN` with actual token)
- MongoDB running

---

## 1. Create Order (From Cart)

**Endpoint:** `POST /api/orders/create`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "purchaseType": "cart",
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "addressLine1": "123 Main Street",
    "addressLine2": "Apartment 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India",
    "landmark": "Near City Mall"
  },
  "billingAddress": {
    "fullName": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "addressLine1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "notes": "Please handle with care",
  "isGift": false,
  "giftMessage": "",
  "giftWrap": false,
  "couponCode": ""
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "orderId": "ORD-1234567890-ABC123",
    "_id": "507f1f77bcf86cd799439011",
    "total": 5000
  }
}
```

---

## 2. Create Order (Direct Purchase)

**Endpoint:** `POST /api/orders/create`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "purchaseType": "direct",
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "colorId": "507f1f77bcf86cd799439012",
      "quantity": 1,
      "isPersonalized": true,
      "personalizedName": "Sarah"
    }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "addressLine1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "notes": "",
  "isGift": true,
  "giftMessage": "Happy Birthday!",
  "giftWrap": true,
  "couponCode": "FESTIVE10"
}
```

---

## 3. Create Razorpay Order

**Endpoint:** `POST /api/orders/create-razorpay-order`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "orderId": "ORD-1234567890-ABC123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "razorpayOrderId": "order_MN1234567890AB",
  "amount": 5000,
  "currency": "INR",
  "keyId": "rzp_test_1234567890"
}
```

---

## 4. Verify Payment

**Endpoint:** `POST /api/orders/verify-payment`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "razorpay_order_id": "order_MN1234567890AB",
  "razorpay_payment_id": "pay_MN1234567890AB",
  "razorpay_signature": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "orderId": "ORD-1234567890-ABC123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "order": {
    "orderId": "ORD-1234567890-ABC123",
    "status": "confirmed",
    "deliveryOTP": "123456"
  }
}
```

---

## 5. Get User Orders

**Endpoint:** `GET /api/orders/my-orders`

**Query Parameters:**
- `status` (optional): pending, confirmed, shipped, delivered, cancelled
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:** `GET /api/orders/my-orders?status=confirmed&page=1&limit=10`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Expected Response:**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orderId": "ORD-1234567890-ABC123",
      "status": "confirmed",
      "items": [...],
      "pricing": {
        "total": 5000
      },
      "createdAt": "2025-10-19T10:30:00.000Z"
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "totalOrders": 50
}
```

---

## 6. Get Single Order

**Endpoint:** `GET /api/orders/:orderId`

**Example:** `GET /api/orders/ORD-1234567890-ABC123`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Expected Response:**
```json
{
  "success": true,
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "orderId": "ORD-1234567890-ABC123",
    "userId": "507f1f77bcf86cd799439010",
    "purchaseType": "cart",
    "items": [
      {
        "productId": {...},
        "colorId": "507f1f77bcf86cd799439012",
        "name": "Gold Ring",
        "quantity": 1,
        "priceAtPurchase": 5000,
        "isPersonalized": true,
        "personalizedName": "Sarah"
      }
    ],
    "pricing": {
      "subtotal": 5000,
      "discount": { "amount": 0 },
      "shipping": 0,
      "total": 5000
    },
    "shippingAddress": {...},
    "status": "confirmed",
    "payment": {
      "status": "completed",
      "verified": true
    },
    "createdAt": "2025-10-19T10:30:00.000Z"
  }
}
```

---

## 7. Cancel Order

**Endpoint:** `PUT /api/orders/:orderId/cancel`

**Example:** `PUT /api/orders/ORD-1234567890-ABC123/cancel`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "order": {
    "orderId": "ORD-1234567890-ABC123",
    "status": "cancelled",
    "cancellation": {
      "reason": "Changed my mind",
      "cancelledBy": "customer",
      "cancelledAt": "2025-10-19T11:00:00.000Z",
      "refundStatus": "pending"
    }
  }
}
```

---

## 8. Verify Delivery OTP

**Endpoint:** `POST /api/orders/verify-delivery-otp`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "orderId": "ORD-1234567890-ABC123",
  "otp": "123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order delivered successfully"
}
```

---

## 9. Razorpay Webhook (For Testing)

**Endpoint:** `POST /api/orders/webhook`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-razorpay-signature": "webhook_signature_here"
}
```

**Body (Payment Captured):**
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_MN1234567890AB",
        "order_id": "order_MN1234567890AB",
        "amount": 500000,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Cart is empty"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Order not found"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Failed to create order",
  "error": "Error details here"
}
```

---

## Testing Flow (Complete Order Journey)

1. **Create Order** → Get `orderId`
2. **Create Razorpay Order** → Get `razorpayOrderId`
3. **Make Payment** (Use Razorpay test cards)
4. **Verify Payment** → Get `deliveryOTP`
5. **Check Order Status** → Should be "confirmed"
6. **Verify Delivery OTP** → Mark as delivered

---

## Razorpay Test Cards

**Success:**
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failure:**
- Card: `4000 0000 0000 0002`

---

## Notes

- Replace all placeholder IDs with actual MongoDB ObjectIds
- Ensure JWT token is valid and not expired
- Test webhook locally using ngrok or similar tunneling service
- Check console logs for OTP and email outputs
- Delivery OTP is stored in `order.notes.internal`