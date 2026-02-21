# Tailwind CSS Quick Reference for AccessHub Frontend

## ✅ Setup Status
- [x] `tailwind.config.js` - Configured
- [x] `postcss.config.js` - Configured  
- [x] `src/index.css` - Tailwind directives added
- [x] Dependencies installed (tailwindcss, autoprefixer, postcss)
- [x] Development server running
- [x] Production build tested

## 🎨 Available Colors

| Color | Value | Usage |
|-------|-------|-------|
| Primary | #1890ff | `text-primary`, `bg-primary`, `border-primary` |
| Success | #52c41a | `text-success`, `bg-success` |
| Warning | #faad14 | `text-warning`, `bg-warning` |
| Error | #ff4d4f | `text-error`, `bg-error` |

## 🔧 Common Tailwind Classes

### Layout
```jsx
<div className="flex flex-col gap-4">           // Flexbox column with spacing
<div className="grid grid-cols-3 gap-6">        // 3-column grid
<div className="flex items-center justify-between">  // Center + space between
```

### Spacing
```jsx
className="p-4"      // Padding
className="m-4"      // Margin
className="gap-6"    // Gap between flex/grid items
className="mb-8"     // Margin-bottom
```

### Typography
```jsx
className="text-xl font-bold"           // Size + weight
className="text-gray-900"               // Color
className="uppercase tracking-wide"     // Case + letter spacing
```

### Components
```jsx
className="bg-white rounded-lg shadow p-6"     // Card style
className="border border-gray-200 rounded"     // Border
className="hover:shadow-lg transition-shadow"  // Hover effect
```

### Responsive
```jsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="hidden md:block"  // Hide on mobile, show on medium+
className="p-4 md:p-8"       // Small padding on mobile, large on desktop
```

## 📝 Component Examples

### Alert Box
```jsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900">
  <h3 className="font-semibold mb-2">Alert Title</h3>
  <p>Alert message content</p>
</div>
```

### Button Group
```jsx
<div className="flex gap-3">
  <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">
    Primary
  </button>
  <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
    Secondary
  </button>
</div>
```

### Badge
```jsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success text-white">
  Active
</span>
```

### List Item
```jsx
<li className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50">
  <span className="text-gray-900 font-medium">Item Name</span>
  <span className="text-gray-600 text-sm">Details</span>
</li>
```

## 🔗 Integration with Ant Design

```jsx
import { Form, Button, Input, Select, Table } from 'antd';

// Form Example
<Form className="max-w-2xl">
  <Form.Item label="Email" className="mb-4">
    <Input className="w-full" type="email" />
  </Form.Item>
  <Button type="primary" htmlType="submit" className="w-full">
    Submit
  </Button>
</Form>

// Table with custom styling
<Table 
  className="bg-white rounded-lg overflow-hidden shadow"
  columns={columns}
  dataSource={data}
/>
```

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Ant Design Components](https://ant.design/components/overview/)
- Local guide: [TAILWIND_GUIDE.md](TAILWIND_GUIDE.md)
- Setup details: [TAILWIND_SETUP.md](TAILWIND_SETUP.md)

## ⚡ Performance Tips

1. **Always use className** - Never inline styles when Tailwind class exists
2. **Purging works automatically** - Unused classes are removed in production
3. **Component layer** - Use `@apply` in CSS for reusable component patterns:
   ```css
   @layer components {
     .btn-primary {
       @apply px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors;
     }
   }
   ```

4. **Custom styles fallback** - Use CSS files only for truly custom styling

## 🚀 Getting Started

1. All configuration is done - just start coding!
2. Use `className` attribute with Tailwind classes
3. Check [TAILWIND_GUIDE.md](TAILWIND_GUIDE.md) for examples
4. Combine with Ant Design components for complex UIs

**Development server**: http://localhost:3000
**Build output**: `/build` directory
