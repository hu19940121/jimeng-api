<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '../stores/settings.store'
import { useCreditStore } from '../stores/credit.store'
import { apiService } from '../services/api.service'
import AppHeader from '../components/layout/AppHeader.vue'
import AppSidebar from '../components/layout/AppSidebar.vue'

const settingsStore = useSettingsStore()
const creditStore = useCreditStore()
const sidebarOpen = ref(false)
const showSettingsModal = ref(false)
const isGeneratingSession = ref(false)
const sessionGenerationMessage = ref('')
const showSessionMessage = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function openSettings() {
  showSettingsModal.value = true
}

function closeSettings() {
  showSettingsModal.value = false
}

async function handleGenerateSession() {
  isGeneratingSession.value = true
  sessionGenerationMessage.value = ''
  showSessionMessage.value = false

  try {
    const result = await settingsStore.generateNewSession()
    
    if (result.success) {
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

onMounted(() => {
  settingsStore.loadFromStorage()
  
  // Show settings modal if not configured
  if (!settingsStore.isConfigured) {
    showSettingsModal.value = true
  } else {
    // 配置API服务
    apiService.setConfig({
      baseUrl: settingsStore.apiBaseUrl,
      sessionId: settingsStore.sessionId,
      region: settingsStore.region
    })
    // 获取积分
    creditStore.fetchCredit()
  }
})

// 监听配置变化,自动刷新积分
watch(
  () => settingsStore.isConfigured,
  (isConfigured) => {
    if (isConfigured) {
      apiService.setConfig({
        baseUrl: settingsStore.apiBaseUrl,
        sessionId: settingsStore.sessionId,
        region: settingsStore.region
      })
      creditStore.fetchCredit()
    } else {
      creditStore.clearCredit()
    }
  }
)
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">
    <!-- Header -->
    <AppHeader 
      @toggle-sidebar="toggleSidebar" 
      @open-settings="openSettings"
    />

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <AppSidebar 
        :is-open="sidebarOpen" 
        @close="closeSidebar"
      />

      <!-- Main content area -->
      <main class="flex-1 overflow-y-auto">
        <div class="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          <slot />
        </div>
      </main>
    </div>

    <!-- Settings Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showSettingsModal"
          class="fixed inset-0 z-50 flex items-center justify-center"
        >
          <!-- Backdrop -->
          <div 
            class="absolute inset-0 bg-black/50 transition-opacity"
            @click="closeSettings"
          />
          
          <!-- Modal content -->
          <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 transform transition-all">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">
                设置
              </h2>
              <button
                type="button"
                class="p-1 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                @click="closeSettings"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <!-- Session ID -->
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Session ID
                </label>
                <input
                  type="text"
                  :value="settingsStore.sessionId"
                  @input="settingsStore.setConfig({ sessionId: ($event.target as HTMLInputElement).value })"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your Session ID"
                />
                
                <!-- Generate Session Button (仅美区可用) -->
                <div v-if="settingsStore.region === 'us'">
                  <button
                    type="button"
                    :disabled="isGeneratingSession"
                    @click="handleGenerateSession"
                    class="w-full px-4 mb-2 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span v-if="isGeneratingSession">生成中...</span>
                    <span v-else>🔄 自动获取 Session ID</span>
                  </button>
                  
                  <!-- Session Generation Message -->
                  <Transition name="fade">
                    <div v-if="showSessionMessage">
                      <p :class="[
                        'text-xs px-3 py-2 rounded-lg',
                        sessionGenerationMessage.includes('成功') 
                          ? 'text-green-700 bg-green-50 border border-green-200' 
                          : 'text-red-700 bg-red-50 border border-red-200'
                      ]">
                        {{ sessionGenerationMessage }}
                      </p>
                    </div>
                  </Transition>
                  
                  <p class="text-xs text-gray-500">
                    点击按钮自动注册美区账号并获取 Session ID（需美国代理节点），或手动输入
                  </p>
                </div>
                
                <!-- 非美区提示 -->
                <p v-else class="text-xs text-gray-500">
                  请手动输入 Session ID（自动获取功能仅支持美区）
                </p>
              </div>

              <!-- Region -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  区域
                </label>
                <select
                  :value="settingsStore.region"
                  @change="settingsStore.setConfig({ region: ($event.target as HTMLSelectElement).value as any })"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="cn">国内站 (cn)</option>
                  <option value="us">美区 (us)</option>
                  <option value="hk">香港 (hk)</option>
                  <option value="jp">日本 (jp)</option>
                  <option value="sg">新加坡 (sg)</option>
                </select>
              </div>

              <!-- API Base URL -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  API Base URL
                </label>
                <input
                  type="text"
                  :value="settingsStore.apiBaseUrl"
                  @input="settingsStore.setConfig({ apiBaseUrl: ($event.target as HTMLInputElement).value })"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="http://localhost:5100"
                />
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                type="button"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                @click="settingsStore.clearConfig()"
              >
                清除
              </button>
              <button
                type="button"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                @click="closeSettings"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
