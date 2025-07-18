import api from "./api"; // 假设你的 axios 实例就叫 api

export function fetchInsuredExpirationList(displayName: string, days: number) {
    return api.get('/insured-expiration/expirations', {
        params: { displayName, days }
    }).then(res => res.data);
}

// 所有参数都放 body 里
export function updateInsuredExpirationDay(displayName: string, days: number) {
    return api.post('/insured-expiration/update-day', { displayName, days })
        .then(res => res.data);
}