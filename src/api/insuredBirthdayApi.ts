import api from "./api"; // 假设你的 axios 实例就叫 api

export function fetchInsuredBirthdayList(displayName: string) {
    return api.get('/insured-birthday/expirations', {
        params: { displayName }
    }).then(res => res.data);
}
