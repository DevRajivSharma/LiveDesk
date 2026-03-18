import { useSocketContext } from '../contexts/SocketContext'

function Cursors() {
  const { cursors, currentUser } = useSocketContext()

  return (
    <>
      {Object.values(cursors).map((cursor) => {
        // Don't show our own cursor
        if (currentUser && cursor.userId === currentUser.id) return null

        return (
          <div
            key={cursor.userId}
            className="pointer-events-none fixed z-[9999] flex flex-col items-start transition-all duration-75 ease-out"
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
            }}
          >
            {/* Cursor Icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: cursor.color }}
            >
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill="currentColor"
                stroke="white"
              />
            </svg>

            {/* User Label */}
            <div
              className="px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap shadow-sm mt-1"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.userName || 'Anonymous'}
            </div>
          </div>
        )
      })}
    </>
  )
}

export default Cursors
