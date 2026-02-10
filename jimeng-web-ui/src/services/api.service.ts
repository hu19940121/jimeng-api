import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'
import type {
  ApiConfig,
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageCompositionRequest,
  VideoGenerationRequest,
  ChatMessage,
} from '../types'
import { formatAuthHeader } from '../utils/region-prefix'

// Error types for user-friendly messages
export const ErrorType = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  TIMEOUT: 'TIMEOUT',
} as const

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType]

export interface AppError {
  type: ErrorType
  message: string
  originalError?: Error
}

// Error message mapping
const ERROR_MESSAGES: Record<ErrorType, string> = {
  NETWORK: '网络连接失败，请检查网络设置',
  AUTH: 'Session ID 无效或已过期，请重新配置',
  VALIDATION: '请求参数无效，请检查输入',
  SERVER: '服务器处理失败，请稍后重试',
  TIMEOUT: '请求超时，请稍后重试',
}

class ApiService {
  private axiosInstance: AxiosInstance
  private config: ApiConfig | null = null

  /**
   * 当后端自动续期产生新 SessionID 时的回调
   * 由外部（如 settings store）注入，避免循环依赖
   */
  onNewSessionId: ((newSessionId: string) => void) | null = null

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 900000, // 15 minutes - matches backend polling timeout
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.config) {
          config.baseURL = this.config.baseUrl
          config.headers.Authorization = formatAuthHeader(
            this.config.sessionId,
            this.config.region
          )
        }
        return config
      },
      (error) => Promise.reject(this.handleError(error))
    )

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const data = response.data as Record<string, unknown> | undefined

        // 检测后端自动续期返回的新 SessionID
        if (data && typeof data.new_session_id === 'string' && data.new_session_id) {
          console.log('[AutoSession] 检测到新的 Session ID:', data.new_session_id.substring(0, 10) + '...')
          this.onNewSessionId?.(data.new_session_id)
        }

        // 检查业务层错误（HTTP 200 但 code 不为 0）
        if (data && typeof data.code === 'number' && data.code !== 0) {
          const message = this.extractErrorMessage(data) || '请求失败'
          return Promise.reject({
            type: ErrorType.SERVER,
            message,
          } as AppError)
        }
        return response
      },
      (error) => Promise.reject(this.handleError(error))
    )
  }

  private handleError(error: AxiosError): AppError {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return {
          type: ErrorType.TIMEOUT,
          message: ERROR_MESSAGES.TIMEOUT,
          originalError: error,
        }
      }
      return {
        type: ErrorType.NETWORK,
        message: ERROR_MESSAGES.NETWORK,
        originalError: error,
      }
    }

    const status = error.response.status
    const data = error.response.data as Record<string, unknown> | undefined

    // 尝试从后端响应中提取错误信息
    const backendMessage = this.extractErrorMessage(data)

    if (status === 401 || status === 403) {
      return {
        type: ErrorType.AUTH,
        message: backendMessage || ERROR_MESSAGES.AUTH,
        originalError: error,
      }
    }

    if (status === 400 || status === 422) {
      return {
        type: ErrorType.VALIDATION,
        message: backendMessage || ERROR_MESSAGES.VALIDATION,
        originalError: error,
      }
    }

    return {
      type: ErrorType.SERVER,
      message: backendMessage || ERROR_MESSAGES.SERVER,
      originalError: error,
    }
  }

  /**
   * 从后端响应中提取错误信息
   */
  private extractErrorMessage(data: Record<string, unknown> | undefined): string | null {
    if (!data) return null

    // 尝试多种常见的错误消息字段
    if (typeof data.message === 'string') return data.message
    if (typeof data.errmsg === 'string') return data.errmsg
    if (typeof data.error === 'string') return data.error
    if (typeof data.error === 'object' && data.error !== null) {
      const errorObj = data.error as Record<string, unknown>
      if (typeof errorObj.message === 'string') return errorObj.message
    }

    return null
  }

  /**
   * Set API configuration
   */
  setConfig(config: ApiConfig): void {
    this.config = config
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiConfig | null {
    return this.config
  }

  /**
   * Get authorization header
   */
  getAuthHeader(): { Authorization: string } | null {
    if (!this.config) return null
    return {
      Authorization: formatAuthHeader(this.config.sessionId, this.config.region),
    }
  }


  /**
   * Generate images from text prompt
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  async generateImages(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const payload: Record<string, unknown> = {
      model: request.model,
      prompt: request.prompt,
    }

    // Include optional parameters if provided
    if (request.ratio) payload.ratio = request.ratio
    if (request.resolution) payload.resolution = request.resolution
    if (request.negative_prompt) payload.negative_prompt = request.negative_prompt
    if (request.sample_strength !== undefined)
      payload.sample_strength = request.sample_strength
    if (request.intelligent_ratio !== undefined)
      payload.intelligent_ratio = request.intelligent_ratio

    const response = await this.axiosInstance.post<ImageGenerationResponse>(
      '/v1/images/generations',
      payload
    )

    return response.data
  }


  /**
   * Compose images (image-to-image generation)
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async composeImages(
    request: ImageCompositionRequest
  ): Promise<ImageGenerationResponse> {
    const formData = new FormData()

    formData.append('model', request.model)
    formData.append('prompt', request.prompt)

    // Handle images - can be URLs (strings) or Files
    for (const image of request.images) {
      if (typeof image === 'string') {
        // URL input
        formData.append('image_urls', image)
      } else if (image instanceof File) {
        // File input
        formData.append('images', image, image.name)
      }
    }

    // Include optional parameters
    if (request.ratio) formData.append('ratio', request.ratio)
    if (request.resolution) formData.append('resolution', request.resolution)
    if (request.sample_strength !== undefined) {
      formData.append('sample_strength', request.sample_strength.toString())
    }

    const response = await this.axiosInstance.post<ImageGenerationResponse>(
      '/v1/images/compositions',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    return response.data
  }


  /**
   * Generate video from text or images
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async generateVideo(
    request: VideoGenerationRequest,
    firstFrame?: File,
    lastFrame?: File
  ): Promise<{ url: string }> {
    const formData = new FormData()

    formData.append('model', request.model)
    formData.append('prompt', request.prompt)

    // Include optional parameters
    if (request.ratio) formData.append('ratio', request.ratio)
    if (request.resolution) formData.append('resolution', request.resolution)
    if (request.duration) formData.append('duration', request.duration.toString())

    // Handle frame uploads
    if (firstFrame) {
      formData.append('first_frame', firstFrame, firstFrame.name)
    }
    if (lastFrame) {
      formData.append('last_frame', lastFrame, lastFrame.name)
    }

    // Handle file paths if provided (for URL-based frames)
    if (request.file_paths && request.file_paths.length > 0) {
      request.file_paths.forEach((path) => {
        formData.append('file_paths', path)
      })
    }

    const response = await this.axiosInstance.post<{
      created: number
      data: Array<{ url: string; revised_prompt?: string }>
    }>(
      '/v1/videos/generations',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    // 从 data 数组中提取第一个视频的 URL
    const videoUrl = response.data.data?.[0]?.url
    if (!videoUrl) {
      throw new Error('视频生成失败：未返回视频URL')
    }

    return { url: videoUrl }
  }


  /**
   * Send chat message (non-streaming)
   * Requirements: 5.1
   */
  async chat(
    messages: Array<{ role: string; content: string }>
  ): Promise<ChatMessage> {
    const response = await this.axiosInstance.post('/v1/chat/completions', {
      messages,
      stream: false,
    })

    const data = response.data
    return {
      id: data.id || crypto.randomUUID(),
      role: 'assistant',
      content: data.choices?.[0]?.message?.content || '',
      timestamp: Date.now(),
    }
  }

  /**
   * Generate new session ID
   */
  async generateSession(): Promise<{ sessionId: string; message: string }> {
    const response = await this.axiosInstance.post<{
      sessionId: string
      message: string
      timestamp: number
    }>('/v1/session/generate')

    return {
      sessionId: response.data.sessionId,
      message: response.data.message,
    }
  }

  /**
   * Get user credit points
   */
  async getCredit(): Promise<{
    giftCredit: number
    purchaseCredit: number
    vipCredit: number
    totalCredit: number
  }> {
    const response = await this.axiosInstance.post<
      Array<{
        token: string
        points: {
          giftCredit: number
          purchaseCredit: number
          vipCredit: number
          totalCredit: number
        }
      }>
    >('/token/points')

    // 返回第一个token的积分信息
    if (response.data && response.data.length > 0 && response.data[0]) {
      return response.data[0].points
    }

    throw new Error('无法获取积分信息')
  }

  /**
   * Send chat message with streaming (SSE)
   * Requirements: 5.1, 5.2
   */
  chatStream(
    messages: Array<{ role: string; content: string }>,
    onMessage: (content: string, done: boolean) => void,
    onError?: (error: AppError) => void
  ): () => void {
    if (!this.config) {
      onError?.({
        type: ErrorType.AUTH,
        message: ERROR_MESSAGES.AUTH,
      })
      return () => {}
    }

    const controller = new AbortController()
    const authHeader = formatAuthHeader(this.config.sessionId, this.config.region)

    fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        messages,
        stream: true,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            onMessage('', true)
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') {
                onMessage('', true)
                return
              }

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                if (content) {
                  onMessage(content, false)
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          onError?.({
            type: ErrorType.NETWORK,
            message: ERROR_MESSAGES.NETWORK,
            originalError: error,
          })
        }
      })

    // Return abort function
    return () => controller.abort()
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export class for testing
export { ApiService }
