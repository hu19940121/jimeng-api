import { parseRegionFromToken, parseProxyFromToken } from '@/api/controllers/core.ts';
import { SessionProvider } from './SessionProvider.ts';
import APIException from './exceptions/APIException.ts';
import EX from '@/api/consts/exceptions.ts';
import logger from './logger.ts';

// 积分不足相关的错误码（errcode）
const INSUFFICIENT_POINTS_ERRCODES = [
  EX.API_IMAGE_GENERATION_INSUFFICIENT_POINTS[0] as number, // -2009
];

// 积分不足相关的错误消息关键词（兜底匹配）
const INSUFFICIENT_POINTS_KEYWORDS = [
  '积分不足',
  'insufficient points',
  'insufficient credit',
  'not enough credits',
];

/**
 * Token 缓存映射：旧 token -> 新 token
 *
 * 当某个旧 token 积分不足后，自动生成的新 token 会被缓存在这里。
 * 后续请求携带同一个旧 token 时，直接使用缓存的新 token，
 * 避免每次请求都重新走 Playwright 注册流程。
 */
const tokenCache = new Map<string, string>();

/**
 * 最近一次自动续期所使用的新 SessionID（不含 us- 前缀和代理）
 * 每次调用 withAutoSession 时会重置为 null，仅在实际使用了新 token 时赋值。
 * 路由层可以调用 getLastUsedNewSessionId() 获取，用于通知前端更新。
 */
let lastUsedNewSessionId: string | null = null;

/**
 * 获取最近一次自动续期使用的新 SessionID
 * 调用后自动清空，避免重复获取
 */
export function getLastUsedNewSessionId(): string | null {
  const id = lastUsedNewSessionId;
  lastUsedNewSessionId = null;
  return id;
}

/**
 * 判断异常是否为积分不足
 */
function isInsufficientPointsError(error: any): boolean {
  // 1. 精确匹配 APIException 的 errcode
  if (error instanceof APIException) {
    if (INSUFFICIENT_POINTS_ERRCODES.includes(error.errcode)) {
      return true;
    }
  }

  // 2. 关键词兜底匹配（同时覆盖 error-handler 中 ret=5000 的情况）
  const message = (error?.message || error?.errmsg || '').toLowerCase();
  return INSUFFICIENT_POINTS_KEYWORDS.some(keyword => message.includes(keyword));
}

/**
 * 从原始 token 提取代理信息，生成新的带代理的美区 token
 *
 * @param originalToken 原始 token（可能包含代理前缀）
 * @param newSessionId 新的 SessionID
 * @returns 构建好的新 token
 */
function buildNewUSToken(originalToken: string, newSessionId: string): string {
  const { proxyUrl } = parseProxyFromToken(originalToken);

  // 新 token 格式: us-{sessionid}
  const newToken = `us-${newSessionId}`;

  // 如果原始 token 携带了代理，新 token 也需要保留代理
  if (proxyUrl) {
    return `${proxyUrl}@${newToken}`;
  }

  return newToken;
}

/**
 * 生成新 Session 并缓存映射关系
 *
 * @param originalToken 用户传入的原始 token
 * @returns 新生成的完整 token（带代理和 us- 前缀）
 */
async function generateAndCacheNewToken(originalToken: string): Promise<string> {
  logger.info('='.repeat(60));
  logger.info('[AutoSession] 检测到美区积分不足，开始自动生成新 SessionID...');
  logger.info('='.repeat(60));

  const newSessionId = await SessionProvider.generateNewSession();
  // 记录最近生成的 SessionID，供路由层查询
  lastUsedNewSessionId = newSessionId;
  const newToken = buildNewUSToken(originalToken, newSessionId);

  // 缓存：旧 token -> 新 token
  tokenCache.set(originalToken, newToken);

  logger.info(`[AutoSession] 新 SessionID 获取成功: ${newSessionId.substring(0, 10)}...`);
  logger.info(`[AutoSession] 已缓存 Token 映射（当前缓存数: ${tokenCache.size}）`);

  return newToken;
}

/**
 * 自动 Session 续期的高阶包装函数
 *
 * 仅对**美区（US）token** 生效：
 * 1. 首先检查缓存中是否有该 token 对应的替代 token，有则直接使用
 * 2. 如果执行过程中出现积分不足，自动生成新 Session 并缓存
 * 3. 用新 token 重试请求
 *
 * @param fn 原始业务函数，最后一个参数必须是 refreshToken
 * @param args fn 的所有参数（最后一个是 refreshToken）
 * @returns fn 的返回结果
 */
export async function withAutoSession<T>(
  fn: (...args: any[]) => Promise<T>,
  ...args: any[]
): Promise<T> {
  // 参数列表中最后一个是 refreshToken
  const originalToken = args[args.length - 1] as string;

  // 每次调用时重置
  lastUsedNewSessionId = null;

  // 检查区域：仅对美区 token 启用自动续期
  const regionInfo = parseRegionFromToken(originalToken);
  if (!regionInfo.isUS) {
    // 非美区，直接执行原始函数
    return await fn(...args);
  }

  // 检查缓存：是否有该旧 token 对应的已缓存的新 token
  const cachedToken = tokenCache.get(originalToken);
  if (cachedToken) {
    logger.info(`[AutoSession] 发现缓存的 Token，使用缓存的新 Token 执行请求`);
    const cachedArgs = [...args];
    cachedArgs[cachedArgs.length - 1] = cachedToken;

    try {
      const cachedResult = await fn(...cachedArgs);
      // 成功使用缓存 token，提取其 SessionID 供前端同步
      const { token: cachedPureToken } = parseProxyFromToken(cachedToken);
      lastUsedNewSessionId = cachedPureToken.replace(/^us-/i, '');
      return cachedResult;
    } catch (cachedError: any) {
      if (isInsufficientPointsError(cachedError)) {
        // 缓存的 token 也积分不足了，清理缓存，走下面的重新生成流程
        logger.info(`[AutoSession] 缓存的 Token 积分也已耗尽，将重新生成...`);
        tokenCache.delete(originalToken);
      } else {
        // 非积分不足错误，直接抛出
        throw cachedError;
      }
    }
  }

  // 没有缓存（或缓存已失效），用原始 token 尝试
  try {
    return await fn(...args);
  } catch (error: any) {
    if (!isInsufficientPointsError(error)) {
      // 非积分不足错误，直接抛出
      throw error;
    }

    // 积分不足，自动生成新 Session
    try {
      const newToken = await generateAndCacheNewToken(originalToken);

      logger.info(`[AutoSession] 使用新 Token 重试请求...`);

      // 替换参数列表中的 refreshToken 为新 token
      const newArgs = [...args];
      newArgs[newArgs.length - 1] = newToken;

      return await fn(...newArgs);
    } catch (sessionError: any) {
      // 区分：是自动生成 Session 失败，还是重试请求又出了别的错
      if (sessionError === error) {
        throw error;
      }
      logger.error(`[AutoSession] 自动续期流程失败: ${sessionError.message}`);
      // 抛出原始的积分不足错误（让用户知道根本原因）
      throw error;
    }
  }
}
