import { API_BASE_URL } from "@/shared/api/client"

const SAMPLE_RATE = 16000
const AUDIO_CHUNK_SIZE = 4096
const STRING_HEADER_TYPE = 7
const encoder = new TextEncoder()
const decoder = new TextDecoder()

export interface AwsTranscriptChunk {
  confidence?: number
  isPartial: boolean
  text: string
}

export interface AwsTranscribeStream {
  stop: () => void
}

interface StartAwsTranscribeStreamOptions {
  token: string
  onClose: () => void
  onError: (message: string) => void
  onStatus: (message: string) => void
  onTranscript: (chunk: AwsTranscriptChunk) => void
  onVolume: (volume: number) => void
}

interface TranscribeAlternative {
  Transcript?: string
  Items?: Array<{ Confidence?: string }>
}

interface TranscribeResult {
  Alternatives?: TranscribeAlternative[]
  IsPartial?: boolean
}

interface TranscribePayload {
  Transcript?: {
    Results?: TranscribeResult[]
  }
}

const crcTable = (() => {
  const table = new Uint32Array(256)

  for (let index = 0; index < table.length; index += 1) {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[index] = value >>> 0
  }

  return table
})()

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff

  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, false)
}

function readUint32(bytes: Uint8Array, offset: number) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, false)
}

function concatBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const output = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.length
  }

  return output
}

function encodeHeader(name: string, value: string) {
  const nameBytes = encoder.encode(name)
  const valueBytes = encoder.encode(value)
  const output = new Uint8Array(1 + nameBytes.length + 1 + 2 + valueBytes.length)
  const view = new DataView(output.buffer)
  let offset = 0

  output[offset] = nameBytes.length
  offset += 1
  output.set(nameBytes, offset)
  offset += nameBytes.length
  output[offset] = STRING_HEADER_TYPE
  offset += 1
  view.setUint16(offset, valueBytes.length, false)
  offset += 2
  output.set(valueBytes, offset)

  return output
}

function encodeAudioEvent(payload: Uint8Array) {
  const headers = concatBytes([
    encodeHeader(":content-type", "application/octet-stream"),
    encodeHeader(":event-type", "AudioEvent"),
    encodeHeader(":message-type", "event"),
  ])
  const totalLength = 12 + headers.length + payload.length + 4
  const output = new Uint8Array(totalLength)
  const view = new DataView(output.buffer)

  writeUint32(view, 0, totalLength)
  writeUint32(view, 4, headers.length)
  writeUint32(view, 8, crc32(output.subarray(0, 8)))
  output.set(headers, 12)
  output.set(payload, 12 + headers.length)
  writeUint32(view, totalLength - 4, crc32(output.subarray(0, totalLength - 4)))

  return output
}

function decodeEventMessage(data: ArrayBuffer) {
  const bytes = new Uint8Array(data)
  const headersLength = readUint32(bytes, 4)
  const headersEnd = 12 + headersLength
  const headers: Record<string, string> = {}
  let offset = 12

  while (offset < headersEnd) {
    const nameLength = bytes[offset]
    offset += 1
    const name = decoder.decode(bytes.subarray(offset, offset + nameLength))
    offset += nameLength
    const valueType = bytes[offset]
    offset += 1

    if (valueType !== STRING_HEADER_TYPE) {
      throw new Error(`Unsupported AWS event-stream header type ${valueType}`)
    }

    const valueLength = new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(0, false)
    offset += 2
    headers[name] = decoder.decode(bytes.subarray(offset, offset + valueLength))
    offset += valueLength
  }

  return {
    headers,
    payload: bytes.subarray(headersEnd, bytes.length - 4),
  }
}

function downsampleToPcm(input: Float32Array, inputSampleRate: number) {
  if (inputSampleRate === SAMPLE_RATE) {
    return floatToPcm(input)
  }

  const ratio = inputSampleRate / SAMPLE_RATE
  const outputLength = Math.max(1, Math.floor(input.length / ratio))
  const output = new Float32Array(outputLength)

  for (let index = 0; index < outputLength; index += 1) {
    const start = Math.floor(index * ratio)
    const end = Math.min(input.length, Math.floor((index + 1) * ratio))
    let sum = 0
    let count = 0

    for (let sourceIndex = start; sourceIndex < end; sourceIndex += 1) {
      sum += input[sourceIndex]
      count += 1
    }

    output[index] = count > 0 ? sum / count : input[start] ?? 0
  }

  return floatToPcm(output)
}

function floatToPcm(input: Float32Array) {
  const output = new Int16Array(input.length)

  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]))
    output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }

  return new Uint8Array(output.buffer)
}

