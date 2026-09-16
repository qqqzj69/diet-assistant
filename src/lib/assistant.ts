// 本地智能问答引擎：基于内置食物库、用户档案与今日记录做规则式回答。
// 覆盖：食物热量查询、食物对比、个性化推荐、今日状态总结、减脂知识、运动消耗、营养补充。
// 说明：这是本地规则引擎（离线可用、数据来自本应用），不是云端大模型。

import { FOODS } from '@/data/foods';
import { EXERCISES } from '@/data/exercises';
import type { IProfile, MealType } from '@/data/types';
import { calcBmr, calcTdee } from './nutrition';
import type { INutrients } from './nutrition';

export interface AssistantCtx {
  profile: IProfile | null;
  totals: INutrients;
  hasRecords: boolean;
  target: number | null;
  macros: { protein: number; fat: number; carbs: number } | null;
}

export const QUICK_PROMPTS = [
  '我今天吃超了吗？',
  '推荐我的晚餐',
  '鸡胸肉多少热量？',
  '怎么才能瘦下来？',
];

const FOOD_NAMES = FOODS.map((f) => f.name).sort((a, b) => b.length - a.length);

const foodIn = (text: string): string | undefined =>
  FOOD_NAMES.find((n) => text.includes(n));

const foodNamesIn = (text: string, limit = 2): string[] => {
  const hits: string[] = [];
  for (const n of FOOD_NAMES) {
    if (text.includes(n)) hits.push(n);
    if (hits.length >= limit) break;
  }
  return hits;
};

const hasProfile = (ctx: AssistantCtx): string | null =>
  ctx.profile
    ? null
    : '我还没有你的身高体重档案，先去「我的方案」填写，我才能给出针对性建议。';

const greeting = (): string =>
  '你好呀，我是你的减脂小助手。可以问我：\n· 食物热量，如「鸡胸肉多少热量？」\n· 吃什么，如「推荐我的晚餐」\n· 今日状态，如「我今天吃超了吗？」\n· 减脂知识，如「怎么才能瘦下来？」';

function answerStatus(ctx: AssistantCtx): string {
  const { profile, totals, target, macros } = ctx;
  if (!profile || target === null || !macros) {
    return '先到「我的方案」设置身高体重，我才能帮你核对今日摄入。';
  }
  if (!ctx.hasRecords) return '今天还没有饮食记录。记录几顿饭后，我帮你看看热量和营养够不够。';
  const diff = target - totals.kcal;
  const line = diff >= 0 ? `还差 ${diff} 千卡到目标` : `已超出 ${-diff} 千卡`;
  const p = macros.protein - totals.protein;
  const lines = [
    `今日已摄入 ${totals.kcal} 千卡，目标 ${target} 千卡，${line}。`,
    `蛋白质摄入 ${totals.protein}g（目标 ${macros.protein}g）${p >= 0 ? '，达标' : `，还差 ${-p}g`}。`,
    `脂肪 ${totals.fat}g / 碳水 ${totals.carbs}g。`,
  ];
  if (diff >= 0) lines.push(`剩余热量还够吃，推荐优先补蛋白质和蔬菜，具体看右侧「今日推荐」。`);
  else lines.push('今天吃超了一点也没关系，明天恢复正常节奏就好，别用节食补偿。');
  return lines.join('\n');
}

function answerRecommend(text: string, ctx: AssistantCtx): string {
  const profileCheck = hasProfile(ctx);
  if (profileCheck) return profileCheck;
  const { target, totals, macros } = ctx;
  if (target === null || !macros) return '设置方案后我才能帮你安排饮食。';

  const meal: MealType | null = ['早餐', '午餐', '晚餐', '加餐'].find((m) =>
    text.includes(m as string)
  ) as MealType | null;

  const remaining = target - totals.kcal;
  const proteinDeficit = macros.protein - totals.protein;
  const fiberDeficit = 28 - totals.fiber;

  const parts: string[] = [];
  if (meal) parts.push(`关于${meal}：`);
  else if (remaining <= 0) parts.push('今日热量目标已达成或超出：');
  else parts.push(`按你目前剩余 ${remaining} 千卡的预算：`);

  const needs: string[] = [];
  if (proteinDeficit > 5) needs.push(`蛋白质还差 ${Math.round(proteinDeficit)}g，优先选高蛋白食物`);
  if (fiberDeficit > 5) needs.push(`膳食纤维还差 ${Math.round(fiberDeficit)}g，多搭配蔬菜粗粮`);
  if (needs.length) parts.push(needs.join('；') + '。');

  const picks = FOODS.filter((f) => f.rating >= 4)
    .filter((f) => {
      if (meal === '早餐') return f.category === '主食' || f.category === '豆奶' || f.category === '肉蛋';
      if (meal === '午餐' || meal === '晚餐')
        return f.category === '肉蛋' || f.category === '水产' || f.category === '蔬菜' || f.category === '主食';
      return true;
    })
    .sort((a, b) => {
      const sa =
        (proteinDeficit > 0 ? a.protein * 2 : 0) +
        (fiberDeficit > 0 ? a.fiber : 0) -
        (a.kcal > 300 ? (a.kcal - 300) * 0.1 : 0);
      const sb =
        (proteinDeficit > 0 ? b.protein * 2 : 0) +
        (fiberDeficit > 0 ? b.fiber : 0) -
        (b.kcal > 300 ? (b.kcal - 300) * 0.1 : 0);
      return sb - sa;
    })
    .slice(0, meal ? 4 : 5);

  parts.push(picks.map((f) => `· ${f.name}（每100g ${f.kcal} 千卡，蛋白 ${f.protein}g）`).join('\n'));
  parts.push('更多选择可看右侧「今日推荐」，点卡片可直接记录。');
  return parts.join('\n');
}

