import axios from 'axios';

// 工具函数，保证输入格式为 "YYYY-MM-DD"，拼接时间段
function toDateTimeRange(date: string, type: 'start' | 'end') {
  if (!date) return '';
  return type === 'start'
    ? `${date}T00:00:00`
    : `${date}T23:59:59`;
}

// 按记录日期查询
export function fetchByRecordDate(recordTimeStart: string, recordTimeEnd: string) {
  // 自动补全时间部分
  const recordTimeStartFull = toDateTimeRange(recordTimeStart, 'start');
  const recordTimeEndFull = toDateTimeRange(recordTimeEnd, 'end');
  return axios.get('http://localhost:8080/api/potential-customers/byRecordTime', {
    params: { recordTimeStart: recordTimeStartFull, recordTimeEnd: recordTimeEndFull }
  });
}

// 综合查询
export function fetchComprehensive(query: {
  recordTimeStart: string,
  recordTimeEnd: string,
  policyStartDateStart: string,
  policyStartDateEnd: string
}) {
  // 自动补全recordTime部分
  const params = {
    ...query,
    recordTimeStart: toDateTimeRange(query.recordTimeStart, 'start'),
    recordTimeEnd: toDateTimeRange(query.recordTimeEnd, 'end')
    // policyStartDateStart/End不用补全，后端是LocalDate，前端直接传"YYYY-MM-DD"即可
  };
  return axios.get('http://localhost:8080/api/potential-customers/byRecordTimeAndPolicyStartDate', {
    params
  });
}

