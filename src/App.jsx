import { load } from 'protobufjs'
import { useCallback, useEffect, useState } from 'react'
import { forgetConfig, getStatus, setConfig, startScan, stopScan, subscribeToCharacteristic } from './utils/ble'
import { v4 as uuidv4 } from 'uuid'
import DisconnectBtn from './components/DisconnectBtn'
import ConnectBtn from './components/ConnectBtn'
import ScanResult from './components/ScanResult'
import GetStatusBtn from './components/GetStatusBtn'
import StartScanBtn from './components/StartScanBtn'
import ForgetConfigBtn from './components/ForgetConfigBtn'
import BleScanBtn from './components/BleScanBtn'

const WIFI_SERVICE = '14387800-130c-49e7-b877-2881c89cb258'.toLowerCase()
const WIFI_CTRL_POINT_CHAR = '14387802-130c-49e7-b877-2881c89cb258'.toLowerCase()
const WIFI_DATA_OUT_CHAR = '14387803-130c-49e7-b877-2881c89cb258'.toLocaleLowerCase()

export default function App () {
  const textDecoder = new TextDecoder()
  const textEncoder = new TextEncoder()

  const [requestRoot, setRequestRoot] = useState(null)
  const [responseRoot, setResponseRoot] = useState(null)
  const [resultRoot, setResultRoot] = useState(null)

  const [device, setDevice] = useState(null)
  const [supportsBle, setSupportsBle] = useState(false)

  const [controlPointChar, setControlPointChar] = useState(null)

  const [networks, setNetworks] = useState([])
  const [status, setStatus] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState(null)
  const [networkPassword, setNetworkPassword] = useState('')
  const [connecting, setConnecting] = useState(false)

  const loadRoots = async () => {
    const request = await load('/proto/request.proto')
    const result = await load('/proto/result.proto')
    const response = await load('/proto/response.proto')
    setRequestRoot(request)
    setResultRoot(result)
    setResponseRoot(response)
  }

  useEffect(() => {
    if (navigator.bluetooth) {
      setSupportsBle(true)
      loadRoots()
    }
  }, [])

  const handleIncomingControlPoint = useCallback((event) => {
    if (responseRoot === null) { return }
    const SilverResponse = responseRoot.lookupType('silver.Response')
    const dataView = event.target.value
    const uint8Array = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength)
    const message = SilverResponse.decode(uint8Array)
    const messageJson = JSON.parse(JSON.stringify(message))
    setStatus(messageJson)
  }, [responseRoot])

  const handleIncomingDataPoint = useCallback((event) => {
    if (resultRoot === null) {
      return
    }
    const SilverResponse = resultRoot.lookupType('silver.Result')
    const dataView = event.target.value
    const uint8Array = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength)
    const message = SilverResponse.decode(uint8Array)
    const decodedString = textDecoder.decode(message?.scanRecord?.wifi?.ssid)
    const rssi = message.scanRecord.rssi
    setNetworks((prev) => {
      if (!decodedString || decodedString.length < 2) {
        return prev
      } else {
        return [...prev, {
          id: uuidv4(),
          name: decodedString,
          ssid: message.scanRecord.wifi.ssid,
          bssid: message.scanRecord.wifi.bssid,
          rssi,
          channel: parseInt(message.scanRecord.wifi.channel),
          band: parseInt(message.scanRecord.wifi.band),
          auth: parseInt(message.scanRecord.wifi.auth)
        }]
      }
    })
  }, [resultRoot])

  const handleStartBleScan = async () => {
    try {
      const params = { optionalServices: [WIFI_SERVICE], acceptAllDevices: true }
      const scanResult = await navigator.bluetooth.requestDevice(params)
      if (scanResult) {
        scanResult.addEventListener('gattserverdisconnected', () => setDevice(null))
        const server = await scanResult.gatt.connect()
        const wifiService = await server.getPrimaryService(WIFI_SERVICE)
        await subscribeToCharacteristic(wifiService, WIFI_DATA_OUT_CHAR, handleIncomingDataPoint)
        const char = await subscribeToCharacteristic(wifiService, WIFI_CTRL_POINT_CHAR, handleIncomingControlPoint)
        setControlPointChar(char)
        getStatus(char, requestRoot)
        setDevice(scanResult)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handleDisconnect = async () => {
    if (device !== null && device.gatt.connected) {
      device.gatt.disconnect()
      setDevice(null)
    }
  }

  if (!supportsBle) {
    return (
      <div>
        Please use a browser that supports web bluetooth
      </div>
    )
  }

  return (
    <div className='max-w-4xl mx-auto p-5 mt-5'>

      <div className='flex items-center justify-between mb-10'>
        <h1 className='text-3xl font-bold'>
          nRF WiFi Provisioning over BLE
        </h1>
        <BleScanBtn onClick={handleStartBleScan} />
      </div>

      {device
        ? (
          <div className='border border-gray-300 rounded-lg p-5'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>{device?.name}</h2>
              <div className='space-x-2.5'>
                <ForgetConfigBtn
                  onClick={async () => {
                    await forgetConfig(controlPointChar, requestRoot)
                  }}
                />
                <StartScanBtn
                  onClick={async () => {
                    await startScan(controlPointChar, requestRoot)
                  }}
                />
              </div>
            </div>

            <div className='flex items-center justify-between mt-5'>
              <p className='mt-5'>{JSON.stringify(status)}</p>
              <GetStatusBtn onClick={async () => await getStatus(controlPointChar, requestRoot)} />
            </div>

            <div className='p-2.5 mt-5 h-56 bg-gray-200 rounded-lg overflow-y-scroll'>
              {networks.map((net) => (
                <ScanResult
                  key={net.id}
                  net={net}
                  isSelected={selectedNetwork?.id === net.id}
                  onClick={async () => {
                    await stopScan(controlPointChar, requestRoot)
                    setSelectedNetwork(net)
                  }}
                />
              ))}
            </div>

            {selectedNetwork && (
              <div className='mt-5'>
                <p>Enter password for: {selectedNetwork.name}</p>
                <input
                  value={networkPassword}
                  onChange={(e) => setNetworkPassword(e.target.value)}
                  placeholder='Password'
                  className='w-1/3 border border-gray-300 rounded-md mt-2.5 mr-2.5 py-2 px-3'
                />
                <ConnectBtn
                  connecting={connecting}
                  onClick={async () => {
                    const passwordBytes = textEncoder.encode(networkPassword)
                    await setConfig(controlPointChar, requestRoot, selectedNetwork, passwordBytes)
                    setConnecting(true)
                    setTimeout(async () => {
                      await getStatus(controlPointChar, requestRoot)
                      setConnecting(false)
                    }, 10000)
                  }}
                />
              </div>
            )}

            <div className='flex justify-end mt-10'>
              <DisconnectBtn onClick={handleDisconnect} />
            </div>

          </div>)
        : (
          <div>
            No device connected
          </div>)}
    </div>
  )
}