function answerFood(text: string): string {
  const name = foodIn(text);
  if (!name) return '我没在内置食物库里找到它。可以换个说法，或去「食物库」搜索看看。';
  const f = FOODS.find((x) => x.name === name)!;
  return [
    `${f.name}：每 100g ${f.kcal} 千卡`,
    `蛋白质 ${f.protein}g · 脂肪 ${f.fat}g · 碳水 ${f.carbs}g · 膳食纤维 ${f.fiber}g`,
    `优点：${f.pros.join('、')}`,
    `注意：${f.cons.join('、')}`,
    `建议：${f.advice}`,
  ].join('\n');
}

function answerCompare(text: string): string {
  const names = foodNamesIn(text);
  if (names.length < 2) return '想让我对比两种食物？像「米饭和全麦面包哪个好」这样问就行。';
  const [a, b] = names;
  const fa = FOODS.find((x) => x.name === a)!;
  const fb = FOODS.find((x) => x.name === b)!;
  const kcalWin = fa.kcal < fb.kcal ? a : b;
  const proteinWin = fa.protein > fb.protein ? a : b;
  const fiberWin = fa.fiber > fb.fiber ? a : b;
  return [
    `${a} vs ${b}（每 100g）：`,
    `· 热量：${a} ${fa.kcal} 千卡 / ${b} ${fb.kcal} 千卡 → ${kcalWin} 更低`,
    `· 蛋白质：${a} ${fa.protein}g / ${b} ${fb.protein}g → ${proteinWin} 更高`,
    `· 膳食纤维：${a} ${fa.fiber}g / ${b} ${fb.fiber}g → ${fiberWin} 更高`,
    `减脂建议：${fa.rating >= fb.rating ? a : b} 的综合友好度评分更高（${Math.max(fa.rating, fb.rating)}/5），但也要结合你当餐的搭配。`,
  ].join('\n');
}

function answerProtein(text: string, ctx: AssistantCtx): string {
  if (text.includes('够不够') || text.includes('达标')) {
    if (!ctx.profile || !ctx.macros) return '设置方案后我才能算你的蛋白目标。';
    if (!ctx.hasRecords) return '今天还没记录饮食，记录后我帮你核对蛋白是否达标。';
    const d = ctx.macros.protein - ctx.totals.protein;
    return `你的蛋白目标约 ${ctx.macros.protein}g，今日已摄入 ${ctx.totals.protein}g，${
      d >= 0 ? `还差 ${Math.round(d)}g` : '已达标'
    }。高蛋白食物：鸡胸肉、鸡蛋、基围虾、瘦牛肉、金枪鱼（水浸）。`;
  }
  const list = FOODS.filter((f) => f.protein >= 12)
    .sort((a, b) => b.protein - a.protein)
    .slice(0, 6)
    .map((f) => `· ${f.name}：${f.protein}g/100g`)
    .join('\n');
  return `高蛋白食物推荐（每 100g 含量）：\n${list}`;
}

function answerSnack(): string {
  const list = FOODS.filter((f) => f.kcal <= 60 && f.rating >= 4)
    .sort((a, b) => b.fiber - a.fiber || a.kcal - b.kcal)
    .slice(0, 6)
    .map((f) => `· ${f.name}：${f.kcal} 千卡/100g`)
    .join('\n');
  return `饿了想吃加餐，选这些低卡又顶饱的：\n${list}\n注意总量控制在 150 千卡以内（比如黄瓜 1 根、苹果半个）。`;
}

function answerExercise(text: string, ctx: AssistantCtx): string {
  const name = EXERCISES.find((e) => text.includes(e.name));
  const kg = ctx.profile?.weight ?? 60;
  if (name) {
    const kcal30 = Math.round(name.met * 3.5 * (kg / 200) * 30);
    return `${name.name}（MET ${name.met}）：按你 ${kg}kg 体重，30 分钟约消耗 ${kcal30} 千卡。\n消耗 = MET × 3.5 × 体重(kg) ÷ 200 × 时长(分钟)。`;
  }
  const top = EXERCISES.filter((e) => e.met >= 6)
    .slice(0, 3)
    .map((e) => {
      const k = Math.round(e.met * 3.5 * (kg / 200) * 30);
      return `· ${e.name}：30 分钟约 ${k} 千卡`;
    })
    .join('\n');
  return `按你 ${kg}kg 体重估算：\n${top}\n想算具体某项运动，直接问「跑步 30 分钟消耗多少」；完整清单见「运动消耗」页。`;
}

