import React from 'react'

const BleScanBtn = ({ onClick }) => {
  return (
    <button
      className='bg-black rounded-lg text-white font-semibold px-5 py-2 uppercase'
      onClick={onClick}
    >
      Scan for BLE Devices
    </button>
  )
}

export default BleScanBtn
