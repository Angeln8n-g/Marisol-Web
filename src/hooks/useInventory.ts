import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type {
  InventoryItem,
  InventoryItemType,
  EquipmentMaintenance,
  InventoryBatch,
  InventoryMovement,
  InventoryMovementType,
  InventoryCategory,
} from '../types'

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
        .select('*, clinic:clinics(id, name), category:inventory_categories(id, name, item_type), batches:inventory_batches(*)')
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

export function useInventoryCategories(itemType?: InventoryItemType) {
  return useQuery({
    queryKey: ['inventory-categories', itemType],
    queryFn: async () => {
      let query = supabase
        .from('inventory_categories')
        .select('*')
        .order('name')

      if (itemType) {
        query = query.eq('item_type', itemType)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as InventoryCategory[]
    },
    staleTime: 10 * 60 * 1000,
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

interface UseInventoryMovementsParams {
  clinicId?: string
  itemId?: string
  movementType?: InventoryMovementType | 'all'
  limit?: number
}

export function useInventoryMovements(params: UseInventoryMovementsParams = {}) {
  const { clinicId, itemId, movementType, limit = 150 } = params

  return useQuery({
    queryKey: ['inventory-movements', clinicId, itemId, movementType, limit],
    queryFn: async () => {
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          item:inventory_items(name, code, unit, current_stock, item_type),
          clinic:clinics!clinic_id(name),
          destination_clinic:clinics!destination_clinic_id(name),
          batch:inventory_batches(batch_number, expiration_date)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (clinicId) {
        query = query.or(`clinic_id.eq.${clinicId},destination_clinic_id.eq.${clinicId}`)
      }

      if (itemId) {
        query = query.eq('item_id', itemId)
      }

      if (movementType && movementType !== 'all') {
        query = query.eq('movement_type', movementType)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as InventoryMovement[]
    },
    staleTime: 60 * 1000,
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

  const updateMaintenance = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<EquipmentMaintenance>) => {
      const { data, error } = await supabase
        .from('equipment_maintenance')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      // Si el mantenimiento finalizó, restaurar equipo a 'active' si estaba en 'in_maintenance'
      if (updates.status === 'completed' && updates.item_id) {
        await supabase
          .from('inventory_items')
          .update({ status: 'active' } as never)
          .eq('id', updates.item_id)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-maintenances'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
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

  const updateBatchStatus = useMutation({
    mutationFn: async ({
      id,
      itemId,
      status,
      discountCurrentStock,
    }: {
      id: string
      itemId: string
      status: 'active' | 'expired' | 'depleted'
      discountCurrentStock?: number
    }) => {
      const { data, error } = await supabase
        .from('inventory_batches')
        .update({ status } as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      // Si se descartó el lote por vencimiento o merma, descontar del stock del ítem
      if (discountCurrentStock && discountCurrentStock > 0) {
        const { data: item } = (await supabase
          .from('inventory_items')
          .select('current_stock')
          .eq('id', itemId)
          .single()) as { data: { current_stock: number } | null }
        if (item) {
          const newStock = Math.max(0, Number(item.current_stock) - discountCurrentStock)
          await supabase
            .from('inventory_items')
            .update({ current_stock: newStock } as never)
            .eq('id', itemId)
        }
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] })
    },
  })


  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({ is_active: false } as never)
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

  const registerMovement = useMutation({
    mutationFn: async (params: {
      item_id: string
      movement_type: InventoryMovementType
      quantity: number
      clinic_id?: string
      destination_clinic_id?: string
      batch_id?: string
      reason?: string
    }) => {
      const { data: item, error: itemErr } = (await supabase
        .from('inventory_items')
        .select('current_stock, clinic_id')
        .eq('id', params.item_id)
        .single()) as { data: { current_stock: number; clinic_id?: string | null } | null; error: any }
      if (itemErr || !item) throw itemErr || new Error('Artículo no encontrado')

      const currentStock = Number(item.current_stock) || 0
      const qty = Number(params.quantity) || 0

      if (qty <= 0 && params.movement_type !== 'adjustment') {
        throw new Error('La cantidad debe ser mayor a 0.')
      }

      let newStock = currentStock
      if (params.movement_type === 'entry') {
        newStock = currentStock + qty
      } else if (params.movement_type === 'exit_clinical' || params.movement_type === 'exit_admin') {
        if (currentStock < qty) {
          throw new Error(`Stock insuficiente. Stock actual: ${currentStock}, salida solicitada: ${qty}`)
        }
        newStock = Math.max(0, currentStock - qty)
      } else if (params.movement_type === 'adjustment') {
        newStock = Math.max(0, qty)
      } else if (params.movement_type === 'transfer') {
        if (currentStock < qty) {
          throw new Error(`Stock insuficiente para transferir. Stock actual: ${currentStock}`)
        }
        newStock = Math.max(0, currentStock - qty)
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id || null

      const { data: movement, error: movErr } = await supabase
        .from('inventory_movements')
        .insert({
          item_id: params.item_id,
          clinic_id: params.clinic_id || item.clinic_id || null,
          destination_clinic_id: params.destination_clinic_id || null,
          batch_id: params.batch_id || null,
          movement_type: params.movement_type,
          quantity: qty,
          reason: params.reason || null,
          performed_by: userId,
        } as never)
        .select()
        .single()
      if (movErr) throw movErr

      const { error: updateErr } = await supabase
        .from('inventory_items')
        .update({ current_stock: newStock } as never)
        .eq('id', params.item_id)
      if (updateErr) throw updateErr

      if (params.batch_id) {
        const { data: batch } = (await supabase
          .from('inventory_batches')
          .select('current_quantity')
          .eq('id', params.batch_id)
          .single()) as { data: { current_quantity: number } | null }
        if (batch) {
          const currentBatchQty = Number(batch.current_quantity) || 0
          let newBatchQty = currentBatchQty
          if (params.movement_type === 'entry') {
            newBatchQty = currentBatchQty + qty
          } else if (params.movement_type === 'exit_clinical' || params.movement_type === 'exit_admin') {
            newBatchQty = Math.max(0, currentBatchQty - qty)
          }
          await supabase
            .from('inventory_batches')
            .update({
              current_quantity: newBatchQty,
              status: newBatchQty === 0 ? 'depleted' : 'active',
            } as never)
            .eq('id', params.batch_id)
        }
      }

      return movement
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
    },
  })

  return {
    createItem: createItem.mutateAsync,
    isCreatingItem: createItem.isPending,
    updateItem: updateItem.mutateAsync,
    isUpdatingItem: updateItem.isPending,
    deleteItem: deleteItem.mutateAsync,
    isDeletingItem: deleteItem.isPending,
    createMaintenance: createMaintenance.mutateAsync,
    isCreatingMaintenance: createMaintenance.isPending,
    updateMaintenance: updateMaintenance.mutateAsync,
    isUpdatingMaintenance: updateMaintenance.isPending,
    addBatch: addBatch.mutateAsync,
    updateBatchStatus: updateBatchStatus.mutateAsync,
    isUpdatingBatchStatus: updateBatchStatus.isPending,
    registerMovement: registerMovement.mutateAsync,
    isRegisteringMovement: registerMovement.isPending,
  }
}


