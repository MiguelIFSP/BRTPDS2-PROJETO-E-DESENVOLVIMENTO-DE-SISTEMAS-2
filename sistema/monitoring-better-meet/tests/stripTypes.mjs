import { stripTypeScriptTypes } from 'node:module';

// Usa o mesmo suporte a TypeScript do Node que executa a API.
export default {
  process(sourceText, sourcePath) {
    return {
      code: stripTypeScriptTypes(sourceText, {
        mode: 'strip',
        sourceUrl: sourcePath,
      }),
    };
  },
};
