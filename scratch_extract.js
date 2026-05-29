const fs = require('fs');
const path = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\798c0290-01d7-435f-9832-3850ae7f6776\\.system_generated\\logs\\overview.txt';

if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('replace_file_content') || line.includes('multi_replace_file_content') || line.includes('write_to_file')) {
      console.log(`\n--- Line ${idx + 1} ---`);
      try {
        const obj = JSON.parse(line);
        console.log("Type:", obj.type);
        if (obj.tool_calls) {
          obj.tool_calls.forEach((tc, tcIdx) => {
            console.log(`[Tool Call ${tcIdx}] ${tc.name}`);
            if (tc.args) {
              const args = tc.args;
              if (args.TargetFile) console.log("TargetFile:", args.TargetFile);
              if (args.ReplacementChunks) {
                console.log("ReplacementChunks Count:", args.ReplacementChunks.length);
                args.ReplacementChunks.forEach((chunk, chunkIdx) => {
                  console.log(`  [Chunk ${chunkIdx}] Start: ${chunk.StartLine}, End: ${chunk.EndLine}`);
                  console.log(`  TargetContent:\n${chunk.TargetContent}\n`);
                  console.log(`  ReplacementContent:\n${chunk.ReplacementContent}\n`);
                });
              }
              if (args.ReplacementContent) {
                console.log("ReplacementContent:\n", args.ReplacementContent);
              }
              if (args.CodeContent) {
                console.log("CodeContent Length:", args.CodeContent.length);
              }
            }
          });
        }
      } catch (e) {
        console.log("JSON Parse failed, error:", e.message);
        // 간략히 출력
        console.log(line.slice(0, 1000));
      }
    }
  });
} else {
  console.log("File not found:", path);
}
