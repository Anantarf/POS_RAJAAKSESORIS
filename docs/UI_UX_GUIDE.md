# UI/UX Guide - Raja Aksesoris POS

## Design System Overview

Aplikasi menggunakan **Premium White + Gold theme** dengan dukungan dark mode. Semua warna, spacing, dan styling didefinisikan sebagai CSS variables untuk konsistensi dan maintenance yang mudah.

### Color Palette

**Light Mode (Default):**
- Primary: Gold (#c9a227)
- Background: Slate-100 (#f1f5f9)
- Surface: White (#ffffff)
- Text: Slate-950 (#0f172a)

**Dark Mode:**
- Semua warna otomatis disesuaikan via CSS variables dan `prefers-color-scheme: dark`

### Typography

- **Display**: Plus Jakarta Sans (headings)
- **Body**: Plus Jakarta Sans (body text)
- **Mono**: IBM Plex Mono (code, numbers)

---

## Component Usage

### 1. Form Fields & Validation

#### Input Component
```jsx
import Input from "@/components/ui/Input";
import { Check, AlertCircle } from "lucide-react";

function MyForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  return (
    <Input
      label="Email Address"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      error={error}
      helper="We'll never share your email"
      icon={AlertCircle}
      required
      placeholder="you@example.com"
    />
  );
}
```

**Props:**
- `label`: Field label
- `error`: Error message (shows red styling)
- `success`: Success message (shows green styling)
- `helper`: Helper text below field
- `icon`: Leading icon (Lucide React icon)
- `iconEnd`: Trailing icon
- `required`: Show required asterisk
- `size`: sm | md | lg

#### FormField Component
```jsx
import FormField from "@/components/FormField";

// Simplified wrapper with additional logic
<FormField
  label="Username"
  value={username}
  onChange={handleChange}
  error={errors.username}
  required
/>
```

#### Form Validation Hook
```jsx
import { useFormValidation } from "@/hooks/useFormValidation";
import { validators } from "@/utils/validation";

function LoginForm() {
  const { values, errors, handleChange, handleBlur, handleSubmit } = 
    useFormValidation(
      { username: "", password: "" },
      async (values) => {
        await login(values);
      },
      (fieldName, value) => {
        if (fieldName === "username") {
          return validators.required(value, "Username");
        }
        if (fieldName === "password") {
          return validators.minLength(6)(value, "Password");
        }
      }
    );

  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="username"
        label="Username"
        value={values.username}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.username}
      />
      {/* ... */}
    </form>
  );
}
```

**Available Validators:**
```js
import { validators } from "@/utils/validation";

// Usage: validators.required(value, "Field Name")
validators.required()        // Check if value is not empty
validators.email()           // Validate email format
validators.minLength(n)      // Min length check
validators.maxLength(n)      // Max length check
validators.phone()           // Validate phone number
validators.number()          // Check if numeric
validators.positive()        // Check if > 0
validators.match(other)      // Compare two values
```

---

### 2. Product Cards

#### ProductCard Component
```jsx
import ProductCard from "@/components/ProductCard";

function ProductGrid({ products }) {
  return (
    <div className="brand-product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          price={product.price}
          stock={product.stock}
          image={product.image_url}
          onSelect={(product) => {
            // Handle product selection
            addToCart(product);
          }}
          onQuickAction={(product) => {
            // Handle quick action button (mobile)
            openProductDetail(product);
          }}
          variant="default" // "default" | "selected" | "disabled"
          disabled={false}
        />
      ))}
    </div>
  );
}
```

**Features:**
- Responsive grid (2 columns on mobile, auto-fit on desktop)
- Stock indicator (shows count if <= 5)
- Out-of-stock overlay
- Quick action button (mobile optimized)
- Touch-friendly sizing (min 44x44px on mobile)

---

### 3. Empty States

#### EmptyState Component
```jsx
import EmptyState from "@/components/EmptyState";
import { Package } from "lucide-react";

function ProductList({ products }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Tidak ada produk"
        description="Mulai dengan menambahkan produk pertama ke inventory Anda"
        actionLabel="Tambah Produk"
        action={() => openCreateProductModal()}
        variant="default" // "default" | "success" | "warning" | "danger"
      />
    );
  }

  return <div>{/* Product list */}</div>;
}
```

**Variants:**
- `default`: Gray (general empty state)
- `success`: Green (positive action needed)
- `warning`: Amber (attention required)
- `danger`: Red (critical action needed)

---

### 4. Bottom Sheets (Mobile)

#### BottomSheet Component
```jsx
import BottomSheet from "@/components/BottomSheet";
import { useState } from "react";

function ProductDetail() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Details</button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Detail Produk"
        scrollable={true}
        actions={[
          {
            label: "Batal",
            variant: "secondary",
            onClick: () => setIsOpen(false),
          },
          {
            label: "Tambah",
            variant: "primary",
            onClick: () => addToCart(),
          },
        ]}
      >
        {/* Content here */}
      </BottomSheet>
    </>
  );
}
```

**Features:**
- Smooth slide-up animation
- Backdrop dismiss (click outside)
- Escape key to close
- Scrollable content
- Action buttons at bottom
- Mobile-optimized (90vh max height)

---

### 5. Buttons

#### Button Component
```jsx
import Button from "@/components/ui/Button";

function MyComponent() {
  return (
    <>
      {/* Variants */}
      <Button variant="primary">Primary Action</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Delete</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>

      {/* Sizes */}
      <Button size="sm">Small</Button>
      <Button size="md">Medium (default)</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>

      {/* States */}
      <Button disabled>Disabled</Button>
      <Button loading>Loading...</Button>
      <Button fullWidth>Full Width</Button>
    </>
  );
}
```

**Variants:**
- `primary`: Gold button (primary action)
- `secondary`: Soft white button (secondary action)
- `accent`: Green button (success)
- `danger`: Red button (destructive)
- `warning`: Orange button (warning)
- `outline`: Bordered button
- `ghost`: No background button

---

### 6. Notifications/Toasts

#### Using Notification System
```jsx
import { useNotification } from "@/contexts/NotificationContext";

function MyComponent() {
  const { notify } = useNotification();

  function handleAction() {
    try {
      // Do something
      notify.success("Berhasil disimpan!");
    } catch (error) {
      notify.error(error.message || "Terjadi kesalahan");
    }
  }

  return <button onClick={handleAction}>Save</button>;
}
```

**Notification Types:**
- `notify.success(message, duration?)` - Green success toast
- `notify.error(message, duration?)` - Red error toast
- `notify.warning(message, duration?)` - Yellow warning toast
- `notify.info(message, duration?)` - Blue info toast

**Parameters:**
- `message`: Message to display
- `duration`: Auto-dismiss in ms (default: 4200ms, 0 = manual dismiss)

---

## Dark Mode Implementation

### Automatic Dark Mode

Aplikasi menggunakan `prefers-color-scheme: dark` media query untuk otomatis mendeteksi preferensi sistem pengguna.

### Manual Dark Mode Toggle

```jsx
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
```

**Theme Preference Storage:**
- Stored in `localStorage` with key `app-theme-preference`
- Persists across sessions
- Falls back to system preference if not set

---

## Mobile Optimization Best Practices

### Touch Targets
- Minimum 44x44px on mobile devices
- Add extra padding for small buttons: `min-h-10 min-w-10` on mobile

### Responsive Grids
```jsx
// Automatically responsive
<div className="brand-product-grid">
  {/* 2 cols on mobile, auto-fit on desktop */}
</div>

<div className="brand-metric-strip">
  {/* Auto-fit with min 156px on desktop, full-width on mobile */}
</div>
```

### Bottom Sheets vs Modals
- Use `<BottomSheet>` for mobile forms and selections
- Use modals only for critical alerts/warnings
- Never use full-width modals on mobile

### Scrollable Areas
- Use `.brand-scroll-region` for horizontal scroll
- Use `.brand-scroll-region-y` for vertical scroll
- Include scrollbar styling with `.brand-scrollbar`

---

## Accessibility Checklist

- ✅ All form fields have labels or `aria-label`
- ✅ Error messages use `aria-invalid` and `aria-describedby`
- ✅ Buttons have clear labels or `aria-label`
- ✅ Focus indicators are visible (`:focus-visible`)
- ✅ Color contrast meets WCAG AA (4.5:1 for text)
- ✅ Notifications use `role="alert"` and `aria-live="polite"`
- ✅ Interactive elements are keyboard accessible
- ✅ Images have alt text
- ✅ Loading states are announced

---

## Common Patterns

### Login Form
```jsx
import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useFormValidation } from "@/hooks/useFormValidation";
import { validators } from "@/utils/validation";

function LoginForm() {
  const { values, errors, handleChange, handleBlur, handleSubmit, isSubmitting } =
    useFormValidation(
      { username: "", password: "" },
      async (values) => {
        await login(values);
      },
      (field, value) => {
        if (field === "username") return validators.required(value, "Username");
        if (field === "password") return validators.minLength(6)(value, "Password");
      }
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="username"
        label="Username"
        value={values.username}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.username}
        required
      />
      <Input
        name="password"
        type="password"
        label="Password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.password}
        required
      />
      <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
        Login
      </Button>
    </form>
  );
}
```

### Data Table with Empty State
```jsx
import EmptyState from "@/components/EmptyState";
import { Database } from "lucide-react";

function DataTable({ data, columns, isLoading }) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (!data.length) {
    return (
      <EmptyState
        icon={Database}
        title="Tidak ada data"
        description="Belum ada data untuk ditampilkan"
      />
    );
  }

  return (
    <table className="brand-table">
      {/* Table content */}
    </table>
  );
}
```

---

## CSS Custom Properties Reference

```css
/* Colors */
--brand-bg               /* Background color */
--brand-surface          /* Card/surface color */
--brand-border           /* Border color */
--brand-gold             /* Primary accent (gold) */
--brand-text             /* Primary text */
--brand-text-muted       /* Secondary text */
--brand-success          /* Success state */
--brand-danger           /* Danger/error state */
--brand-warning          /* Warning state */

/* Sizing */
--control-height-sm      /* 32px */
--control-height-md      /* 40px */
--control-height-lg      /* 48px */
--brand-radius           /* 10px */
--brand-radius-sm        /* 7px */

/* Shadows */
--brand-shadow-sm        /* Small shadow */
--brand-shadow-md        /* Medium shadow */
--brand-ring             /* Focus ring */
```

---

## Testing UI Components

### Form Validation Testing
```js
import { validators } from "@/utils/validation";

test("email validator", () => {
  expect(validators.email("user@example.com")).toBeNull();
  expect(validators.email("invalid")).toBeTruthy();
});

test("required validator", () => {
  expect(validators.required("", "Field")).toBeTruthy();
  expect(validators.required("value", "Field")).toBeNull();
});
```

### Component Testing
```jsx
import { render, screen, userEvent } from "@testing-library/react";
import Button from "@/components/ui/Button";

test("button click handler", async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  await userEvent.click(screen.getByText("Click me"));
  expect(handleClick).toHaveBeenCalled();
});
```

---

## Troubleshooting

### Dark Mode Not Working
1. Check browser supports `prefers-color-scheme`
2. Clear localStorage (`app-theme-preference`)
3. Verify CSS variables are defined in `:root`

### Form Validation Not Showing
1. Ensure `aria-invalid` is set on input
2. Check `aria-describedby` points to error element
3. Verify error state passes `error` prop to Input

### Mobile Layout Breaking
1. Check if using `.brand-product-grid` or `.brand-metric-strip`
2. Verify mobile media queries are in CSS
3. Test on actual mobile device (responsive design mode may differ)

---

## Migration Guide

### From Old Design System
If upgrading from old styling:

1. **Replace hardcoded colors** with CSS variables
2. **Use new Input component** instead of custom input HTML
3. **Use EmptyState component** instead of `brand-empty-state` div
4. **Use FormField wrapper** for consistent form styling
5. **Add dark mode support** by testing with `prefers-color-scheme`

---

## Performance Tips

- Use `lazy={true}` on ProductCard images
- Memoize heavy form validation with `useCallback`
- Use `.brand-scroll-region` for large lists (prevents jank)
- Keep notifications count < 5 (auto-dismiss old ones)

---

Last Updated: 2026-06-23  
Version: 1.0
