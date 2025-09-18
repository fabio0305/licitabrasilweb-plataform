import { register } from 'tsconfig-paths';
import { resolve } from 'path';

// Registrar os path mappings do tsconfig.json
register({
  baseUrl: resolve(__dirname),
  paths: {
    '@/*': ['*'],
    '@/controllers/*': ['controllers/*'],
    '@/models/*': ['models/*'],
    '@/routes/*': ['routes/*'],
    '@/middleware/*': ['middleware/*'],
    '@/utils/*': ['utils/*'],
    '@/config/*': ['config/*'],
    '@/types/*': ['types/*']
  }
});
