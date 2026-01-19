"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, Users, Trash2, Search, RefreshCw, 
  Monitor, Folder, ChevronRight, Circle, ArrowLeft,
  Laptop, Smartphone, MapPin, Globe, Clock, Eye,
  FileText, Play, Calendar, User, AlertTriangle
} from 'lucide-react'
import { useAuth, AuthProvider } from '@/lib/auth-context'
import { supabase, User as UserType, DevicePair, FileAccessLog, ScreenShareLog } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Tab = 'users' | 'files' | 'screen'

interface UserWithDevices extends UserType {
  devices?: DevicePair[]
}

function AdminContent() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [users, setUsers] = useState<UserWithDevices[]>([])
  const [devices, setDevices] = useState<DevicePair[]>([])
  const [fileAccessLogs, setFileAccessLogs] = useState<FileAccessLog[]>([])
  const [screenShareLogs, setScreenShareLogs] = useState<ScreenShareLog[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserWithDevices | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      checkAdmin()
    }
  }, [user])

  const checkAdmin = async () => {
    if (!user) return
    const { data } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    
    if (data?.is_admin) {
      setIsAdmin(true)
      fetchData()
    } else {
      router.push('/dashboard')
    }
  }

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    
    try {
      const response = await fetch('/api/admin', {
        headers: { 'x-user-id': user.id }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        const usersWithDevices = data.users.map((u: UserType) => ({
          ...u,
          devices: data.devices.filter((d: DevicePair) => d.user_id === u.id)
        }))
        
        setUsers(usersWithDevices)
        setDevices(data.devices)
        setFileAccessLogs(data.fileAccessLogs)
        setScreenShareLogs(data.screenShareLogs)
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    }
    
    setLoading(false)
  }

  const deleteUser = async (userId: string) => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/admin?userId=${userId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      })
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
        setDeleteConfirm(null)
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getUserFileAccess = (userId: string) => 
    fileAccessLogs.filter(log => log.user_id === userId)

  const getUserScreenShare = (userId: string) => 
    screenShareLogs.filter(log => log.user_id === userId)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff073a] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] cyber-grid">
      <nav className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-[#2a2a3a] z-50">
        <div className="h-full max-w-[1600px] mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-lg hover:bg-[#1a1a24] transition-colors text-[#8888a0] hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff073a] to-[#ff6b35] p-[2px]">
              <div className="w-full h-full rounded-xl bg-[#0a0a0f] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#ff073a]" />
              </div>
            </div>
            <span className="text-lg font-semibold text-white">Admin Panel</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5a70]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-64 pl-10 bg-[#1a1a24] border-[#2a2a3a] text-white placeholder:text-[#5a5a70]"
              />
            </div>
            <Button
              onClick={fetchData}
              variant="outline"
              size="icon"
              className="border-[#2a2a3a] text-white hover:bg-[#1a1a24]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-20 px-4 md:px-6 max-w-[1600px] mx-auto pb-8">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-[#ff073a]/20 text-[#ff073a] border border-[#ff073a]/50'
                : 'bg-[#1a1a24] text-[#8888a0] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'files'
                ? 'bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/50'
                : 'bg-[#1a1a24] text-[#8888a0] hover:text-white'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>File Access ({fileAccessLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('screen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'screen'
                ? 'bg-[#b829dd]/20 text-[#b829dd] border border-[#b829dd]/50'
                : 'bg-[#1a1a24] text-[#8888a0] hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Screen Share ({screenShareLogs.length})</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 space-y-4">
                <div className="glass-panel rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-[#2a2a3a]">
                    <h2 className="text-lg font-semibold text-white">All Users</h2>
                  </div>
                  <div className="divide-y divide-[#2a2a3a]">
                    {loading ? (
                      <div className="p-8 text-center">
                        <RefreshCw className="w-8 h-8 text-[#ff073a] animate-spin mx-auto" />
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-8 text-center text-[#8888a0]">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`p-4 cursor-pointer transition-all hover:bg-[#1a1a24] ${
                            selectedUser?.id === u.id ? 'bg-[#1a1a24] border-l-2 border-[#ff073a]' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff073a] to-[#ff6b35] flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{u.username[0].toUpperCase()}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-white font-medium">{u.username}</p>
                                  {u.is_admin && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-[#ff073a]/20 text-[#ff073a] rounded">
                                      ADMIN
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#8888a0]">{u.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#5a5a70]">
                                {u.devices?.length || 0} devices
                              </span>
                              <ChevronRight className="w-4 h-4 text-[#5a5a70]" />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {selectedUser ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-panel rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">User Details</h3>
                      {!selectedUser.is_admin && (
                        <Button
                          onClick={() => setDeleteConfirm(selectedUser.id)}
                          variant="outline"
                          size="sm"
                          className="border-[#ff073a]/50 text-[#ff073a] hover:bg-[#ff073a]/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff073a] to-[#ff6b35] flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{selectedUser.username[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-white">{selectedUser.username}</p>
                          <p className="text-sm text-[#8888a0]">{selectedUser.email}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-[#0f0f16] rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-[#5a5a70]" />
                          <span className="text-[#8888a0]">Joined:</span>
                          <span className="text-white">{formatDate(selectedUser.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Laptop className="w-4 h-4 text-[#5a5a70]" />
                          <span className="text-[#8888a0]">Devices:</span>
                          <span className="text-white">{selectedUser.devices?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Folder className="w-4 h-4 text-[#5a5a70]" />
                          <span className="text-[#8888a0]">File Access:</span>
                          <span className="text-white">{getUserFileAccess(selectedUser.id).length}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Monitor className="w-4 h-4 text-[#5a5a70]" />
                          <span className="text-[#8888a0]">Screen Share:</span>
                          <span className="text-white">{getUserScreenShare(selectedUser.id).length}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-[#8888a0] mb-2">Devices</h4>
                        <div className="space-y-2">
                          {selectedUser.devices?.map((d) => (
                            <div key={d.id} className="p-3 bg-[#0f0f16] rounded-xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {d.device_name.toLowerCase().includes('phone') ? (
                                    <Smartphone className="w-4 h-4 text-[#8888a0]" />
                                  ) : (
                                    <Laptop className="w-4 h-4 text-[#8888a0]" />
                                  )}
                                  <span className="text-white text-sm">{d.device_name}</span>
                                </div>
                                <Circle
                                  className={`w-2 h-2 ${
                                    d.is_online ? 'text-[#39ff14] fill-[#39ff14]' : 'text-[#5a5a70] fill-[#5a5a70]'
                                  }`}
                                />
                              </div>
                              <div className="mt-2 text-xs text-[#5a5a70] space-y-1">
                                <p>{d.os_name} {d.os_version} - {d.browser_name}</p>
                                {d.location_city && (
                                  <p className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {d.location_city}, {d.location_country}
                                  </p>
                                )}
                                {d.ip_address && (
                                  <p className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {d.ip_address}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="glass-panel rounded-2xl p-8 text-center">
                    <User className="w-12 h-12 text-[#5a5a70] mx-auto mb-4" />
                    <p className="text-[#8888a0]">Select a user to view details</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div
              key="files"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#2a2a3a]">
                  <h2 className="text-lg font-semibold text-white">File Access Logs</h2>
                </div>
                {fileAccessLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="w-12 h-12 text-[#5a5a70] mx-auto mb-4" />
                    <p className="text-[#8888a0]">No file access logs yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0f0f16]">
                        <tr>
                          <th className="text-left p-4 text-xs font-medium text-[#5a5a70] uppercase">User</th>
                          <th className="text-left p-4 text-xs font-medium text-[#5a5a70] uppercase">File</th>
                          <th className="text-left p-4 text-xs font-medium text-[#5a5a70] uppercase">Action</th>
                          <th className="text-left p-4 text-xs font-medium text-[#5a5a70] uppercase">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2a3a]">
                        {fileAccessLogs.map((log) => {
                          const logUser = users.find(u => u.id === log.user_id)
                          return (
                            <tr key={log.id} className="hover:bg-[#1a1a24]">
                              <td className="p-4">
                                <span className="text-white">{logUser?.username || 'Unknown'}</span>
                              </td>
                              <td className="p-4">
                                <div>
                                  <p className="text-white text-sm">{log.file_name}</p>
                                  <p className="text-xs text-[#5a5a70]">{log.file_path}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  log.action === 'download' ? 'bg-[#39ff14]/20 text-[#39ff14]' :
                                  log.action === 'upload' ? 'bg-[#00f0ff]/20 text-[#00f0ff]' :
                                  log.action === 'delete' ? 'bg-[#ff073a]/20 text-[#ff073a]' :
                                  'bg-[#5a5a70]/20 text-[#8888a0]'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-[#8888a0]">
                                {formatDate(log.accessed_at)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'screen' && (
            <motion.div
              key="screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#2a2a3a]">
                  <h2 className="text-lg font-semibold text-white">Screen Share Logs</h2>
                </div>
                {screenShareLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <Monitor className="w-12 h-12 text-[#5a5a70] mx-auto mb-4" />
                    <p className="text-[#8888a0]">No screen share logs yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#0f0f16]">
                        <tr>
                          <th className="text-left p-4 text-xs font-medium text-[#5a5a70] uppercase">User</th>
                          <th className="text-left p-4 text-xs font-medium text-[#5a5a70] uppercase">Source Device</th>
                          <th className="text-left p-4 text-xs font-medium text-[#5a5a70] uppercase">Target Device</th>
                          <th className="text-left p-4 text-xs font-medium text-[#5a5a70] uppercase">Duration</th>
                          <th className="text-left p-4 text-xs font-medium text-[#5a5a70] uppercase">Started</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a2a3a]">
                        {screenShareLogs.map((log) => {
                          const logUser = users.find(u => u.id === log.user_id)
                          const sourceDevice = devices.find(d => d.id === log.source_device_id)
                          const targetDevice = devices.find(d => d.id === log.target_device_id)
                          return (
                            <tr key={log.id} className="hover:bg-[#1a1a24]">
                              <td className="p-4">
                                <span className="text-white">{logUser?.username || 'Unknown'}</span>
                              </td>
                              <td className="p-4 text-sm text-[#8888a0]">
                                {sourceDevice?.device_name || 'Unknown'}
                              </td>
                              <td className="p-4 text-sm text-[#8888a0]">
                                {targetDevice?.device_name || 'Unknown'}
                              </td>
                              <td className="p-4">
                                {log.duration_seconds ? (
                                  <span className="text-white text-sm">
                                    {Math.floor(log.duration_seconds / 60)}m {log.duration_seconds % 60}s
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-1 rounded bg-[#39ff14]/20 text-[#39ff14]">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-sm text-[#8888a0]">
                                {formatDate(log.started_at)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-[#12121a] border-[#2a2a3a]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#ff073a]" />
              Delete User
            </DialogTitle>
            <DialogDescription className="text-[#8888a0]">
              Are you sure you want to delete this user? This action cannot be undone.
              All user data, devices, and logs will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-[#2a2a3a] text-white hover:bg-[#1a1a24]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirm && deleteUser(deleteConfirm)}
              className="bg-[#ff073a] text-white hover:bg-[#ff073a]/80"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminContent />
    </AuthProvider>
  )
}
