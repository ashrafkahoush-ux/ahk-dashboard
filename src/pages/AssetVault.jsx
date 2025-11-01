import { useState } from 'react'
import { FolderOpen, FileText, Lock, Download, ExternalLink, Shield, Copy, CheckCircle } from 'lucide-react'
import { useAssets, getSourceById } from '../utils/useData'

export default function AssetVault() {
  const categories = useAssets()
  const [copiedId, setCopiedId] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState({})

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const copyLink = (assetPath) => {
    const fullUrl = `${window.location.origin}/${assetPath}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(assetPath)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openAsset = (assetPath) => {
    window.open(`/${assetPath}`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-ahk-navy-900">
            Asset Vault
          </h1>
          <p className="text-ahk-slate-600 mt-1">
            Secure storage for all strategic documents and resources
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Upload New</span>
        </button>
      </div>

      {/* Security Notice */}
      <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300">
        <div className="flex items-start space-x-4">
          <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-blue-900 mb-1">Secure Data Room</h3>
            <p className="text-sm text-blue-800">
              All files are encrypted and access-controlled. Data Room folders are view-only for external parties.
              No internal file names or sensitive information exposed.
            </p>
          </div>
        </div>
      </div>

      {/* Asset Categories - Expandable */}
      <div className="space-y-4">
        {categories.map((category) => {
          const isExpanded = expandedCategories[category.id]
          const categoryIcon = category.id === 'CAT-DATA-ROOM' ? Lock : 
                               category.id === 'CAT-TEMPLATES' ? FileText : FolderOpen
          const Icon = categoryIcon
          
          return (
            <div key={category.id} className="card">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-ahk-slate-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className={`rounded-lg p-3 ${
                    category.id === 'CAT-DATA-ROOM' ? 'bg-red-100' :
                    category.id === 'CAT-INVESTOR-PACKS' ? 'bg-ahk-navy-100' :
                    'bg-ahk-gold-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      category.id === 'CAT-DATA-ROOM' ? 'text-red-600' :
                      category.id === 'CAT-INVESTOR-PACKS' ? 'text-ahk-navy-600' :
                      'text-ahk-gold-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-display font-bold text-ahk-navy-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-ahk-slate-600">
                      {category.items.length} file{category.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-ahk-slate-400">
                  {isExpanded ? '▼' : '▶'}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {category.items.map((item) => {
                    const sourceDoc = getSourceById(item.source_doc)
                    
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 bg-ahk-slate-50 rounded-lg hover:bg-ahk-slate-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold text-ahk-navy-900">{item.title}</p>
                            {item.confidential && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-semibold rounded">
                                CONFIDENTIAL
                              </span>
                            )}
                          </div>
                          {item.tags && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-ahk-slate-200 text-ahk-slate-700 text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {sourceDoc && (
                            <p className="text-xs text-ahk-slate-600">
                              Source: {sourceDoc.title}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => openAsset(item.path)}
                            className="p-2 bg-ahk-navy-500 text-white rounded-lg hover:bg-ahk-navy-600 transition-colors"
                            title="Open"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyLink(item.path)}
                            className={`p-2 rounded-lg transition-colors ${
                              copiedId === item.path
                                ? 'bg-green-500 text-white'
                                : 'bg-ahk-gold-500 text-white hover:bg-ahk-gold-600'
                            }`}
                            title="Copy Link"
                          >
                            {copiedId === item.path ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-br from-ahk-navy-700 to-ahk-navy-900 text-white">
          <h3 className="text-xl font-display font-bold mb-2">Google Drive Data Room</h3>
          <p className="text-white text-opacity-80 mb-4 text-sm">
            Access the main data room with organized folders for investor materials
          </p>
          <button className="btn-primary bg-white text-ahk-navy-900 hover:bg-ahk-slate-100 flex items-center space-x-2">
            <ExternalLink className="w-4 h-4" />
            <span>Open Data Room</span>
          </button>
        </div>

        <div className="card bg-gradient-to-br from-ahk-gold-500 to-ahk-gold-700 text-white">
          <h3 className="text-xl font-display font-bold mb-2">Generate QR Code</h3>
          <p className="text-white text-opacity-90 mb-4 text-sm">
            Create QR codes for pitch deck access and investor resource links
          </p>
          <button className="btn-primary bg-white text-ahk-gold-700 hover:bg-ahk-slate-100 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Create QR Code</span>
          </button>
        </div>
      </div>
    </div>
  )
}
