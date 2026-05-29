const fs = require('fs');
const path = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\6110a7b6-9186-48ce-a0f7-987f34bb48c0\\.system_generated\\logs\\overview.txt';

if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('replace_file_content') || line.includes('multi_replace_file_content') || line.includes('write_to_file')) {
      try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
          obj.tool_calls.forEach((tc, tcIdx) => {
            if (tc.args && tc.args.TargetFile && tc.args.TargetFile.includes('route.ts')) {
              console.log(`\n--- Line ${idx + 1} ---`);
              console.log(`[Tool Call ${tcIdx}] ${tc.name}`);
              console.log("TargetFile:", tc.args.TargetFile);
              if (tc.args.ReplacementContent) {
                console.log("ReplacementContent length:", tc.args.ReplacementContent.length);
                console.log("ReplacementContent Preview:\n", tc.args.ReplacementContent.slice(0, 1000));
              }
              if (tc.args.ReplacementChunks) {
                console.log("ReplacementChunks Count:", tc.args.ReplacementChunks.length);
                tc.args.ReplacementChunks.forEach((c, cIdx) => {
                  console.log(`  Chunk ${cIdx} length:`, c.ReplacementContent.length);
                  console.log(`  Preview:\n`, c.ReplacementContent.slice(0, 500));
                });
              }
            }
          });
        }
      } catch (e) {
        // ignore
      }
    }
  });
} else {
  console.log("File not found:", path);
}
