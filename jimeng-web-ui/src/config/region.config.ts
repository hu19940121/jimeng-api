import type { Region } from '../types'

// 模型信息接口
export interface ModelInfo {
  id: string
  name: string
  description: string
  regions: Region[]
  type: 'image' | 'video' | 'both'
  // 是否支持 intelligent_ratio
  supportsIntelligentRatio?: boolean
  // 特殊分辨率限制
  resolutionConstraints?: {
    // 强制使用的分辨率
    forcedResolution?: string
    // 是否忽略 ratio 参数
    ignoreRatio?: boolean
    // 仅在特定区域生效
    regions?: Region[]
  }[]
  // 视频模型：可选的时长选项
  durationOptions?: number[]
  // 视频模型：是否支持 resolution 参数（720p/1080p）
  supportsResolution?: boolean
}

// 分辨率选项
export interface ResolutionOption {
  value: string
  label: string
  description: string
  pixels: string
}

// 比例选项
export interface RatioOption {
  value: string
  label: string
  width: number
  height: number
}

// ==================== 图像生成模型 ====================
export const IMAGE_MODELS: ModelInfo[] = [
  // ⚠️ 暂时禁用：调用该模型会报服务器处理失败
  // {
  //   id: 'jimeng-4.5',
  //   name: 'Jimeng 4.5',
  //   description: '最新版本，支持2k/4k全部比例及智能比例',
  //   regions: ['cn', 'us', 'hk', 'jp', 'sg'],
  //   type: 'image',
  //   supportsIntelligentRatio: true
  // },
  {
    id: 'jimeng-4.1',
    name: 'Jimeng 4.1',
    description: '支持2k/4k全部比例及智能比例，全站通用',
    regions: ['cn', 'us', 'hk', 'jp', 'sg'],
    type: 'image',
    supportsIntelligentRatio: true
  },
  {
    id: 'jimeng-4.0',
    name: 'Jimeng 4.0',
    description: '稳定版本，国内外通用',
    regions: ['cn', 'us', 'hk', 'jp', 'sg'],
    type: 'image',
    supportsIntelligentRatio: true
  },
  {
    id: 'jimeng-3.1',
    name: 'Jimeng 3.1',
    description: '经典版本',
    regions: ['cn'],
    type: 'image'
  },
  {
    id: 'jimeng-3.0',
    name: 'Jimeng 3.0',
    description: '经典版本，国内外通用',
    regions: ['cn', 'us', 'hk', 'jp', 'sg'],
    type: 'image'
  },
  {
    id: 'jimeng-2.1',
    name: 'Jimeng 2.1',
    description: '早期版本',
    regions: ['cn'],
    type: 'image'
  },
  {
    id: 'jimeng-xl-pro',
    name: 'Jimeng XL Pro',
    description: '超大模型，适合复杂场景',
    regions: ['cn', 'us', 'hk', 'jp', 'sg'],
    type: 'image'
  },
  {
    id: 'nanobananapro',
    name: 'Nanobanana Pro',
    description: '国际站专属，支持ratio和resolution参数',
    regions: ['us', 'hk', 'jp', 'sg'],
    type: 'image'
  },
  {
    id: 'nanobanana',
    name: 'Nanobanana',
    description: '国际站专属，美国站固定1024x1024/2k',
    regions: ['us', 'hk', 'jp', 'sg'],
    type: 'image',
    resolutionConstraints: [
      {
        // 美国站：固定分辨率，忽略 ratio
        forcedResolution: '2k',
        ignoreRatio: true,
        regions: ['us']
      },
      {
        // 港/日/新：强制 1k，但支持自定义 ratio
        forcedResolution: '1k',
        ignoreRatio: false,
        regions: ['hk', 'jp', 'sg']
      }
    ]
  }
]

