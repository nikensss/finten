/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'parse-xbrl' {
  export function parse(filePath: string): any;
  export function parseStr(xmlContents: string): any;
}
