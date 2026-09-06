import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InventoryItem, InventoryItemType, EquipmentMaintenance, InventoryBatch } from '../types'

interface UseInventoryParams {
  clinicId?: string
  itemType?: InventoryItemType | 'all'
  search?: string
}

export function useInventoryItems(params: UseInventoryParams = {}) {
  const { clinicId, itemType = 'all', search } = params

  return useQuery({
    queryKey: ['inventory-items', clinicId, itemType, search],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select('*, clinic:clinics(id, name), batches:inventory_batches(*)')
        .eq('is_active', true)
        .order('name')

      if (clinicId) {
        query = query.eq('clinic_id', clinicId)
      }

      if (itemType && itemType !== 'all') {
        query = query.eq('item_type', itemType)
      }

      if (search && search.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%,brand.ilike.%${search.trim()}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as InventoryItem[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useInventoryAlerts(clinicId?: string) {
  return useQuery({
    queryKey: ['inventory-alerts', clinicId],
    queryFn: async () => {
      // 1. Low stock query
      let stockQuery = supabase
        .from('inventory_items')
        .select('id, name, code, current_stock, minimum_stock, unit, item_type')
        .eq('is_active', true)

      if (clinicId) stockQuery = stockQuery.eq('clinic_id', clinicId)
      const { data: stockItems } = await stockQuery
      const rawItems = (stockItems || []) as Array<{
        id: string
        name: string
        code?: string
        current_stock: number
        minimum_stock: number
        unit: string
        item_type: string
      }>

      const lowStock = rawItems.filter(
        (item) => Number(item.current_stock) <= Number(item.minimum_stock)
      )

      // 2. Batches expiring within 60 days
      const thresholdDate = new Date()
      thresholdDate.setDate(thresholdDate.getDate() + 60)

      const { data: expiringBatches } = await supabase
        .from('inventory_batches')
        .select('*, item:inventory_items(name, code, clinic_id)')
        .eq('status', 'active')
        .lte('expiration_date', thresholdDate.toISOString().split('T')[0])
        .order('expiration_date', { ascending: true })

      return {
        lowStockItems: lowStock,
        expiringBatches: (expiringBatches || []) as Array<InventoryBatch & { item?: { name: string; code?: string } }>,
        totalAlerts: lowStock.length + (expiringBatches?.length || 0),
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useEquipmentMaintenances(clinicId?: string) {
  return useQuery({
    queryKey: ['equipment-maintenances', clinicId],
    queryFn: async () => {
      let query = supabase
        .from('equipment_maintenance')
        .select('*, item:inventory_items(name, code, brand, serial_number)')
        .order('scheduled_date', { ascending: false })

      if (clinicId) {
        query = query.eq('clinic_id', clinicId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as EquipmentMaintenance[]
    },
    staleTime: 3 * 60 * 1000,
  })
}

export function useInventoryMutations() {
  const queryClient = useQueryClient()

  const createItem = useMutation({
    mutationFn: async (item: Partial<InventoryItem>) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(item as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] })
    },
  })

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InventoryItem>) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] })
    },
  })

  const createMaintenance = useMutation({
    mutationFn: async (maint: Partial<EquipmentMaintenance>) => {
      const { data, error } = await supabase
        .from('equipment_maintenance')
        .insert(maint as never)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-maintenances'] })
    },
  })

  const addBatch = useMutation({
    mutationFn: async (batch: Partial<InventoryBatch>) => {
      const { data, error } = await supabase
        .from('inventory_batches')
        .insert(batch as never)
        .select()
        .single()
      if (error) throw error

      // Automatically increment item's current_stock
      if (batch.item_id && batch.current_quantity) {
        const { data: item } = (await supabase
          .from('inventory_items')
          .select('current_stock')
          .eq('id', batch.item_id)
          .single()) as { data: { current_stock: number } | null }
        if (item) {
          await supabase
            .from('inventory_items')
            .update({ current_stock: Number(item.current_stock) + Number(batch.current_quantity) } as never)
            .eq('id', batch.item_id)
        }
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] })
    },
  })

  return {
    createItem: createItem.mutateAsync,
    isCreatingItem: createItem.isPending,
    updateItem: updateItem.mutateAsync,
    isUpdatingItem: updateItem.isPending,
    createMaintenance: createMaintenance.mutateAsync,
    isCreatingMaintenance: createMaintenance.isPending,
    addBatch: addBatch.mutateAsync,
  }
}
