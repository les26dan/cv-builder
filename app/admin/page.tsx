'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HeaderMinimal from '@/components/HeaderMinimal'

interface User {
  id: string
  full_name: string
  email: string
  email_verified: boolean
  created_at: string
}

interface SystemStats {
  totalUsers: number
  verifiedUsers: number
  totalCVs: number
  activeAnalyses: number
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      
      // For now, we'll mock the admin data since we don't have the admin APIs yet
      // In a real implementation, these would be API calls to admin endpoints
      
      const mockStats: SystemStats = {
        totalUsers: 25,
        verifiedUsers: 18,
        totalCVs: 47,
        activeAnalyses: 12
      }
      
      const mockUsers: User[] = [
        {
          id: '1',
          full_name: 'Admin Buddy',
          email: 'adminbuddy@okbuddy.com',
          email_verified: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          full_name: 'Test User',
          email: 'test@example.com',
          email_verified: false,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      
      setStats(mockStats)
      setUsers(mockUsers)
      
    } catch (err) {
      console.error('Failed to load admin data:', err)
      setError('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderMinimal 
          showAutosave={false}
          userInitial="A"
        />
        <main className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading admin dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <HeaderMinimal 
          showAutosave={false}
          userInitial="A"
        />
        <main className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="text-red-500 text-lg font-semibold">{error}</div>
            <button 
              onClick={loadAdminData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderMinimal 
        showAutosave={false}
        userInitial="A"
      />
      
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System overview and user management</p>
        </div>

        {/* System Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalUsers}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-700">Verified Users</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.verifiedUsers}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-700">Total CVs</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalCVs}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-700">Active Analyses</h3>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.activeAnalyses}</p>
            </div>
          </div>
        )}

        {/* User Management */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.email_verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.email_verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-red-600 hover:text-red-900">Suspend</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => alert('System backup feature coming soon!')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Backup System
              </button>
              <button 
                onClick={() => alert('Analytics export feature coming soon!')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Export Analytics
              </button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/cv-workspace')}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Go to CV Workspace
              </button>
              <button 
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Go to Landing Page
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 