# Design System & Style Guide

## Modern UI Components Created

This project now features a modern, clean, and professional design system with the following reusable components:

### Color Palette
- **Primary**: Indigo (`#6366f1`) - Main action color
- **Secondary**: Purple (`#8b5cf6`) - Complementary color
- **Success**: Emerald (`#10b981`) - Positive actions
- **Warning**: Amber (`#f59e0b`) - Warnings/alerts
- **Danger**: Red (`#ef4444`) - Destructive actions
- **Neutral**: Slate (`#f1f5f9` - `#0f172a`) - Background & text

### Components

#### 1. **Button**
- Variants: `primary`, `secondary`, `outline`, `danger`, `success`
- Sizes: `sm`, `md`, `lg`
- Features: Loading state, icons, full width support
```tsx
import { Button } from '@/components/ui';
<Button variant="primary" size="md" loading={false}>Click Me</Button>
```

#### 2. **Card**
- Modern white card with subtle border and shadow
- Hover effect option
- Padding variants: `sm`, `md`, `lg`
```tsx
import { Card } from '@/components/ui';
<Card hover padding="md">Content here</Card>
```

#### 3. **Badge**
- Variants: `primary`, `secondary`, `success`, `warning`, `danger`, `info`
- Sizes: `sm`, `md`, `lg`
```tsx
import { Badge } from '@/components/ui';
<Badge variant="success">Active</Badge>
```

#### 4. **Input**
- Built-in label, error, and helper text support
- Icon support for leading icon
- Size variants: `sm`, `md`, `lg`
```tsx
import { Input } from '@/components/ui';
<Input label="Email" type="email" icon="📧" error={errorMsg} />
```

#### 5. **Alert**
- Types: `success`, `error`, `warning`, `info`
- Optional title and icon
```tsx
import { Alert } from '@/components/ui';
<Alert type="error" title="Error">Something went wrong</Alert>
```

#### 6. **Header**
- Sticky header with title, subtitle, and optional action
- Professional layout with consistent spacing
```tsx
import { Header } from '@/components/ui';
<Header title="Page Title" subtitle="Description" action={<Button>Action</Button>} />
```

#### 7. **Badge/Divider/Container**
- `Divider`: Optional label divider
- `Container`: Max-width wrapper with consistent padding
- `Badge`: Small informational labels

### Design Features

✨ **Modern Aesthetics**
- Clean white/light backgrounds
- Smooth gradients and transitions
- Professional typography with clear hierarchy
- Consistent spacing and alignment

🎨 **Color Consistency**
- Indigo primary color throughout
- Semantic colors for different states
- High contrast text for accessibility

⚡ **User Experience**
- Hover effects on interactive elements
- Smooth loading states with spinners
- Clear focus states for keyboard navigation
- Responsive design for all screen sizes

📱 **Responsive Layout**
- Mobile-first approach
- Grid-based layouts
- Flexible components that adapt to screen size

### Updated Pages

1. **Login/Register** (`/app/page.tsx`)
   - Modern card design with gradients
   - Professional form layout
   - Demo credentials prominently displayed

2. **Dashboard** (`/app/dashboard/page.tsx`)
   - Clean grid layout for classes
   - Quick action cards
   - Professional header with stats

3. **Enroll Classes** (`/app/enroll/page.tsx`)
   - Card-based class listings
   - Clear quota information
   - Professional enrollment buttons

4. **Schedule** (`/app/schedule/page.tsx`)
   - Modern table design
   - Color-coded classes (student/teaching)
   - Responsive schedule grid

5. **Sidebar** (`/components/Sidebar.tsx`)
   - Clean white design (no dark background)
   - Professional user avatar
   - Clear navigation hierarchy
   - Active state indicators

### Best Practices

When building new pages or components, follow these guidelines:

1. **Use Components**: Leverage existing UI components instead of creating inline styles
2. **Consistent Spacing**: Use Tailwind spacing utilities consistently
3. **Color Semantics**: Use semantic color variants for better UX
4. **Typography**: Use clear font weights and sizes from the scale
5. **Interaction**: Add hover and focus states to all interactive elements
6. **Accessibility**: Ensure sufficient color contrast and keyboard navigation

### Importing Components

```tsx
// Individual imports
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// Or use barrel export
import { Button, Card, Badge } from '@/components/ui';
```

---

**Design System Version**: 1.0  
**Last Updated**: December 30, 2025
