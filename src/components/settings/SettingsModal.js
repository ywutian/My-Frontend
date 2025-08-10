import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { FiX, FiMoon, FiSun, FiLock } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

function SettingsModal({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  
  const tabs = [
    { id: 'general', label: 'General Settings' },
    //{ id: 'billing', label: 'Billing' },
  ];

  const billingPlans = [
    {
      id: 'weekly',
      name: 'Weekly Plan',
      price: '$4.99',
      period: 'week',
      features: ['Basic features', '100 minutes/week']
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '$14.99',
      period: 'month',
      popular: true,
      features: ['All features', '500 minutes/month']
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      price: '$149.99',
      period: 'year',
      discount: '17% off',
      features: ['All features', 'Unlimited minutes']
    },
    {
      id: 'booster',
      name: 'Minutes Booster',
      price: '$9.99',
      features: ['Additional 200 minutes', 'Never expires']
    }
  ];

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-xl font-semibold">
              Settings
            </Dialog.Title>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`
                  px-4 py-3 font-medium
                  ${activeTab === tab.id ? 'text-gray-800 border-b-2 border-gray-600' : 'text-gray-500'}
                `}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'general' ? (
              <div className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Theme</h3>
                  <div className="flex space-x-4">
                    <button 
                      className={`flex items-center px-4 py-2 rounded-lg border border-gray-200 
                        ${theme === 'light' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      onClick={() => theme !== 'light' && toggleTheme()}
                    >
                      <FiSun className="h-5 w-5 mr-2" />
                      Light
                    </button>
                    <button 
                      className={`flex items-center px-4 py-2 rounded-lg border hover:bg-gray-50
                        ${theme === 'dark' ? 'bg-blue-50 border-blue-500' : ''}`}
                      onClick={() => theme !== 'dark' && toggleTheme()}
                    >
                      <FiMoon className="h-5 w-5 mr-2" />
                      Dark
                    </button>
                  </div>
                </div>

                {/* Language Selection */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Language</h3>
                  <select className="w-full px-4 py-2 rounded-lg border border-gray-200 
                                     focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300">
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                {/* Password Change */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Change Password</h3>
                  <button className="flex items-center px-4 py-2 rounded-lg border hover:bg-gray-50">
                    <FiLock className="h-5 w-5 mr-2" />
                    Change Password
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Subscription Plans</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {billingPlans.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`
                        relative p-6 rounded-xl border
                        ${plan.popular ? 'border-gray-600 shadow-md' : 'border-gray-200'}
                      `}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-xs px-3 py-1 rounded-full">
                          Popular
                        </span>
                      )}
                      <div className="text-center">
                        <h4 className="font-medium">{plan.name}</h4>
                        <div className="mt-2">
                          <span className="text-2xl font-bold">{plan.price}</span>
                          <span className="text-gray-500">/{plan.period}</span>
                        </div>
                        {plan.discount && (
                          <span className="text-green-500 text-sm">{plan.discount}</span>
                        )}
                        <button className="mt-4 w-full px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700">
                          Select Plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export default SettingsModal; 