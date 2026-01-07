import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { InviteQRCode } from '@/components/InviteQRCode'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Download, RefreshCw, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export function AdminInvitesPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [invites, setInvites] = useState([])
  const [stats, setStats] = useState({ total: 0, redeemed: 0, pending: 0, redemptionRate: 0 })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [bulkCount, setBulkCount] = useState(10)
  const [selectedInvite, setSelectedInvite] = useState(null)

  useEffect(() => {
    if (profile?.neighborhood_id) {
      loadInvites()
      loadStats()
    }
  }, [profile])

  const loadInvites = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('neighborhood_invites')
        .select(`
          *,
          neighborhood:neighborhoods(name)
        `)
        .eq('neighborhood_id', profile.neighborhood_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvites(data || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invites: ' + error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data: allInvites, error } = await supabase
        .from('neighborhood_invites')
        .select('is_redeemed')
        .eq('neighborhood_id', profile.neighborhood_id)

      if (error) throw error

      const total = allInvites.length
      const redeemed = allInvites.filter(inv => inv.is_redeemed).length
      const pending = total - redeemed
      const redemptionRate = total > 0 ? Math.round((redeemed / total) * 100) : 0

      setStats({ total, redeemed, pending, redemptionRate })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const generateSingleInvite = async () => {
    setGenerating(true)
    try {
      // Generate code
      const { data: code, error: codeError } = await supabase
        .rpc('generate_invite_code', {
          p_neighborhood_id: profile.neighborhood_id
        })

      if (codeError) throw codeError

      // Insert invite
      const { data: invite, error: insertError } = await supabase
        .from('neighborhood_invites')
        .insert({
          code: code,
          neighborhood_id: profile.neighborhood_id,
          created_by: user.id
        })
        .select()
        .single()

      if (insertError) throw insertError

      toast({
        title: 'Success!',
        description: `Created invite code: ${code}`,
      })

      loadInvites()
      loadStats()
      setSelectedInvite(invite)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate invite: ' + error.message,
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const generateBulkInvites = async () => {
    setGenerating(true)
    try {
      const promises = []
      for (let i = 0; i < bulkCount; i++) {
        promises.push(
          supabase.rpc('generate_invite_code', {
            p_neighborhood_id: profile.neighborhood_id
          })
        )
      }

      const codes = await Promise.all(promises)

      const invitesToInsert = codes.map(({ data: code }) => ({
        code: code,
        neighborhood_id: profile.neighborhood_id,
        created_by: user.id
      }))

      const { error } = await supabase
        .from('neighborhood_invites')
        .insert(invitesToInsert)

      if (error) throw error

      toast({
        title: 'Success!',
        description: `Created ${bulkCount} invite codes`,
      })

      loadInvites()
      loadStats()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate bulk invites: ' + error.message,
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const exportInvites = () => {
    const csv = [
      ['Code', 'Status', 'Created', 'Redeemed', 'Redeemed By'].join(','),
      ...invites.map(inv => [
        inv.code,
        inv.is_redeemed ? 'Redeemed' : 'Pending',
        format(new Date(inv.created_at), 'yyyy-MM-dd'),
        inv.redeemed_at ? format(new Date(inv.redeemed_at), 'yyyy-MM-dd') : '',
        inv.redeemed_by || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invites-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()

    toast({
      title: 'Exported!',
      description: `Downloaded ${invites.length} invites as CSV`,
    })
  }

  if (!profile?.neighborhood_id) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              You must be part of a neighborhood to manage invites.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage neighborhood invites for {profile.neighborhood?.name || 'your neighborhood'}
          </p>
        </div>
        <Button onClick={loadInvites} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.redeemed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redemption Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.redemptionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Invites</TabsTrigger>
          <TabsTrigger value="manage">Manage Invites</TabsTrigger>
          {selectedInvite && <TabsTrigger value="qr">QR Code</TabsTrigger>}
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Single Invite</CardTitle>
                <CardDescription>Generate one invite code at a time</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateSingleInvite}
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {generating ? 'Generating...' : 'Generate Single Invite'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bulk Generation</CardTitle>
                <CardDescription>Generate multiple invites for mail campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bulk-count">Number of Invites</Label>
                  <Input
                    id="bulk-count"
                    type="number"
                    min="1"
                    max="100"
                    value={bulkCount}
                    onChange={(e) => setBulkCount(parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={generateBulkInvites}
                  disabled={generating}
                  className="w-full"
                  variant="secondary"
                  size="lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {generating ? 'Generating...' : `Generate ${bulkCount} Invites`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Invites</CardTitle>
                  <CardDescription>View and manage all neighborhood invites</CardDescription>
                </div>
                <Button onClick={exportInvites} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Redeemed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : invites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No invites yet. Generate some above!
                      </TableCell>
                    </TableRow>
                  ) : (
                    invites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-mono text-sm">
                          {invite.code}
                        </TableCell>
                        <TableCell>
                          {invite.is_redeemed ? (
                            <Badge variant="success">Redeemed</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invite.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {invite.redeemed_at
                            ? format(new Date(invite.redeemed_at), 'MMM d, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvite(invite)}
                          >
                            View QR
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedInvite && (
          <TabsContent value="qr">
            <Card>
              <CardHeader>
                <CardTitle>QR Code for {selectedInvite.code}</CardTitle>
                <CardDescription>
                  Download and print this QR code on your direct mail pieces
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <InviteQRCode
                  code={selectedInvite.code}
                  neighborhoodName={profile.neighborhood?.name || 'Your Neighborhood'}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
