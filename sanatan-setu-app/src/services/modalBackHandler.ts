type BackCallback = () => void;
const backStack: BackCallback[] = [];

export const pushBackHandler = (callback: BackCallback): (() => void) => {
  backStack.push(callback);
  return () => {
    const index = backStack.lastIndexOf(callback);
    if (index !== -1) {
      backStack.splice(index, 1);
    }
  };
};

export const popAndExecuteBackHandler = (): boolean => {
  if (backStack.length > 0) {
    const lastHandler = backStack.pop();
    if (lastHandler) {
      lastHandler();
      return true;
    }
  }
  return false;
};
