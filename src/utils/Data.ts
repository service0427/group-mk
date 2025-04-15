const deepMerge = (obj1: any, obj2: any): any => {
  const output = Object.assign({}, obj1);

  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      if (typeof obj2[key] === 'object' && obj2[key] !== null && obj1[key]) {
        output[key] = deepMerge(obj1[key], obj2[key]);
      } else {
        output[key] = obj2[key];
      }
    }
  }

  return output;
};

const generateUniqueToken = (): string => {
  const timestamp: number = new Date().getTime();
  const randomString: string = Math.random().toString(36).substring(2, 8); // Random string of length 6

  return `${timestamp}-${randomString}`;
};

export { deepMerge, generateUniqueToken };
