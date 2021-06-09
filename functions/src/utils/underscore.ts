export function underscore(str: string): string {
  return str
    .replace(/(?:^|\.?)([A-Z])/g, function (_, x) {
      return '_' + x.toLowerCase();
    })
    .replace(/^_/, '');
}

export default underscore;
