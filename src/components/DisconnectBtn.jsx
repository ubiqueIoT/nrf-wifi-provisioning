import React from 'react'

const DisconnectBtn = ({ onClick }) => {
  return (
    <button
      className='bg-white border border-black text-black font-semibold uppercase py-2 px-5 rounded-lg'
      onClick={onClick}
    >
      Disconnect
    </button>
  )
}

export default DisconnectBtn
