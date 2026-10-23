# Quickstart: 5-Lesson Packages

## Overview
This feature allows students to buy a 5-lesson bundle with a 3% discount and book each class individually at their convenience from the student portal.

## Local Testing Steps

### 1. Start Servers
Backend:
```powershell
uvicorn app.main:app --reload --port 8000
```
Frontend:
```powershell
cd frontend
npm run dev
```

### 2. Purchase a Package
1. Open `http://localhost:5173/book/dc92ef71-d458-4e75-92d9-69b64fc1c964`
2. Toggle from "Clase individual" to "Paquete de 5 clases (-3%)"
3. Select Duration (e.g. 60 min) and Lesson Type (e.g. Conversación)
4. View price summary: €150.35 instead of €155.00
5. Click purchase button (redirects to Stripe Checkout or creates package in dev mode)

### 3. Redeem Credits
1. Log into student portal `http://localhost:5173/dashboard`
2. See "Mis Paquetes" card with 5 available credits
3. Click "Reservar con crédito"
4. Pick any available slot in the calendar
5. Lesson is booked instantly; credits become 4 of 5!
