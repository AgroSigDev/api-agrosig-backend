function makeRateLimiter (maxEvents = 10, perMs = 10_000) {
  const map = new Map()
  return (socket) => {
    const now = Date.now()
    const info = map.get(socket.id) || { count: 0, ts: now }
    if (now - info.ts > perMs) {
      info.count = 1
      info.ts = now
    } else {
      info.count++
    }
    map.set(socket.id, info)
    return info.count <= maxEvents
  }
}

export {
  makeRateLimiter
}
