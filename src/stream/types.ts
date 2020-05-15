export type ReadableStream = NodeJS.ReadableStream | NodeJS.ReadableStream & NodeJS.WritableStream;
export type WritableStream = NodeJS.WritableStream | NodeJS.ReadableStream & NodeJS.WritableStream;
export type Stream = ReadableStream | WritableStream;
