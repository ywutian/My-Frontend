// 计算最长公共子序列长度的辅助函数
function getLCS(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯找出差异
  let diff = '';
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (str1[i - 1] === str2[j - 1]) {
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      diff = str2[j - 1] + diff;
      j--;
    }
  }
  while (j > 0) {
    diff = str2[j - 1] + diff;
    j--;
  }

  return diff;
}

export const getTranscriptText = (transcripts, interimResult, prevInterimRef) => {
  // 历史文本正确
  const historicalText = transcripts.map(t => t.text).join(' ');

  // 临时文本直接使用 interimResult
  let incrementalText = interimResult?.text || '';

  return { historicalText, incrementalText };
};
