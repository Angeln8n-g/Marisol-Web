/**
 * Utilidades para monitorear el rendimiento de la aplicación
 * 
 * Uso:
 * - Medir tiempo de operaciones críticas
 * - Detectar operaciones lentas
 * - Logging de métricas de rendimiento
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private timers: Map<string, number> = new Map()

  /**
   * Inicia un timer para una operación
   */
  start(name: string): void {
    this.timers.set(name, performance.now())
  }

  /**
   * Finaliza un timer y registra la métrica
   */
  end(name: string): number | null {
    const startTime = this.timers.get(name)
    if (!startTime) {
      console.warn(`No timer found for: ${name}`)
      return null
    }

    const duration = performance.now() - startTime
    this.timers.delete(name)

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
    }

    this.metrics.push(metric)

    // Log si la operación es lenta (> 1 segundo)
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  /**
   * Obtiene todas las métricas registradas
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Obtiene métricas de una operación específica
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name)
  }

  /**
   * Calcula el promedio de duración para una operación
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) return 0

    const total = metrics.reduce((sum, m) => sum + m.duration, 0)
    return total / metrics.length
  }

  /**
   * Limpia todas las métricas
   */
  clear(): void {
    this.metrics = []
    this.timers.clear()
  }

  /**
   * Exporta métricas como CSV
   */
  exportCSV(): string {
    const headers = 'Name,Duration (ms),Timestamp\n'
    const rows = this.metrics
      .map(m => `${m.name},${m.duration.toFixed(2)},${new Date(m.timestamp).toISOString()}`)
      .join('\n')
    return headers + rows
  }
}

// Instancia global
export const perfMonitor = new PerformanceMonitor()

/**
 * Hook para medir el rendimiento de operaciones async
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  perfMonitor.start(name)
  try {
    const result = await operation()
    return result
  } finally {
    perfMonitor.end(name)
  }
}

/**
 * Decorator para medir el rendimiento de funciones
 */
export function measure(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const metricName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      perfMonitor.start(metricName)
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } finally {
        perfMonitor.end(metricName)
      }
    }

    return descriptor
  }
}

/**
 * Monitorea el rendimiento de componentes React
 */
export function logComponentRender(componentName: string, props?: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 Render: ${componentName}`, props)
  }
}

/**
 * Detecta memory leaks potenciales
 */
export function checkMemoryUsage(): void {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2)
    const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2)
    const limitMB = (memory.jsHeapSizeLimit / 1048576).toFixed(2)

    console.log(`💾 Memory: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`)

    // Advertir si se usa más del 80% del límite
    if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
      console.warn('⚠️ High memory usage detected!')
    }
  }
}

// Monitoreo automático en desarrollo
if (process.env.NODE_ENV === 'development') {
  // Verificar memoria cada 30 segundos
  setInterval(checkMemoryUsage, 30000)
}
