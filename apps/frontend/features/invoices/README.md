# Dispatch Orders Module

This module provides a complete frontend interface for managing dispatch orders, following a feature-based architecture pattern.

## Structure

```
features/dispatch-orders/
├── components/
│   ├── DispatchOrdersContent.tsx      # Main listing page component
│   ├── DispatchOrdersTable.tsx        # Table component for dispatch orders list
│   ├── DispatchOrderDetails.tsx       # Detail view component
│   ├── DispatchOrderActions.tsx       # Header actions (Create Dispatch Order, etc.)
│   ├── DispatchOrderFilter.tsx        # Search and filter components
│   └── DispatchOrderEmitModal.tsx     # Emit confirmation modal
├── forms/
│   ├── DispatchOrderForm.tsx          # Main form component
│   ├── DispatchOrderFormProvider.tsx  # Form context provider
│   ├── form-fields/
│   │   ├── DispatchOrderHeaderFields.tsx  # Header fields component
│   │   ├── DispatchOrderItemsSection.tsx  # Items section wrapper
│   │   ├── DispatchOrderItemsTable.tsx    # Items table component
│   │   └── DispatchOrderTotals.tsx        # Totals calculation component
│   └── hooks/
│       ├── useDispatchOrderForm.ts        # Form state management hook
│       ├── useDispatchOrderFormLogic.ts   # Form logic orchestration hook
│       └── useDispatchOrderActions.ts     # Form side-effects (mutations, navigation)
├── schemas/
│   └── dispatch-order-form-schema.ts  # Zod validation schema (using server field names)
├── hooks/
│   ├── useDispatchOrders.ts          # Data fetching hooks (list, get, create, update, delete, emit)
│   └── useDispatchOrderModal.ts      # Action hooks for modals and state management
├── services/
│   └── dispatch-order-api.ts         # API service (moved from lib/api/invoices.ts)
├── index.ts                          # Centralized exports
└── README.md                         # This file
```

## Features

### ✅ Implemented

- **Dispatch Order Listing**: Paginated table with two tabs:
  - **Unissued**: Shows DRAFT dispatch orders (editable)
  - **Issued**: Shows EMITTED dispatch orders (read-only)
- **Dispatch Order Details**: Comprehensive view of dispatch order information including:
  - Dispatch order information (number, dates, status)
  - Client information
  - Vendor information (if assigned)
  - Delivery information
  - Payment information and conditions
  - Items table with full details
  - Totals summary
- **Dispatch Order Creation**: Full form for creating new dispatch orders with:
  - Header fields (client, vendor, payment type, dates, delivery info)
  - Items table with product search
  - Real-time totals calculation
  - Payment conditions (for credit dispatch orders)
- **Dispatch Order Editing**: Edit DRAFT dispatch orders only
- **Dispatch Order Emission**: Emit DRAFT dispatch orders to change status to EMITTED
- **Dispatch Order Deletion**: Delete DRAFT dispatch orders only
- **Search & Filters**: Search by dispatch order number
- **Pagination**: Full pagination support
- **Responsive Design**: Mobile-friendly layout
- **Loading States**: Skeleton loading for better UX
- **Error Handling**: Comprehensive error boundary and error states

## API Integration

The module uses the `dispatch-order-api.ts` service with the following endpoints:

- `GET /api/inventario/invoices` - List dispatch orders with filters
- `GET /api/inventario/invoices/:secuencia` - Get dispatch order by sequence
- `GET /api/inventario/invoices/siguiente-numero` - Get next dispatch order number
- `POST /api/inventario/invoices` - Create DRAFT dispatch order
- `PUT /api/inventario/invoices/:id` - Update DRAFT dispatch order
- `PATCH /api/inventario/invoices/:id/emit` - Emit dispatch order (DRAFT → EMITTED)
- `DELETE /api/inventario/invoices/:id` - Delete DRAFT dispatch order

## Usage

### Pages

- `/dispatch-orders` - Main dispatch order listing page (two tabs: Unissued/Issued)
- `/dispatch-orders/create` - Create new dispatch order form page
- `/dispatch-orders/edit/[secuencia]` - Edit dispatch order form page
- `/dispatch-orders/emit/[secuencia]` - Emit dispatch order form page
- `/dispatch-orders/[secuencia]` - Dispatch order details page

