import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '../types'

interface UsePurchaseOrdersParams {
  clinicId?: string
  status?: PurchaseOrderStatus | 'all'
}

export function usePurchaseOrders(params: UsePurchaseOrdersParams = {}) {
  const { clinicId, status = 'all' } = params

  return useQuery({
    queryKey: ['purchase-orders', clinicId, status],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          clinic:clinics(id, name),
          items:purchase_order_items(
            *,
            item:inventory_items(id, name, code, unit, dispense_unit, current_stock, cost_price)
          )
        `)
        .order('created_at', { ascending: false })

      if (clinicId) {
        query = query.eq('clinic_id', clinicId)
      }

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as PurchaseOrder[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function usePurchaseOrderMutations() {
  const queryClient = useQueryClient()

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-movements'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] })
    queryClient.invalidateQueries({ queryKey: ['predictive-items'] })
  }

  // 1. Crear Orden de Compra con sus renglones
  const createOrder = useMutation({
    mutationFn: async (payload: {
      clinic_id?: string | null
      supplier_name: string
      supplier_contact?: string | null
      supplier_rnc?: string | null
      forecast_window_days?: number
      notes?: string | null
      estimated_delivery_date?: string | null
      status?: PurchaseOrderStatus
      items: Array<{
        item_id: string
        package_quantity: number
        unit_cost: number
        notes?: string | null
      }>
    }) => {
      // Generar correlativo OC
      const now = new Date()
      const year = now.getFullYear()
      const randomSuffix = Math.floor(1000 + Math.random() * 9000)
      const orderNumber = `OC-${year}-${randomSuffix}`

      // Calcular total
      const totalAmount = payload.items.reduce(
        (acc, it) => acc + (Number(it.package_quantity) || 1) * (Number(it.unit_cost) || 0),
        0
      )

      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id || null

      // Insertar orden principal
      const { data: order, error: orderErr } = (await supabase
        .from('purchase_orders')
        .insert({
          order_number: orderNumber,
          clinic_id: payload.clinic_id || null,
          supplier_name: payload.supplier_name.trim(),
          supplier_contact: payload.supplier_contact?.trim() || null,
          supplier_rnc: payload.supplier_rnc?.trim() || null,
          forecast_window_days: payload.forecast_window_days || 14,
          notes: payload.notes?.trim() || null,
          total_amount: totalAmount,
          estimated_delivery_date: payload.estimated_delivery_date || null,
          status: payload.status || 'draft',
          created_by: userId,
        } as never)
        .select()
        .single()) as { data: PurchaseOrder | null; error: any }

      if (orderErr || !order) throw orderErr || new Error('Error al crear orden de compra.')

      // Insertar ítems
      if (payload.items.length > 0) {
        const itemsToInsert = payload.items.map((it) => ({
          order_id: order.id,
          item_id: it.item_id,
          package_quantity: Number(it.package_quantity) || 1,
          unit_cost: Number(it.unit_cost) || 0,
          total_cost: (Number(it.package_quantity) || 1) * (Number(it.unit_cost) || 0),
          notes: it.notes?.trim() || null,
        }))

        const { error: itemsErr } = await supabase
          .from('purchase_order_items')
          .insert(itemsToInsert as never)

        if (itemsErr) throw itemsErr
      }

      return order
    },
    onSuccess: invalidateAll,
  })

  // 2. Actualizar Orden de Compra (estado, notas, fecha)
  const updateOrder = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      status?: PurchaseOrderStatus
      notes?: string | null
      estimated_delivery_date?: string | null
      supplier_name?: string
      supplier_contact?: string | null
    }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: invalidateAll,
  })

  // 3. Recepción e Ingreso Directo a Inventario
  const receiveOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id || null

      // Intentar llamar a la función almacenada PostgreSQL
      const { data, error } = await (supabase.rpc as any)('receive_purchase_order', {
        p_order_id: orderId,
        p_received_by: userId,
      })

      if (error) {
        // En caso de que no esté cargada en la sesión RPC, ejecutar fallback cliente
        console.warn('RPC falló, ejecutando fallback de recepción:', error)
        
        // Obtener orden y sus renglones
        const { data: orderData } = (await supabase
          .from('purchase_orders')
          .select('*, items:purchase_order_items(*)')
          .eq('id', orderId)
          .single()) as { data: (PurchaseOrder & { items: PurchaseOrderItem[] }) | null }

        if (!orderData) throw new Error('Orden de compra no encontrada')

        for (const it of orderData.items || []) {
          // Obtener item actual
          const { data: invItem } = (await supabase
            .from('inventory_items')
            .select('current_stock')
            .eq('id', it.item_id)
            .single()) as { data: { current_stock: number } | null }

          const currentStock = Number(invItem?.current_stock) || 0
          const addedStock = Number(it.package_quantity) || 0

          // Actualizar stock
          await supabase
            .from('inventory_items')
            .update({
              current_stock: currentStock + addedStock,
              cost_price: it.unit_cost > 0 ? it.unit_cost : undefined,
              updated_at: new Date().toISOString(),
            } as never)
            .eq('id', it.item_id)

          // Registrar movimiento en Kardex
          await supabase
            .from('inventory_movements')
            .insert({
              item_id: it.item_id,
              clinic_id: orderData.clinic_id || null,
              movement_type: 'entry',
              quantity: addedStock,
              reason: `Recepción de Orden de Compra #${orderData.order_number} (${orderData.supplier_name})`,
              performed_by: userId,
            } as never)
        }

        // Marcar recibida
        await supabase
          .from('purchase_orders')
          .update({
            status: 'received',
            received_at: new Date().toISOString(),
          } as never)
          .eq('id', orderId)

        return { success: true }
      }

      return data
    },
    onSuccess: invalidateAll,
  })

  // 4. Cancelar o Eliminar Orden
  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status: 'cancelled' } as never)
        .eq('id', orderId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: invalidateAll,
  })

  return {
    createOrder: createOrder.mutateAsync,
    isCreatingOrder: createOrder.isPending,
    updateOrder: updateOrder.mutateAsync,
    isUpdatingOrder: updateOrder.isPending,
    receiveOrder: receiveOrder.mutateAsync,
    isReceivingOrder: receiveOrder.isPending,
    cancelOrder: cancelOrder.mutateAsync,
    isCancellingOrder: cancelOrder.isPending,
  }
}
