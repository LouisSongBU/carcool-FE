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