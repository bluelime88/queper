# Queper — Product Requirements Document

> **Queper. Know when it's your turn.**

---

## 1. MVP Overview

Queper is a web-based digital queue notification system for businesses that need to manage customers waiting for an order, service, appointment, consultation, or transaction.

The system replaces traditional physical pagers and manual announcements with a simple web-based workflow.

The customer:

1. Scans a QR code.
2. Enters an order or queue number.
3. Waits.
4. Receives a notification when it is their turn.

- No customer app installation is required.
- No customer account is required.
- No personal information is required.

---

## 2. MVP Product Architecture

The entire solution will be web-based.

```
┌──────────────────────────┐
│ Business Staff Browser   │
│                          │
│ Queper Web Dashboard     │
└────────────┬─────────────┘
             │
             │ Internet
             ▼
┌──────────────────────────┐
│      Queper Backend      │
│                          │
│ Authentication           │
│ Queue Management         │
│ Customer Sessions        │
│ Real-Time Updates        │
│ Notifications            │
└────────────┬─────────────┘
             │
             │ Internet
             ▼
┌──────────────────────────┐
│ Customer Smartphone      │
│                          │
│ Native Camera            │
│         ↓                │
│ Queper Mobile Web App    │
└──────────────────────────┘
```

---

## 3. How Queper Works

### Business Staff

The business opens the Queper web dashboard using:

- Desktop computer
- Laptop
- Tablet
- Smartphone

The business displays a Queper QR code at the counter, reception area, or waiting area.

### Customer

The customer scans the QR code using the phone's built-in camera. The customer is redirected to the Queper web application.

They enter their:

- Order number
- Queue number
- Ticket number
- Claim number

The customer then waits.

### Business

The staff sees the customer in the active queue. When the order or service is ready, the staff clicks **Notify Customer**.

Queper sends a notification to the customer's device.

---

## 4. MVP User Flow

### Business Flow

```
1. Business opens Queper
          ↓
2. Staff logs in
          ↓
3. Staff displays QR Code
          ↓
4. Customer scans QR Code
          ↓
5. Customer enters queue/order number
          ↓
6. Customer appears in Queper dashboard
          ↓
7. Staff processes order/service
          ↓
8. Staff clicks "Notify Customer"
          ↓
9. Customer receives notification
          ↓
10. Customer proceeds
          ↓
11. Staff marks session completed
```

### Customer Flow

```
1. Scan QR Code
          ↓
2. Enter Queue / Order Number
          ↓
3. Join Queue
          ↓
4. Allow Notifications
          ↓
5. Wait
          ↓
6. Receive Notification
          ↓
7. Proceed to Counter / Room / Service Area
```

---

## 5. Queper Web Application

The MVP should consist of two primary web experiences.

### A. Business Dashboard

Used by:

- Staff
- Managers
- Business administrators

### B. Customer Web App

Used by customers through their mobile browser. No installation required.

---

## 6. Business Dashboard

### 6.1 Login

The business staff accesses the Queper web application.

Example:

```
┌────────────────────────────┐
│          QUEPER             │
│                             │
│      Know when it's         │
│         your turn.          │
│                             │
│ Email / Username            │
│ [                        ]  │
│                             │
│ Password                    │
│ [                        ]  │
│                             │
│         [ LOGIN ]           │
└────────────────────────────┘
```

---

## 7. Business Dashboard

After login, the staff sees the active queue.

```
┌────────────────────────────────────┐
│ QUEPER                              │
│ ABC Restaurant                      │
│                                     │
│ [DISPLAY QR CODE] [CREATE QUEUE]    │
│                                     │
│ ACTIVE QUEUE                        │
│                                     │
│ #101  WAITING      [NOTIFY]         │
│ #102  WAITING      [NOTIFY]         │
│ #103  READY        [COMPLETED]      │
│ #104  WAITING      [NOTIFY]         │
│                                     │
└────────────────────────────────────┘
```

---

## 8. QR Code Display

The business should have a dedicated QR Code screen.

```
┌──────────────────────────┐
│          QUEPER          │
│                          │
│       [ QR CODE ]        │
│                          │
│ Scan to join the queue   │
│                          │
│ No app required          │
│                          │
└──────────────────────────┘
```

This screen can be:

