import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ProcedureSupply } from '../types'

export function useProcedureSupplies(procedureId?: string | null) {
  return useQuery({
    queryKey: ['procedure-supplies', procedureId],
    queryFn: async () => {
      if (!procedureId) return []

      const { data, error } = (await supabase
        .from('procedure_supplies')
        .select(
          `*, item:inventory_items(*, category:inventory_categories(id, name, item_type), batches:inventory_batches(*))`
        )
        .eq('procedure_id', procedureId)
        .order('created_at', { ascending: true })) as { data: ProcedureSupply[] | null; error: any }

      if (error) {
        // If table does not exist or has an issue, log and return empty gracefully
        console.warn('Error fetching procedure supplies:', error)
        return []
      }

      return (data || []) as ProcedureSupply[]
    },
    enabled: Boolean(procedureId),
    staleTime: 60 * 1000,
  })
}

export interface DispatchClinicalTrayParams {
  procedureId: string
  procedureName: string
  clinicId: string
  patientId?: string
  patientName?: string
  appointmentId?: string
  items: Array<{
    itemId: string
    itemName: string
    itemType: string
    quantity: number
    dispenseUnit?: string
    batchId?: string
  }>
}

export function useProcedureSuppliesMutations() {
  const queryClient = useQueryClient()

  const addSupply = useMutation({
    mutationFn: async (payload: {
      procedure_id: string
      item_id: string
      quantity: number
      dispense_unit?: string
      is_optional?: boolean
      notes?: string
    }) => {
      const { data, error } = (await supabase
        .from('procedure_supplies')
        .insert({
          procedure_id: payload.procedure_id,
          item_id: payload.item_id,
          quantity: Math.max(0.01, Number(payload.quantity) || 1),
          dispense_unit: payload.dispense_unit?.trim() || null,
          is_optional: Boolean(payload.is_optional),
          notes: payload.notes?.trim() || null,
        } as never)
        .select(
          `*, item:inventory_items(*, category:inventory_categories(id, name, item_type), batches:inventory_batches(*))`
        )
        .single()) as { data: ProcedureSupply | null; error: any }

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-supplies', variables.procedure_id] })
    },
  })

  const updateSupply = useMutation({
    mutationFn: async ({
      id,
      procedureId,
      ...updates
    }: {
      id: string
      procedureId: string
      quantity?: number
      dispense_unit?: string
      is_optional?: boolean
      notes?: string
    }) => {
      const { data, error } = (await supabase
        .from('procedure_supplies')
        .update({
          ...(updates.quantity !== undefined ? { quantity: Math.max(0.01, Number(updates.quantity)) } : {}),
          ...(updates.dispense_unit !== undefined ? { dispense_unit: updates.dispense_unit.trim() || null } : {}),
          ...(updates.is_optional !== undefined ? { is_optional: Boolean(updates.is_optional) } : {}),
          ...(updates.notes !== undefined ? { notes: updates.notes.trim() || null } : {}),
        } as never)
        .eq('id', id)
        .select(
          `*, item:inventory_items(*, category:inventory_categories(id, name, item_type), batches:inventory_batches(*))`
        )
        .single()) as { data: ProcedureSupply | null; error: any }

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-supplies', variables.procedureId] })
    },
  })

  const removeSupply = useMutation({
    mutationFn: async (payload: { id: string; procedureId: string }) => {
      const { error } = await supabase.from('procedure_supplies').delete().eq('id', payload.id)
      if (error) throw error
      return payload.id
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-supplies', variables.procedureId] })
    },
  })

  const dispatchClinicalTray = useMutation({
    mutationFn: async (params: DispatchClinicalTrayParams) => {
      const { procedureName, clinicId, patientName, appointmentId, items } = params

      // Filtrar sólo consumibles para descontar de stock
      const consumableItems = items.filter((it) => it.itemType !== 'tool' && it.quantity > 0)

      if (consumableItems.length === 0) {
        return { dispatchedCount: 0 }
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id || null

      for (const consumable of consumableItems) {
        // 1. Obtener item actual para stock y factor de conversión de empaque
        const { data: itemData } = (await supabase
          .from('inventory_items')
          .select('current_stock, unit, units_per_package, dispense_unit')
          .eq('id', consumable.itemId)
          .single()) as {
          data: {
            current_stock: number
            unit: string
            units_per_package: number
            dispense_unit?: string
          } | null
        }

        const currentStock = Number(itemData?.current_stock) || 0
        const unitsPerPkg = Number(itemData?.units_per_package) || 1
        const isIndividual =
          unitsPerPkg > 1 &&
          consumable.dispenseUnit &&
          consumable.dispenseUnit.toLowerCase() !== (itemData?.unit || '').toLowerCase()

        // Si es unidad individual, la deducción en stock de empaque es proporcional
        const stockDeduction = isIndividual
          ? Number((consumable.quantity / unitsPerPkg).toFixed(4))
          : consumable.quantity

        const newStock = Math.max(0, Number((currentStock - stockDeduction).toFixed(4)))

        const unitDisplay = consumable.dispenseUnit || itemData?.dispense_unit || itemData?.unit || 'uds'
        const labelDetail = isIndividual
          ? `${consumable.quantity} ${unitDisplay} (~${stockDeduction} ${itemData?.unit})`
          : `${consumable.quantity} ${unitDisplay}`

        // 2. Registrar movimiento en Kárdex
        const reasonText = `Bandeja clínica: ${procedureName} [${labelDetail}]${
          patientName ? ` - Paciente: ${patientName}` : ''
        }${appointmentId ? ` (Cita)` : ''}`

        await supabase.from('inventory_movements').insert({
          item_id: consumable.itemId,
          clinic_id: clinicId,
          batch_id: consumable.batchId || null,
          movement_type: 'exit_clinical',
          quantity: stockDeduction,
          reason: reasonText,
          performed_by: userId,
        } as never)

        // 3. Descontar stock general del ítem
        await supabase
          .from('inventory_items')
          .update({ current_stock: newStock } as never)
          .eq('id', consumable.itemId)

        // 4. Si se especificó un lote, descontar del lote
        if (consumable.batchId) {
          const { data: batchData } = (await supabase
            .from('inventory_batches')
            .select('current_quantity')
            .eq('id', consumable.batchId)
            .single()) as { data: { current_quantity: number } | null }

          if (batchData) {
            const batchStock = Number(batchData.current_quantity) || 0
            const newBatchStock = Math.max(0, Number((batchStock - stockDeduction).toFixed(4)))
            await supabase
              .from('inventory_batches')
              .update({
                current_quantity: newBatchStock,
                ...(newBatchStock === 0 ? { status: 'depleted' } : {}),
              } as never)
              .eq('id', consumable.batchId)
          }
        }
      }

      return { dispatchedCount: consumableItems.length }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
    },
  })

  return {
    addSupply: addSupply.mutateAsync,
    isAddingSupply: addSupply.isPending,
    updateSupply: updateSupply.mutateAsync,
    isUpdatingSupply: updateSupply.isPending,
    removeSupply: removeSupply.mutateAsync,
    isRemovingSupply: removeSupply.isPending,
    dispatchClinicalTray: dispatchClinicalTray.mutateAsync,
    isDispatchingTray: dispatchClinicalTray.isPending,
  }
}
