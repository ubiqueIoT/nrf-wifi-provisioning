import React from 'react'

const StartScanBtn = ({ onClick }) => {
  return (
    <button
      className={`bg-green-500 text-white font-semibold
  uppercase rounded-lg px-5 py-2`}
      onClick={onClick}
    >
      Start Scan
    </button>
  )
}

export default StartScanBtn
