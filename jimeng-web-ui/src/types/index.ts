// API Configuration
export interface ApiConfig {
  baseUrl: string
  sessionId: string
  region: 'cn' | 'us' | 'hk' | 'jp' | 'sg'
}

// Image Generation
export interface ImageGenerationRequest {
  model: string
  prompt: string
  ratio?: string
  resolution?: string
  negative_prompt?: string
  sample_strength?: number
  intelligent_ratio?: boolean
}

// Image Composition with intelligent_ratio
export interface ImageCompositionRequestExtended {
  model: string
  prompt: string
  images: (string | File)[]
  ratio?: string
  resolution?: string
  sample_strength?: number
  intelligent_ratio?: boolean
}

export interface ImageGenerationResponse {
  created: number
  data: Array<{ url: string }>
}

// Image Composition
export interface ImageCompositionRequest {
  model: string
  prompt: string
  images: (string | File)[]
  ratio?: string
  resolution?: string
  sample_strength?: number
}

// Video Generation
export interface VideoGenerationRequest {
  model: string
  prompt: string
  ratio?: string
  resolution?: string
  duration?: number
  file_paths?: string[]
}

// Chat
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  images?: string[]
  video?: string
}

// History
export interface HistoryItem {
  id: string
  type: 'image' | 'video' | 'composition'
  prompt: string
  params: Record<string, unknown>
  results: string[]
  createdAt: number
  thumbnail?: string
}

// Generation Status
export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error'

// Region
export type Region = 'cn' | 'us' | 'hk' | 'jp' | 'sg'
