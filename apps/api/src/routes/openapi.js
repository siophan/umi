import { adminPaths } from './openapi/paths/admin';
import { authPaths } from './openapi/paths/auth';
import { chatPaths } from './openapi/paths/chats';
import { commercePaths } from './openapi/paths/commerce';
import { communityPaths } from './openapi/paths/community';
import { notificationPaths } from './openapi/paths/notifications';
import { shopPaths } from './openapi/paths/shop';
import { socialPaths } from './openapi/paths/social';
import { userPaths } from './openapi/paths/users';
import { adminSchemas } from './openapi/schemas/admin';
import { authSchemas } from './openapi/schemas/auth';
import { commonSchemas } from './openapi/schemas/common';
import { shopSchemas } from './openapi/schemas/shop';
import { openApiTags } from './openapi/tags';
const openApiDocument = {
    openapi: '3.0.3',
    info: {
        title: 'Joy API',
        version: '0.1.0',
        description: '`umi/apps/api` 当前接口在线调试文档。',
    },
    servers: [
        {
            url: '/',
            description: 'Current server',
        },
    ],
    tags: openApiTags,
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: '在这里填登录接口返回的 token，不需要手动加 Bearer 前缀。',
            },
        },
        schemas: {
            ...commonSchemas,
            ...authSchemas,
            ...adminSchemas,
            ...shopSchemas,
        },
    },
    paths: {
        ...authPaths,
        ...userPaths,
        ...socialPaths,
        ...notificationPaths,
        ...communityPaths,
        ...chatPaths,
        ...commercePaths,
        ...adminPaths,
        ...shopPaths,
    },
};
function renderSwaggerUiHtml() {
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Joy API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html {
        box-sizing: border-box;
        overflow-y: scroll;
      }
      *,
      *::before,
      *::after {
        box-sizing: inherit;
      }
      body {
        margin: 0;
        background: #f5f7fb;
      }
      .topbar {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        persistAuthorization: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
      });
    </script>
  </body>
</html>`;
}
export function registerOpenApiRoutes(app) {
    app.get('/openapi.json', (_request, response) => {
        response.json(openApiDocument);
    });
    app.get('/docs', (_request, response) => {
        response.type('html').send(renderSwaggerUiHtml());
    });
}
