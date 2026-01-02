# 🚀 Quick Start Guide - Using the New UI System

## Getting Started in 5 Minutes

### 1. Run the Application
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

You should see the modernized login page with beautiful design! 🎨

---

## Using Components in Your Pages

### Simple Button
```tsx
import Button from '@/components/ui/Button';

export default function MyPage() {
  return (
    <Button variant="primary" size="md">
      Click Me
    </Button>
  );
}
```

### Card with Content
```tsx
import Card from '@/components/ui/Card';

export default function MyPage() {
  return (
    <Card hover padding="md">
      <h3 className="font-bold">My Card Title</h3>
      <p className="text-slate-600">Card content here</p>
    </Card>
  );
}
```

### Form with Input
```tsx
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useState } from 'react';

export default function FormPage() {
  const [email, setEmail] = useState('');
  
  return (
    <form className="space-y-4">
      <Input
        label="Email"
        type="email"
        icon="📧"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button variant="primary" fullWidth>
        Submit
      </Button>
    </form>
  );
}
```

### Header with Action
```tsx
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';

export default function MyPage() {
  return (
    <>
      <Header
        title="My Page"
        subtitle="This is my page subtitle"
        action={<Button>+ Add Item</Button>}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page content here */}
      </div>
    </>
  );
}
```

---

## Button Variants

```tsx
<Button variant="primary">Primary (Main action)</Button>
<Button variant="secondary">Secondary (Less important)</Button>
<Button variant="outline">Outline (Link-like)</Button>
<Button variant="danger">Danger (Delete)</Button>
<Button variant="success">Success (Positive)</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium (Default)</Button>
<Button size="lg">Large</Button>

// States
<Button loading={true}>Loading...</Button>
<Button disabled={true}>Disabled</Button>
<Button fullWidth={true}>Full Width</Button>
```

---

## Badge Variants

```tsx
import Badge from '@/components/ui/Badge';

<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">✓ Success</Badge>
<Badge variant="warning">⚠ Warning</Badge>
<Badge variant="danger">✕ Danger</Badge>
<Badge variant="info">ℹ Info</Badge>
```

---

## Alert Types

```tsx
import Alert from '@/components/ui/Alert';

<Alert type="success" title="Success!">
  Your action completed successfully
</Alert>

<Alert type="error" title="Error">
  Something went wrong, please try again
</Alert>

<Alert type="warning" title="Warning">
  Please be careful with this action
</Alert>

<Alert type="info" title="Information">
  Here's some useful information
</Alert>
```

---

## Common Page Patterns

### Empty State
```tsx
<Card className="text-center py-12">
  <p className="text-6xl mb-4">📦</p>
  <p className="text-slate-900 font-semibold text-lg mb-2">
    No items found
  </p>
  <p className="text-slate-600 mb-6">
    Create your first item to get started
  </p>
  <Button variant="primary">Create Item</Button>
</Card>
```

### Loading State
```tsx
<div className="flex justify-center py-12">
  <div className="text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-4 
                    border-slate-200 border-t-indigo-600 mx-auto mb-3"></div>
    <p className="text-slate-600 font-medium">Loading...</p>
  </div>
</div>
```

### Card Grid
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <Card key={item.id} hover>
      <h3 className="font-bold text-lg text-slate-900 mb-2">
        {item.title}
      </h3>
      <p className="text-slate-600 mb-4">{item.description}</p>
      <Button variant="outline" size="sm">Learn More</Button>
    </Card>
  ))}
</div>
```

### Table Layout
```tsx
<Card>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-slate-100 border-b">
          <th className="px-6 py-3 text-left font-bold text-slate-900">
            Header 1
          </th>
          <th className="px-6 py-3 text-left font-bold text-slate-900">
            Header 2
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b hover:bg-slate-50">
          <td className="px-6 py-3">Data 1</td>
          <td className="px-6 py-3">Data 2</td>
        </tr>
      </tbody>
    </table>
  </div>
