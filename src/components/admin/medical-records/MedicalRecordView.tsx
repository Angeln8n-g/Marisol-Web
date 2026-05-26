import React, { useState } from 'react'
import type { MedicalRecord, RecordDocument } from '../../../types'
import { formatDate, formatFileSize } from '../../../lib/utils'
import { DocumentUploader } from './DocumentUploader'

interface MedicalRecordViewProps {
  records: (MedicalRecord & { documents: RecordDocument[] })[]
  isLoading: boolean
  onUploadDocument: (recordId: string, file: File) => Promise<void>
  onDeleteDocument: (documentId: string, fileUrl: string) => Promise<void>
  isUploading?: boolean
}

export const MedicalRecordView: React.FC<MedicalRecordViewProps> = ({
  records,
  isLoading,
  onUploadDocument,
  onDeleteDocument,
  isUploading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 flex justify-center">
        <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm text-gray-500 font-montserrat mt-3">
          No hay registros médicos para este paciente
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const isExpanded = expandedId === record.id
        return (
          <div
            key={record.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : record.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">{record.chief_complaint}</p>
                  <p className="text-xs text-gray-500 font-montserrat mt-0.5">
                    {formatDate(record.record_date)} · {record.documents?.length || 0} documento{(record.documents?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-montserrat">
                  {record.diagnosis && (
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">Diagnóstico</p>
                      <p className="text-gray-700">{record.diagnosis}</p>
                    </div>
                  )}
                  {record.treatment_plan && (
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">Plan de Tratamiento</p>
                      <p className="text-gray-700">{record.treatment_plan}</p>
                    </div>
                  )}
                </div>

                {record.notes && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1">Notas</p>
                    <p className="text-sm text-gray-700 font-montserrat">{record.notes}</p>
                  </div>
                )}

                {record.documents && record.documents.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-2 font-montserrat">
                      Documentos ({record.documents.length})
                    </p>
                    <div className="space-y-2">
                      {record.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-200"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div className="min-w-0">
                              <p className="text-sm text-navy truncate font-montserrat">{doc.file_name}</p>
                              <p className="text-xs text-gray-500 font-montserrat">{formatFileSize(doc.file_size_bytes)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-gold transition-colors"
                              aria-label="Descargar"
                              title="Descargar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                            <button
                              onClick={() => onDeleteDocument(doc.id, doc.file_url)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                              aria-label="Eliminar"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500 font-semibold mb-2 font-montserrat">Subir Documento</p>
                  <DocumentUploader
                    onUpload={(file) => onUploadDocument(record.id, file)}
                    isUploading={isUploading}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