- Displayed on a monitor
- Printed
- Displayed on a tablet
- Displayed on a staff phone
- Printed on a receipt
- Placed at a counter

---

## 9. Creating a Queue Entry

The staff can create a queue entry.

```
Create Queue Entry

Queue / Order Number

[ 102 ]

[ CREATE ]
```

Example:

```
Queue #102
Status: CREATED
```

The customer can then associate themselves with the queue number.

---

## 10. Customer Web App

The customer scans the QR code. The customer is taken to:

```
queper.app/join
```

The system identifies the business through the QR code.

Example:

```
┌──────────────────────────┐
│          QUEPER          │
│                          │
│       ABC Restaurant     │
│                          │
│ Enter your order number  │
│                          │
│       [ 102 ]            │
│                          │
│     [ JOIN QUEUE ]       │
│                          │
│ No account required.     │
│ No personal information  │
│ required.                │
└──────────────────────────┘
```

---

## 11. Customer Waiting Screen

After joining:

```
┌──────────────────────────┐
│          QUEPER          │
│                          │
│       Order #102         │
│                          │
│       YOU'RE ALL SET     │
│                          │
│ We'll notify you when    │
│ your order is ready.     │
│                          │
│ You can now put your     │
│ phone away.              │
└──────────────────────────┘
```

The customer can close the screen and wait for the notification.

---

## 12. Customer Notification

When staff clicks **Notify Customer**, the customer receives:

> Your order #102 is ready. Please proceed to the pickup counter.

For other businesses:

- **Clinic** — Queue #102 is ready. Please proceed to Room 3.
- **Pharmacy** — Claim #102 is ready for pickup.
- **Service Center** — Queue #102 is now being served. Please proceed to Counter 4.

---

## 13. Generic Queue Model

Queper should not be designed exclusively around food orders. The MVP should use a generic queue concept.

A queue entry can represent:

- Order number
- Queue number
- Ticket number
- Claim number
- Service number

Example:

```
Queue Entry
-----------
102
```

The business can determine what the number means.

---

## 14. Queue Lifecycle

```
CREATED
   ↓
WAITING
   ↓
READY / CALLED
   ↓
COMPLETED
```

Optional states:

- CANCELLED
- EXPIRED

---

## 15. MVP Features

### Business Features

**Authentication**

- Business login
- Staff login
- Secure sessions
- Logout

**Business Profile**

- Business name
- Business type
- Location
- Queue label

Examples:

- Order Number
- Queue Number
- Ticket Number
- Claim Number

**QR Code**

- Generate business QR code
- Display QR code
- Download QR code
- Print QR code

**Queue Management**

Staff can:

- Create queue entry
- View active queue
- Search queue number
- View queue status
- Notify customer
- Complete queue entry
- Cancel queue entry

**Real-Time Updates**

When a customer joins the queue:

```
Customer
    ↓
Scans QR Code
    ↓
Enters #102
    ↓
Backend
    ↓
Business Dashboard
```

The staff dashboard updates automatically. No manual refresh should be required.

---

## 16. Customer Features

Customers can:

- Scan QR code
- Enter queue number
- Join a queue
- View current status
- Receive notification
- View ready instructions

Customers cannot:

- View other customers
- Access business information beyond what is necessary
- Access other queue sessions

---

## 17. Privacy Design

Privacy should be one of Queper's primary differentiators.

The customer should not need to provide:

- Name
- Phone number
- Email
- Account
- Password
- Social media login

The customer is represented by an anonymous temporary session.

```
Customer
   ↓
Anonymous Session
   ↓
Queue #102
   ↓
Notification Subscription
```

---

## 18. Notification Strategy

The MVP should use browser-based push notifications.

The customer:

1. Joins the queue.
2. Grants notification permission.
3. Receives a notification when ready.

The system should also display the customer's current status on the web page. This provides a fallback if the customer reopens the page.

---

## 19. Important Browser Consideration

Because Queper is web-based, notification behavior can vary between:

- Android Chrome
- iOS Safari
- iOS Chrome
- Samsung Internet
- Other mobile browsers

The MVP should prioritize testing on:

**Primary Target — Android Chrome**

This should be the first target platform because it provides the most straightforward web push notification experience.

**Secondary Target — iOS Safari**