</Card>
```

---

## Import Methods

### Method 1: Individual Imports (Preferred)
```tsx
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
```

### Method 2: Barrel Export (Convenience)
```tsx
import { Button, Card, Badge, Input, Alert } from '@/components/ui';
```

---

## Color Usage

```
Primary Blue:     #6366f1 (indigo-600)
Success Green:    #10b981 (emerald-600)
Warning Orange:   #f59e0b (amber-500)
Danger Red:       #ef4444 (red-500)
Neutral Gray:     Various slate shades
```

Use `variant="primary"`, `variant="success"`, etc. instead of hardcoding colors.

---

## Spacing Utilities

```tsx
// Margin
<div className="mt-4">Margin top 16px</div>
<div className="mb-8">Margin bottom 32px</div>
<div className="mx-auto">Margin horizontal auto</div>

// Padding
<div className="p-4">Padding all sides 16px</div>
<div className="px-6 py-3">Padding X 24px, Y 12px</div>

// Gap (for flex/grid)
<div className="flex gap-4">Flex with 16px gap</div>
<div className="grid gap-6">Grid with 24px gap</div>

// Space (for vertical stacks)
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

---

## Common CSS Classes

```tsx
// Typography
<h1 className="text-3xl font-bold text-slate-900">Page Title</h1>
<h2 className="text-2xl font-bold text-slate-900">Section Title</h2>
<h3 className="text-lg font-bold text-slate-900">Card Title</h3>
<p className="text-base text-slate-700">Body text</p>
<p className="text-sm text-slate-600">Small text</p>
<p className="text-xs text-slate-500">Tiny text</p>

// Colors
<div className="text-indigo-600">Primary text</div>
<div className="text-emerald-600">Success text</div>
<div className="text-red-600">Danger text</div>
<div className="bg-slate-100">Light background</div>
<div className="bg-white">White background</div>
```

---

## Responsive Classes

```tsx
// Responsive grid
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Single column on mobile, 2 on tablet, 3 on desktop */}
</div>

// Hide/show
<div className="hidden md:block">
  Only visible on tablet and up
</div>
<div className="md:hidden">
  Only visible on mobile
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl">
  Responsive heading
</h1>
```

---

## Dos and Don'ts

### ✅ DO
```tsx
// Use components
<Button variant="primary">Click Me</Button>

// Use semantic colors
<Badge variant="success">Active</Badge>

// Use spacing utilities
<div className="space-y-4">...</div>

// Use responsive classes
<div className="grid md:grid-cols-2">...</div>
```

### ❌ DON'T
```tsx
// Don't use inline styles
<button style={{ backgroundColor: 'blue' }}>Click</button>

// Don't hardcode colors
<div className="bg-blue-500">Content</div>

// Don't use inline pixel values
<div style={{ marginTop: '16px' }}>Content</div>

// Don't ignore mobile design
<div className="grid grid-cols-3">...</div>
```

---

## Need Help?

1. **Check Component Guide**: `COMPONENT_GUIDE.md`
2. **Review Design System**: `DESIGN_SYSTEM.md`
3. **See Examples**: Look at updated pages
4. **Read Docs**: `BEFORE_AFTER_GUIDE.md`

---

## Next Steps

1. ✅ Test the new design
2. ✅ Explore components
3. ✅ Read documentation
4. ⏳ Apply to more pages
5. ⏳ Customize if needed

---

## Example: Complete Page

```tsx
'use client';

import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useState } from 'react';

export default function ExamplePage() {
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <Header
        title="My Example Page"
        subtitle="This demonstrates the new UI system"
        action={<Button>+ Add Item</Button>}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card hover>
            <Badge variant="primary" className="mb-3">Featured</Badge>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Card Title
            </h3>
            <p className="text-slate-600 mb-4">
              This is a beautiful card with the new design system
            </p>
            <Button 
              variant="outline" 
              size="sm"
              loading={loading}
              onClick={() => setLoading(!loading)}
            >
              Click Me
            </Button>
          </Card>

          <Card hover>
            <Badge variant="success" className="mb-3">Active</Badge>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Another Card
            </h3>
            <p className="text-slate-600 mb-4">
              The design system makes building pages easy
            </p>
            <Button variant="primary" size="sm">
              Learn More
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button variant="primary">Save</Button>
          <Button variant="outline">Cancel</Button>
          <Button variant="danger">Delete</Button>
        </div>
      </div>
    </div>
  );
}
```

---

**You're all set!** 🎉 Now go build amazing pages with the new UI system!
