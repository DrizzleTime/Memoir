export function md5(string: string): string {
  function rotateLeft(value: number, shift: number) {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number) {
    const result = (x & 0x7fffffff) + (y & 0x7fffffff);
    if (x & 0x80000000 && y & 0x80000000) {
      return result ^ 0x80000000 ^ 0x80000000;
    }
    if (x & 0x80000000 || y & 0x80000000) {
      if (result & 0x80000000) {
        return result ^ 0x80000000;
      }
      return result | 0x80000000;
    }
    return result;
  }

  function f(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }
  function g(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }
  function h(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }
  function i(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string) {
    const wordCount = ((str.length + 8) >> 6) + 1;
    const words = new Array(wordCount * 16).fill(0);
    for (let index = 0; index < str.length; index++) {
      words[index >> 2] |= str.charCodeAt(index) << ((index % 4) * 8);
    }
    words[str.length >> 2] |= 0x80 << ((str.length % 4) * 8);
    words[wordCount * 16 - 2] = str.length * 8;
    return words;
  }

  function wordToHex(value: number) {
    let hex = "";
    for (let index = 0; index <= 3; index++) {
      const byte = (value >> (index * 8)) & 255;
      hex += ("0" + byte.toString(16)).slice(-2);
    }
    return hex;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const K = [
    0xd76aa478,
    0xe8c7b756,
    0x242070db,
    0xc1bdceee,
    0xf57c0faf,
    0x4787c62a,
    0xa8304613,
    0xfd469501,
    0x698098d8,
    0x8b44f7af,
    0xffff5bb1,
    0x895cd7be,
    0x6b901122,
    0xfd987193,
    0xa679438e,
    0x49b40821,
    0xf61e2562,
    0xc040b340,
    0x265e5a51,
    0xe9b6c7aa,
    0xd62f105d,
    0x02441453,
    0xd8a1e681,
    0xe7d3fbc8,
    0x21e1cde6,
    0xc33707d6,
    0xf4d50d87,
    0x455a14ed,
    0xa9e3e905,
    0xfcefa3f8,
    0x676f02d9,
    0x8d2a4c8a,
    0xfffa3942,
    0x8771f681,
    0x6d9d6122,
    0xfde5380c,
    0xa4beea44,
    0x4bdecfa9,
    0xf6bb4b60,
    0xbebfbc70,
    0x289b7ec6,
    0xeaa127fa,
    0xd4ef3085,
    0x04881d05,
    0xd9d4d039,
    0xe6db99e5,
    0x1fa27cf8,
    0xc4ac5665,
    0xf4292244,
    0x432aff97,
    0xab9423a7,
    0xfc93a039,
    0x655b59c3,
    0x8f0ccc92,
    0xffeff47d,
    0x85845dd1,
    0x6fa87e4f,
    0xfe2ce6e0,
    0xa3014314,
    0x4e0811a1,
    0xf7537e82,
    0xbd3af235,
    0x2ad7d2bb,
    0xeb86d391,
  ];

  for (let index = 0; index < x.length; index += 16) {
    const AA = a;
    const BB = b;
    const CC = c;
    const DD = d;

    for (let j = 0; j < 64; j++) {
      let idx: number;
      let sIdx: number;
      if (j < 16) {
        idx = j;
        sIdx = j % 4;
        a = ff(a, b, c, d, x[index + idx], S[sIdx], K[j]);
      } else if (j < 32) {
        idx = (5 * j + 1) % 16;
        sIdx = 4 + (j % 4);
        a = gg(a, b, c, d, x[index + idx], S[sIdx], K[j]);
      } else if (j < 48) {
        idx = (3 * j + 5) % 16;
        sIdx = 8 + (j % 4);
        a = hh(a, b, c, d, x[index + idx], S[sIdx], K[j]);
      } else {
        idx = (7 * j) % 16;
        sIdx = 12 + (j % 4);
        a = ii(a, b, c, d, x[index + idx], S[sIdx], K[j]);
      }
      const temp = d;
      d = c;
      c = b;
      b = a;
      a = temp;
    }
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

