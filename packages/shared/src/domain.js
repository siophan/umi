export function toEntityId(value) {
    return String(value);
}
export function toOptionalEntityId(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    return toEntityId(value);
}
