const fs = require('fs');

function extractCodeByRegex(logPath, stepIndex, outputName) {
  if (!fs.existsSync(logPath)) {
    console.log("Log not found:", logPath);
    return;
  }
  const content = fs.readFileSync(logPath, 'utf-8');
  const parts = content.split('{"step_index":');
  const part = parts.find(p => p.trim().startsWith(stepIndex + ',') || p.trim().startsWith(stepIndex + ':'));
  
  if (!part) {
    console.log(`stepIndex ${stepIndex} not found`);
    return;
  }

  console.log(`Found step_index ${stepIndex}`);

  // 1. "ReplacementContent" 찾기
  let pos = 0;
  let tcIdx = 0;
  while ((pos = part.indexOf('"ReplacementContent"', pos)) !== -1) {
    let startQuote = part.indexOf('"', pos + '"ReplacementContent"'.length);
    // : 기호 등을 건너뛰고 문자열 시작 따옴표 찾기
    while (startQuote !== -1 && part[startQuote - 1] === '\\') {
      startQuote = part.indexOf('"', startQuote + 1);
    }
    // 콜론 기호 뒤의 실제 값 시작 따옴표
    let valQuote = part.indexOf('"', pos + 20);
    
    let endQuote = -1;
    let value = '';
    let escape = false;
    for (let i = valQuote + 1; i < part.length; i++) {
      const char = part[i];
      if (escape) {
        if (char === 'n') value += '\n';
        else if (char === 'r') value += '\r';
        else if (char === 't') value += '\t';
        else if (char === '"') value += '"';
        else if (char === '\\') value += '\\';
        else value += '\\' + char;
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        endQuote = i;
        break;
      } else {
        value += char;
      }
    }
    
    if (endQuote !== -1) {
      fs.writeFileSync(`${outputName}_content_tc${tcIdx}.txt`, value, 'utf-8');
      console.log(`  Saved ReplacementContent via regex! (Length: ${value.length})`);
      tcIdx++;
    }
    pos = Math.max(pos + 1, endQuote + 1);
  }

  // 2. "ReplacementChunks" 찾기
  pos = 0;
  while ((pos = part.indexOf('"ReplacementChunks"', pos)) !== -1) {
    let startBracket = part.indexOf('[', pos);
    if (startBracket === -1) break;
    
    // [ 뒤의 짝이 맞는 ] 를 찾음 (이스케이프 따옴표 안의 ] 는 무시)
    let endBracket = -1;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = startBracket; i < part.length; i++) {
      const char = part[i];
      if (char === '"' && !escape) {
        inString = !inString;
      } else if (char === '\\' && inString) {
        escape = !escape;
      } else {
        escape = false;
        if (!inString) {
          if (char === '[') depth++;
          else if (char === ']') {
            depth--;
            if (depth === 0) {
              endBracket = i;
              break;
            }
          }
        }
      }
    }
    
    if (endBracket !== -1) {
      const chunkStr = part.slice(startBracket, endBracket + 1);
      let chunkPos = 0;
      let chunkIdx = 0;
      while ((chunkPos = chunkStr.indexOf('{', chunkPos)) !== -1) {
        let endBrace = -1;
        let cDepth = 0;
        let cInString = false;
        let cEscape = false;
        for (let i = chunkPos; i < chunkStr.length; i++) {
          const char = chunkStr[i];
          if (char === '"' && !cEscape) {
            cInString = !cInString;
          } else if (char === '\\' && cInString) {
            cEscape = !cEscape;
          } else {
            cEscape = false;
            if (!cInString) {
              if (char === '{') cDepth++;
              else if (char === '}') {
                cDepth--;
                if (cDepth === 0) {
                  endBrace = i;
                  break;
                }
              }
            }
          }
        }
        
        if (endBrace !== -1) {
          const singleChunkStr = chunkStr.slice(chunkPos, endBrace + 1);
          let repPos = singleChunkStr.indexOf('"ReplacementContent"');
          if (repPos !== -1) {
            let startQ = singleChunkStr.indexOf('"', repPos + 20);
            if (startQ !== -1) {
              let val = '';
              let esc = false;
              for (let j = startQ + 1; j < singleChunkStr.length; j++) {
                const char = singleChunkStr[j];
                if (esc) {
                  if (char === 'n') val += '\n';
                  else if (char === 'r') val += '\r';
                  else if (char === 't') val += '\t';
                  else if (char === '"') val += '"';
                  else if (char === '\\') val += '\\';
                  else val += '\\' + char;
                  esc = false;
                } else if (char === '\\') {
                  esc = true;
                } else if (char === '"') {
                  break;
                } else {
                  val += char;
                }
              }
              // 만약 double escaped 문자열인 경우 복구
              // (예: 문자열 내부의 \\n 이 진짜 줄바꿈 \n 이 되어야 함)
              let finalVal = val;
              try {
                // simple unescaping for JSON stringified content
                finalVal = JSON.parse('"' + val.replace(/"/g, '\\"') + '"');
              } catch (e) {
                // fall back to raw
              }
              fs.writeFileSync(`${outputName}_chunk${chunkIdx}.txt`, finalVal, 'utf-8');
              console.log(`  Saved Chunk ${chunkIdx} via regex! (Length: ${finalVal.length})`);
              chunkIdx++;
            }
          }
          chunkPos = Math.max(chunkPos + 1, endBrace + 1);
        } else {
          break;
        }
      }
    }
    pos = Math.max(pos + 1, endBracket + 1);
  }
}

const newLog = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\798c0290-01d7-435f-9832-3850ae7f6776\\.system_generated\\logs\\overview.txt';

console.log("Starting code extraction by regex...");
extractCodeByRegex(newLog, 46, 'new_step46');
extractCodeByRegex(newLog, 56, 'new_step56');
extractCodeByRegex(newLog, 62, 'new_step62');
extractCodeByRegex(newLog, 116, 'new_step116');
extractCodeByRegex(newLog, 122, 'new_step122');
extractCodeByRegex(newLog, 164, 'new_step164');