// ==================== 视频生成模型 ====================
export const VIDEO_MODELS: ModelInfo[] = [
  {
    id: 'jimeng-video-4.0-pro',
    name: 'Seedance 2.0 Pro',
    description: 'Seedance 2.0 专业版，支持15s时长',
    regions: ['cn'],
    type: 'video',
    durationOptions: [5, 10, 15],
    supportsResolution: false
  },
  {
    id: 'jimeng-video-4.0',
    name: 'Seedance 2.0',
    description: 'Seedance 2.0 标准版，支持15s时长',
    regions: ['cn'],
    type: 'video',
    durationOptions: [5, 10, 15],
    supportsResolution: false
  },
  // ⚠️ 暂时禁用：调用该模型会报服务器处理失败
  // {
  //   id: 'jimeng-video-3.5-pro',
  //   name: 'Jimeng Video 3.5 Pro',
  //   description: '专业版 v3.5，全站通用（默认）',
  //   regions: ['cn', 'us', 'hk', 'jp', 'sg'],
  //   type: 'video',
  //   durationOptions: [5, 10, 12],
  //   supportsResolution: false
  // },
  {
    id: 'jimeng-video-veo3',
    name: 'Veo3',
    description: 'Veo3 模型，固定8s时长，亚洲国际站专属',
    regions: ['hk', 'jp', 'sg'],
    type: 'video',
    durationOptions: [8],
    supportsResolution: false
  },
  {
    id: 'jimeng-video-veo3.1',
    name: 'Veo3.1',
    description: 'Veo3.1 模型，固定8s时长，亚洲国际站专属',
    regions: ['hk', 'jp', 'sg'],
    type: 'video',
    durationOptions: [8],
    supportsResolution: false
  },
  {
    id: 'jimeng-video-sora2',
    name: 'Sora2',
    description: 'Sora2 模型，亚洲国际站专属',
    regions: ['hk', 'jp', 'sg'],
    type: 'video',
    durationOptions: [4, 8, 12],
    supportsResolution: false
  },
  {
    id: 'jimeng-video-3.0-pro',
    name: 'Jimeng Video 3.0 Pro',
    description: '专业版，国内站及亚洲国际站',
    regions: ['cn', 'hk', 'jp', 'sg'],
    type: 'video',
    durationOptions: [5, 10],
    supportsResolution: false
  },
  {
    id: 'jimeng-video-3.0',
    name: 'Jimeng Video 3.0',
    description: '标准版，全站通用',
    regions: ['cn', 'us', 'hk', 'jp', 'sg'],
    type: 'video',
    durationOptions: [5, 10],
    supportsResolution: true
  },
  {
    id: 'jimeng-video-3.0-fast',
    name: 'Jimeng Video 3.0 Fast',
    description: '极速版，国内站及亚洲国际站',
    regions: ['cn', 'hk', 'jp', 'sg'],
    type: 'video',
    durationOptions: [5, 10],
    supportsResolution: true
  },
  {
    id: 'jimeng-video-2.0-pro',
    name: 'Jimeng Video 2.0 Pro',
    description: '专业版 v2，国内站及亚洲国际站',
    regions: ['cn', 'hk', 'jp', 'sg'],
    type: 'video',
    durationOptions: [5, 10],
    supportsResolution: false
  },
  {
    id: 'jimeng-video-2.0',
    name: 'Jimeng Video 2.0',
    description: '标准版 v2，国内站及亚洲国际站',
    regions: ['cn', 'hk', 'jp', 'sg'],
    type: 'video',
    durationOptions: [5, 10],
    supportsResolution: false
  }
]

// ==================== 分辨率配置 ====================
export const IMAGE_RESOLUTIONS: ResolutionOption[] = [
  { value: '1k', label: '1K', description: '标准', pixels: '1024×1024' },
  { value: '2k', label: '2K', description: '高清', pixels: '2048×2048' },
  { value: '4k', label: '4K', description: '超清', pixels: '4096×4096' }
]

export const VIDEO_RESOLUTIONS: ResolutionOption[] = [
  { value: '720p', label: '720P', description: '标准', pixels: '1280×720' },
  { value: '1080p', label: '1080P', description: '高清', pixels: '1920×1080' }
]

