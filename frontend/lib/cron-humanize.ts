export type CronVisualMode = "daily" | "weekly" | "monthly" | "custom"

export interface CronVisualFields {
  mode: CronVisualMode
  hour: string
  minute: string
  weekday: string
  monthday: string
  custom: string
}

const WEEKDAY_NAMES: Record<string, string> = {
  "0": "周日",
  "1": "周一",
  "2": "周二",
  "3": "周三",
  "4": "周四",
  "5": "周五",
  "6": "周六",
  "7": "周日",
}

function parseCron(expr: string): string[] | null {
  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) return null
  return parts
}

function parseNumberField(part: string, min: number, max: number): number[] | null {
  const values = new Set<number>()
  const segments = part.split(",")
  for (const segment of segments) {
    const trimmed = segment.trim()
    if (!trimmed) return null
    const [rangePart, stepPart] = trimmed.split("/")
    const step = stepPart ? Number(stepPart) : 1
    if (!Number.isInteger(step) || step <= 0) return null

    const addRange = (start: number, end: number) => {
      if (start > end) return false
      for (let v = start; v <= end; v += step) values.add(v)
      return true
    }

    if (rangePart === "*") {
      if (!addRange(min, max)) return null
      continue
    }

    if (rangePart.includes("-")) {
      const [startStr, endStr] = rangePart.split("-")
      const start = Number(startStr)
      const end = Number(endStr)
      if (!Number.isInteger(start) || !Number.isInteger(end)) return null
      if (start < min || end > max) return null
      if (!addRange(start, end)) return null
      continue
    }

    const n = Number(rangePart)
    if (!Number.isInteger(n) || n < min || n > max) return null
    values.add(n)
  }
  return [...values].sort((a, b) => a - b)
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function humanizeNumericField(values: number[], label: string): string {
  if (values.length === 1) return `${values[0]}${label}`
  if (values.length <= 4) return `${values.join("、")}${label}`
  return `${values.length}个${label}`
}

export function humanizeCron(expr: string): string {
  const parsed = parseCron(expr)
  if (!parsed) return `规则：${expr}`
  const [minutePart, hourPart, dayPart, monthPart, weekdayPart] = parsed

  const minuteValues = parseNumberField(minutePart, 0, 59)
  const hourValues = parseNumberField(hourPart, 0, 23)
  const dayValues = parseNumberField(dayPart, 1, 31)
  const monthValues = parseNumberField(monthPart, 1, 12)
  const weekdayValues = parseNumberField(weekdayPart, 0, 7)

  if (!minuteValues || !hourValues || !dayValues || !monthValues || !weekdayValues) {
    return `规则：${expr}`
  }

  if (
    monthPart === "*" &&
    dayPart === "*" &&
    weekdayPart === "*" &&
    minuteValues.length === 1 &&
    hourValues.length === 1
  ) {
    return `每天 ${formatTime(hourValues[0], minuteValues[0])}`
  }

  if (
    monthPart === "*" &&
    dayPart === "*" &&
    weekdayValues.length >= 1 &&
    weekdayValues.length <= 7 &&
    minuteValues.length === 1 &&
    hourValues.length === 1
  ) {
    const weekText = weekdayValues.map((d) => WEEKDAY_NAMES[String(d)] ?? `周${d}`).join("、")
    return `每周 ${weekText} ${formatTime(hourValues[0], minuteValues[0])}`
  }

  if (
    monthPart === "*" &&
    dayValues.length >= 1 &&
    dayValues.length <= 31 &&
    weekdayPart === "*" &&
    minuteValues.length === 1 &&
    hourValues.length === 1
  ) {
    return `每月 ${humanizeNumericField(dayValues, "日")} ${formatTime(hourValues[0], minuteValues[0])}`
  }

  if (minuteValues.length === 1 && hourValues.length === 1) {
    const monthText = monthPart === "*" ? "每月" : `${humanizeNumericField(monthValues, "月")} `
    const dayText = dayPart === "*" ? "每天" : `${humanizeNumericField(dayValues, "日")}`
    const weekText = weekdayPart === "*" ? "" : ` ${weekdayValues.map((d) => WEEKDAY_NAMES[String(d)] ?? `周${d}`).join("、")}`
    return `${monthText}${dayText}${weekText} ${formatTime(hourValues[0], minuteValues[0])}`.trim()
  }

  return `规则：${expr}`
}

function clampTime(value: string, min: number, max: number): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(min)
  const clamped = Math.max(min, Math.min(max, Math.trunc(n)))
  return String(clamped)
}

export function cronToFields(expr?: string): CronVisualFields {
  const fallback: CronVisualFields = {
    mode: "daily",
    hour: "9",
    minute: "0",
    weekday: "1",
    monthday: "1",
    custom: expr ?? "",
  }
  if (!expr) return fallback

  const parsed = parseCron(expr)
  if (!parsed) return { ...fallback, mode: "custom", custom: expr }
  const [minutePart, hourPart, dayPart, monthPart, weekdayPart] = parsed

  const minuteValues = parseNumberField(minutePart, 0, 59)
  const hourValues = parseNumberField(hourPart, 0, 23)
  if (!minuteValues || !hourValues || minuteValues.length !== 1 || hourValues.length !== 1) {
    return { ...fallback, mode: "custom", custom: expr }
  }

  const base = {
    hour: String(hourValues[0]),
    minute: String(minuteValues[0]),
    custom: expr,
  }

  if (monthPart === "*" && dayPart === "*" && weekdayPart === "*") {
    return { ...fallback, ...base, mode: "daily" }
  }

  const weekdayValues = parseNumberField(weekdayPart, 0, 7)
  if (monthPart === "*" && dayPart === "*" && weekdayValues && weekdayValues.length === 1) {
    const weekday = weekdayValues[0] === 7 ? 0 : weekdayValues[0]
    return { ...fallback, ...base, mode: "weekly", weekday: String(weekday) }
  }

  const dayValues = parseNumberField(dayPart, 1, 31)
  if (monthPart === "*" && weekdayPart === "*" && dayValues && dayValues.length === 1) {
    return { ...fallback, ...base, mode: "monthly", monthday: String(dayValues[0]) }
  }

  return { ...fallback, ...base, mode: "custom" }
}

export function fieldsToCron(fields: CronVisualFields): string {
  if (fields.mode === "custom") return fields.custom.trim()

  const minute = clampTime(fields.minute, 0, 59)
  const hour = clampTime(fields.hour, 0, 23)
  if (fields.mode === "daily") return `${minute} ${hour} * * *`
  if (fields.mode === "weekly") {
    const weekday = clampTime(fields.weekday, 0, 6)
    return `${minute} ${hour} * * ${weekday}`
  }
  const monthday = clampTime(fields.monthday, 1, 31)
  return `${minute} ${hour} ${monthday} * *`
}
