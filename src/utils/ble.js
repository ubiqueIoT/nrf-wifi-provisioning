export const getStatus = async (char, root) => {
  if (root === null) { return }
  const Request = root.lookupType('silver.Request')

  const payload = { opCode: 1 }

  const error = Request.verify(payload)
  if (error) { throw new Error(error) }

  const buffer = Request.encode(payload).finish()
  await char.writeValue(buffer)
}

export const forgetConfig = async (char, root) => {
  if (root === null) { return }

  const Request = root.lookupType('silver.Request')
  const payload = { opCode: 5 }

  const error = Request.verify(payload)
  if (error) { throw new Error(error) }

  const buffer = Request.encode(payload).finish()
  await char.writeValue(buffer)
}

export const setConfig = async (char, root, wifiEntry, passphrase) => {
  if (root === null) { return }

  const Request = root.lookupType('silver.Request')

  const payload = {
    opCode: 4,
    config: {
      wifi: {
        ssid: wifiEntry.ssid,
        bssid: wifiEntry.bssid,
        channel: wifiEntry.channel,
        band: wifiEntry.band,
        auth: wifiEntry.auth
      },
      passphrase,
      volatileMemory: false
    }
  }
  console.log(payload)
  const error = Request.verify(payload)
  if (error) { throw new Error(error) }

  const buffer = Request.encode(payload).finish()
  await char.writeValue(buffer)
}

export const startScan = async (char, root) => {
  if (root === null) { return }
  const Request = root.lookupType('silver.Request')
  const BandEnum = root.lookupEnum('silver.Band')

  const payload = {
    opCode: 2,
    scanParams: {
      band: BandEnum.BAND_ANY,
      periodMs: 0
    }
  }
  const error = Request.verify(payload)
  if (error) { throw new Error(error) }

  const buffer = Request.encode(payload).finish()
  await char.writeValue(buffer)
}

export const stopScan = async (char, root) => {
  if (root === null) { return }
  const Request = root.lookupType('silver.Request')

  const payload = { opCode: 3 }

  const error = Request.verify(payload)
  if (error) { throw new Error(error) }

  const buffer = Request.encode(payload).finish()
  await char.writeValue(buffer)
}

export const subscribeToCharacteristic = async (service, charUuid, callback) => {
  try {
    const char = await service.getCharacteristic(charUuid)
    await char.startNotifications()
    char.addEventListener('characteristicvaluechanged', callback)
    return char
  } catch (e) {
    console.log(e)
  }
}
