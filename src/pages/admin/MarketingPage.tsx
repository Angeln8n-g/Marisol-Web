import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'
import {
  useMarketingCampaigns,
  useMarketingOffers,
  useSocialMediaPosts,
  useMarketingVouchers,
  useMarketingMutations,
} from '../../hooks/useMarketing'
import { useProcedures } from '../../hooks/useProcedures'
import type { MarketingVoucher } from '../../types'
import {
  VoucherModal,
  VoucherCardView,
  RedeemVoucherModal,
  ClinicBrandingKit,
  SocialCopyAssistant,
} from '../../components/admin/marketing'
import { formatDate } from '../../lib/utils'

export const MarketingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'planner' | 'campaigns' | 'branding'>('vouchers')

  // Search & filter state for vouchers
  const [voucherFilterStatus, setVoucherFilterStatus] = useState<string>('all')
  const [voucherSearch, setVoucherSearch] = useState<string>('')

  // Queries
  const { data: vouchers = [], isLoading: loadingVouchers } = useMarketingVouchers({
    status: voucherFilterStatus,
    search: voucherSearch,
  })
  const { data: campaigns = [], isLoading: loadingCampaigns } = useMarketingCampaigns()
  const { data: offers = [], isLoading: loadingOffers } = useMarketingOffers()
  const { data: posts = [], isLoading: loadingPosts } = useSocialMediaPosts()
  const { procedures } = useProcedures()

  const {
    createCampaign,
    createOffer,
    createSocialPost,
    updatePostStatus,
    cancelVoucher,
    isCreatingCampaign,
    isCreatingOffer,
    isCreatingPost,
  } = useMarketingMutations()

  // Modal States
  const [isCreateVoucherOpen, setIsCreateVoucherOpen] = useState(false)
  const [selectedVoucherForCard, setSelectedVoucherForCard] = useState<MarketingVoucher | null>(null)
  const [isRedeemOpen, setIsRedeemOpen] = useState(false)
  const [voucherToRedeem, setVoucherToRedeem] = useState<MarketingVoucher | null>(null)

  const [showPostModal, setShowPostModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)

  // Post Form State
  const [postTitle, setPostTitle] = useState('')
  const [postCopy, setPostCopy] = useState('')
  const [postPlatforms, setPostPlatforms] = useState<string[]>(['instagram', 'facebook'])
  const [postDate, setPostDate] = useState('')
  const [postCampaignId, setPostCampaignId] = useState('')
  const postStatus: 'draft' | 'scheduled' | 'published' = 'scheduled'

  // Campaign Form State
  const [campName, setCampName] = useState('')
  const [campDesc, setCampDesc] = useState('')
  const [campObj, setCampObj] = useState<'leads' | 'brand_awareness' | 'procedure_promotion' | 'retention'>('leads')
  const [campBudget, setCampBudget] = useState<number>(10000)

  // Offer Form State
  const [offerTitle, setOfferTitle] = useState('')
  const [offerCode, setOfferCode] = useState('')
  const [offerType, setOfferType] = useState<'percentage' | 'fixed_amount'>('percentage')
  const [offerValue, setOfferValue] = useState<number>(20)
  const [offerProcId, setOfferProcId] = useState('')

  // KPI calculations
  const kpis = useMemo(() => {
    const totalVouchers = vouchers.length
    const activeVouchers = vouchers.filter((v) => v.status === 'active').length
    const redeemedVouchers = vouchers.filter((v) => v.status === 'redeemed').length
    const redeemRate = totalVouchers > 0 ? Math.round((redeemedVouchers / totalVouchers) * 100) : 0
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length
    return {
      totalVouchers,
      activeVouchers,
      redeemedVouchers,
      redeemRate,
      activeCampaigns,
      totalPosts: posts.length,
    }
  }, [vouchers, campaigns, posts])

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postTitle || !postCopy) return

    await createSocialPost({
      title: postTitle,
      content_copy: postCopy,
      platforms: postPlatforms,
      scheduled_for: postDate ? new Date(postDate).toISOString() : new Date().toISOString(),
      campaign_id: postCampaignId || null,
      status: postStatus,
    })

    setShowPostModal(false)
    setPostTitle('')
    setPostCopy('')
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campName) return

    await createCampaign({
      name: campName,
      description: campDesc || null,
      objective: campObj,
      budget: Number(campBudget) || 0,
      status: 'active',
    })

    setShowCampaignModal(false)
    setCampName('')
    setCampDesc('')
  }

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerTitle || !offerCode) return

    await createOffer({
      title: offerTitle,
      promo_code: offerCode.toUpperCase().trim(),
      discount_type: offerType,
      discount_value: Number(offerValue) || 0,
      procedure_id: offerProcId || null,
      is_active: true,
    })

    setShowOfferModal(false)
    setOfferTitle('')
    setOfferCode('')
  }

  const togglePlatform = (p: string) => {
    if (postPlatforms.includes(p)) {
      setPostPlatforms(postPlatforms.filter((item) => item !== p))
    } else {
      setPostPlatforms([...postPlatforms, p])
    }
  }

  const handleUseCopyTemplate = (template: { title: string; copy: string; platforms: string[] }) => {
    setPostTitle(template.title)
    setPostCopy(template.copy)
    setPostPlatforms(template.platforms)
    setShowPostModal(true)
  }

  const handleOpenRedeem = (voucher?: MarketingVoucher) => {
    setVoucherToRedeem(voucher || null)
    setIsRedeemOpen(true)
  }

  const handleCancelVoucher = async (id: string, code: string) => {
    if (window.confirm(`¿Estás seguro de cancelar y anular el voucher ${code}?`)) {
      await cancelVoucher(id)
    }
  }

  return (
    <div className="space-y-6 font-montserrat">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-playfair text-navy font-bold">Marketing y Redes Sociales</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
            Gestión de vouchers de regalo, identidad corporativa, contenidos y campañas publicitarias
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'vouchers' && (
            <>
              <button
                type="button"
                onClick={() => handleOpenRedeem()}
                className="px-3 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Validar / Canjear Bono
              </button>
              <button
                type="button"
                onClick={() => setIsCreateVoucherOpen(true)}
                className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Emitir Voucher de Regalo
              </button>
            </>
          )}

          {activeTab === 'planner' && (
            <button
              type="button"
              onClick={() => setShowPostModal(true)}
              className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Publicación
            </button>
          )}

          {activeTab === 'campaigns' && (
            <>
              <button
                type="button"
                onClick={() => setShowOfferModal(true)}
                className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Crear Oferta / Cupón
              </button>
              <button
                type="button"
                onClick={() => setShowCampaignModal(true)}
                className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Campaña
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Vouchers Emitidos</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-playfair text-navy">{kpis.totalVouchers}</span>
            <span className="text-xs text-emerald-600 font-semibold">{kpis.activeVouchers} activos</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tasa de Canje</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-playfair text-emerald-600">{kpis.redeemRate}%</span>
            <span className="text-xs text-gray-500">{kpis.redeemedVouchers} canjeados</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Campañas Activas</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-playfair text-navy">{kpis.activeCampaigns}</span>
            <span className="text-xs text-gold font-semibold">{offers.length} cupones</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Parrilla Social</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-playfair text-navy">{kpis.totalPosts}</span>
            <span className="text-xs text-gray-500">publicaciones</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'vouchers'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          Vouchers y Gift Cards ({vouchers.length})
        </button>

        <button
          onClick={() => setActiveTab('planner')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'planner'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Parrilla y Contenidos ({posts.length})
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'campaigns'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          </svg>
          Campañas y Ofertas ({campaigns.length})
        </button>

        <button
          onClick={() => setActiveTab('branding')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'branding'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Kit de Identidad y Marca
        </button>
      </div>

      {/* Tab 1: Vouchers y Tarjetas de Regalo */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          {/* Controls: Filter & Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-gray-500 font-semibold">Estado:</span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'active', label: 'Activos' },
                { id: 'redeemed', label: 'Canjeados' },
                { id: 'expired', label: 'Vencidos' },
                { id: 'cancelled', label: 'Cancelados' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setVoucherFilterStatus(st.id)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                    voucherFilterStatus === st.id
                      ? 'bg-navy text-gold font-bold shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-72">
              <div className="relative">
                <input
                  type="text"
                  value={voucherSearch}
                  onChange={(e) => setVoucherSearch(e.target.value)}
                  placeholder="Buscar por código, paciente, teléfono..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <svg
                  className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Vouchers Grid */}
          {loadingVouchers ? (
            <div className="p-12 text-center text-xs text-gray-400 bg-white rounded-xl border border-gray-200">
              Cargando vouchers y tarjetas de regalo...
            </div>
          ) : vouchers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gold/40 p-12 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-sand flex items-center justify-center text-gold shadow-inner">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-playfair font-bold text-navy">
                  {voucherSearch ? 'No se encontraron vouchers coincidentes' : 'Aún no hay vouchers emitidos'}
                </h3>
                <p className="text-xs text-gray-500">
                  Crea tarjetas de regalo de lujo, bonos de bienvenida para nuevos pacientes o cupones VIP con formato imprimible y envío directo por WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateVoucherOpen(true)}
                className="px-5 py-2.5 bg-gold text-white text-xs font-bold rounded-xl hover:bg-gold/90 shadow-md inline-flex items-center gap-2"
              >
                + Emitir Primer Voucher
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vouchers.map((v) => {
                const isRedeemed = v.status === 'redeemed'
                const isExpired = v.status === 'expired'
                const isActive = v.status === 'active'

                return (
                  <div
                    key={v.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-gold p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
                  >
                    <div className="space-y-3">
                      {/* Top Code & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-navy text-gold tracking-widest border border-gold/40 shadow-xs">
                          {v.voucher_code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRedeemed
                              ? 'bg-blue-100 text-blue-800'
                              : isExpired
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isActive ? '● Activo' : isRedeemed ? '✓ Canjeado' : isExpired ? 'Vencido' : 'Cancelado'}
                        </span>
                      </div>

                      {/* Title & Value */}
                      <div>
                        <h4 className="font-playfair font-bold text-base text-navy leading-snug">{v.title}</h4>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-xl font-extrabold text-gold font-playfair">
                            {v.discount_type === 'percentage'
                              ? `${v.discount_value}% OFF`
                              : `RD$ ${Number(v.discount_value).toLocaleString()}`}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {v.discount_type === 'percentage' ? 'en procedimiento' : 'de crédito de regalo'}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-3 bg-sand/30 rounded-xl space-y-1.5 text-xs text-gray-700 border border-sand">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-[11px]">Beneficiario:</span>
                          <span className="font-semibold text-navy truncate max-w-[170px]">
                            {v.beneficiary_name || v.patient?.full_name || 'Al Portador'}
                          </span>
                        </div>
                        {v.procedure && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-[11px]">Procedimiento:</span>
                            <span className="font-medium text-navy truncate max-w-[170px]">
                              {v.procedure.name}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-[11px]">Vence:</span>
                          <span className="font-medium text-gray-700">
                            {formatDate(v.expiration_date, 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </div>

                      {isRedeemed && v.redeemed_at && (
                        <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                          Canjeado el {formatDate(v.redeemed_at, 'dd/MM/yyyy hh:mm a')}
                          {v.notes && <p className="text-[10px] text-gray-500 mt-0.5">Nota: {v.notes}</p>}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedVoucherForCard(v)}
                        className="text-xs font-semibold text-navy hover:text-gold flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver Tarjeta
                      </button>

                      <div className="flex items-center gap-1.5">
                        {isActive && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCancelVoucher(v.id, v.voucher_code)}
                              className="text-[11px] text-gray-400 hover:text-red-600 px-2 py-1 rounded transition-colors"
                            >
                              Anular
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRedeem(v)}
                              className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-lg transition-colors shadow-xs"
                            >
                              Canjear
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Parrilla de Redes Sociales */}
      {activeTab === 'planner' && (
        <div className="space-y-8">
          {/* Social Copy Library Component */}
          <SocialCopyAssistant onUseTemplate={handleUseCopyTemplate} />

          {/* Scheduled Posts View */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="font-playfair text-lg font-bold text-navy">Parrilla Editorial y Calendario</h3>
              <button
                type="button"
                onClick={() => setShowPostModal(true)}
                className="text-xs font-bold text-gold hover:text-gold/80 flex items-center gap-1"
              >
                + Programar Publicación
              </button>
            </div>

            {loadingPosts ? (
              <div className="p-12 text-center text-xs text-gray-400">Cargando publicaciones...</div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 mx-auto rounded-full bg-sand/30 flex items-center justify-center text-gold">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No hay publicaciones programadas en la parrilla editorial.</p>
                <button
                  type="button"
                  onClick={() => setShowPostModal(true)}
                  className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-lg hover:bg-gold/90"
                >
                  + Programar Primera Publicación
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3 hover:border-gold transition-colors flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {post.platforms.map((plat) => (
                            <span key={plat} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy/10 text-navy capitalize">
                              {plat}
                            </span>
                          ))}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          post.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : post.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {post.status === 'published' ? 'Publicado' : post.status === 'scheduled' ? 'Programado' : 'Borrador'}
                        </span>
                      </div>

                      <h3 className="font-playfair font-bold text-base text-navy">{post.title}</h3>
                      <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-line leading-relaxed">
                        {post.content_copy}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>
                        {post.scheduled_for ? format(new Date(post.scheduled_for), "d MMM, hh:mm a", { locale: es }) : 'Sin fecha'}
                      </span>
                      {post.status === 'scheduled' && (
                        <button
                          type="button"
                          onClick={() => updatePostStatus({ id: post.id, status: 'published' })}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          ✓ Marcar Publicado
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Campañas Publicitarias y Ofertas */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Campaigns Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm space-y-2">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-playfair font-bold text-base text-navy">Campañas Publicitarias Activas</h3>
                <p className="text-xs text-gray-500">Objetivos comerciales, captación de leads y control de presupuestos</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCampaignModal(true)}
                className="px-3 py-1.5 bg-navy text-gold text-xs font-bold rounded-lg hover:bg-navy/90 transition-colors"
              >
                + Nueva Campaña
              </button>
            </div>

            {loadingCampaigns ? (
              <div className="p-12 text-center text-xs text-gray-400">Cargando campañas...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                No hay campañas de marketing registradas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3">Nombre de Campaña</th>
                      <th className="px-6 py-3">Objetivo</th>
                      <th className="px-6 py-3">Presupuesto</th>
                      <th className="px-6 py-3">Inicio</th>
                      <th className="px-6 py-3">Fin</th>
                      <th className="px-6 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {campaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-navy">
                          {camp.name}
                          {camp.description && <span className="block text-[11px] text-gray-400 font-normal">{camp.description}</span>}
                        </td>
                        <td className="px-6 py-4 capitalize text-gray-600">{camp.objective.replace('_', ' ')}</td>
                        <td className="px-6 py-4 font-semibold text-navy">RD$ {camp.budget?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-600">{camp.start_date}</td>
                        <td className="px-6 py-4 text-gray-600">{camp.end_date || 'En curso'}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            {camp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Offers & Promo Coupons Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div>
                <h3 className="font-playfair font-bold text-base text-navy">Cupones Promocionales y Descuentos</h3>
                <p className="text-xs text-gray-500">Códigos promocionales configurados para publicidad y recepción</p>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferModal(true)}
                className="text-xs font-bold text-gold hover:text-gold/80"
              >
                + Crear Cupón
              </button>
            </div>

            {loadingOffers ? (
              <div className="p-12 text-center text-xs text-gray-400">Cargando ofertas...</div>
            ) : offers.length === 0 ? (
              <div className="bg-white p-12 text-center text-sm text-gray-500 rounded-xl border border-gray-200">
                No hay ofertas promocionales configuradas.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {offers.map((offer) => (
                  <div key={offer.id} className="bg-white rounded-xl border-2 border-dashed border-gold/40 p-5 shadow-sm space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded bg-gold/10 text-gold font-bold text-sm tracking-wider">
                        {offer.promo_code || 'SIN CÓDIGO'}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        {offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` : `RD$ ${offer.discount_value} OFF`}
                      </span>
                    </div>

                    <h3 className="font-playfair font-bold text-base text-navy">{offer.title}</h3>
                    {offer.procedure && (
                      <p className="text-xs text-gray-500">Aplica a: <strong>{offer.procedure.name}</strong></p>
                    )}

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{offer.redemptions_count} canjes</span>
                      <span className={offer.is_active ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                        {offer.is_active ? '● Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Kit de Branding e Identidad */}
      {activeTab === 'branding' && (
        <ClinicBrandingKit />
      )}

      {/* MODALS */}
      {/* 1. Modal Emitir Voucher */}
      <VoucherModal
        isOpen={isCreateVoucherOpen}
        onClose={() => setIsCreateVoucherOpen(false)}
        onCreated={(v) => {
          setSelectedVoucherForCard(v)
        }}
      />

      {/* 2. Modal Ver Tarjeta de Regalo / Imprimir / WhatsApp */}
      <VoucherCardView
        isOpen={!!selectedVoucherForCard}
        onClose={() => setSelectedVoucherForCard(null)}
        voucher={selectedVoucherForCard}
        onRedeemClick={(v) => {
          setSelectedVoucherForCard(null)
          handleOpenRedeem(v)
        }}
      />

      {/* 3. Modal Validar y Canjear Bono */}
      <RedeemVoucherModal
        isOpen={isRedeemOpen}
        onClose={() => {
          setIsRedeemOpen(false)
          setVoucherToRedeem(null)
        }}
        initialVoucher={voucherToRedeem}
      />

      {/* 4. Modal: Crear Post */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">Planificar Publicación para Redes</h3>
              <button type="button" onClick={() => setShowPostModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-navy mb-1">Título del Contenido *</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="ej. 5 Cuidados para mantener tus dientes blancos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Plataformas de Difusión *</label>
                <div className="flex flex-wrap gap-2">
                  {['instagram', 'facebook', 'tiktok', 'whatsapp'].map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => togglePlatform(plat)}
                      className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                        postPlatforms.includes(plat)
                          ? 'bg-navy text-gold shadow-sm'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Copy / Texto de la Publicación *</label>
                <textarea
                  rows={5}
                  required
                  value={postCopy}
                  onChange={(e) => setPostCopy(e.target.value)}
                  placeholder="Escribe el texto, hashtags y llamado a la acción (CTA) para tus seguidores..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-navy mb-1">Fecha y Hora Programada</label>
                  <input
                    type="datetime-local"
                    value={postDate}
                    onChange={(e) => setPostDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Campaña Vinculada</label>
                  <select
                    value={postCampaignId}
                    onChange={(e) => setPostCampaignId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  >
                    <option value="">Sin campaña</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPost}
                  className="px-5 py-2 bg-gold text-white font-bold rounded-lg hover:bg-gold/90 shadow-sm disabled:opacity-50"
                >
                  {isCreatingPost ? 'Guardando...' : 'Guardar en Parrilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Crear Campaña */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">Nueva Campaña Publicitaria</h3>
              <button type="button" onClick={() => setShowCampaignModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-navy mb-1">Nombre de la Campaña *</label>
                <input
                  type="text"
                  required
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="ej. Campaña Estética de Navidad 2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Objetivo de la Campaña</label>
                <select
                  value={campObj}
                  onChange={(e) => setCampObj(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                >
                  <option value="leads">Captación de Nuevos Pacientes (Leads)</option>
                  <option value="procedure_promotion">Promoción de Procedimiento Específico</option>
                  <option value="brand_awareness">Reconocimiento y Posicionamiento de Marca</option>
                  <option value="retention">Fidelización de Pacientes Existentes</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Presupuesto Asignado (RD$)</label>
                <input
                  type="number"
                  min={0}
                  value={campBudget}
                  onChange={(e) => setCampBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Descripción / Metas</label>
                <textarea
                  rows={2}
                  value={campDesc}
                  onChange={(e) => setCampDesc(e.target.value)}
                  placeholder="Meta de consultas captadas, canales a utilizar..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="px-5 py-2 bg-gold text-white font-bold rounded-lg hover:bg-gold/90 shadow-sm disabled:opacity-50"
                >
                  {isCreatingCampaign ? 'Creando...' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Crear Oferta */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">Crear Oferta y Cupón</h3>
              <button type="button" onClick={() => setShowOfferModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-navy mb-1">Título de la Oferta *</label>
                <input
                  type="text"
                  required
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="ej. 20% en Implantes Dentales de Titanio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-navy mb-1">Código Promocional *</label>
                  <input
                    type="text"
                    required
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    placeholder="ej. VERANO20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none uppercase font-bold text-gold"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Tipo de Descuento</label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed_amount">Monto Fijo (RD$)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Valor del Descuento *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={offerValue}
                  onChange={(e) => setOfferValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Procedimiento Aplicable (Opcional)</label>
                <select
                  value={offerProcId}
                  onChange={(e) => setOfferProcId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                >
                  <option value="">Aplica a todos los procedimientos</option>
                  {procedures.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOffer}
                  className="px-5 py-2 bg-gold text-white font-bold rounded-lg hover:bg-gold/90 shadow-sm disabled:opacity-50"
                >
                  {isCreatingOffer ? 'Creando...' : 'Publicar Oferta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
