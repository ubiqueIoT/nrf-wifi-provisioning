import React from 'react'

const ScanResult = ({ net, onClick, isSelected }) => {
  return (
    <div
      key={net.id}
      onClick={onClick}
    >
      <div className={`flex items-center justify-between p-2.5
                   hover:bg-gray-300 hover:cursor-pointer
                   ${isSelected && 'bg-gray-300'}`}
      >
        <div>
          <p>{net.name}</p>
          <p className='text-xs'>Channel {net.channel}</p>
        </div>
        <p>{net.rssi}</p>
      </div>
    </div>
  )
}

export default ScanResult
