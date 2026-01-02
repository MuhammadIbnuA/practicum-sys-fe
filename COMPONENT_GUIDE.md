# Component & Design Usage Guide

## Quick Reference

### Color Usage

```
Primary Actions:      #6366f1 (Indigo)
Secondary Actions:    #8b5cf6 (Purple)
Success/Green:        #10b981 (Emerald)
Warning/Orange:       #f59e0b (Amber)
Error/Red:           #ef4444 (Red)
Neutral BG:          #f8fafc (Slate-50)
Text Dark:           #0f172a (Slate-950)
Text Light:          #64748b (Slate-500)
```

---

## Component Patterns

### ✅ CORRECT USAGE

#### Using Button Component
```tsx
import Button from '@/components/ui/Button';

export default function Example() {
  return (
    <div className="space-y-4">
      {/* Primary action */}
      <Button variant="primary">Save</Button>
      
      {/* Secondary action */}
      <Button variant="secondary">Cancel</Button>
      
      {/* Outline for less important actions */}
      <Button variant="outline">Learn More</Button>
      
      {/* Danger action */}
      <Button variant="danger">Delete</Button>
      
      {/* With loading state */}
      <Button loading={isLoading}>Processing...</Button>
      
      {/* Full width for forms */}
      <Button fullWidth>Submit Form</Button>
    </div>
  );
}
```

#### Using Card Component
```tsx
import Card from '@/components/ui/Card';

export default function Example() {
  return (
    <div className="space-y-4">
      {/* Static card */}
      <Card>
        <h3 className="font-bold">Title</h3>
        <p className="text-slate-600">Content</p>
      </Card>
      
      {/* Hoverable card */}
      <Card hover>
        <h3 className="font-bold">Clickable Card</h3>
        <p className="text-slate-600">Hover to see effect</p>
      </Card>
      
      {/* With padding */}
      <Card padding="lg">Large padding card</Card>
    </div>
  );
}
```

#### Using Input Component
```tsx
import Input from '@/components/ui/Input';
import { useState } from 'react';

export default function FormExample() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  return (
    <form className="space-y-4">
      <Input
        label="Email Address"
        type="email"
        icon="📧"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        helperText="We'll never share your email"
        required
      />
      
      <Input
        label="Password"
        type="password"
        icon="🔐"
        placeholder="••••••••"
        required
      />
    </form>
  );
}
```

#### Using Header Component
```tsx
import Header from '@/components/ui/Header';
import Button from '@/components/ui/Button';

export default function Page() {
  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Welcome back!"
        action={<Button>+ Add New</Button>}
      />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page content */}
      </main>
    </>
  );
}
```

#### Using Badge Component
```tsx
import Badge from '@/components/ui/Badge';

export default function Example() {
  return (
    <div className="space-y-4">
      <Badge variant="primary">Active</Badge>
      <Badge variant="success">✓ Completed</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="danger">Archived</Badge>
      <Badge variant="info">2024</Badge>
    </div>
  );
}
```

#### Using Alert Component
```tsx
import Alert from '@/components/ui/Alert';

export default function Example() {
  return (
    <div className="space-y-4">
      <Alert type="success" title="Success!">
        Your changes have been saved
      </Alert>
      
      <Alert type="error" title="Error!">
        Something went wrong. Please try again.
      </Alert>
      
      <Alert type="warning" title="Warning">
        This action cannot be undone
      </Alert>
      
      <Alert type="info" title="Information">
        New features available in the latest version
      </Alert>
    </div>
  );
}
```

---

### ❌ INCORRECT USAGE

```tsx
// DON'T: Use inline styles instead of components
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  Click Me
</button>

// DO: Use Button component
import Button from '@/components/ui/Button';
<Button variant="primary">Click Me</Button>
```

```tsx
// DON'T: Mix different color schemes
<div className="bg-blue-500 p-4 text-red-600 border-2 border-green-400">
  Inconsistent styling
</div>

// DO: Use consistent color variables and components
<Card>
  <p className="text-slate-600">Consistent styling</p>
</Card>
```

```tsx
// DON'T: Hardcoded spacing values
<div style={{ marginTop: '32px', padding: '12px 16px' }}>
  Content
</div>

// DO: Use Tailwind spacing utilities
<div className="mt-8 px-4 py-3">Content</div>
```

---

## Page Layout Pattern

### Standard Page Structure
```tsx
'use client';

import Header from '@/components/ui/Header';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function MyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Header at top */}
      <Header
        title="Page Title"
        subtitle="Page description"
        action={<Button>Action</Button>}
      />

      {/* 2. Container for main content */}
      <Container>
        
        {/* 3. Content organized in sections */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Section Title
          </h2>
          
          {/* Use grid for multiple cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card hover>
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                Card Title
              </h3>
              <p className="text-slate-600 mb-4">Description</p>
              <Link href="/somewhere">
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </Link>
            </Card>
          </div>
        </section>
      </Container>
    </div>
  );
}
```

---

## Spacing Guidelines

```
Padding/Margin Scale:
- xs: 2px (0.125rem)   - Very small gaps
- sm: 4px (0.25rem)    - Small gaps
- 1:  4px (0.25rem)    - Single unit
- 2:  8px (0.5rem)     - Half unit
- 3:  12px (0.75rem)   - 3/4 unit
- 4:  16px (1rem)      - 1 unit (standard)
- 6:  24px (1.5rem)    - 1.5 units
- 8:  32px (2rem)      - 2 units
- 12: 48px (3rem)      - 3 units

Use consistently:
- Between sections: gap-8 (32px)
- Between items: gap-4 (16px)
- Inside cards: p-6 (24px)
- Page margins: px-4 py-8
```

---

## Typography

```
Hierarchy:
- Page Title:      text-3xl font-bold text-slate-900
- Section Title:   text-2xl font-bold text-slate-900
- Card Title:      text-lg font-bold text-slate-900
- Body:            text-base text-slate-700
- Small text:      text-sm text-slate-600
- Tiny text:       text-xs text-slate-500

Button text:       font-semibold text-base (default)
Label text:        font-semibold text-sm text-slate-700
```

---

## Common Patterns

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

### Form with Validation
```tsx
<form onSubmit={handleSubmit} className="space-y-6">
  {error && (
    <Alert type="error" title="Error">
      {error}
    </Alert>
  )}
  
  <Input
    label="Name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    error={errors.name}
    required
  />
  
  <Button variant="primary" fullWidth loading={isSubmitting}>
    Submit
  </Button>
</form>
```

---

## Responsive Design

```tsx
// Mobile first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Single column on mobile */}
  {/* 2 columns on tablet (md) */}
  {/* 3 columns on desktop (lg) */}
</div>

// Hide/show content responsively
<div className="hidden md:block">Only visible on tablet+</div>
<div className="md:hidden">Only visible on mobile</div>
```

---

## Best Practices Summary

✅ **DO:**
- Use semantic color variants (primary, success, danger)
- Keep components small and focused
- Use spacing utilities consistently
- Add loading and error states
- Provide helpful empty messages
- Use responsive grid layouts
- Leverage the design system components

❌ **DON'T:**
- Mix different button styles
- Use hardcoded pixel values
- Create custom "button" divs
- Mix color schemes on one page
- Forget to add error states
- Ignore mobile responsiveness
- Duplicate component code

---

**Remember**: If you're about to write CSS from scratch, check if there's already a component or utility class for it! The design system exists to keep things consistent and fast.
