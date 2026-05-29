const fs = require('fs');
const logPath = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\798c0290-01d7-435f-9832-3850ae7f6776\\.system_generated\\logs\\overview.txt';

function sanitizeJsonString(str) {
  let result = '';
  let inString = false;
  let escape = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && !escape) {
      inString = !inString;
      result += char;
    } else if (char === '\\' && inString) {
      escape = !escape;
      result += char;
    } else {
      escape = false;
      if (inString) {
        if (char === '\n') {
          result += '\\n';
        } else if (char === '\r') {
          result += '\\r';
        } else if (char === '\t') {
          result += '\\t';
        } else {
          result += char;
        }
      } else {
        result += char;
      }
    }
  }
  return result;
}

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf-8');
  const parts = content.split('{"step_index":');
  const part = parts.find(p => p.trim().startsWith('46,') || p.trim().startsWith('46:'));
  if (part) {
    const jsonStr = '{"step_index":' + part;
    const sanitized = sanitizeJsonString(jsonStr);
    
    // sanitized의 position 256 근처 출력
    console.log("Sanitized position 256 area:");
    console.log(sanitized.slice(220, 300));
    
    // 에러 원인 분석을 위해 에러 재현 및 상세 출력
    try {
      JSON.parse(sanitized);
      console.log("Success parse!");
    } catch (e) {
      console.log("Parse failed:", e.message);
      // 에러 메시지에서 나오는 position 파악
      const match = e.message.match(/at position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        console.log(`Actual failing char code at sanitized position ${pos}:`);
        const slice = sanitized.slice(pos - 20, pos + 20);
        console.log("Context:", slice);
        for (let i = 0; i < slice.length; i++) {
          console.log(`Index ${i} (${pos-20+i}): char='${slice[i]}' code=${slice.charCodeAt(i)}`);
        }
      }
    }
  }
}
