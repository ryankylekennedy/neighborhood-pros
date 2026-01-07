import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return
      }

      // Fetch neighborhood separately if needed
      if (profileData?.neighborhood_id) {
        const { data: neighborhoodData } = await supabase
          .from('neighborhoods')
          .select('id, name')
          .eq('id', profileData.neighborhood_id)
          .maybeSingle()

        if (neighborhoodData) {
          profileData.neighborhood = neighborhoodData
        }
      }

      setProfile(profileData || null)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          // Set loading to false immediately
          if (mounted) {
            setLoading(false)
          }
          // Fetch profile in background without blocking
          fetchProfile(session.user.id).catch(err => {
            console.error('Background profile fetch failed:', err)
          })
        } else {
          setUser(null)
          setProfile(null)
          if (mounted) {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('Auth init error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          // Set loading to false BEFORE fetching profile so UI can update
          setLoading(false)
          // Fetch profile in background without blocking
          fetchProfile(session.user.id).catch(err => {
            console.error('Background profile fetch failed:', err)
          })
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    return { data, error }
  }

  const signUpWithInvite = async (email, password, fullName, neighborhoodId, address, inviteCode) => {
    try {
      // 1. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })

      if (authError) return { error: authError }

      // 2. Update profile with neighborhood and address
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          neighborhood_id: neighborhoodId,
          address: address
        })
        .eq('id', authData.user.id)

      if (profileError) return { error: profileError }

      // 3. Redeem invite code
      const { data: redeemData, error: redeemError } = await supabase
        .rpc('redeem_invite_code', {
          p_code: inviteCode,
          p_user_id: authData.user.id
        })

      if (redeemError) {
        return { error: new Error(redeemError.message || 'Failed to redeem invite code') }
      }

      if (!redeemData || !redeemData.success) {
        return { error: new Error(redeemData?.error || 'Invalid invite code') }
      }

      return { data: authData, error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
    return { error }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: { message: 'Not authenticated' } }

    const { data: profileData, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('*')
      .single()

    if (!error && profileData) {
      // Fetch neighborhood separately if needed
      if (profileData.neighborhood_id) {
        const { data: neighborhoodData } = await supabase
          .from('neighborhoods')
          .select('id, name')
          .eq('id', profileData.neighborhood_id)
          .maybeSingle()

        if (neighborhoodData) {
          profileData.neighborhood = neighborhoodData
        }
      }
      setProfile(profileData)
    }
    return { data: profileData, error }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signUpWithInvite,
    signIn,
    signOut,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}