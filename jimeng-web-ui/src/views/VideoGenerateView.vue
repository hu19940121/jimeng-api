<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGenerationStore } from '../stores/generation.store'
import { useHistoryStore } from '../stores/history.store'
import { useSettingsStore } from '../stores/settings.store'
import { apiService } from '../services/api.service'
import { BaseButton, BaseSelect } from '../components/common'
import {
  PromptInput,
  ModelSelector,
  RatioSelector,
  ResolutionSelector,
  ImageUploader,
  VideoPlayer,
  GenerationProgress
} from '../components/generation'
import { getModelDurationOptions, modelSupportsResolution, getDefaultVideoModel } from '../config'
import type { AppError } from '../services/api.service'

interface UploadedImage {
  id: string
  file?: File
  url: string
  name: string
  isUrl: boolean
}

type VideoMode = 'text-to-video' | 'image-to-video' | 'first-last-frame'

const generationStore = useGenerationStore()
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()

// 从 localStorage 加载用户上次的选择
const FORM_STATE_KEY = 'jimeng_video_generate_form'
function loadFormState() {
  try {
    const stored = localStorage.getItem(FORM_STATE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  return {}
}

const savedState = loadFormState()

// Form state
const mode = ref<VideoMode>(savedState.mode || 'text-to-video')
const prompt = ref('')
const model = ref(savedState.model || getDefaultVideoModel(settingsStore.region))
const ratio = ref(savedState.ratio || '16:9')
const resolution = ref(savedState.resolution || '720p')
const duration = ref<number>(savedState.duration || 5)
const firstFrameImages = ref<UploadedImage[]>([])
const lastFrameImages = ref<UploadedImage[]>([])

// 保存表单状态到 localStorage
function saveFormState() {
  const state = {
    mode: mode.value,
    model: model.value,
    ratio: ratio.value,
    resolution: resolution.value,
    duration: duration.value
  }
  localStorage.setItem(FORM_STATE_KEY, JSON.stringify(state))
}

// 监听表单变化，自动保存
watch([mode, model, ratio, resolution, duration], () => {
  saveFormState()
})

// 从 URL query 参数加载（用于历史记录的"使用此提示词"功能）
import { useRoute } from 'vue-router'
import { onMounted } from 'vue'

const route = useRoute()

onMounted(() => {
  // 从 URL query 加载参数
  if (route.query.prompt) {
    prompt.value = String(route.query.prompt)
  }
  if (route.query.model) {
    model.value = String(route.query.model)
  }
  if (route.query.ratio) {
    ratio.value = String(route.query.ratio)
  }
  if (route.query.resolution) {
    resolution.value = String(route.query.resolution)
  }
  if (route.query.duration) {
    const d = parseInt(String(route.query.duration))
    if (!isNaN(d)) {
      duration.value = d
    }
  }
})

// Result state - 从 store 获取，支持持久化
const videoUrl = computed(() => taskState.value.results[0] || null)

// Mode options
const modeOptions = [
  { value: 'text-to-video', label: '文生视频' },
  { value: 'image-to-video', label: '图生视频' },
  { value: 'first-last-frame', label: '首尾帧生成' }
]

// 根据当前模型动态计算时长选项
const durationOptions = computed(() => {
  const options = getModelDurationOptions(model.value)
  return options.map(d => ({
    value: d,
    label: `${d} 秒`
  }))
})

// 当模型变化时，确保当前 duration 值在可选范围内
watch(model, (newModel) => {
  const options = getModelDurationOptions(newModel)
  if (!options.includes(duration.value) && options[0] !== undefined) {
    duration.value = options[0]
  }
})

// 当前模型是否支持分辨率参数
const currentModelSupportsResolution = computed(() => {
  return modelSupportsResolution(model.value)
})

// 当前类型的状态
const taskState = computed(() => generationStore.videoState)

// Computed
const isConfigured = computed(() => settingsStore.isConfigured)
const isLoading = computed(() => taskState.value.status === 'loading')

// 图生视频或首尾帧生成时禁用比例选择
const isRatioDisabled = computed(() => {
  return mode.value === 'image-to-video' || mode.value === 'first-last-frame'
})

const canGenerate = computed(() => {
  if (!isConfigured.value || !prompt.value.trim()) return false
  
  if (mode.value === 'text-to-video') {
    return true
  }
  if (mode.value === 'image-to-video') {
    return firstFrameImages.value.length > 0
  }
  if (mode.value === 'first-last-frame') {
    return firstFrameImages.value.length > 0 && lastFrameImages.value.length > 0
  }
  return false
})

// 监听区域变化，更新默认模型
watch(
  () => settingsStore.region,
  (newRegion) => {
    model.value = getDefaultVideoModel(newRegion)
  }
)

// Clear frames when mode changes
watch(mode, () => {
  firstFrameImages.value = []
  lastFrameImages.value = []
})

// Error message formatting
function formatError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as AppError).message
  }
  return '生成失败，请稍后重试'
}

