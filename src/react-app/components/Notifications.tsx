import { Toaster } from 'react-hot-toast'

export function Notifications() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Define default options
        className: '',
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          border: '1px solid #e5e7eb',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
        },

        // Default options for specific types
        success: {
          duration: 3000,
          style: {
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #d1fae5',
          },
          iconTheme: {
            primary: '#059669',
            secondary: '#ecfdf5',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
          },
          iconTheme: {
            primary: '#dc2626',
            secondary: '#fef2f2',
          },
        },
        loading: {
          style: {
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
          },
          iconTheme: {
            primary: '#6b7280',
            secondary: '#f3f4f6',
          },
        },
      }}
    />
  )
}
