import stream from 'stream';


async function* emptyGenerator() { }
export const emptyStream = () => stream.Readable.from(emptyGenerator());
