<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '../stores/settings.store'
import { BaseButton, BaseInput, BaseSelect } from '../components/common'
import type { Region } from '../types'

const settingsStore = useSettingsStore()

// Local form state
const sessionId = ref('')
const region = ref<Region>('cn')
const apiBaseUrl = ref('http://localhost:5100')

// UI state
const showSaveSuccess = ref(false)
const showClearConfirm = ref(false)
const isGeneratingSession = ref(false)
const sessionGenerationMessage = ref('')
const showSessionMessage = ref(false)

// Region options
const regionOptions = [
  { value: 'cn', label: '国内站 (cn)' },
  { value: 'us', label: '美区 (us)' },
  { value: 'hk', label: '香港 (hk)' },
  { value: 'jp', label: '日本 (jp)' },
  { value: 'sg', label: '新加坡 (sg)' }
]

// Computed preview of formatted session ID
const formattedPreview = computed(() => {
  if (!sessionId.value) return ''
  const prefix = region.value === 'cn' ? '' : `${region.value}-`
  return `${prefix}${sessionId.value}`
})

// Load settings on mount
onMounted(() => {
  settingsStore.loadFromStorage()
  sessionId.value = settingsStore.sessionId
  region.value = settingsStore.region
  apiBaseUrl.value = settingsStore.apiBaseUrl
})

// Watch for changes in store and sync to local state
watch(
  () => settingsStore.sessionId,
  (newValue) => {
    sessionId.value = newValue
  }
)

watch(
  () => settingsStore.region,
  (newValue) => {
    region.value = newValue
  }
)

watch(
  () => settingsStore.apiBaseUrl,
  (newValue) => {
    apiBaseUrl.value = newValue
  }
)

function handleSave() {
  settingsStore.setConfig({
    sessionId: sessionId.value,
    region: region.value,
    apiBaseUrl: apiBaseUrl.value
  })
  
  showSaveSuccess.value = true
  setTimeout(() => {
    showSaveSuccess.value = false
  }, 2000)
}

function handleClear() {
  showClearConfirm.value = true
}

function confirmClear() {
  settingsStore.clearConfig()
  sessionId.value = ''
  region.value = 'cn'
  apiBaseUrl.value = 'http://localhost:5100'
  showClearConfirm.value = false
}

async function handleGenerateSession() {
  isGeneratingSession.value = true
  sessionGenerationMessage.value = ''
  showSessionMessage.value = false

  try {
    // Update store with current API base URL before generating
    settingsStore.setConfig({ apiBaseUrl: apiBaseUrl.value })
    
    const result = await settingsStore.generateNewSession()
    
    if (result.success) {
      // Update local sessionId with the generated one
      sessionId.value = settingsStore.sessionId
      sessionGenerationMessage.value = result.message
      showSessionMessage.value = true
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        showSessionMessage.value = false
      }, 3000)
    } else {
      sessionGenerationMessage.value = result.message
      showSessionMessage.value = true
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        showSessionMessage.value = false
      }, 5000)
    }
  } catch (error: any) {
    sessionGenerationMessage.value = error.message || 'Session ID 生成失败'
    showSessionMessage.value = true
    
    setTimeout(() => {
      showSessionMessage.value = false
    }, 5000)
  } finally {
    isGeneratingSession.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">设置</h1>

    <div class="space-y-8">
      <!-- Session ID Section -->
      <section class="bg-white rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">认证配置</h2>
        
        <div class="space-y-4">
          <BaseSelect v-model="region" :options="regionOptions" label="区域" placeholder="选择区域" />
          
          <div class="space-y-3">
            <BaseInput v-model="sessionId" label="Session ID" placeholder="请输入您的 Session ID" type="text" />
            
            <!-- 只在美区显示自动获取按钮（仅美区注册后可获得免费积分） -->
            <div v-if="region === 'us'">
              <div class="flex items-center gap-3 mb-3">
                <BaseButton 
                  variant="outline" 
                  :disabled="isGeneratingSession"
                  @click="handleGenerateSession"
                  class="flex-shrink-0"
                >
                  <span v-if="isGeneratingSession">生成中...</span>
                  <span v-else>自动获取 Session ID</span>
                </BaseButton>
                
                <Transition name="fade">
                  <div v-if="showSessionMessage" class="flex-1">
                    <p :class="[
                      'text-sm px-3 py-2 rounded-lg',
                      sessionGenerationMessage.includes('成功') 
                        ? 'text-green-700 bg-green-50 border border-green-200' 
                        : 'text-red-700 bg-red-50 border border-red-200'
                    ]">
                      {{ sessionGenerationMessage }}
                    </p>
                  </div>
                </Transition>
              </div>
              
              <div class="text-xs text-gray-500 space-y-1">
                <p>• 点击"自动获取 Session ID"按钮可自动注册美区账号并获取会话令牌</p>
                <p>• 当生图或生视频提示额度不够时，请重新获取 Session ID</p>
                <p>• 💡 免费积分（未开会员）使用 <span class="font-semibold">Jimeng 3.0</span> 模型速度最快，其他模型可能排队较慢</p>
                <p>• ⚠️ 需要 jimeng-api 服务端能通过美国代理节点访问 dreamina.capcut.com</p>
              </div>
            </div>
            
            <!-- 非美区提示 -->
            <div v-else class="text-xs text-gray-500">
              <p>• 请手动输入 Session ID（自动获取功能仅支持美区）</p>
              <p>• 当生图或生视频提示额度不够时，请重新获取 Session ID</p>
            </div>
          </div>

          <div v-if="sessionId" class="p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">格式化后的 Session ID:</p>
            <code class="text-sm text-blue-600 break-all">{{ formattedPreview }}</code>
          </div>
        </div>
      </section>

      <!-- API Configuration Section -->
      <section class="bg-white rounded-xl p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">API 配置</h2>
        <BaseInput v-model="apiBaseUrl" label="API 基础地址" placeholder="http://localhost:5100" type="url" />
        <p class="mt-2 text-xs text-gray-500">默认为 http://localhost:5100，如需连接其他服务器请修改此地址</p>
      </section>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between pt-4">
        <BaseButton variant="danger" @click="handleClear">清除配置</BaseButton>
        
        <div class="flex items-center gap-3">
          <Transition name="fade">
            <span v-if="showSaveSuccess" class="text-sm text-green-600">✓ 保存成功</span>
          </Transition>
          <BaseButton variant="primary" @click="handleSave">保存设置</BaseButton>
        </div>
      </div>
    </div>

    <!-- Clear Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showClearConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="showClearConfirm = false" />
          <div class="relative bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">确认清除</h3>
            <p class="text-gray-600 mb-6">确定要清除所有配置吗？此操作无法撤销。</p>
            <div class="flex justify-end gap-3">
              <BaseButton variant="outline" @click="showClearConfirm = false">取消</BaseButton>
              <BaseButton variant="danger" @click="confirmClear">确认清除</BaseButton>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
