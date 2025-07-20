import api from "./api"; // 假设你的 axios 实例就叫 api

export function fetchPotentialExpirationList(displayName: string, days: number) {
    return api.get('/potential-expiration/expirations', {
        params: { displayName, days }
    }).then(res => res.data);
}

// 所有参数都放 body 里
export function updatePotentialExpirationDay(displayName: string, days: number) {
    return api.post('/potential-expiration/update-day', { displayName, days })
        .then(res => res.data);
}