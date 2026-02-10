<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import MainLayout from './layouts/MainLayout.vue'
import { ErrorBoundary } from './components/common'

// 从构建时注入的环境变量读取访问密码（空值 = 不启用）
const ACCESS_PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD || ''
const AUTH_KEY = 'jimeng_access_verified'

// 是否已通过验证
const isVerified = ref(false)
// 密码输入
const passwordInput = ref('')
// 错误信息
const errorMessage = ref('')
// 是否显示密码
const showPassword = ref(false)
// 是否正在验证
const isSubmitting = ref(false)
// 是否振动中
const isShaking = ref(false)

onMounted(() => {
  // 未设置密码，直接放行
  if (!ACCESS_PASSWORD) {
    isVerified.value = true
    return
  }
  // 检查 localStorage 里是否已经验证过
  const stored = localStorage.getItem(AUTH_KEY)
  if (stored === ACCESS_PASSWORD) {
    isVerified.value = true
  }
})

function handleSubmit() {
  if (!passwordInput.value.trim()) {
    errorMessage.value = '请输入访问密码'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  // 简单延迟，增加仪式感
  setTimeout(() => {
    if (passwordInput.value.trim() === ACCESS_PASSWORD) {
      // 验证通过，存入 localStorage
      localStorage.setItem(AUTH_KEY, ACCESS_PASSWORD)
      isVerified.value = true
    } else {
      errorMessage.value = '访问密码错误'
      // 振动效果
      isShaking.value = true
      setTimeout(() => { isShaking.value = false }, 500)
    }
    isSubmitting.value = false
  }, 300)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleSubmit()
}
</script>

<template>
  <!-- 已验证 或 未启用密码：正常显示应用 -->
  <template v-if="isVerified">
    <MainLayout>
      <ErrorBoundary fallback-message="页面加载出错">
        <RouterView v-slot="{ Component, route }">
          <Transition name="page" mode="out-in" appear>
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </ErrorBoundary>
    </MainLayout>
  </template>

  <!-- 密码验证页 -->
  <template v-else>
    <div class="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden">
      <!-- 背景装饰 -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl"></div>
        <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-size-[50px_50px]"></div>
      </div>

      <!-- 登录卡片 -->
      <div class="relative z-10 w-full max-w-sm mx-4" :class="{ 'animate-shake': isShaking }">
        <!-- 卡片外发光 -->
        <div class="absolute -inset-1 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-lg"></div>

        <div class="relative bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <!-- Logo -->
          <div class="flex flex-col items-center mb-8">
            <div class="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
              <img class="w-16 h-16 rounded-2xl" src="@/assets/logo.png" alt="Logo">
            </div>
            <h1 class="text-xl font-bold text-white">三哥AI</h1>
            <p class="text-sm text-slate-400 mt-1">请输入访问密码以继续</p>
          </div>

          <!-- 输入区域 -->
          <div class="space-y-4">
            <div class="relative">
              <!-- 锁图标 -->
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                v-model="passwordInput"
                :type="showPassword ? 'text' : 'password'"
                placeholder="输入访问密码"
                class="w-full pl-11 pr-11 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                @keydown="handleKeydown"
                autofocus
              />
              <!-- 显示/隐藏密码 -->
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>

            <!-- 错误提示 -->
            <Transition name="slide-fade">
              <div
                v-if="errorMessage"
                class="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <svg class="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-sm text-red-300">{{ errorMessage }}</span>
              </div>
            </Transition>

            <!-- 提交按钮 -->
            <button
              type="button"
              :disabled="isSubmitting || !passwordInput.trim()"
              class="w-full py-3 px-4 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98]"
              @click="handleSubmit"
            >
              <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                验证中...
              </span>
              <span v-else>进入系统</span>
            </button>
          </div>

          <p class="text-center text-xs text-slate-500 mt-6">访问密码由管理员提供</p>
        </div>
      </div>
    </div>
  </template>
</template>

<style scoped>
/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 错误提示滑入动画 */
.slide-fade-enter-active { transition: all 0.3s ease; }
.slide-fade-leave-active { transition: all 0.2s ease; }
.slide-fade-enter-from { opacity: 0; transform: translateY(-8px); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-4px); }

/* 振动动画 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>
