<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCreditStore } from '../../stores/credit.store'
import { useSettingsStore } from '../../stores/settings.store'

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
  (e: 'open-settings'): void
}>()

const creditStore = useCreditStore()
const settingsStore = useSettingsStore()

const isConfigured = computed(() => settingsStore.isConfigured)
const totalCredit = computed(() => creditStore.creditInfo?.totalCredit ?? null)

// 帮助弹窗状态
const showHelpModal = ref(false)

// 格式化积分显示
const formattedCredit = computed(() => {
  if (totalCredit.value === null) return '--'
  return totalCredit.value.toLocaleString()
})

// 刷新积分
async function refreshCredit() {
  if (!isConfigured.value) return
  await creditStore.fetchCredit()
}

// 组件挂载时获取积分
onMounted(() => {
  if (isConfigured.value) {
    refreshCredit()
  }
})
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
    <div class="flex h-14 items-center px-4 gap-4">
      <!-- Mobile menu button -->
      <button
        type="button"
        class="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        @click="emit('toggle-sidebar')"
        aria-label="Toggle menu"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Logo -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <img class="w-8 h-8 rounded-lg" src="@/assets/logo.png" alt="">
          <!-- <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg> -->
        </div>
        <span class="font-semibold text-lg text-gray-900">三哥AI</span>
      </div>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Credit Display - Desktop -->
      <div
        v-if="isConfigured"
        class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
      >
        <svg class="w-4 h-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
        </svg>
        <div class="flex flex-col">
          <span class="text-xs text-gray-500 leading-none">积分</span>
          <span class="text-sm font-semibold text-gray-900 leading-none mt-0.5">
            {{ formattedCredit }}
          </span>
        </div>
        <button
          type="button"
          :disabled="creditStore.isLoading"
          @click="refreshCredit"
          class="p-1 rounded hover:bg-white/50 transition-colors disabled:opacity-50"
          title="刷新积分"
        >
          <svg
            :class="['w-3.5 h-3.5 text-blue-600', creditStore.isLoading && 'animate-spin']"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Credit Display - Mobile (compact) -->
      <button
        v-if="isConfigured"
        type="button"
        :disabled="creditStore.isLoading"
        @click="refreshCredit"
        class="md:hidden flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg border border-blue-100"
        title="积分"
      >
        <svg class="w-4 h-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm font-semibold text-gray-900">
          {{ formattedCredit }}
        </span>
      </button>

      <!-- Desktop navigation links -->
      <nav class="hidden md:flex items-center gap-1">
        <router-link
          to="/text-to-image"
          class="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          active-class="bg-blue-50 text-blue-600"
        >
          文生图
        </router-link>
        <router-link
          to="/image-to-image"
          class="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          active-class="bg-blue-50 text-blue-600"
        >
          图生图
        </router-link>
        <router-link
          to="/video-generate"
          class="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          active-class="bg-blue-50 text-blue-600"
        >
          视频生成
        </router-link>
        <!-- <router-link
          to="/chat"
          class="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          active-class="bg-blue-50 text-blue-600"
        >
          聊天
        </router-link> -->
        <router-link
          to="/history"
          class="px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          active-class="bg-blue-50 text-blue-600"
        >
          历史
        </router-link>
      </nav>

      <!-- Help button -->
      <button
        type="button"
        class="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        @click="showHelpModal = true"
        aria-label="帮助"
        title="帮助"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <!-- Settings button -->
      <button
        type="button"
        class="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        @click="emit('open-settings')"
        aria-label="Open settings"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </header>

  <!-- Help Modal -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showHelpModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-black/50" @click="showHelpModal = false" />
        <div class="relative bg-white rounded-xl max-w-md w-full shadow-xl max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-start justify-between p-6 pb-4 flex-shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">
                常见问题
              </h3>
            </div>
            <button
              type="button"
              @click="showHelpModal = false"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="space-y-4 px-6 overflow-y-auto flex-1">
            <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-yellow-900 mb-2">
                    遇到异常问题？
                  </h4>
                  <p class="text-sm text-yellow-800 mb-3">
                    本应用会将您的设置和历史记录保存在浏览器本地存储中。如果遇到以下问题：
                  </p>
                  <ul class="text-sm text-yellow-800 space-y-1 mb-3 list-disc list-inside">
                    <li>页面显示异常</li>
                    <li>功能无法正常使用</li>
                    <li>参数设置不生效</li>
                    <li>历史记录显示错误</li>
                  </ul>
                  <p class="text-sm text-yellow-800 mb-3">
                    请尝试清除浏览器本地存储来解决：
                  </p>
                  <div class="bg-yellow-100 rounded p-3 space-y-2">
                    <p class="text-xs text-yellow-900 font-medium">清除方法：</p>
                    <ol class="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
                      <li>按 <kbd class="px-1.5 py-0.5 bg-white rounded text-xs font-mono">F12</kbd> 打开开发者工具</li>
                      <li>切换到 <strong>Application</strong> 或 <strong>应用</strong> 标签</li>
                      <li>在左侧找到 <strong>Local Storage</strong></li>
                      <li>点击当前网站</li>
                      <li>点击右键选择 <strong>Clear</strong> 或 <strong>清除</strong></li>
                      <li>刷新页面</li>
                    </ol>
                  </div>
                  <p class="text-xs text-yellow-700 mt-3">
                    ⚠️ 注意：清除后您的历史记录和设置将被重置
                  </p>
                </div>
              </div>
            </div>

            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-blue-900 mb-1">
                    本地存储说明
                  </h4>
                  <p class="text-xs text-blue-800">
                    为了提供更好的用户体验，我们会在您的浏览器中保存：
                  </p>
                  <ul class="text-xs text-blue-800 mt-2 space-y-1 list-disc list-inside">
                    <li>Session ID 和 API 配置</li>
                    <li>生成参数（模型、比例、分辨率等）</li>
                    <li>历史记录</li>
                    <li>生成结果（仅保存链接）</li>
                  </ul>
                  <p class="text-xs text-blue-700 mt-2">
                    所有数据仅存储在您的浏览器中，不会上传到服务器。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-6 pt-4 flex justify-end flex-shrink-0 border-t border-gray-100">
            <button
              type="button"
              @click="showHelpModal = false"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

kbd {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
</style>
