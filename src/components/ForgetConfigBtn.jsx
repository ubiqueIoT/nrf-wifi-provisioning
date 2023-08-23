import React from 'react'

const ForgetConfigBtn = ({ onClick }) => {
  return (
    <button
      className={`bg-red-500 text-white font-semibold
                uppercase rounded-lg px-5 py-2`}
      onClick={onClick}
    >
      Forget Config
    </button>
  )
}

export default ForgetConfigBtn