// 监听 loading 状态，添加刷新警告
watch(isLoading, (loading) => {
  if (loading) {
    window.onbeforeunload = () => '视频正在生成中，刷新页面将中断任务。确定要离开吗？'
  } else {
    window.onbeforeunload = null
  }
})

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.onbeforeunload = null
})

async function handleGenerate() {
  if (!canGenerate.value) return

  // Configure API service
  apiService.setConfig({
    baseUrl: settingsStore.apiBaseUrl,
    sessionId: settingsStore.sessionId,
    region: settingsStore.region
  })

  generationStore.startGeneration('video')

  try {
    // Prepare frame files
    let firstFrame: File | undefined
    let lastFrame: File | undefined

    if (mode.value !== 'text-to-video' && firstFrameImages.value.length > 0) {
      const img = firstFrameImages.value[0]
      if (img) {
        firstFrame = img.file
      }
    }

    if (mode.value === 'first-last-frame' && lastFrameImages.value.length > 0) {
      const img = lastFrameImages.value[0]
      if (img) {
        lastFrame = img.file
      }
    }

    // 仅在模型支持时传递 resolution 参数
    const videoResolution = currentModelSupportsResolution.value ? resolution.value : undefined

    const response = await apiService.generateVideo(
      {
        model: model.value,
        prompt: prompt.value,
        ratio: ratio.value,
        resolution: videoResolution,
        duration: duration.value
      },
      firstFrame,
      lastFrame
    )

    generationStore.setResults('video', [response.url])

    // Save to history
    historyStore.addItem({
      type: 'video',
      prompt: prompt.value,
      params: {
        model: model.value,
        ratio: ratio.value,
        resolution: videoResolution,
        duration: duration.value,
        mode: mode.value
      },
      results: [response.url],
      thumbnail: firstFrameImages.value[0]?.url
    })
  } catch (error) {
    generationStore.setError('video', formatError(error))
  }
}
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-6">
    <!-- Left Panel - Controls -->
    <div class="lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
      <h1 class="text-xl font-bold text-gray-900">
        视频生成
      </h1>

      <!-- Configuration Warning -->
      <div
        v-if="!isConfigured"
        class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
      >
        <p class="text-sm text-yellow-800">
          请先在设置中配置 Session ID
        </p>
      </div>

      <!-- Mode Selector -->
      <BaseSelect
        v-model="mode"
        :options="modeOptions"
        label="生成模式"
        :disabled="isLoading"
      />

      <!-- First Frame Uploader (for image-to-video and first-last-frame) -->
      <ImageUploader
        v-if="mode !== 'text-to-video'"
        v-model="firstFrameImages"
        :max-files="1"
        :disabled="isLoading"
        :label="mode === 'first-last-frame' ? '首帧图片' : '参考图片'"
      />

      <!-- Last Frame Uploader (for first-last-frame only) -->
      <ImageUploader
        v-if="mode === 'first-last-frame'"
        v-model="lastFrameImages"
        :max-files="1"
        :disabled="isLoading"
        label="尾帧图片"
      />

      <!-- Prompt Input -->
      <PromptInput
        v-model="prompt"
        :disabled="isLoading"
        :show-negative-prompt="false"
        placeholder="描述您想要生成的视频内容..."
      />

      <!-- Model Selector -->
      <ModelSelector
        v-model="model"
        type="video"
        :region="settingsStore.region"
        :disabled="isLoading"
      />

      <!-- Ratio Selector -->
      <div>
        <RatioSelector
          v-model="ratio"
          type="video"
          :disabled="isLoading || isRatioDisabled"
        />
        
        <!-- Ratio Disabled Hint -->
        <div
          v-if="isRatioDisabled"
          class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <p class="text-xs text-blue-800">
              {{ mode === 'image-to-video' ? '图生视频模式下，视频比例将自动匹配上传图片的比例' : '首尾帧生成模式下，视频比例将自动匹配首帧图片的比例' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Resolution Selector (仅当模型支持时显示) -->
      <div v-if="currentModelSupportsResolution">
        <ResolutionSelector
          v-model="resolution"
          type="video"
          :disabled="isLoading"
        />
      </div>
      <!-- Resolution Not Supported Hint -->
      <div
        v-else
        class="p-2 bg-gray-50 border border-gray-200 rounded-lg"
      >
        <p class="text-xs text-gray-500">
          ℹ️ 当前模型不支持自定义分辨率参数（仅 Jimeng Video 3.0 / 3.0 Fast 支持 720p/1080p）
        </p>
      </div>

      <!-- Duration Selector -->
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-700">
          视频时长
        </label>
        <!-- 固定时长提示 -->
        <div
          v-if="durationOptions.length === 1"
          class="py-3 px-4 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 font-medium text-center"
        >
          {{ durationOptions[0]?.label }}（固定）
        </div>
        <!-- 可选时长按钮组 -->
        <div v-else :class="['grid gap-3', durationOptions.length <= 2 ? 'grid-cols-2' : 'grid-cols-3']">
          <button
            v-for="option in durationOptions"
            :key="option.value"
            type="button"
            :disabled="isLoading"
            :class="[
              'py-3 px-4 rounded-lg border-2 font-medium transition-all',
              duration === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-700 hover:border-gray-300',
              isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]"
            @click="duration = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Generate Button -->
      <BaseButton
        variant="primary"
        size="lg"
        class="w-full"
        :loading="isLoading"
        :disabled="!canGenerate"
        @click="handleGenerate"
      >
        {{ isLoading ? '生成中...' : '生成视频' }}
      </BaseButton>

      <!-- 生成中警告提示 -->
      <div v-if="isLoading" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="text-sm text-yellow-800 font-medium">生成中，请勿刷新页面</p>
            <p class="text-xs text-yellow-700 mt-1">视频生成需要较长时间，刷新页面将中断任务</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel - Results -->
    <div class="flex-1 min-w-0">
      <!-- Progress -->
      <GenerationProgress
        v-if="taskState.status !== 'idle'"
        :status="taskState.status"
        :message="generationStore.getErrorWithGuidance('video') || undefined"
        :start-time="taskState.startTime"
        :end-time="taskState.endTime"
        class="mb-6"
      >
        <!-- Session Error Guidance -->
        <div v-if="taskState.error && generationStore.isSessionError(taskState.error)" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
            </svg>
            <div class="flex-1">
              <p class="text-sm text-yellow-800 font-medium">Session ID 可能已过期</p>
              <p class="text-xs text-yellow-700 mt-1">请前往设置页面重新获取 Session ID，然后重试生成。</p>
              <router-link 
                to="/settings" 
                class="inline-flex items-center gap-1 mt-2 text-xs text-yellow-800 hover:text-yellow-900 font-medium underline"
              >
                前往设置页面
                <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                </svg>
              </router-link>
            </div>
          </div>
        </div>
      </GenerationProgress>

      <!-- Video Player -->
      <div v-if="videoUrl" class="max-w-3xl mx-auto">
        <h3 class="text-sm font-medium text-gray-700 mb-3">生成结果</h3>
        <VideoPlayer
          :src="videoUrl"
          :poster="firstFrameImages[0]?.url"
          :autoplay="false"
          :loop="true"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="taskState.status === 'idle'"
        class="flex flex-col items-center justify-center h-64 text-center"
      >
        <svg
          class="w-16 h-16 text-gray-300 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p class="text-gray-500">输入提示词并点击生成</p>
      </div>
    </div>
  </div>
</template>
