<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useGenerationStore } from '../stores/generation.store'
import { useHistoryStore } from '../stores/history.store'
import { useSettingsStore } from '../stores/settings.store'
import { apiService } from '../services/api.service'
import { BaseButton } from '../components/common'
import {
  PromptInput,
  ModelSelector,
  RatioSelector,
  ResolutionSelector,
  ImageGallery,
  GenerationProgress
} from '../components/generation'
import { getDefaultImageModel } from '../config'
import type { AppError } from '../services/api.service'

const generationStore = useGenerationStore()
const historyStore = useHistoryStore()
const settingsStore = useSettingsStore()

// 从 localStorage 加载用户上次的选择
const FORM_STATE_KEY = 'jimeng_text_to_image_form'
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
const prompt = ref('')
const negativePrompt = ref('')
const model = ref(savedState.model || getDefaultImageModel(settingsStore.region))
const ratio = ref(savedState.ratio || '1:1')
const resolution = ref(savedState.resolution || '1k')
const intelligentRatio = ref(savedState.intelligentRatio || false)

// 保存表单状态到 localStorage
function saveFormState() {
  const state = {
    model: model.value,
    ratio: ratio.value,
    resolution: resolution.value,
    intelligentRatio: intelligentRatio.value
  }
  localStorage.setItem(FORM_STATE_KEY, JSON.stringify(state))
}

// 监听表单变化，自动保存
watch([model, ratio, resolution, intelligentRatio], () => {
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
  if (route.query.negative_prompt) {
    negativePrompt.value = String(route.query.negative_prompt)
  }
  if (route.query.intelligent_ratio) {
    intelligentRatio.value = route.query.intelligent_ratio === 'true'
  }
})

// 模型约束状态
const modelConstraint = ref<{ forcedResolution?: string; ignoreRatio?: boolean } | null>(null)
const supportsIntelligentRatio = ref(false)

// 当前类型的状态
const taskState = computed(() => generationStore.imageState)

// Computed
const isConfigured = computed(() => settingsStore.isConfigured)
const isLoading = computed(() => taskState.value.status === 'loading')
const canGenerate = computed(() => prompt.value.trim().length > 0 && isConfigured.value)

// 比例是否被约束禁用
const ratioConstraintDisabled = computed(() => {
  return modelConstraint.value?.ignoreRatio || intelligentRatio.value
})

const ratioConstraintMessage = computed(() => {
  if (modelConstraint.value?.ignoreRatio) {
    return '当前模型在此区域固定输出 1024×1024，比例参数将被忽略'
  }
  if (intelligentRatio.value) {
    return '已启用智能比例，系统将根据提示词自动推断最佳比例'
  }
  return ''
})

// 强制分辨率
const forcedResolution = computed(() => {
  return modelConstraint.value?.forcedResolution || ''
})



// 监听区域变化，更新默认模型
watch(
  () => settingsStore.region,
  (newRegion) => {
    model.value = getDefaultImageModel(newRegion)
  }
)

// 处理模型约束变化
function handleConstraintChange(constraint: { forcedResolution?: string; ignoreRatio?: boolean } | null) {
  modelConstraint.value = constraint
}

// 处理智能比例支持变化
function handleIntelligentRatioSupport(supported: boolean) {
  supportsIntelligentRatio.value = supported
  // 如果模型不支持智能比例，自动关闭
  if (!supported) {
    intelligentRatio.value = false
  }
}

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
    window.onbeforeunload = () => '图像正在生成中，刷新页面将中断任务。确定要离开吗？'
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

  // 确定实际使用的参数
  const actualResolution = forcedResolution.value || resolution.value
  const actualRatio = ratioConstraintDisabled.value ? undefined : ratio.value

  generationStore.startGeneration('image')

  try {
    const response = await apiService.generateImages({
      model: model.value,
      prompt: prompt.value,
      ratio: actualRatio,
      resolution: actualResolution,
      negative_prompt: negativePrompt.value || undefined,
      intelligent_ratio: supportsIntelligentRatio.value && intelligentRatio.value ? true : undefined
    })

    const urls = response.data.map(item => item.url)
    generationStore.setResults('image', urls)

    // Save to history
    historyStore.addItem({
      type: 'image',
      prompt: prompt.value,
      params: {
        model: model.value,
        ratio: actualRatio,
        resolution: actualResolution,
        negative_prompt: negativePrompt.value,
        intelligent_ratio: intelligentRatio.value
      },
      results: urls,
      thumbnail: urls[0]
    })
  } catch (error) {
    generationStore.setError('image', formatError(error))
  }
}
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-6">
    <!-- Left Panel - Controls -->
    <div class="lg:w-80 xl:w-96 flex-shrink-0 space-y-6">
      <h1 class="text-xl font-bold text-gray-900">
        文生图
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

      <!-- Prompt Input -->
      <PromptInput
        v-model="prompt"
        v-model:negative-prompt="negativePrompt"
        :disabled="isLoading"
        placeholder="描述您想要生成的图像..."
      />

      <!-- Model Selector -->
      <ModelSelector
        v-model="model"
        :region="settingsStore.region"
        type="image"
        :disabled="isLoading"
        @constraint-change="handleConstraintChange"
        @intelligent-ratio-support="handleIntelligentRatioSupport"
      />

      <!-- Intelligent Ratio Toggle -->
      <div v-if="supportsIntelligentRatio" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <span class="text-sm font-medium text-gray-700">智能比例</span>
          <p class="text-xs text-gray-500 mt-0.5">
            根据提示词自动推断最佳比例
          </p>
        </div>
        <button
          type="button"
          :disabled="isLoading"
          :class="[
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
            intelligentRatio ? 'bg-blue-500' : 'bg-gray-200',
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          ]"
          @click="intelligentRatio = !intelligentRatio"
        >
          <span
            :class="[
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              intelligentRatio ? 'translate-x-5' : 'translate-x-0'
            ]"
          />
        </button>
      </div>

      <!-- Ratio Selector -->
      <RatioSelector
        v-model="ratio"
        type="image"
        :disabled="isLoading"
        :constraint-disabled="ratioConstraintDisabled"
        :constraint-message="ratioConstraintMessage"
      />

      <!-- Resolution Selector -->
      <ResolutionSelector
        v-model="resolution"
        type="image"
        :disabled="isLoading"
        :forced-resolution="forcedResolution"
      />

      <!-- Generate Button -->
      <BaseButton
        variant="primary"
        size="lg"
        class="w-full"
        :loading="isLoading"
        :disabled="!canGenerate"
        @click="handleGenerate"
      >
        {{ isLoading ? '生成中...' : '生成图像' }}
      </BaseButton>

      <!-- 生成中警告提示 -->
      <div v-if="isLoading" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="text-sm text-yellow-800 font-medium">生成中，请勿刷新页面</p>
            <p class="text-xs text-yellow-700 mt-1">刷新页面将中断生成任务，需要重新开始</p>
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
        :message="generationStore.getErrorWithGuidance('image') || undefined"
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

      <!-- Results Gallery -->
      <ImageGallery
        :images="taskState.results"
        :loading="isLoading"
        :columns="2"
      />
    </div>
  </div>
</template>
