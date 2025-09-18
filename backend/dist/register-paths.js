"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tsconfig_paths_1 = require("tsconfig-paths");
const path_1 = require("path");
(0, tsconfig_paths_1.register)({
    baseUrl: (0, path_1.resolve)(__dirname),
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
//# sourceMappingURL=register-paths.js.map