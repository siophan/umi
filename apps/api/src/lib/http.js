export function ok(response, data) {
    const body = {
        success: true,
        data,
    };
    response.json(body);
}