// ==================== 比例配置 ====================
export const IMAGE_RATIOS: RatioOption[] = [
  { value: '1:1', label: '1:1', width: 1, height: 1 },
  { value: '4:3', label: '4:3', width: 4, height: 3 },
  { value: '3:4', label: '3:4', width: 3, height: 4 },
  { value: '16:9', label: '16:9', width: 16, height: 9 },
  { value: '9:16', label: '9:16', width: 9, height: 16 },
  { value: '3:2', label: '3:2', width: 3, height: 2 },
  { value: '2:3', label: '2:3', width: 2, height: 3 },
  { value: '21:9', label: '21:9', width: 21, height: 9 }
]

export const VIDEO_RATIOS: RatioOption[] = [
  { value: '1:1', label: '1:1', width: 1, height: 1 },
  { value: '4:3', label: '4:3', width: 4, height: 3 },
  { value: '3:4', label: '3:4', width: 3, height: 4 },
  { value: '16:9', label: '16:9', width: 16, height: 9 },
  { value: '9:16', label: '9:16', width: 9, height: 16 },
  { value: '21:9', label: '21:9', width: 21, height: 9 }
]

// ==================== 默认值配置 ====================
export const DEFAULT_IMAGE_MODEL: Record<Region, string> = {
  cn: 'jimeng-3.0',
  us: 'jimeng-3.0',
  hk: 'jimeng-3.0',
  jp: 'jimeng-3.0',
  sg: 'jimeng-3.0'
}

// 默认视频模型改为 jimeng-video-3.5-pro（README 标记为 Default）
export const DEFAULT_VIDEO_MODEL: Record<Region, string> = {
  cn: 'jimeng-video-3.0',
  us: 'jimeng-video-3.0',
  hk: 'jimeng-video-3.0',
  jp: 'jimeng-video-3.0',
  sg: 'jimeng-video-3.0'
}

// ==================== 工具函数 ====================

/**
 * 获取指定区域可用的图像模型
 */
export function getAvailableImageModels(region: Region): ModelInfo[] {
  return IMAGE_MODELS.filter(model => model.regions.includes(region))
}

/**
 * 获取指定区域可用的视频模型
 */
export function getAvailableVideoModels(region: Region): ModelInfo[] {
  return VIDEO_MODELS.filter(model => model.regions.includes(region))
}

/**
 * 获取模型的分辨率约束
 */
export function getModelResolutionConstraint(
  modelId: string,
  region: Region
): { forcedResolution?: string; ignoreRatio?: boolean } | null {
  const model = IMAGE_MODELS.find(m => m.id === modelId)
  if (!model?.resolutionConstraints) return null

  const constraint = model.resolutionConstraints.find(
    c => c.regions?.includes(region)
  )
  return constraint || null
}

/**
 * 检查模型是否支持智能比例
 */
export function supportsIntelligentRatio(modelId: string): boolean {
  const model = IMAGE_MODELS.find(m => m.id === modelId)
  return model?.supportsIntelligentRatio ?? false
}

/**
 * 获取区域的默认图像模型
 */
export function getDefaultImageModel(region: Region): string {
  return DEFAULT_IMAGE_MODEL[region]
}

/**
 * 获取区域的默认视频模型
 */
export function getDefaultVideoModel(region: Region): string {
  return DEFAULT_VIDEO_MODEL[region]
}

/**
 * 获取视频模型的可用时长选项
 */
export function getModelDurationOptions(modelId: string): number[] {
  const model = VIDEO_MODELS.find(m => m.id === modelId)
  return model?.durationOptions ?? [5, 10]
}

/**
 * 检查视频模型是否支持分辨率参数
 */
export function modelSupportsResolution(modelId: string): boolean {
  const model = VIDEO_MODELS.find(m => m.id === modelId)
  return model?.supportsResolution ?? false
}

/**
 * 判断是否为国内站
 */
export function isDomesticRegion(region: Region): boolean {
  return region === 'cn'
}

/**
 * 判断是否为国际站
 */
export function isInternationalRegion(region: Region): boolean {
  return region !== 'cn'
}

/**
 * 获取区域显示名称
 */
export function getRegionDisplayName(region: Region): string {
  const names: Record<Region, string> = {
    cn: '国内站',
    us: '美国站',
    hk: '香港站',
    jp: '日本站',
    sg: '新加坡站'
  }
  return names[region]
}
