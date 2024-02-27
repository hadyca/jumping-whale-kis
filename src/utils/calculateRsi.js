//rsi 계산 로직
export default function calculateRsi(closingPriceArr) {
  console.log(closingPriceArr);
  const changes = [];
  for (let i = 1; i < closingPriceArr.length; i++) {
    changes.push(closingPriceArr[i] - closingPriceArr[i - 1]);
  }

  const gains = changes.map((change) => (change > 0 ? change : 0));
  const losses = changes.map((change) => (change < 0 ? -change : 0));

  //14봉 기준
  const firstAuArr = gains.map((value, index) => {
    if (index < 13) {
      return null;
    } else if (index === 13) {
      const firstAu = calculateFirstAverage(gains, 15); //14번째 값까지
      return firstAu;
    } else {
      return value;
    }
  });

  let beforeAu = firstAuArr[13];
  const finalAuArr = firstAuArr.map((value, index) => {
    if (index < 14) {
      return value;
    } else if (index >= 14) {
      beforeAu = (beforeAu * 13 + value) / 14;
      return beforeAu;
    }
  });

  // Du만들기
  const firstDuArr = losses.map((value, index) => {
    if (index < 13) {
      return null;
    } else if (index === 13) {
      const firstDu = calculateFirstAverage(losses, 15); //14번째 값까지
      return firstDu;
    } else {
      return value;
    }
  });

  let beforeDu = firstDuArr[13];
  const finalDuArr = firstDuArr.map((value, index) => {
    if (index < 14) {
      return value;
    } else if (index >= 14) {
      beforeDu = (beforeDu * 13 + value) / 14;
      return beforeDu;
    }
  });

  //rs만들기
  const beforeRs =
    finalAuArr[finalAuArr.length - 2] / finalDuArr[finalDuArr.length - 2];
  const nowRs =
    finalAuArr[finalAuArr.length - 1] / finalDuArr[finalDuArr.length - 1];

  const bRsi = 100 - 100 / (1 + beforeRs);
  const nRsi = 100 - 100 / (1 + nowRs);

  const beforeRsi = bRsi.toFixed(2);
  const nowRsi = nRsi.toFixed(2);
  return { beforeRsi, nowRsi };
}

// 배열의 평균을 계산하는 함수
const calculateFirstAverage = (arr, n) => {
  const sum = arr.slice(0, n).reduce((acc, val) => acc + val, 0);
  return sum / n;
};
