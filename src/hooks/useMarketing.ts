import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { MarketingCampaign, MarketingOffer, SocialMediaPost, MarketingVoucher } from '../types'

export function useMarketingCampaigns() {
  return useQuery({
    queryKey: ['marketing-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as unknown as MarketingCampaign[]
    },
    staleTime: 3 * 60 * 1000,
  })
}

export function useMarketingOffers() {
  return useQuery({
    queryKey: ['marketing-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_offers')
        .select('*, procedure:procedures(name, category)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as unknown as MarketingOffer[]
    },
    staleTime: 3 * 60 * 1000,
  })
}

export function useSocialMediaPosts(campaignId?: string) {
  return useQuery({
    queryKey: ['social-media-posts', campaignId],
    queryFn: async () => {
      let query = supabase
        .from('social_media_posts')
        .select('*')
        .order('scheduled_for', { ascending: false })

      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as SocialMediaPost[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useMarketingVouchers(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['marketing-vouchers', filters?.status, filters?.search],
    queryFn: async () => {
      let query = supabase
        .from('marketing_vouchers')
        .select('*, patient:patients(id, full_name, phone, email), procedure:procedures(id, name, category), offer:marketing_offers(title, promo_code)')
        .order('created_at', { ascending: false })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      if (error) throw error

      let list = (data || []) as unknown as MarketingVoucher[]

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim()
        list = list.filter(
          (v) =>
            v.voucher_code.toLowerCase().includes(q) ||
            v.beneficiary_name.toLowerCase().includes(q) ||
            v.title.toLowerCase().includes(q) ||
            (v.beneficiary_phone && v.beneficiary_phone.includes(q)) ||
            (v.patient?.full_name && v.patient.full_name.toLowerCase().includes(q))
        )
      }

      return list
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useMarketingMutations() {
  const queryClient = useQueryClient()

  const createCampaign = useMutation({
    mutationFn: async (campaign: Partial<MarketingCampaign>) => {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert(campaign as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-campaigns'] })
    },
  })

  const createOffer = useMutation({
    mutationFn: async (offer: Partial<MarketingOffer>) => {
      const { data, error } = await supabase
        .from('marketing_offers')
        .insert(offer as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-offers'] })
    },
  })

  const createSocialPost = useMutation({
    mutationFn: async (post: Partial<SocialMediaPost>) => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .insert(post as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-posts'] })
    },
  })

  const updatePostStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'scheduled' | 'published' | 'archived' }) => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .update({ status, published_at: status === 'published' ? new Date().toISOString() : null } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media-posts'] })
    },
  })

  const createVoucher = useMutation({
    mutationFn: async (voucher: Partial<MarketingVoucher>) => {
      const { data, error } = await supabase
        .from('marketing_vouchers')
        .insert(voucher as never)
        .select('*, patient:patients(id, full_name, phone, email), procedure:procedures(id, name, category)')
        .single()
      if (error) throw error
      return data as unknown as MarketingVoucher
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-vouchers'] })
      queryClient.invalidateQueries({ queryKey: ['marketing-offers'] })
    },
  })

  const redeemVoucher = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('marketing_vouchers')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as MarketingVoucher
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-vouchers'] })
    },
  })

  const cancelVoucher = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('marketing_vouchers')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-vouchers'] })
    },
  })

  return {
    createCampaign: createCampaign.mutateAsync,
    isCreatingCampaign: createCampaign.isPending,
    createOffer: createOffer.mutateAsync,
    isCreatingOffer: createOffer.isPending,
    createSocialPost: createSocialPost.mutateAsync,
    isCreatingPost: createSocialPost.isPending,
    updatePostStatus: updatePostStatus.mutateAsync,
    createVoucher: createVoucher.mutateAsync,
    isCreatingVoucher: createVoucher.isPending,
    redeemVoucher: redeemVoucher.mutateAsync,
    isRedeemingVoucher: redeemVoucher.isPending,
    cancelVoucher: cancelVoucher.mutateAsync,
    isCancellingVoucher: cancelVoucher.isPending,
  }
}