### Components

```tsx
import {
  DispatchOrdersContent,
  DispatchOrderDetails,
  DispatchOrderForm,
} from "@/features/dispatch-orders";

// In page component
<DispatchOrdersContent />
<DispatchOrderDetails dispatchOrderSequence="123" />
```

### Hooks

```tsx
import {
  useDispatchOrders,
  useDispatchOrder,
  useCreateDispatchOrder,
  useUpdateDispatchOrder,
  useEmitDispatchOrder,
  useDeleteDispatchOrder,
  useDispatchOrderModal,
} from "@/features/dispatch-orders";

// List dispatch orders with pagination and filters
const { data, isLoading } = useDispatchOrders({
  page: 1,
  estado: "DRAFT",
  search: "term",
});

// Get specific dispatch order
const { data: dispatchOrder } = useDispatchOrder(123);

// Actions for modals and CRUD operations
const dispatchOrderModal = useDispatchOrderModal();
```

## Field Naming Convention

**Important**: This module uses server field names (`FG*`, `FU*`) directly in forms and throughout the codebase for consistency and simplicity. This eliminates the need for field name transformations between API and form data.

### Server Field Names Used:

- `FGClienteId` - Customer ID
- `FGVendedorId` - Vendor ID
- `FGPago` - Payment type (CONTADO, CANJE, CREDITO)
- `FGTelefono1/2` - Phone numbers
- `FGCorreo1/2` - Email addresses
- `FGDireccionEntrega` - Delivery address
- `FGCiudadId` - Delivery city ID
- `FGFechaCreado` - Creation date
- `FGCondicion1/2/3` - Payment conditions
- `FUInvcaruniId` - Product ID (in items)
- `FUCantidad` - Quantity (in items)
- `FUVrUnitario` - Unit price (in items)
- `FUDescuento` - Discount percentage (in items)
- `FUImpuesto` - Has VAT flag (in items, boolean converted to number for API)

## Dispatch Order States

- **DRAFT (Unissued)**: Dispatch order is created but not yet emitted
  - Can be edited
  - Can be deleted
  - Stock is validated but not deducted
  - Shows in "Unissued" tab

- **EMITTED (Issued)**: Dispatch order is finalized
  - Cannot be edited
  - Cannot be deleted
  - Stock is deducted
  - Shows in "Issued" tab

## Design Pattern

This module follows a feature-based architecture:

- **Feature-based structure**: All related code is organized in a single feature directory
- **Consistent naming**: PascalCase for files, kebab-case for directories
- **Server field names**: Forms use server field names directly (`FG*`, `FU*`)
- **Type safety**: Full TypeScript support with proper types
- **Hook organization**: Separate data and action hooks
- **Component structure**: Content → Table → Details flow
- **Shared components**: Uses EntityDetails and EntityDeleteModal
- **Error handling**: ErrorBoundary integration
- **Loading states**: Skeleton components for better UX
- **Form structure**: Hook-based orchestration replacing the legacy provider pattern

## Dependencies

- React Query for data fetching and caching
- Next.js App Router for routing
- Shadcn/UI components for consistent design
- Sonner for toast notifications
- Lucide React for icons
- React Hook Form for form management
- Zod for validation

## Migration Notes

This module was migrated from `components/dispatch-orders/` to `features/dispatch-orders/` with the following changes:

1. **Renamed types**: All `Invoice`/`Invoice` types renamed to `DispatchOrder`
2. **Renamed hooks**: All hooks renamed from `useInvoice*` to `useDispatchOrder*`
3. **Renamed components**: All components renamed from `Invoice*` to `DispatchOrder*`
4. **Server field names**: Forms now use server field names (`FG*`, `FU*`) directly
5. **Service location**: API service moved from `lib/api/invoices.ts` to `features/dispatch-orders/services/dispatch-order-api.ts`
6. **Centralized exports**: All exports available through `features/dispatch-orders/index.ts`

## Future Enhancements

- Print/PDF generation
- Advanced filters (date range, client, vendor)
- Export/Import functionality
- Batch operations
- Dispatch order templates
- Product autocomplete improvements
- Stock availability real-time feedback
- Payment recording integration
