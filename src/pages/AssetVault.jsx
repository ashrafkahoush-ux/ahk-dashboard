import { FolderOpen, FileText, Lock, Download, ExternalLink, Shield } from 'lucide-react'

export default function AssetVault() {
  const assetCategories = [
    {
      id: 1,
      name: 'Investor Packs',
      description: 'Pitch decks, financial projections, and investor presentations',
      files: 8,
      lastUpdated: '2 days ago',
      icon: FileText,
      color: 'from-ahk-navy-600 to-ahk-navy-800'
    },
    {
      id: 2,
      name: 'Case Studies',
      description: 'Success stories, client testimonials, and market validation',
      files: 5,
      lastUpdated: '1 week ago',
      icon: FolderOpen,
      color: 'from-ahk-gold-500 to-ahk-gold-700'
    },
    {
      id: 3,
      name: 'Templates',
      description: 'Marketing materials, contracts, and operational templates',
      files: 12,
      lastUpdated: '3 days ago',
      icon: FileText,
      color: 'from-ahk-slate-600 to-ahk-slate-800'
    },
    {
      id: 4,
      name: 'Data Room',
      description: 'Confidential business documents for due diligence',
      files: 15,
      lastUpdated: '5 days ago',
      icon: Lock,
      color: 'from-red-600 to-red-800'
    }
  ]

  const recentFiles = [
    { name: 'AHK_Strategic_Overview_Q4_2025.pdf', category: 'Investor Packs', size: '2.4 MB', date: '2025-10-30' },
    { name: 'Project_QVAN_Pitch_Deck.pptx', category: 'Investor Packs', size: '8.7 MB', date: '2025-10-29' },
    { name: 'DVM_Case_Study_Dealer_Network.pdf', category: 'Case Studies', size: '1.8 MB', date: '2025-10-28' },
    { name: 'Marketing_Campaign_Template.docx', category: 'Templates', size: '450 KB', date: '2025-10-27' },
    { name: 'Financial_Projections_2026.xlsx', category: 'Data Room', size: '1.2 MB', date: '2025-10-26' }
  ]

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

      {/* Asset Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {assetCategories.map((category) => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              className="card hover:shadow-xl transition-all text-left group"
            >
              <div className={`bg-gradient-to-br ${category.color} rounded-lg p-4 mb-4 group-hover:scale-105 transition-transform`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-display font-bold text-ahk-navy-900 mb-2">
                {category.name}
              </h3>
              <p className="text-sm text-ahk-slate-600 mb-4">
                {category.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ahk-slate-600">{category.files} files</span>
                <span className="text-ahk-slate-500">{category.lastUpdated}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Recent Files */}
      <div className="card">
        <h3 className="text-xl font-display font-bold text-ahk-navy-900 mb-4">
          Recent Files
        </h3>
        <div className="space-y-2">
          {recentFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 hover:bg-ahk-slate-50 rounded-lg transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-ahk-slate-100 rounded-lg p-3 group-hover:bg-ahk-navy-100 transition-colors">
                  <FileText className="w-5 h-5 text-ahk-navy-700" />
                </div>
                <div>
                  <p className="font-semibold text-ahk-navy-900 group-hover:text-ahk-navy-700">
                    {file.name}
                  </p>
                  <p className="text-sm text-ahk-slate-600">
                    {file.category} • {file.size}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-ahk-slate-600">
                  {new Date(file.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <button className="p-2 hover:bg-ahk-slate-200 rounded-lg transition-colors">
                  <Download className="w-5 h-5 text-ahk-slate-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
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
