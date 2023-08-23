import React from 'react'

const ConnectBtn = ({ onClick, connecting }) => {
  return (
    <button
      className={`px-5 py-2 uppercase font-semibold rounded-lg 
                  ${connecting
                    ? 'bg-gray-200 text-black'
                    : 'bg-blue-500 text-white'}`}
      disabled={connecting}
      onClick={onClick}
    >
      {connecting ? 'Connecting...' : 'Connect'}
    </button>
  )
}

export default ConnectBtn
