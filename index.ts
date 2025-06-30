import { scanProject } from './project-scan';

(async () => {
  const result = await scanProject();
  console.log(JSON.stringify(result, null, 2));
})();
