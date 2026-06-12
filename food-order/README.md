# Team Dinner Order API

A simple Express backend for tracking team dinner orders. Use Postman or `curl` to interact with the API.

## Endpoints

### GET `/api/menu`

Returns the menu with the current order count for each dish.

**Example response:**

```json
{
  "menu": [
    { "code": "PIZZA", "name": "Pepperoni Pizza", "orderCount": 1 },
    { "code": "PASTA", "name": "Spaghetti Carbonara", "orderCount": 0 },
    { "code": "SALAD", "name": "Caesar Salad", "orderCount": 0 }
  ]
}
```

### POST `/api/order`

Places a new order. Each `memberCode` can only order once.

**Request body:**

```json
{
  "memberCode": "STU01",
  "dishCode": "PIZZA"
}
```

**Success response (201):**

```json
{
  "message": "Order placed successfully",
  "memberCode": "STU01",
  "dishCode": "PIZZA"
}
```

**Error responses (400):**

- Invalid dish code
- Member has already placed an order

## Example curl commands

Get the menu and order counts:

```bash
curl http://localhost:3000/api/menu
```

Place an order:

```bash
curl -X POST http://localhost:3000/api/order \
  -H "Content-Type: application/json" \
  -d '{"memberCode": "STU01", "dishCode": "PIZZA"}'
```

## Run the server

```bash
npm start
```