iOS support should be validated separately because browser notification behavior has platform-specific requirements.

---

## 20. Recommended MVP Technology Stack

### Frontend

**Business Dashboard**

- React
- Next.js
- Responsive web design

**Customer App**

- Responsive mobile web application
- Progressive Web App architecture
- Service Worker for notifications

### Backend

Recommended options:

**Option 1: Supabase**

Provides:

- Authentication
- PostgreSQL database
- Real-time subscriptions
- APIs
- Row-level security

This is a strong choice for a fast MVP.

**Option 2: Firebase**

Provides:

- Authentication
- Firestore
- Cloud Functions
- Firebase Cloud Messaging

This is also suitable, especially if mobile push notification integration is prioritized.

---

## 21. Recommended Architecture

```
┌──────────────────────────────┐
│    Business Web Dashboard    │
│                              │
│ React / Next.js              │
└───────────────┬──────────────┘
                │
                │ HTTPS
                ▼
┌──────────────────────────────┐
│        Queper Backend        │
│                              │
│ Authentication               │
│ Queue Management             │
│ Customer Sessions            │
│ Real-Time Events             │
│ Notification Management      │
└───────────────┬──────────────┘
                │
                │ HTTPS / Web Push
                ▼
┌──────────────────────────────┐
│     Customer Mobile Web      │
│                              │
│ QR Scan                      │
│ Queue Registration           │
│ Waiting Screen               │
│ Push Notification            │
└──────────────────────────────┘
```

---

## 22. Data Model

**Business**

```
Business
--------
id
name
business_type
status
created_at
```

**Location**

```
Location
--------
id
business_id
name
address
status
created_at
```

**Staff User**

```
StaffUser
---------
id
business_id
location_id
username
password_hash
role
created_at
```

**Queue Session**

```
QueueSession
------------
id
business_id
location_id
queue_number
status
created_at
joined_at
ready_at
completed_at
expires_at
```

**Customer Session**

```
CustomerSession
---------------
id
queue_session_id
notification_subscription
created_at
expires_at
```

---

## 23. Security Requirements

**Business Authentication** — Only authorized business staff can access the business dashboard.

**Business Data Isolation** — A business must only be able to access its own queue data.

**Secure QR Tokens** — QR codes should use non-predictable tokens.

Example:

```
https://queper.app/join/8f72a9c1...
```

The QR code should not expose:

- Customer data
- Queue data
- Internal business IDs

**Encrypted Communication** — All communication must use HTTPS.

**Anonymous Customer Sessions** — Customer sessions should use randomly generated identifiers.

---

## 24. Session Expiration

Customer sessions should expire automatically.

Recommended default: **2 hours**

After expiration:

- The session can no longer receive notifications.
- The queue entry can be automatically marked as expired.
- Temporary notification data can be deleted or invalidated.

---

## 25. Edge Cases

**Wrong Queue Number**

> We couldn't find that number. Please check your order or queue number.

**Already Connected Queue**

> This number is already connected to a customer.

Staff may reset or override the session.

**Customer Joins After Ready Status**

> This queue is already ready. Please proceed to the designated counter or service area.

**Notifications Disabled**

Display instructions for enabling browser notifications. The customer can still view their status if they reopen the session.

**Customer Closes the Browser**

The notification system should continue to work where browser push notifications are supported. The customer may also reopen the Queper session using the QR code if the session is still active.

---

## 26. MVP Screens

### Business Screens

**1. Login**

```
QUEPER

Username
[              ]

Password
[              ]

[ LOGIN ]
```

**2. Dashboard**

```
QUEPER
Business Name

[ DISPLAY QR CODE ]

Active Queue

#101  WAITING       [NOTIFY]
#102  WAITING       [NOTIFY]
#103  READY         [COMPLETE]
#104  WAITING       [NOTIFY]

[ CREATE QUEUE ]
```

**3. QR Code Display**

```
QUEPER

[ QR CODE ]

Scan to join the queue

No app required
```

**4. Create Queue**

```
Create Queue Entry

Queue / Order Number

[ 102 ]

[ CREATE ]
```

**5. Queue Details**

```
Queue #102

Customer:
CONNECTED

Status:
WAITING

[ NOTIFY CUSTOMER ]

[ CANCEL ]
```

