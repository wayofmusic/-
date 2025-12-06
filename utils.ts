export const formatTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return `${pad(minutes)}:${pad(seconds)}.${pad(centiseconds)}`;
};

export const formatDuration = (ms: number): string => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (hours > 0) {
        return `${hours}小时 ${minutes}分 ${seconds}秒`;
    }
    return `${minutes}分 ${seconds}秒`;
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};