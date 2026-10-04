export default function Settings() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-blue-900">Settings</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Language Preferences</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input type="radio" name="language" className="w-5 h-5 text-blue-600" defaultChecked />
              <span>English</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="radio" name="language" className="w-5 h-5 text-blue-600" />
              <span>Kiswahili</span>
            </label>
          </div>
        </div>
        
        <div className="space-y-4 pt-6 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Notifications</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
              <span>Safety Alerts</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" defaultChecked />
              <span>Fishing Recommendations</span>
            </label>
          </div>
        </div>
        
        <div className="pt-6 border-t border-gray-100">
          <button type="button" className="px-6 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition font-medium">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}