### Customer Screens

**1. Join Queue**

```
QUEPER

Business Name

Enter your order or
queue number

[ 102 ]

[ JOIN QUEUE ]

No account required.
No personal information required.
```

**2. Waiting**

```
QUEPER

Queue #102

YOU'RE ALL SET

We'll notify you when
it's your turn.

You can now put your
phone away.
```

**3. Ready**

```
QUEPER

YOUR TURN IS READY

Queue #102

Please proceed to
the designated counter.
```

---

## 27. Functional Requirements

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-001 | Staff Authentication | The system shall authenticate authorized business users. |
| FR-002 | Business Management | The system shall associate staff users with a business. |
| FR-003 | QR Code Generation | The system shall generate a QR code for a business queue. |
| FR-004 | Customer QR Scanning | Customers shall be able to scan the QR code using their native camera. |
| FR-005 | Queue Number Entry | Customers shall be able to enter a queue or order number. |
| FR-006 | Anonymous Session | The system shall create a temporary anonymous customer session. |
| FR-007 | Queue Association | The system shall associate the customer session with the relevant queue entry. |
| FR-008 | Queue Management | Staff shall be able to manage active queue entries. |
| FR-009 | Real-Time Updates | The business dashboard shall receive real-time queue updates. |
| FR-010 | Customer Notification | Staff shall be able to notify a customer when their queue entry is ready. |
| FR-011 | Status Display | The customer shall be able to view their current queue status. |
| FR-012 | Completion | Staff shall be able to mark a queue session as completed. |
| FR-013 | Expiration | The system shall automatically expire inactive sessions. |

---

## 28. Non-Functional Requirements

### Performance

The system should:

- Load the customer web page within 3 seconds.
- Update the staff dashboard within 2 seconds.
- Deliver notifications within a few seconds.
- Support multiple simultaneous customers.

### Usability

The customer flow should require:

```
Scan
   ↓
Enter Number
   ↓
Join
   ↓
Wait
   ↓
Get Notified
```

The entire process should ideally take less than 30 seconds.

### Responsiveness

The application should work on:

- Desktop
- Laptop
- Tablet
- Android smartphone
- iPhone

---

## 29. MVP Success Metrics

### Customer

- QR scan-to-queue completion rate
- Average time to join queue
- Notification permission acceptance rate
- Notification delivery rate
- Abandoned session rate

### Business

- Average time to create queue
- Average time to notify customer
- Number of completed queue sessions
- Number of failed notifications

---

## 30. MVP Acceptance Criteria

The MVP is successful when:

### Business

- Staff can log in.
- Staff can display a QR code.
- Staff can create queue entries.
- Staff can view customers who joined.
- Staff can see real-time queue updates.
- Staff can notify customers.
- Staff can complete queue sessions.

### Customer

- Customer can scan a QR code without installing an app.
- Customer can enter a queue number.
- Customer can join anonymously.
- Customer can see their waiting status.
- Customer can receive a notification.
- Customer can see the ready status.

### System

- Business data is isolated.
- Queue updates synchronize in real time.
- Sessions expire automatically.
- Communication is encrypted.
- Customer personal information is not required.

---

## 31. Future Roadmap

### Phase 1: Queper MVP

```
QR Code
   ↓
Customer Web App
   ↓
Cloud Backend
   ↓
Business Web Dashboard
   ↓
Web Push Notification
```

### Phase 2: Business Features

- Multiple locations
- Multiple queue types
- Staff roles
- Custom branding
- Queue analytics
- Custom notification messages

### Phase 3: Integrations

- POS integration
- Clinic systems
- Appointment platforms
- Restaurant ordering systems
- Public APIs

### Phase 4: Offline Mode

Future offline capabilities may include:

- Local queue management
- Local Wi-Fi mode
- Staff hotspot mode
- Local QR codes
- Local browser communication
- Synchronization when internet returns

---

## Final MVP Definition

Queper is a web-based, QR-powered digital queue notification platform.

- A business displays a QR code.
- The customer scans it with their phone.
- The customer enters their order or queue number.
- The business manages the queue through a web dashboard.
- When the customer's order, service, or turn is ready, Queper sends a notification.

**No app download. No customer account. No personal information.**

**Queper. Know when it's your turn.**
