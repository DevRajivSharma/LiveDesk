import { useSocketContext } from '../contexts/SocketContext'

function UserList() {
  const { users, currentUser, isConnected } = useSocketContext()

  return (
    <div className="flex flex-col bg-white border-l border-slate-200 w-64">
      
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          👥 Users
          <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
            {users.length}
          </span>
        </h3>
      </div>

      
      <div className="flex-1 overflow-y-auto p-2">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUser?.id

          return (
            <div
              key={user.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                isCurrentUser ? 'bg-primary-50' : 'hover:bg-slate-50'
              }`}
            >
              
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: user.color || '#6366f1' }}
              >
                {(user.name || 'A').charAt(0).toUpperCase()}
              </div>

              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {user.name || 'Anonymous'}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs text-primary-600">(you)</span>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  Joined {new Date(user.joinedAt).toLocaleTimeString()}
                </span>
              </div>

              
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
            </div>
          )
        })}

        {users.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No users yet</p>
          </div>
        )}
      </div>

      
      <div className="px-4 py-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-slate-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default UserList