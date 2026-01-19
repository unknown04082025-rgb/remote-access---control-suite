import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: users } = await supabase
    .from('users')
    .select('id, username, email, created_at, is_admin')
    .order('created_at', { ascending: false })

  const { data: devices } = await supabase
    .from('device_pairs')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: fileAccessLogs } = await supabase
    .from('file_access_logs')
    .select('*')
    .order('accessed_at', { ascending: false })
    .limit(100)

  const { data: screenShareLogs } = await supabase
    .from('screen_share_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(100)

  return NextResponse.json({
    users: users || [],
    devices: devices || [],
    fileAccessLogs: fileAccessLogs || [],
    screenShareLogs: screenShareLogs || []
  })
}

export async function DELETE(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const { searchParams } = new URL(request.url)
  const targetUserId = searchParams.get('userId')
  const deviceId = searchParams.get('deviceId')
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (deviceId) {
    const { error } = await supabase
      .from('device_pairs')
      .delete()
      .eq('id', deviceId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'User ID or Device ID required' }, { status: 400 })
  }

  if (targetUserId === userId) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  await supabase.from('device_pairs').delete().eq('user_id', targetUserId)
  await supabase.from('file_access_logs').delete().eq('user_id', targetUserId)
  await supabase.from('screen_share_logs').delete().eq('user_id', targetUserId)
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', targetUserId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
