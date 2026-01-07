import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useInvite() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const validateInvite = async (code) => {
    try {
      setLoading(true)
      setError(null)

      if (!code || !code.trim()) {
        throw new Error('Please enter an invite code')
      }

      // Query the invite by code
      const { data: invite, error: queryError } = await supabase
        .from('neighborhood_invites')
        .select(`
          id,
          code,
          is_redeemed,
          neighborhood_id,
          neighborhood:neighborhoods (
            id,
            name
          )
        `)
        .eq('code', code.toUpperCase())
        .single()

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          throw new Error('Invalid invite code')
        }
        throw queryError
      }

      if (invite.is_redeemed) {
        throw new Error('This invite code has already been used')
      }

      return {
        success: true,
        invite: {
          id: invite.id,
          code: invite.code,
          neighborhoodId: invite.neighborhood_id,
          neighborhoodName: invite.neighborhood?.name || 'Unknown'
        }
      }
    } catch (err) {
      setError(err.message)
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }

  const redeemInvite = async (code, userId) => {
    try {
      setLoading(true)
      setError(null)

      // Call the database function to redeem the invite
      const { data, error: rpcError } = await supabase
        .rpc('redeem_invite_code', {
          p_code: code.toUpperCase(),
          p_user_id: userId
        })

      if (rpcError) {
        throw rpcError
      }

      if (!data.success) {
        throw new Error(data.error)
      }

      return {
        success: true,
        neighborhoodId: data.neighborhood_id,
        inviteId: data.invite_id
      }
    } catch (err) {
      setError(err.message)
      return {
        success: false,
        error: err.message
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    validateInvite,
    redeemInvite,
    loading,
    error
  }
}
