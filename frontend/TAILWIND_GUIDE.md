/**
 * Tailwind CSS Usage Examples for AccessHub Frontend
 * 
 * This file demonstrates how to use Tailwind CSS in your AccessHub components
 * alongside Ant Design components.
 */

// Example 1: Simple Layout Component with Tailwind
export const SimpleLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Title</h3>
            <p className="text-gray-600">Card content goes here</p>
          </div>
        </div>
      </main>
    </div>
  );
};

// Example 2: Form with Ant Design + Tailwind
import { Form, Button, Input, Select } from 'antd';

export const FormWithTailwind = () => {
  const [form] = Form.useForm();

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Form Title</h2>
      
      <Form form={form} layout="vertical">
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input className="w-full" />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: 'Admin', value: 'admin' },
              { label: 'User', value: 'user' },
            ]}
          />
        </Form.Item>

        <div className="flex gap-3 mt-6">
          <Button type="primary" htmlType="submit" className="flex-1">
            Submit
          </Button>
          <Button className="flex-1">Cancel</Button>
        </div>
      </Form>
    </div>
  );
};

// Example 3: Custom styled component (when Tailwind alone isn't enough)
// Create corresponding LoginV2.css for complex styling
export const CustomStyledComponent = () => {
  return (
    <div className="custom-gradient-bg flex items-center justify-center min-h-screen">
      {/* Use className for simple utilities, import CSS for complex styles */}
      <div className="bg-white rounded-xl shadow-2xl p-8">
        <p className="text-center text-gray-600">Content</p>
      </div>
    </div>
  );
};

/**
 * Tailwind + Ant Design Best Practices:
 * 
 * 1. Use Tailwind for layout, spacing, typography, colors:
 *    <div className="flex flex-col gap-4 p-6 bg-white rounded-lg">
 * 
 * 2. Use Ant Design for form components, modals, tables:
 *    <Form>, <Modal>, <Table>, <Button>, <Input>
 * 
 * 3. Combine them - style Ant components with Tailwind via className:
 *    <Button className="mt-4 w-full">Submit</Button>
 * 
 * 4. Custom colors available in theme (see tailwind.config.js):
 *    primary: #1890ff (Ant Design blue)
 *    success: #52c41a (Ant Design green)
 *    warning: #faad14 (Ant Design orange)
 *    error: #ff4d4f (Ant Design red)
 * 
 * 5. For complex styling not achievable with Tailwind classes,
 *    create a CSS file (e.g., LoginV2.css) and import it
 */
