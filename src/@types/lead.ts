declare module 'lead' {
import stream from 'stream';


    export default function sink<S extends stream.Stream>(readableStream: S): S;
}
