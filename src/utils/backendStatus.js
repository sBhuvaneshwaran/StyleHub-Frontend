const emitter = new EventTarget();

let current = 'up';

export const getStatus = () => current;

export const setStatus = (s) => {
  if (s === current) return;
  current = s;
  emitter.dispatchEvent(new CustomEvent('status', { detail: s }));
};

export default emitter;
