export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}
export async function runAfterDelay(ms: number, runnable : () => void) {
    await sleep(ms);
    runnable();
}