function getVolume(input: Float32Array) {
  let sum = 0

  for (const sample of input) {
    sum += sample * sample
  }

  return Math.min(1, Math.sqrt(sum / input.length) * 4.2)
}

function getAverageConfidence(alternative: TranscribeAlternative) {
  const confidences =
    alternative.Items?.map((item) => Number(item.Confidence)).filter((value) => Number.isFinite(value)) ?? []

  if (confidences.length === 0) return undefined
  return confidences.reduce((sum, value) => sum + value, 0) / confidences.length
}

async function getPresignedUrl(token: string) {
  const response = await fetch(`${API_BASE_URL}/candidate/interview/${encodeURIComponent(token)}/transcribe-presign`, {
    body: JSON.stringify({
      language_code: "vi-VN",
      media_encoding: "pcm",
      sample_rate: SAMPLE_RATE,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    const fallback = `Không lấy được AWS Transcribe URL (${response.status}).`
    try {
      const body = (await response.json()) as { detail?: string }
      throw new Error(body.detail || fallback)
    } catch (error) {
      if (error instanceof Error && error.message !== "Unexpected end of JSON input") throw error
      throw new Error(fallback)
    }
  }

  const payload = (await response.json()) as { url?: string }
  if (!payload.url) throw new Error("Backend không trả về AWS Transcribe URL.")

  return payload.url
}

function handleTranscribeMessage(data: ArrayBuffer, onTranscript: (chunk: AwsTranscriptChunk) => void) {
  const message = decodeEventMessage(data)
  const messageType = message.headers[":message-type"]
  const eventType = message.headers[":event-type"]
  const payloadText = decoder.decode(message.payload)

  if (messageType === "exception") {
    throw new Error(payloadText || "AWS Transcribe trả về lỗi.")
  }

  if (eventType !== "TranscriptEvent" || !payloadText) return

  const payload = JSON.parse(payloadText) as TranscribePayload
  const results = payload.Transcript?.Results ?? []

  for (const result of results) {
    const alternative = result.Alternatives?.[0]
    if (!alternative) continue

    const text = alternative?.Transcript?.trim()
    if (!text) continue

    onTranscript({
      confidence: result.IsPartial ? undefined : getAverageConfidence(alternative),
      isPartial: Boolean(result.IsPartial),
      text,
    })
  }
}

export async function startAwsTranscribeStream({
  token,
  onClose,
  onError,
  onStatus,
  onTranscript,
  onVolume,
}: StartAwsTranscribeStreamOptions): Promise<AwsTranscribeStream> {
  onStatus("Đang lấy AWS Transcribe URL")
  const [url, stream] = await Promise.all([
    getPresignedUrl(token),
    navigator.mediaDevices.getUserMedia({ audio: true }),
  ])

  const audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream)
  const processor = audioContext.createScriptProcessor(AUDIO_CHUNK_SIZE, 1, 1)
  const muteGain = audioContext.createGain()
  const socket = new WebSocket(url)
  let stopped = false
  let smoothedVolume = 0

  muteGain.gain.value = 0
  socket.binaryType = "arraybuffer"

  processor.onaudioprocess = (event) => {
    if (stopped || socket.readyState !== WebSocket.OPEN) return

    const input = event.inputBuffer.getChannelData(0)
    smoothedVolume = smoothedVolume * 0.7 + getVolume(input) * 0.3
    onVolume(smoothedVolume)
    socket.send(encodeAudioEvent(downsampleToPcm(input, audioContext.sampleRate)))
  }

  socket.onopen = () => {
    onStatus("AWS Transcribe đang nghe")
    source.connect(processor)
    processor.connect(muteGain)
    muteGain.connect(audioContext.destination)
  }

  socket.onmessage = (event) => {
    if (!(event.data instanceof ArrayBuffer)) return

    try {
      handleTranscribeMessage(event.data, onTranscript)
    } catch (error) {
      onError(error instanceof Error ? error.message : "Không đọc được phản hồi AWS Transcribe.")
    }
  }

  socket.onerror = () => {
    onError("Kết nối AWS Transcribe bị lỗi.")
  }

  socket.onclose = () => {
    onClose()
  }

  const cleanupAudio = () => {
    processor.disconnect()
    source.disconnect()
    muteGain.disconnect()
    stream.getTracks().forEach((track) => track.stop())
    void audioContext.close()
    onVolume(0)
  }

  return {
    stop: () => {
      if (stopped) return
      stopped = true
      cleanupAudio()

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(encodeAudioEvent(new Uint8Array()))
        window.setTimeout(() => socket.close(1000, "client stop"), 150)
      } else if (socket.readyState === WebSocket.CONNECTING) {
        socket.close(1000, "client stop")
      }
    },
  }
}
