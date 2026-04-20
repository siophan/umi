export function registerHealthRoutes(app) {
    app.get('/health', (_request, response) => {
        response.json({
            ok: true,
            service: 'api',
            timestamp: new Date().toISOString(),
        });
    });
}