function answerKnowledge(text: string, ctx: AssistantCtx): string {
  if (text.includes('基础代谢') || text.includes('BMR') || text.includes('代谢')) {
    if (!ctx.profile) return '基础代谢（BMR）是身体静息时维持生命所需的热量。填写身高体重后，我可以直接帮你算出数值。';
    const bmr = Math.round(calcBmr(ctx.profile));
    const tdee = Math.round(calcTdee(ctx.profile));
    return `你的基础代谢（BMR）约 ${bmr} 千卡/天，是静息状态下维持生命所需的最低热量；\n结合活动水平后的每日总消耗（TDEE）约 ${tdee} 千卡。减脂热量应高于 BMR、低于 TDEE，一般女性不低于 1200、男性不低于 1500 千卡。`;
  }
  if (text.includes('缺口')) {
    if (!ctx.profile) return hasProfile(ctx);
    const tdee = Math.round(calcTdee(ctx.profile));
    return `热量缺口 = 每日总消耗（TDEE ≈ ${tdee} 千卡）− 摄入热量。\n缺口 500 千卡/天 ≈ 每周减 0.5kg 纯脂肪；缺口 1000 千卡/天 ≈ 每周 1kg。\n建议缺口控制在 300-800 千卡，女性每日摄入不低于 1200、男性不低于 1500 千卡，缺口太大容易掉肌肉、反弹。`;
  }
  if (text.includes('平台期') || text.includes('不掉')) {
    return '平台期常见原因：身体适应了更低的摄入、水分波动、肌肉流失导致消耗下降。\n可以试试：① 调整运动类型和强度；② 增加蛋白质比例（每公斤体重 1.5-2g）；③ 保证睡眠 7-8 小时；④ 别把热量压得太低，先恢复维持热量 1-2 周再继续。';
  }
  if (text.includes('节食') || text.includes('断食')) {
    return '极端节食或断食短期掉秤快，但掉的多数是水分和肌肉，基础代谢也会下降，恢复饮食后极易反弹。\n更稳的做法：温和热量缺口（300-500 千卡/天）+ 足量蛋白质 + 力量训练，每周减 0.5-1kg 就很好。';
  }
  return [
    '科学减脂三板斧：',
    '1. 热量缺口：每天摄入比消耗低 300-500 千卡，每周减 0.5-1kg 是健康节奏',
    '2. 蛋白质吃够：每公斤体重 1.2-2g，鸡胸、鸡蛋、鱼虾、瘦牛肉都是好来源',
    '3. 运动结合：有氧（快走、慢跑、跳绳）+ 力量（深蹲、俯卧撑），每周 3-5 次',
    '搭配：主食粗细搭配、蔬菜占一半、少油少糖少外卖，睡眠 7-8 小时。',
    '我能帮你算目标热量、推荐食物和运动消耗，直接问我「怎么算我的目标」或「推荐我的午餐」。',
  ].join('\n');
}

function answerWater(): string {
  return '一般建议每天饮水 1500-2000ml（约 6-8 杯），运动或出汗多时再加。\n判断标准：尿液呈淡黄色说明水分充足；饭前喝一杯水还有助控制食量。';
}

export function answerQuestion(q: string, ctx: AssistantCtx): string {
  const text = q.trim();
  if (!text) return greeting();

  if (/^(你好|hi|hello|嗨|在吗|在么)/i.test(text)) return greeting();
  if (/(和|跟|与).*(哪个|对比|区别|谁好)/.test(text)) return answerCompare(text);
  if (/(今天|今日|摄入|吃超|达标|状态|怎么样|如何了)/.test(text)) return answerStatus(ctx);
  if (/(推荐|吃什么|吃啥|建议|安排|应该吃)/.test(text)) return answerRecommend(text, ctx);
  if (/(蛋白|蛋白质)/.test(text)) return answerProtein(text, ctx);
  if (/(零食|加餐|饿了|嘴馋|低卡|解馋)/.test(text)) return answerSnack();
  if (/(跑步|跳绳|游泳|运动|消耗|锻炼|快走|骑车|椭圆机|力量)/.test(text)) return answerExercise(text, ctx);
  if (/(喝水|饮水|水分)/.test(text)) return answerWater();
  if (/(怎么减肥|如何减肥|怎么瘦|瘦下来|减肥方法|基础代谢|BMR|TDEE|代谢|热量缺口|缺口|平台期|节食|断食|轻断食)/.test(text))
    return answerKnowledge(text, ctx);
  if (/(热量|千卡|卡路里|高不高|能减肥|适合减肥|营养|优点|缺点)/.test(text) && foodIn(text))
    return answerFood(text);

  return [
    '这个问题我暂时答不上来，我可以帮你：',
    '· 查食物热量：如「全麦面包多少热量？」',
    '· 对比食物：如「米饭和全麦面包哪个好」',
    '· 推荐饮食：如「推荐我的午餐」',
    '· 看今日状态：如「我今天吃超了吗？」',
    '· 问减脂知识：如「怎么才能瘦下来？」',
  ].join('\n');
}
