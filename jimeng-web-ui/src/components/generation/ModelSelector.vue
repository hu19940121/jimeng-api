<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Region } from '../../types'
import {
  getAvailableImageModels,
  getAvailableVideoModels,
  getDefaultImageModel,
  getDefaultVideoModel,
  getModelResolutionConstraint,
  supportsIntelligentRatio,
  type ModelInfo
} from '../../config'

interface Props {
  modelValue?: string
  region?: Region
  type?: 'image' | 'video'
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  region: 'cn',
  type: 'image',
  label: '模型',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'constraintChange': [constraint: { forcedResolution?: string; ignoreRatio?: boolean } | null]
  'intelligentRatioSupport': [supported: boolean]
}>()

// 根据类型和区域获取可用模型
const availableModels = computed<ModelInfo[]>(() => {
  return props.type === 'video'
    ? getAvailableVideoModels(props.region)
    : getAvailableImageModels(props.region)
})

const selectedModel = computed(() => {
  return availableModels.value.find(m => m.id === props.modelValue)
})

// 当前模型的分辨率约束
const currentConstraint = computed(() => {
  if (props.type === 'video') return null
  return getModelResolutionConstraint(props.modelValue, props.region)
})

// 当前模型是否支持智能比例
const currentSupportsIntelligentRatio = computed(() => {
  return supportsIntelligentRatio(props.modelValue)
})

// 监听区域变化，自动切换到该区域的默认模型
watch(
  () => props.region,
  (newRegion) => {
    const currentModelAvailable = availableModels.value.some(m => m.id === props.modelValue)
    if (!currentModelAvailable) {
      const defaultModel = props.type === 'video'
        ? getDefaultVideoModel(newRegion)
        : getDefaultImageModel(newRegion)
      emit('update:modelValue', defaultModel)
    }
  },
  { immediate: true }
)

// 监听模型变化，通知约束变化
watch(
  [() => props.modelValue, () => props.region],
  () => {
    emit('constraintChange', currentConstraint.value)
    emit('intelligentRatioSupport', currentSupportsIntelligentRatio.value)
  },
  { immediate: true }
)

const handleSelect = (modelId: string) => {
  if (!props.disabled) {
    emit('update:modelValue', modelId)
  }
}

// 获取推荐标签
function getRecommendedTag(model: ModelInfo): string | null {
  if (model.id === 'jimeng-4.5') return '推荐'
  if (model.id === 'jimeng-video-3.0') return '推荐'
  return null
}

// 获取特殊标签（如国际站专属）
function getSpecialTag(model: ModelInfo): string | null {
  if (model.id.startsWith('nanobanana')) return '国际站专属'
  if (model.regions.length === 1 && model.regions[0] === 'cn') return '国内站专属'
  return null
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block mb-2 text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    
    <div class="space-y-2">
      <button
        v-for="model in availableModels"
        :key="model.id"
        type="button"
        :disabled="disabled"
        :class="[
          'w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left',
          modelValue === model.id
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        ]"
        @click="handleSelect(model.id)"
      >
        <!-- Radio indicator -->
        <div
          :class="[
            'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
            modelValue === model.id
              ? 'border-blue-500'
              : 'border-gray-300'
          ]"
        >
          <div
            v-if="modelValue === model.id"
            class="w-2.5 h-2.5 rounded-full bg-blue-500"
          />
        </div>
        
        <!-- Model info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              :class="[
                'font-medium',
                modelValue === model.id
                  ? 'text-blue-700'
                  : 'text-gray-900'
              ]"
            >
              {{ model.name }}
            </span>
            <!-- 推荐标签 -->
            <span
              v-if="getRecommendedTag(model)"
              class="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded"
            >
              {{ getRecommendedTag(model) }}
            </span>
            <!-- 特殊标签 -->
            <span
              v-if="getSpecialTag(model)"
              class="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded"
            >
              {{ getSpecialTag(model) }}
            </span>
            <!-- 智能比例支持标签 -->
            <span
              v-if="model.supportsIntelligentRatio"
              class="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded"
            >
              智能比例
            </span>
          </div>
          <p class="mt-0.5 text-sm text-gray-500">
            {{ model.description }}
          </p>
        </div>
      </button>
    </div>
    
    <!-- 约束提示 -->
    <div
      v-if="currentConstraint"
      class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
    >
      <p class="text-xs text-yellow-800">
        <span v-if="currentConstraint.ignoreRatio">
          ⚠️ 当前模型在此区域固定输出 1024×1024 / {{ currentConstraint.forcedResolution }}，比例和分辨率参数将被忽略
        </span>
        <span v-else-if="currentConstraint.forcedResolution">
          ⚠️ 当前模型在此区域强制使用 {{ currentConstraint.forcedResolution }} 分辨率
        </span>
      </p>
    </div>
    
    <!-- Jimeng 4.0 等待时间提示 -->
    <div
      v-if="modelValue === 'jimeng-4.0' && type === 'image'"
      class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
    >
      <div class="flex items-start gap-2">
        <svg class="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1">
          <p class="text-xs text-orange-800 font-medium">等待时间提示</p>
          <p class="text-xs text-orange-700 mt-1">
            Jimeng 4.0 模型生成时间可能较长。如果等待时间过长,建议切换到 <span class="font-semibold">Jimeng 3.0</span> 模型以获得更快的生成速度。
          </p>
        </div>
      </div>
    </div>
    
    <!-- Selected model summary -->
    <div
      v-if="selectedModel && !currentConstraint && modelValue !== 'jimeng-4.0'"
      class="mt-3 p-2 bg-gray-50 rounded-lg"
    >
      <p class="text-xs text-gray-500">
        当前选择: <span class="font-medium text-gray-700">{{ selectedModel.name }}</span>
      </p>
    </div>
  </div>
</template>
