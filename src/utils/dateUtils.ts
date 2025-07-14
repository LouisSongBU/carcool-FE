// 判断字符串是否为ISO日期或日期时间格式
function isIsoDateString(value: string) {
    // 支持 "2024-07-01" 或 "2024-07-01T15:31:12"
    return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2}))?)?$/.test(value);
}

// 递归转换对象或数组内所有 *Date / *Time 结尾字段
export function convertDatesInObject<T>(obj: T): T {
    if (Array.isArray(obj)) {
        return obj.map(convertDatesInObject) as any;
    }
    if (obj !== null && typeof obj === 'object') {
        const ret: any = {};
        for (const key in obj) {
            const value = (obj as any)[key];
            if (
                value &&
                typeof value === 'string' &&
                (key.endsWith('Date') || key.endsWith('Time')) &&
                isIsoDateString(value)
            ) {
                ret[key] = new Date(value);
            } else if (typeof value === 'object' && value !== null) {
                ret[key] = convertDatesInObject(value);
            } else {
                ret[key] = value;
            }
        }
        return ret;
    }
    return obj;
}

/** 获取本地当天日期字符串，格式 yyyy-mm-dd */
export function getTodayDate(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/** 获取本地当前时间字符串，格式 yyyy-mm-dd HH:mm:ss */
export function getNowDateTime(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const MM = String(now.getMinutes()).padStart(2, '0');
    const SS = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}

/** 格式化任意 Date 对象为 yyyy-mm-dd HH:mm:ss */
export function formatDateTime(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const MM = String(date.getMinutes()).padStart(2, '0');
    const SS = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}

/** 格式化任意 Date 对象为 yyyy-mm-dd */
export function formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}